import { minuteOfDay } from "../clock";
import type { MobilityProfile, TripRecord } from "./types";

function median(values: number[]): number | undefined {
  if (values.length === 0) return undefined;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function stddev(values: number[], mean: number): number {
  if (values.length === 0) return 0;
  const variance =
    values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * Reduces raw trip history to a small quantitative summary (§96), so that
 * only this summary — not the raw history — is ever sent to Gemini.
 */
export function summarizeMobilityProfile(
  trips: TripRecord[],
  targetDayOfWeek?: number,
): MobilityProfile {
  const relevant =
    targetDayOfWeek === undefined
      ? trips
      : trips.filter((t) => t.dayOfWeek === targetDayOfWeek);
  const pool = relevant.length >= 3 ? relevant : trips;

  const departureMinutes = pool.map((t) => minuteOfDay(new Date(t.departureTime)));
  const arrivalMinutes = pool.map((t) => minuteOfDay(new Date(t.arrivalTime)));
  const distances = trips.map((t) => t.distanceKm);
  const consumptions = trips
    .filter((t) => t.distanceKm > 0)
    .map((t) => t.energyUsedKWh / t.distanceKm);

  const departureMean =
    departureMinutes.length > 0
      ? departureMinutes.reduce((a, b) => a + b, 0) / departureMinutes.length
      : undefined;

  return {
    weekdayTypicalDepartureMinuteOfDay:
      median(departureMinutes) ?? undefined,
    weekdayDepartureStdMinutes:
      departureMean !== undefined
        ? Number(stddev(departureMinutes, departureMean).toFixed(1))
        : undefined,
    typicalReturnMinuteOfDay: median(arrivalMinutes) ?? undefined,
    medianTripDistanceKm: median(distances),
    medianConsumptionKWhPerKm:
      median(consumptions) !== undefined
        ? Number(median(consumptions)!.toFixed(3))
        : undefined,
    historySampleCount: trips.length,
  };
}
