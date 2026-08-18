import { clampSoc } from "@/lib/domain/assert";
import type { NormalizedCalendarEvent } from "@/lib/domain/calendar/types";
import type { V2GAction, V2GScheduleSlot } from "@/lib/domain/v2g/types";
import type { VehicleEnergyState } from "@/lib/services/mobileHomeService";
import {
  computeSnapshot,
  createValidationEngine,
  type EngineSnapshot,
  type GeminiCandidate,
  type ValidationEngine,
} from "@/lib/services/validationEngine";

export { computeSnapshot };
export type { EngineSnapshot, GeminiCandidate, ValidationEngine };

/**
 * The mobile app and /validation intentionally model the SAME demo vehicle
 * (identity matches lib/data/mockData.ts DEMO_USER_VEHICLE_ID = "OWN-002",
 * a Kia EV9) so the two surfaces never disagree about who the demo user is.
 * hardMinimumSoc/preferredReserveSoc differ from mockData's flat
 * `minimumSoc` on purpose — this engine uses the richer guaranteed-SOC
 * model (hard floor + reserve + uncertainty margin) instead of one number.
 */
export const LIVE_DEMO_SEED = 7;

export const LIVE_DEMO_VEHICLE = {
  vehicleId: "OWN-002",
  model: "Kia EV9",
  batteryCapacityKWh: 99.8,
  maxChargePowerKW: 6.4,
  maxDischargePowerKW: 9,
  hardMinimumSoc: 20,
  preferredReserveSoc: 15,
  initialSoc: 68,
} as const;

export function buildLiveMobilityEngine(startTime: Date = new Date()): ValidationEngine {
  const start = new Date(startTime.getTime());
  start.setSeconds(0, 0);
  return createValidationEngine({
    vehicleId: LIVE_DEMO_VEHICLE.vehicleId,
    batteryCapacityKWh: LIVE_DEMO_VEHICLE.batteryCapacityKWh,
    maxChargePowerKW: LIVE_DEMO_VEHICLE.maxChargePowerKW,
    maxDischargePowerKW: LIVE_DEMO_VEHICLE.maxDischargePowerKW,
    hardMinimumSoc: LIVE_DEMO_VEHICLE.hardMinimumSoc,
    preferredReserveSoc: LIVE_DEMO_VEHICLE.preferredReserveSoc,
    seed: LIVE_DEMO_SEED,
    initialSoc: LIVE_DEMO_VEHICLE.initialSoc,
    startTime: start,
  });
}

function fmtTime(iso: string): string {
  return iso.slice(11, 16);
}

// ---------------------------------------------------------------------------
// Schedule slots (30-min resolution) -> a small number of UI timeline blocks
// ---------------------------------------------------------------------------

export type TimelineBlockKind = "charge" | "idle" | "discharge" | "drive";

export interface TimelineBlock {
  kind: TimelineBlockKind;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  energyKWh: number;
  avgPowerKW: number;
  reasonCode: string;
  explanation: string;
  socStart: number;
  socEnd: number;
}

function blockKind(slot: V2GScheduleSlot): TimelineBlockKind {
  if (slot.reasonCode === "VEHICLE_UNAVAILABLE") return "drive";
  if (slot.action === "CHARGE") return "charge";
  if (slot.action === "DISCHARGE") return "discharge";
  return "idle";
}

/** Merges consecutive same-kind/same-reason slots into display-sized blocks. */
export function buildTimelineBlocks(slots: V2GScheduleSlot[]): TimelineBlock[] {
  const blocks: TimelineBlock[] = [];
  for (const slot of slots) {
    const kind = blockKind(slot);
    const slotMinutes =
      (new Date(slot.end).getTime() - new Date(slot.start).getTime()) / 60_000;
    const energyKWh = Number((slot.powerKW * (slotMinutes / 60)).toFixed(2));
    const last = blocks[blocks.length - 1];
    if (last && last.kind === kind && last.reasonCode === slot.reasonCode) {
      last.endTime = fmtTime(slot.end);
      last.durationMinutes += slotMinutes;
      last.energyKWh = Number((last.energyKWh + energyKWh).toFixed(2));
      last.socEnd = slot.predictedSocEnd;
    } else {
      blocks.push({
        kind,
        startTime: fmtTime(slot.start),
        endTime: fmtTime(slot.end),
        durationMinutes: slotMinutes,
        energyKWh,
        avgPowerKW: slot.powerKW,
        reasonCode: slot.reasonCode,
        explanation: slot.explanation,
        socStart: slot.predictedSocStart,
        socEnd: slot.predictedSocEnd,
      });
    }
  }
  return blocks;
}

