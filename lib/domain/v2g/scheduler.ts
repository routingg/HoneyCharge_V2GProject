import { clampSoc, kWhToSocDelta, socToKWh } from "../assert";
import { toKstIso } from "../clock";
import {
  DEFAULT_CHARGE_EFFICIENCY,
  DEFAULT_DISCHARGE_EFFICIENCY,
  DEFAULT_OPTIMIZER_WEIGHTS,
} from "../config";
import type { GridSignal } from "../grid/types";
import type { OptimizerWeights, V2GAction, V2GScheduleResult, V2GScheduleSlot } from "./types";

export interface AdaptiveScheduleInput {
  startTime: Date;
  slotMinutes: number;
  horizonSlots: number;
  initialSoc: number;
  batteryCapacityKWh: number;
  maxChargePowerKW: number;
  maxDischargePowerKW: number;
  chargeEfficiency?: number;
  dischargeEfficiency?: number;
  /** SOC floor the vehicle must never go below (§16, §27). */
  hardMinimumSoc: number;
  /** SOC the vehicle must reach by `predictedDeparture` (§27). */
  guaranteedSoc: number;
  connected: boolean;
  telemetryStale: boolean;
  /** Predicted next departure. Slots at/after this and before `predictedReturn` are treated as driving. */
  predictedDeparture?: Date;
  predictedReturn?: Date;
  /** Energy consumed by the predicted trip, spread evenly across the driving window. */
  tripEnergyKWh?: number;
  gridSignals: GridSignal[];
  weights?: OptimizerWeights;
  /** Minimum kWh worth discharging in one slot — avoids pointless micro-cycling. */
  minDischargeKWh?: number;
  /**
   * User-facing "Automatic V2G" switch. When false, the schedule never
   * discharges — it still charges toward `guaranteedSoc` exactly as
   * before. Defaults to true so existing callers are unaffected.
   */
  v2gEnabled?: boolean;
}

const DEFAULT_MIN_DISCHARGE_KWH = 0.3;

/**
 * §25–§29: builds a rolling-horizon CHARGE/IDLE/DISCHARGE schedule.
 * Safety-first, two-pass logic:
 *  1. Never discharge while soc <= hardMinimumSoc or soc <= guaranteedSoc.
 *  2. Force CHARGE whenever the vehicle can no longer reach guaranteedSoc
 *     by the predicted departure if it waits any longer.
 *  3. Otherwise, charge/discharge opportunistically based on the
 *     (simulated) grid signal and optimizer weights.
 * This is intentionally a greedy, explainable heuristic rather than a
 * global optimum (§29) — correctness and auditability first.
 */
