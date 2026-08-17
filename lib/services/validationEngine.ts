import { socToKWh } from "@/lib/domain/assert";
import { dayOfWeekKst, SimulatedClock } from "@/lib/domain/clock";
import type { NormalizedCalendarEvent } from "@/lib/domain/calendar/types";
import {
  DEFAULT_HORIZON_SLOTS,
  DEFAULT_SLOT_MINUTES,
  STALE_TELEMETRY_MINUTES,
} from "@/lib/domain/config";
import { generateSimulatedGridSignals } from "@/lib/domain/grid/gridSignal";
import { predictDeparture } from "@/lib/domain/mobility/departurePrediction";
import { summarizeMobilityProfile } from "@/lib/domain/mobility/mobilityProfile";
import { predictTripEnergy } from "@/lib/domain/mobility/tripEnergyPrediction";
import { generateSyntheticTripHistory } from "@/lib/domain/mobility/tripHistory";
import type { TripRecord } from "@/lib/domain/mobility/types";
import { evaluateSafetyState } from "@/lib/domain/safety/stateMachine";
import { calculateGuaranteedSoc } from "@/lib/domain/soc/guaranteedSoc";
import { buildAdaptiveSchedule } from "@/lib/domain/v2g/scheduler";
import { SimulationVehicleAdapter } from "@/lib/domain/vehicle/simulator";

export interface EngineConfig {
  vehicleId: string;
  batteryCapacityKWh: number;
  maxChargePowerKW: number;
  maxDischargePowerKW: number;
  hardMinimumSoc: number;
  preferredReserveSoc: number;
  seed: number;
  initialSoc: number;
  startTime: Date;
}

export interface ValidationEngine {
  clock: SimulatedClock;
  adapter: SimulationVehicleAdapter;
  tripHistory: TripRecord[];
  calendarEvents: NormalizedCalendarEvent[];
  hardMinimumSoc: number;
  preferredReserveSoc: number;
}

/**
 * Builds a fresh, self-contained live scenario: a deterministic vehicle
 * simulator (§32) plus 30 days of clearly-synthetic trip history (§66)
 * seeded so a given seed always reproduces the same scenario (§33).
 */
export function createValidationEngine(config: EngineConfig): ValidationEngine {
  const clock = new SimulatedClock(config.startTime);
  const adapter = new SimulationVehicleAdapter(
    {
      vehicleId: config.vehicleId,
      batteryCapacityKWh: config.batteryCapacityKWh,
      initialSoc: config.initialSoc,
      maxChargePowerKW: config.maxChargePowerKW,
      maxDischargePowerKW: config.maxDischargePowerKW,
    },
    clock,
  );
  const tripHistory = generateSyntheticTripHistory({
    vehicleId: config.vehicleId,
    days: 30,
    endDate: config.startTime,
    batteryCapacityKWh: config.batteryCapacityKWh,
    seed: config.seed,
  });

  return {
    clock,
    adapter,
    tripHistory,
    calendarEvents: [],
    hardMinimumSoc: config.hardMinimumSoc,
    preferredReserveSoc: config.preferredReserveSoc,
  };
}

export interface GeminiCandidate {
  eventId: string;
  vehicleNeedProbability: number;
  confidence: number;
}

export interface EngineSnapshot {
  now: string;
  vehicleState: ReturnType<SimulationVehicleAdapter["getStateSync"]>;
  telemetryAgeMinutes: number;
  mobilityProfile: ReturnType<typeof summarizeMobilityProfile>;
  departurePrediction: ReturnType<typeof predictDeparture>;
  tripEnergyPrediction: ReturnType<typeof predictTripEnergy>;
  guaranteedSocResult: ReturnType<typeof calculateGuaranteedSoc>;
  safetyState: ReturnType<typeof evaluateSafetyState>;
  schedule: ReturnType<typeof buildAdaptiveSchedule>;
  availableForV2GSoc: number;
  availableForV2GKWh: number;
}

/**
 * Runs the full CONTEXT -> PREDICTION -> SAFETY -> OPTIMIZATION pipeline
 * (§4) for the engine's current instant. Pure given the engine's current
 * state and the (optional, already-fetched) Gemini calendar analysis — no
 * network calls happen inside this function, so it stays independently
 * testable (§71) and reusable from both the dashboard and its tests.
 */
