import type { GridSignal } from "../grid/types";
import { buildAdaptiveSchedule } from "../v2g/scheduler";
import type { OptimizerWeights, V2GScheduleResult } from "../v2g/types";
import type { DepartureOutcome } from "./types";

export interface ComparisonScenarioInput {
  startTime: Date;
  slotMinutes: number;
  horizonSlots: number;
  initialSoc: number;
  batteryCapacityKWh: number;
  maxChargePowerKW: number;
  maxDischargePowerKW: number;
  connected: boolean;
  telemetryStale: boolean;
  /** Deadline the scheduler plans around — what the system believes, in advance. */
  predictedDeparture: Date;
  predictedReturn: Date;
  /**
   * When the vehicle actually leaves (§37 early-departure scenario: this
   * may differ from `predictedDeparture`). Outcomes are scored against
   * the SOC the schedule had actually reached at this real moment, not
   * against the schedule's own planning deadline. Defaults to
   * `predictedDeparture` when omitted.
   */
  actualDeparture?: Date;
  /** What the guaranteed-SOC engine predicted the trip would need. */
  predictedTripRequirementSoc: number;
  predictedTripEnergyKWh: number;
  /** What the trip actually consumed once realized (§41, may differ from prediction). */
  actualTripEnergyKWh: number;
  gridSignals: GridSignal[];
  weights?: OptimizerWeights;
  /** Adaptive strategy's computed guaranteed SOC. */
  adaptiveGuaranteedSoc: number;
  /** Fixed baseline's static floor. */
  fixedMinimumSoc: number;
  /** Absolute safety floor enforced for both strategies (§16, §27). */
  hardMinimumSoc: number;
}

export interface StrategyComparisonResult {
  fixed: V2GScheduleResult;
  adaptive: V2GScheduleResult;
  fixedOutcome: DepartureOutcome;
  adaptiveOutcome: DepartureOutcome;
}

/** §51: independent post-hoc scan — does not trust the scheduler's own bookkeeping. */
export function countSafetyViolations(
  result: V2GScheduleResult,
  hardMinimumSoc: number,
): number {
  let violations = 0;
  for (const slot of result.slots) {
    if (slot.predictedSocEnd < hardMinimumSoc - 0.01) violations += 1;
    if (slot.predictedSocEnd < -0.01 || slot.predictedSocEnd > 100.01) violations += 1;
    const controlledAction = slot.action === "CHARGE" || slot.action === "DISCHARGE";
    const unsafeReason =
      slot.reasonCode === "VEHICLE_UNAVAILABLE" ||
      slot.reasonCode === "STALE_TELEMETRY" ||
      slot.reasonCode === "CHARGER_DISCONNECTED";
    if (controlledAction && unsafeReason) violations += 1;
  }
  return violations;
}

/** Reads the SOC the schedule had actually reached at a given real-world moment. */
function socAtTime(
  result: V2GScheduleResult,
  startTime: Date,
  slotMinutes: number,
  targetTime: Date,
): number {
  if (result.slots.length === 0) return 0;
  const index = Math.max(
    0,
    Math.min(
      result.slots.length - 1,
      Math.floor((targetTime.getTime() - startTime.getTime()) / (slotMinutes * 60_000)),
    ),
  );
  return result.slots[index].predictedSocStart;
}

function buildOutcome(
  result: V2GScheduleResult,
  predictedRequiredTripSoc: number,
  actualRequiredTripSoc: number,
  hardMinimumSoc: number,
  departureSocAvailable: number,
): DepartureOutcome {
  const scanned = countSafetyViolations(result, hardMinimumSoc);
  return {
    predictedRequiredTripSoc: Number(predictedRequiredTripSoc.toFixed(1)),
    actualRequiredTripSoc: Number(actualRequiredTripSoc.toFixed(1)),
    departureSocAvailable: Number(departureSocAvailable.toFixed(1)),
    hardMinimumSoc,
    safetyViolated: scanned > 0 || departureSocAvailable < actualRequiredTripSoc,
  };
}

/**
 * §46: runs both strategies against exactly the same scenario inputs so
 * neither is given an advantage.
 */
export function compareStrategies(
  input: ComparisonScenarioInput,
): StrategyComparisonResult {
  const common = {
    startTime: input.startTime,
    slotMinutes: input.slotMinutes,
    horizonSlots: input.horizonSlots,
    initialSoc: input.initialSoc,
    batteryCapacityKWh: input.batteryCapacityKWh,
    maxChargePowerKW: input.maxChargePowerKW,
    maxDischargePowerKW: input.maxDischargePowerKW,
    connected: input.connected,
    telemetryStale: input.telemetryStale,
    predictedDeparture: input.predictedDeparture,
    predictedReturn: input.predictedReturn,
    tripEnergyKWh: input.predictedTripEnergyKWh,
    gridSignals: input.gridSignals,
    weights: input.weights,
  };

  const fixed = buildAdaptiveSchedule({
    ...common,
    hardMinimumSoc: input.hardMinimumSoc,
    guaranteedSoc: Math.max(input.fixedMinimumSoc, input.hardMinimumSoc),
  });
  const adaptive = buildAdaptiveSchedule({
    ...common,
    hardMinimumSoc: input.hardMinimumSoc,
    guaranteedSoc: input.adaptiveGuaranteedSoc,
  });

  const actualRequiredTripSoc =
    (input.actualTripEnergyKWh / input.batteryCapacityKWh) * 100;
  const actualDeparture = input.actualDeparture ?? input.predictedDeparture;

  return {
    fixed,
    adaptive,
    fixedOutcome: buildOutcome(
      fixed,
      input.fixedMinimumSoc,
      actualRequiredTripSoc,
      input.hardMinimumSoc,
      socAtTime(fixed, input.startTime, input.slotMinutes, actualDeparture),
    ),
    adaptiveOutcome: buildOutcome(
      adaptive,
      input.predictedTripRequirementSoc,
      actualRequiredTripSoc,
      input.hardMinimumSoc,
      socAtTime(adaptive, input.startTime, input.slotMinutes, actualDeparture),
    ),
  };
}