export function buildAdaptiveSchedule(
  input: AdaptiveScheduleInput,
): V2GScheduleResult {
  const chargeEfficiency = input.chargeEfficiency ?? DEFAULT_CHARGE_EFFICIENCY;
  const dischargeEfficiency =
    input.dischargeEfficiency ?? DEFAULT_DISCHARGE_EFFICIENCY;
  const weights = input.weights ?? DEFAULT_OPTIMIZER_WEIGHTS;
  const minDischargeKWh = input.minDischargeKWh ?? DEFAULT_MIN_DISCHARGE_KWH;
  const slotHours = input.slotMinutes / 60;

  const departureSlotIndex = input.predictedDeparture
    ? Math.max(
        0,
        Math.round(
          (input.predictedDeparture.getTime() - input.startTime.getTime()) /
            (input.slotMinutes * 60_000),
        ),
      )
    : null;
  const isWithinHorizon =
    departureSlotIndex !== null && departureSlotIndex < input.horizonSlots;

  const tripEnergyPerDrivingSlot = (() => {
    if (!input.predictedDeparture || !input.predictedReturn || !input.tripEnergyKWh) {
      return { perSlot: 0, drivingSlots: new Set<number>() };
    }
    const drivingSlots = new Set<number>();
    for (let i = 0; i < input.horizonSlots; i++) {
      const slotStart = input.startTime.getTime() + i * input.slotMinutes * 60_000;
      if (
        slotStart >= input.predictedDeparture.getTime() &&
        slotStart < input.predictedReturn.getTime()
      ) {
        drivingSlots.add(i);
      }
    }
    return {
      perSlot: drivingSlots.size > 0 ? input.tripEnergyKWh / drivingSlots.size : 0,
      drivingSlots,
    };
  })();

  let soc = input.initialSoc;
  const slots: V2GScheduleSlot[] = [];
  let totalChargedKWh = 0;
  let totalDischargedKWh = 0;
  let projectedDepartureSoc: number | null = null;

  for (let i = 0; i < input.horizonSlots; i++) {
    const slotStart = new Date(input.startTime.getTime() + i * input.slotMinutes * 60_000);
    const slotEnd = new Date(slotStart.getTime() + input.slotMinutes * 60_000);
    const socStart = soc;

    const driving = tripEnergyPerDrivingSlot.drivingSlots.has(i);

    let action: V2GAction = "IDLE";
    let powerKW = 0;
    let reasonCode = "GRID_BALANCED";
    let explanation = "전력 수급 차이가 크지 않아 대기 중이에요.";

    if (driving) {
      soc = clampSoc(soc - kWhToSocDelta(tripEnergyPerDrivingSlot.perSlot, input.batteryCapacityKWh));
      reasonCode = "VEHICLE_UNAVAILABLE";
      explanation = "차량이 이동 중이라 제어 대상에서 제외돼요.";
    } else if (input.telemetryStale) {
      reasonCode = "STALE_TELEMETRY";
      explanation = "차량 상태 정보가 오래되어 안전을 위해 제어를 멈췄어요.";
    } else if (!input.connected) {
      reasonCode = "CHARGER_DISCONNECTED";
      explanation = "충전기가 연결되어 있지 않아요.";
    } else if (soc <= input.hardMinimumSoc) {
      action = "CHARGE";
      powerKW = input.maxChargePowerKW;
      reasonCode = "LOW_SOC";
      explanation = "최소 보장 잔량 이하로 내려가 충전을 최우선으로 진행해요.";
    } else {
      const remainingSlots = isWithinHorizon ? Math.max(0, departureSlotIndex! - i) : Infinity;
      const neededKWh = Math.max(
        0,
        socToKWh(input.guaranteedSoc, input.batteryCapacityKWh) -
          socToKWh(soc, input.batteryCapacityKWh),
      );
      const maxChargeThisSlotKWh = input.maxChargePowerKW * slotHours * chargeEfficiency;
      const maxRemainingChargeKWh =
        remainingSlots === Infinity ? Infinity : remainingSlots * maxChargeThisSlotKWh;
      const mustChargeNow =
        neededKWh > 0 &&
        remainingSlots !== Infinity &&
        neededKWh >= maxRemainingChargeKWh - maxChargeThisSlotKWh * 0.5;

      if (mustChargeNow) {
        action = "CHARGE";
        powerKW = input.maxChargePowerKW;
        reasonCode = "DEPARTURE_PREPARATION";
        explanation = "출발 전 보장 잔량 확보를 위해 충전을 진행해요.";
      } else {
        const gridSignal: GridSignal | undefined = input.gridSignals[i];
        const dischargeScore = gridSignal
          ? weights.gridSupport * gridSignal.gridDemandLevel +
            weights.economicValue * gridSignal.energyValue -
            weights.batteryCyclingPenalty
          : -1;
        const chargeScore = gridSignal
          ? weights.renewableAbsorption * (gridSignal.renewableSurplusKW / 400) -
            weights.batteryCyclingPenalty * 0.5
          : -1;

        const availableForV2GKWh =
          socToKWh(soc, input.batteryCapacityKWh) -
          socToKWh(input.guaranteedSoc, input.batteryCapacityKWh);

        if (
          input.v2gEnabled !== false &&
          soc > input.guaranteedSoc &&
          availableForV2GKWh >= minDischargeKWh &&
          dischargeScore > 0 &&
          dischargeScore >= chargeScore
        ) {
          action = "DISCHARGE";
          powerKW = Math.min(
            input.maxDischargePowerKW,
            availableForV2GKWh / (slotHours * dischargeEfficiency),
          );
          reasonCode = "V2G_SAFE_SURPLUS";
          explanation = "보장 잔량 이상의 여유 배터리로 전력망을 지원해요.";
        } else if (soc < 95 && gridSignal && gridSignal.renewableSurplusKW > 0 && chargeScore > 0) {
          action = "CHARGE";
          powerKW = Math.min(
            input.maxChargePowerKW,
            gridSignal.renewableSurplusKW / 20,
          );
          reasonCode = "RENEWABLE_ABSORPTION";
          explanation = "재생에너지 잉여 전력을 배터리에 저장해요.";
        } else if (input.v2gEnabled === false && soc > input.guaranteedSoc) {
          reasonCode = "V2G_DISABLED_BY_USER";
          explanation = "자동 V2G가 꺼져 있어 방전하지 않아요.";
        } else {
          reasonCode = soc <= input.guaranteedSoc ? "USER_RESERVE" : "GRID_BALANCED";
          explanation =
            soc <= input.guaranteedSoc
              ? "보장 잔량 보호 구간이라 방전하지 않아요."
              : "전력 수급 차이가 크지 않아 대기 중이에요.";
        }
      }
    }

    if (action === "CHARGE" && powerKW > 0) {
      const storedKWh = powerKW * slotHours * chargeEfficiency;
      soc = clampSoc(soc + kWhToSocDelta(storedKWh, input.batteryCapacityKWh));
      totalChargedKWh += powerKW * slotHours;
    } else if (action === "DISCHARGE" && powerKW > 0) {
      const removedKWh = (powerKW * slotHours) / dischargeEfficiency;
      soc = clampSoc(soc - kWhToSocDelta(removedKWh, input.batteryCapacityKWh));
      totalDischargedKWh += powerKW * slotHours;
    }

    slots.push({
      start: toKstIso(slotStart),
      end: toKstIso(slotEnd),
      action,
      powerKW: Number(powerKW.toFixed(2)),
      predictedSocStart: Number(socStart.toFixed(1)),
      predictedSocEnd: Number(soc.toFixed(1)),
      reasonCode,
      explanation,
    });

    if (isWithinHorizon && i === departureSlotIndex) {
      projectedDepartureSoc = Number(socStart.toFixed(1));
    }
  }

  if (isWithinHorizon && projectedDepartureSoc === null) {
    projectedDepartureSoc = Number(soc.toFixed(1));
  }

  return {
    slots,
    feasible:
      projectedDepartureSoc === null || projectedDepartureSoc >= input.guaranteedSoc - 0.5,
    projectedDepartureSoc,
    totalChargedKWh: Number(totalChargedKWh.toFixed(2)),
    totalDischargedKWh: Number(totalDischargedKWh.toFixed(2)),
  };
}