export function computeSnapshot(
  engine: ValidationEngine,
  geminiAnalysis: GeminiCandidate[],
  calendarEnabled: boolean,
): EngineSnapshot {
  const now = engine.clock.now();
  const vehicleState = engine.adapter.getStateSync();
  const telemetryAgeMinutes = engine.adapter.getTelemetryAgeMinutes();
  const controllable = vehicleState.connected && vehicleState.chargerConnected;

  const mobilityProfile = summarizeMobilityProfile(engine.tripHistory, dayOfWeekKst(now));
  const departurePrediction = predictDeparture({
    now,
    trips: engine.tripHistory,
    calendarEvents: engine.calendarEvents,
    calendarEnabled,
    geminiCalendarAnalysis: geminiAnalysis,
  });
  const tripEnergyPrediction = predictTripEnergy(mobilityProfile, vehicleState.batteryCapacityKWh);
  const combinedConfidence = Math.min(
    departurePrediction.confidence,
    tripEnergyPrediction.confidence,
  );
  const guaranteedSocResult = calculateGuaranteedSoc({
    tripRequirementSoc: tripEnergyPrediction.requiredTripSoc,
    userReserveSoc: engine.preferredReserveSoc,
    hardMinimumSoc: engine.hardMinimumSoc,
    confidence: combinedConfidence,
  });

  const safetyState = evaluateSafetyState({
    soc: vehicleState.soc,
    hardMinimumSoc: engine.hardMinimumSoc,
    guaranteedSoc: guaranteedSocResult.guaranteedSoc,
    connected: controllable,
    driving: vehicleState.driving,
    telemetryAgeMinutes,
    staleThresholdMinutes: STALE_TELEMETRY_MINUTES,
  });

  const predictedDeparture = new Date(departurePrediction.predictedDeparture);
  const typicalDurationMinutes =
    mobilityProfile.typicalReturnMinuteOfDay !== undefined &&
    mobilityProfile.weekdayTypicalDepartureMinuteOfDay !== undefined &&
    mobilityProfile.typicalReturnMinuteOfDay > mobilityProfile.weekdayTypicalDepartureMinuteOfDay
      ? mobilityProfile.typicalReturnMinuteOfDay - mobilityProfile.weekdayTypicalDepartureMinuteOfDay
      : 60;
  const predictedReturn = new Date(
    predictedDeparture.getTime() + Math.max(30, typicalDurationMinutes) * 60_000,
  );

  const schedule = buildAdaptiveSchedule({
    startTime: now,
    slotMinutes: DEFAULT_SLOT_MINUTES,
    horizonSlots: DEFAULT_HORIZON_SLOTS,
    initialSoc: vehicleState.soc,
    batteryCapacityKWh: vehicleState.batteryCapacityKWh,
    maxChargePowerKW: vehicleState.maxChargePowerKW,
    maxDischargePowerKW: vehicleState.maxDischargePowerKW,
    hardMinimumSoc: engine.hardMinimumSoc,
    guaranteedSoc: guaranteedSocResult.guaranteedSoc,
    connected: controllable,
    telemetryStale: safetyState === "STALE_DATA",
    predictedDeparture,
    predictedReturn,
    tripEnergyKWh: tripEnergyPrediction.requiredEnergyKWh,
    gridSignals: generateSimulatedGridSignals(now, DEFAULT_SLOT_MINUTES, DEFAULT_HORIZON_SLOTS),
  });

  const availableForV2GSoc = Math.max(0, vehicleState.soc - guaranteedSocResult.guaranteedSoc);
  const availableForV2GKWh = socToKWh(availableForV2GSoc, vehicleState.batteryCapacityKWh);

  return {
    now: now.toISOString(),
    vehicleState,
    telemetryAgeMinutes,
    mobilityProfile,
    departurePrediction,
    tripEnergyPrediction,
    guaranteedSocResult,
    safetyState,
    schedule,
    availableForV2GSoc: Number(availableForV2GSoc.toFixed(1)),
    availableForV2GKWh: Number(availableForV2GKWh.toFixed(1)),
  };
}
