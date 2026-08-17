import { generateSimulatedGridSignals } from "../grid/gridSignal";
import { generateSyntheticTripHistory } from "../mobility/tripHistory";
import { summarizeMobilityProfile } from "../mobility/mobilityProfile";
import { predictDeparture } from "../mobility/departurePrediction";
import { predictTripEnergy } from "../mobility/tripEnergyPrediction";
import { calculateGuaranteedSoc } from "../soc/guaranteedSoc";
import type { GuaranteedSocResult } from "../soc/types";
import type { DeparturePrediction, TripRecord } from "../mobility/types";
import { compareStrategies, type StrategyComparisonResult } from "./compare";
import { buildStrategyRunResult, computeValidationMetrics } from "./metrics";
import type { ValidationMetrics } from "./types";

export interface BacktestOptions {
  vehicleId: string;
  batteryCapacityKWh: number;
  maxChargePowerKW: number;
  maxDischargePowerKW: number;
  hardMinimumSoc: number;
  userReserveSoc: number;
  fixedMinimumSoc: number;
  /** Total synthetic history to generate. */
  historyDays: number;
  /** Minimum prior trips required before a day is scored (§40). */
  minHistoryTripsBeforeScoring: number;
  seed: number;
  endDate: Date;
  slotMinutes?: number;
  /** Hours before the actual departure the system makes its plan. */
  decisionLeadHours?: number;
}

export interface BacktestDayResult {
  date: string;
  comparison: StrategyComparisonResult;
  guaranteedSocResult: GuaranteedSocResult;
  departurePrediction: DeparturePrediction;
  actualTrip: TripRecord;
}

export interface BacktestResult {
  days: BacktestDayResult[];
  fixedMetrics: ValidationMetrics;
  adaptiveMetrics: ValidationMetrics;
}

const DEFAULT_SLOT_MINUTES = 30;
const DEFAULT_DECISION_LEAD_HOURS = 6;
const HORIZON_BUFFER_SLOTS = 8;

/**
 * §45–§51: the central hypothesis test. For each trip in the synthetic
 * history, predicts departure/trip-energy using ONLY the trips that
 * happened strictly before it (no leakage), computes the adaptive
 * guaranteed SOC, then runs the fixed and adaptive strategies against
 * that trip's ACTUAL realized energy consumption (ground truth) with
 * identical inputs (§46). This can show the adaptive strategy performing
 * worse — nothing here is tuned to make it win (§46).
 */
export function runFixedVsAdaptiveBacktest(options: BacktestOptions): BacktestResult {
  const slotMinutes = options.slotMinutes ?? DEFAULT_SLOT_MINUTES;
  const decisionLeadHours = options.decisionLeadHours ?? DEFAULT_DECISION_LEAD_HOURS;

  const allTrips = generateSyntheticTripHistory({
    vehicleId: options.vehicleId,
    days: options.historyDays,
    endDate: options.endDate,
    batteryCapacityKWh: options.batteryCapacityKWh,
    seed: options.seed,
  }).sort(
    (a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime(),
  );

  const days: BacktestDayResult[] = [];

  for (let i = 0; i < allTrips.length; i++) {
    const trip = allTrips[i];
    const actualDeparture = new Date(trip.departureTime);
    const priorTrips = allTrips.filter(
      (t) => new Date(t.departureTime).getTime() < actualDeparture.getTime(),
    );
    if (priorTrips.length < options.minHistoryTripsBeforeScoring) continue;

    const decisionTime = new Date(
      actualDeparture.getTime() - decisionLeadHours * 60 * 60_000,
    );
    const profile = summarizeMobilityProfile(priorTrips, trip.dayOfWeek);
    const departurePrediction = predictDeparture({
      now: decisionTime,
      trips: priorTrips,
      calendarEvents: [],
      calendarEnabled: false,
    });
    const tripEnergyPrediction = predictTripEnergy(profile, options.batteryCapacityKWh);
    const combinedConfidence = Math.min(
      departurePrediction.confidence,
      tripEnergyPrediction.confidence,
    );
    const guaranteedSocResult = calculateGuaranteedSoc({
      tripRequirementSoc: tripEnergyPrediction.requiredTripSoc,
      userReserveSoc: options.userReserveSoc,
      hardMinimumSoc: options.hardMinimumSoc,
      confidence: combinedConfidence,
    });

    const predictedDeparture = new Date(departurePrediction.predictedDeparture);
    const tripDurationMs =
      new Date(trip.arrivalTime).getTime() - new Date(trip.departureTime).getTime();
    const predictedReturn = new Date(predictedDeparture.getTime() + Math.max(tripDurationMs, 15 * 60_000));

    const horizonEnd = new Date(
      Math.max(predictedReturn.getTime(), actualDeparture.getTime() + tripDurationMs),
    );
    const horizonSlots = Math.min(
      96,
      Math.max(
        4,
        Math.ceil((horizonEnd.getTime() - decisionTime.getTime()) / (slotMinutes * 60_000)) +
          HORIZON_BUFFER_SLOTS,
      ),
    );

    const comparison = compareStrategies({
      startTime: decisionTime,
      slotMinutes,
      horizonSlots,
      initialSoc: trip.startSoc,
      batteryCapacityKWh: options.batteryCapacityKWh,
      maxChargePowerKW: options.maxChargePowerKW,
      maxDischargePowerKW: options.maxDischargePowerKW,
      connected: true,
      telemetryStale: false,
      predictedDeparture,
      predictedReturn,
      actualDeparture,
      predictedTripRequirementSoc: tripEnergyPrediction.requiredTripSoc,
      predictedTripEnergyKWh: tripEnergyPrediction.requiredEnergyKWh,
      actualTripEnergyKWh: trip.energyUsedKWh,
      gridSignals: generateSimulatedGridSignals(decisionTime, slotMinutes, horizonSlots),
      adaptiveGuaranteedSoc: guaranteedSocResult.guaranteedSoc,
      fixedMinimumSoc: options.fixedMinimumSoc,
      hardMinimumSoc: options.hardMinimumSoc,
    });

    days.push({
      date: trip.departureTime.slice(0, 10),
      comparison,
      guaranteedSocResult,
      departurePrediction,
      actualTrip: trip,
    });
  }

  const fixedRun = buildStrategyRunResult(
    "fixed",
    days.map((d) => d.comparison),
  );
  const adaptiveRun = buildStrategyRunResult(
    "adaptive",
    days.map((d) => d.comparison),
  );

  return {
    days,
    fixedMetrics: computeValidationMetrics(fixedRun),
    adaptiveMetrics: computeValidationMetrics(adaptiveRun, fixedRun),
  };
}
