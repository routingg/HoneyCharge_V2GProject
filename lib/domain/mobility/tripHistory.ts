import { assertNonNegative, assertValidSoc } from "../assert";
import { dayOfWeekKst, toKstIso } from "../clock";
import type { TripRecord } from "./types";

export interface SyntheticTripHistoryOptions {
  vehicleId: string;
  days: number;
  endDate: Date;
  batteryCapacityKWh: number;
  /** deterministic seed so the same options always produce the same history (§33). */
  seed: number;
}

/** xorshift32 — deterministic, seedable, dependency-free PRNG. */
function makeRng(seed: number): () => number {
  let state = seed || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    state |= 0;
    return ((state >>> 0) % 1_000_000) / 1_000_000;
  };
}

/**
 * Generates ~30 days of clearly-synthetic commuter trip history (§66):
 * weekday commute pattern, weekend irregularity, occasional early/late
 * departures, missed and unexpected trips, and varying trip length /
 * efficiency. Deterministic given the same seed.
 */
export function generateSyntheticTripHistory(
  options: SyntheticTripHistoryOptions,
): TripRecord[] {
  const rng = makeRng(options.seed);
  const trips: TripRecord[] = [];

  for (let dayOffset = options.days; dayOffset >= 1; dayOffset--) {
    const day = new Date(
      options.endDate.getTime() - dayOffset * 24 * 60 * 60_000,
    );
    const dow = dayOfWeekKst(day);
    const isWeekend = dow === 0 || dow === 6;

    // Missed expected trip (stayed home) — small chance on weekdays.
    if (!isWeekend && rng() < 0.06) continue;
    // Unexpected weekend trip — small chance.
    if (isWeekend && rng() > 0.4) continue;

    const baseDepartureMinute = isWeekend ? 10 * 60 + 30 : 8 * 60;
    const jitterMinutes = isWeekend ? (rng() - 0.5) * 240 : (rng() - 0.5) * 40;
    // Occasional much earlier/later departure to exercise prediction variance.
    const outlier = rng() < 0.08 ? (rng() < 0.5 ? -90 : 60) : 0;
    const departureMinute = Math.max(
      0,
      Math.min(23 * 60 + 59, Math.round(baseDepartureMinute + jitterMinutes + outlier)),
    );

    const distanceKm = isWeekend
      ? 15 + rng() * 60
      : 12 + rng() * 18;
    const consumptionKWhPerKm = 0.15 + rng() * 0.05;
    const energyUsedKWh = Number((distanceKm * consumptionKWhPerKm).toFixed(2));
    const tripDurationMinutes = Math.round(20 + distanceKm * 1.2);

    const startSoc = assertValidSoc(
      Number((55 + rng() * 35).toFixed(1)),
      "startSoc",
    );
    const energyFractionOfBattery =
      (energyUsedKWh / options.batteryCapacityKWh) * 100;
    const endSoc = assertValidSoc(
      Math.max(5, Number((startSoc - energyFractionOfBattery).toFixed(1))),
      "endSoc",
    );

    const departureDate = new Date(day);
    departureDate.setHours(0, departureMinute, 0, 0);
    const arrivalDate = new Date(
      departureDate.getTime() + tripDurationMinutes * 60_000,
    );

    trips.push({
      tripId: `${options.vehicleId}-${toKstIso(day).slice(0, 10)}`,
      departureTime: toKstIso(departureDate),
      arrivalTime: toKstIso(arrivalDate),
      startSoc,
      endSoc,
      distanceKm: Number(distanceKm.toFixed(1)),
      energyUsedKWh: assertNonNegative(energyUsedKWh, "energyUsedKWh"),
      dayOfWeek: dow,
    });
  }

  return trips;
}