// ---------------------------------------------------------------------------
// Mobile-facing view model (presentation shaping only — no new calculations
// beyond unit formatting; every number traces back to computeSnapshot).
// ---------------------------------------------------------------------------

export interface MobilityHomeViewModel {
  vehicleModel: string;
  batteryCapacityKWh: number;
  currentSoc: number;
  guaranteedSoc: number;
  protectedPercent: number;
  availablePercent: number;
  availableKWh: number;
  tripRequirementSoc: number;
  userReserveSoc: number;
  uncertaintyMarginSoc: number;
  hardMinimumSoc: number;
  nextDepartureTime: string;
  nextDepartureIso: string;
  departureConfidencePercent: number;
  departureSources: { historical: number; calendar: number; gemini: number };
  explanationFactors: string[];
  currentAction: V2GAction;
  currentReasonCode: string;
  currentExplanation: string;
  safetyState: string;
  timeline: TimelineBlock[];
  telemetryAgeMinutes: number;
  connected: boolean;
  driving: boolean;
  totalChargedKWh: number;
  totalDischargedKWh: number;
  feasible: boolean;
}

export function buildMobilityHomeViewModel(snapshot: EngineSnapshot): MobilityHomeViewModel {
  const { vehicleState, guaranteedSocResult, departurePrediction, schedule, safetyState } =
    snapshot;
  return {
    vehicleModel: LIVE_DEMO_VEHICLE.model,
    batteryCapacityKWh: vehicleState.batteryCapacityKWh,
    currentSoc: vehicleState.soc,
    guaranteedSoc: guaranteedSocResult.guaranteedSoc,
    protectedPercent: Math.min(vehicleState.soc, guaranteedSocResult.guaranteedSoc),
    availablePercent: snapshot.availableForV2GSoc,
    availableKWh: snapshot.availableForV2GKWh,
    tripRequirementSoc: guaranteedSocResult.tripRequirementSoc,
    userReserveSoc: guaranteedSocResult.userReserveSoc,
    uncertaintyMarginSoc: guaranteedSocResult.uncertaintyMarginSoc,
    hardMinimumSoc: guaranteedSocResult.hardMinimumSoc,
    nextDepartureTime: fmtTime(departurePrediction.predictedDeparture),
    nextDepartureIso: departurePrediction.predictedDeparture,
    departureConfidencePercent: Math.round(departurePrediction.confidence * 100),
    departureSources: departurePrediction.sourceWeights,
    explanationFactors: departurePrediction.explanationFactors,
    currentAction: schedule.slots[0]?.action ?? "IDLE",
    currentReasonCode: schedule.slots[0]?.reasonCode ?? "GRID_BALANCED",
    currentExplanation: schedule.slots[0]?.explanation ?? "",
    safetyState,
    timeline: buildTimelineBlocks(schedule.slots),
    telemetryAgeMinutes: snapshot.telemetryAgeMinutes,
    connected: vehicleState.connected && vehicleState.chargerConnected,
    driving: vehicleState.driving,
    totalChargedKWh: schedule.totalChargedKWh,
    totalDischargedKWh: schedule.totalDischargedKWh,
    feasible: schedule.feasible,
  };
}

// ---------------------------------------------------------------------------
// Demo time control — advances the engine's clock and moves SOC to the
// value the *already-computed* adaptive schedule projected for that instant.
// This intentionally reuses the existing SimulationVehicleAdapter surface
// (the same LOW_SOC event `/validation` uses to force a SOC value) rather
// than adding a second SOC-mutation path.
// ---------------------------------------------------------------------------

export function jumpLiveEngineBy(
  engine: ValidationEngine,
  minutes: number,
  calendarEnabled: boolean,
  geminiCandidates: GeminiCandidate[],
): void {
  if (minutes <= 0) return;
  const before = computeSnapshot(engine, geminiCandidates, calendarEnabled);
  const targetIso = new Date(engine.clock.now().getTime() + minutes * 60_000).toISOString();
  const coveringSlot = before.schedule.slots.find((s) => s.start <= targetIso && targetIso < s.end);
  const projectedSoc = coveringSlot
    ? coveringSlot.predictedSocEnd
    : (before.schedule.projectedDepartureSoc ?? before.vehicleState.soc);

  engine.adapter.applyEvent({ type: "LOW_SOC", atMinute: 0, payload: { soc: clampSoc(projectedSoc) } });
  engine.clock.advanceMinutes(minutes);
}

/**
 * The §16/§40 "schedule changed" demo: adds a calendar event anchored to
 * the CURRENT predicted departure (not to wall-clock "now", which would
 * make the direction of the shift depend on what time the demo happens to
 * run) so the injected event reliably implies an earlier departure than
 * the historical-only prediction. `calendarCandidate()` in
 * departurePrediction.ts subtracts a 20-minute travel buffer from the
 * event start when deriving its suggested departure, so this anchors
 * against that same offset. No numbers are hardcoded — the caller re-runs
 * computeSnapshot() afterward and the before/after diff is whatever the
 * real weighted-average pipeline computes (which may be smaller than
 * `earlierByMinutes` once blended with a confident historical candidate).
 */
export function buildEarlierDepartureCalendarEvent(
  engine: ValidationEngine,
  currentPredictedDepartureIso: string,
  earlierByMinutes = 45,
): NormalizedCalendarEvent {
  const now = engine.clock.now();
  const currentPredicted = new Date(currentPredictedDepartureIso);
  let eventStart = new Date(
    currentPredicted.getTime() - earlierByMinutes * 60_000 + 20 * 60_000,
  );
  const earliestAllowed = new Date(now.getTime() + 5 * 60_000);
  if (eventStart.getTime() < earliestAllowed.getTime()) {
    eventStart = earliestAllowed;
  }
  const eventEnd = new Date(eventStart.getTime() + 60 * 60_000);
  return {
    id: `schedule-change-${eventStart.getTime()}`,
    start: eventStart.toISOString(),
    end: eventEnd.toISOString(),
    allDay: false,
    location: "제주 시내",
  };
}

/**
 * Translates the new guaranteed-SOC-aware view model into the existing
 * five-state vocabulary (`VehicleEnergyState`) that `VehicleGlyph` and the
 * Epit/myHyundai badge dictionaries already speak, so this file doesn't
 * force a rewrite of every label map in components/mobile/*. Same data,
 * different vocabulary — not a second source of truth.
 */
export function deriveDisplayEnergyState(vm: MobilityHomeViewModel): VehicleEnergyState {
  if (!vm.connected) return "disconnected";
  if (vm.driving) return "standby";
  if (vm.currentAction === "CHARGE") return "charging";
  if (vm.currentAction === "DISCHARGE") return "discharging";
  if (vm.currentSoc <= vm.guaranteedSoc + 0.5) return "soc-protected";
  return "standby";
}

// ---------------------------------------------------------------------------
// Mobility pattern card (vehicle screen) — derived from the same
// mobilityProfile computeSnapshot() already produces from trip history
// (lib/domain/mobility/mobilityProfile.ts). No separate calculation.
// ---------------------------------------------------------------------------

export interface MobilityPatternViewModel {
  typicalDepartureTime: string | null;
  typicalReturnTime: string | null;
  departureStdMinutes: number | null;
  medianTripDistanceKm: number | null;
  medianConsumptionKWhPerKm: number | null;
  historySampleCount: number;
  confidenceLabel: "높음" | "보통" | "낮음";
}

function minuteOfDayToTime(minute: number | undefined): string | null {
  if (minute === undefined) return null;
  const clamped = Math.max(0, Math.min(24 * 60 - 1, Math.round(minute)));
  const hh = Math.floor(clamped / 60)
    .toString()
    .padStart(2, "0");
  const mm = (clamped % 60).toString().padStart(2, "0");
  return `${hh}:${mm}`;
}

export function buildMobilityPatternViewModel(
  snapshot: EngineSnapshot,
): MobilityPatternViewModel {
  const profile = snapshot.mobilityProfile;
  const confidenceLabel: MobilityPatternViewModel["confidenceLabel"] =
    profile.historySampleCount >= 15 &&
    (profile.weekdayDepartureStdMinutes ?? 999) <= 30
      ? "높음"
      : profile.historySampleCount >= 6
        ? "보통"
        : "낮음";

  return {
    typicalDepartureTime: minuteOfDayToTime(profile.weekdayTypicalDepartureMinuteOfDay),
    typicalReturnTime: minuteOfDayToTime(profile.typicalReturnMinuteOfDay),
    departureStdMinutes: profile.weekdayDepartureStdMinutes ?? null,
    medianTripDistanceKm: profile.medianTripDistanceKm ?? null,
    medianConsumptionKWhPerKm: profile.medianConsumptionKWhPerKm ?? null,
    historySampleCount: profile.historySampleCount,
    confidenceLabel,
  };
}
