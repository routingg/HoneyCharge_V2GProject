import { dayOfWeekKst, minuteOfDay, toKstIso } from "../clock";
import type { NormalizedCalendarEvent } from "../calendar/types";
import type { DeparturePrediction, TripRecord } from "./types";

interface DepartureCandidate {
  source: "historical" | "calendar" | "gemini";
  minuteOfDay: number;
  confidence: number;
  note: string;
}

const HALF_LIFE_DAYS = 14;

function recencyWeight(trip: TripRecord, now: Date): number {
  const ageDays =
    (now.getTime() - new Date(trip.departureTime).getTime()) /
    (24 * 60 * 60_000);
  return Math.pow(0.5, Math.max(0, ageDays) / HALF_LIFE_DAYS);
}

function weightedMeanAndStd(
  values: number[],
  weights: number[],
): { mean: number; std: number } {
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  if (totalWeight === 0) return { mean: values[0] ?? 0, std: 999 };
  const mean =
    values.reduce((sum, v, i) => sum + v * weights[i], 0) / totalWeight;
  const variance =
    values.reduce((sum, v, i) => sum + weights[i] * (v - mean) ** 2, 0) /
    totalWeight;
  return { mean, std: Math.sqrt(variance) };
}

/** §17: same-weekday distribution + recency-weighted mean + variance -> confidence. */
function historicalCandidate(
  trips: TripRecord[],
  targetDayOfWeek: number,
  now: Date,
): DepartureCandidate | null {
  const sameWeekday = trips.filter((t) => t.dayOfWeek === targetDayOfWeek);
  const pool = sameWeekday.length >= 3 ? sameWeekday : trips;
  if (pool.length === 0) return null;

  const minutes = pool.map((t) => minuteOfDay(new Date(t.departureTime)));
  const weights = pool.map((t) => recencyWeight(t, now));
  const { mean, std } = weightedMeanAndStd(minutes, weights);

  const sampleFactor = Math.min(1, pool.length / 8);
  const consistencyFactor = Math.max(0.1, Math.min(0.95, 1 - std / 180));
  const weekdaySpecificityBonus = sameWeekday.length >= 3 ? 1 : 0.85;
  const confidence = Number(
    (sampleFactor * consistencyFactor * weekdaySpecificityBonus).toFixed(2),
  );

  return {
    source: "historical",
    minuteOfDay: mean,
    confidence,
    note: `Based on ${pool.length} historical trip(s), std=${std.toFixed(0)}min`,
  };
}

/**
 * §18: calendar is a signal, not ground truth. Without Gemini, a location
 * present on a non-all-day event is treated as a weak mobility signal;
 * Gemini classification (passed in via `geminiAnalysis`) overrides this
 * heuristic when available.
 */
function calendarCandidate(
  events: NormalizedCalendarEvent[],
  now: Date,
  horizonHours: number,
  geminiAnalysis?: { eventId: string; vehicleNeedProbability: number; confidence: number }[],
): DepartureCandidate | null {
  const horizonMs = horizonHours * 60 * 60_000;
  const upcoming = events
    .filter((e) => !e.allDay)
    .filter((e) => {
      const start = new Date(e.start).getTime();
      return start >= now.getTime() && start <= now.getTime() + horizonMs;
    })
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  if (upcoming.length === 0) return null;
  const next = upcoming[0];
  const geminiForEvent = geminiAnalysis?.find((g) => g.eventId === next.id);

  const relevanceProbability =
    geminiForEvent?.vehicleNeedProbability ?? (next.location ? 0.6 : 0.25);
  const baseConfidence = geminiForEvent?.confidence ?? (next.location ? 0.5 : 0.2);

  if (relevanceProbability < 0.4) return null;

  // Assume a 20-minute travel buffer ahead of the event start.
  const suggestedMinute = Math.max(0, minuteOfDay(new Date(next.start)) - 20);

  return {
    source: geminiForEvent ? "gemini" : "calendar",
    minuteOfDay: suggestedMinute,
    confidence: Number((baseConfidence * relevanceProbability).toFixed(2)),
    note: geminiForEvent
      ? `Gemini classified calendar event as mobility-relevant (p=${relevanceProbability})`
      : `Calendar event with location present, heuristic relevance=${relevanceProbability}`,
  };
}

export interface DeparturePredictionInput {
  now: Date;
  trips: TripRecord[];
  calendarEvents: NormalizedCalendarEvent[];
  calendarEnabled: boolean;
  calendarLookaheadHours?: number;
  geminiCalendarAnalysis?: { eventId: string; vehicleNeedProbability: number; confidence: number }[];
}

/**
 * Combines historical, calendar, and (optional) Gemini candidates into a
 * single deterministic departure prediction (§18, §19). Gemini never
 * overwrites the statistical result directly — it only contributes one
 * weighted candidate among several, and only through `calendarCandidate`.
 */
export function predictDeparture(
  input: DeparturePredictionInput,
): DeparturePrediction {
  const targetDayOfWeek = dayOfWeekKst(input.now);
  const candidates: DepartureCandidate[] = [];

  const historical = historicalCandidate(input.trips, targetDayOfWeek, input.now);
  if (historical) candidates.push(historical);

  if (input.calendarEnabled) {
    const calendar = calendarCandidate(
      input.calendarEvents,
      input.now,
      input.calendarLookaheadHours ?? 36,
      input.geminiCalendarAnalysis,
    );
    if (calendar) candidates.push(calendar);
  }

  if (candidates.length === 0) {
    // §40: insufficient history — fall back to a conservative default with
    // low confidence rather than fabricating precision.
    const fallbackDate = new Date(input.now);
    fallbackDate.setHours(8, 0, 0, 0);
    if (fallbackDate.getTime() < input.now.getTime()) {
      fallbackDate.setDate(fallbackDate.getDate() + 1);
    }
    return {
      predictedDeparture: toKstIso(fallbackDate),
      confidence: 0.2,
      sourceWeights: { historical: 0, calendar: 0, gemini: 0 },
      explanationFactors: [
        "No trip history or calendar signal available; using a conservative 08:00 default.",
      ],
    };
  }

  const totalConfidence = candidates.reduce((sum, c) => sum + c.confidence, 0);
  const weights = { historical: 0, calendar: 0, gemini: 0 };
  let weightedMinute = 0;
  for (const c of candidates) {
    const w = totalConfidence > 0 ? c.confidence / totalConfidence : 1 / candidates.length;
    weights[c.source] += Number(w.toFixed(2));
    weightedMinute += w * c.minuteOfDay;
  }

  const spread =
    candidates.length > 1
      ? Math.max(...candidates.map((c) => c.minuteOfDay)) -
        Math.min(...candidates.map((c) => c.minuteOfDay))
      : 0;
  const avgConfidence = totalConfidence / candidates.length;
  const agreementBonus = spread <= 30 && candidates.length > 1 ? 0.1 : 0;
  const spreadPenalty = Math.min(0.4, spread / 720);
  const confidence = Number(
    Math.min(0.95, Math.max(0.05, avgConfidence + agreementBonus - spreadPenalty)).toFixed(
      2,
    ),
  );

  const predictedDate = new Date(input.now);
  const clampedMinute = Math.max(0, Math.min(23 * 60 + 59, Math.round(weightedMinute)));
  predictedDate.setHours(Math.floor(clampedMinute / 60), clampedMinute % 60, 0, 0);
  if (predictedDate.getTime() < input.now.getTime()) {
    predictedDate.setDate(predictedDate.getDate() + 1);
  }

  return {
    predictedDeparture: toKstIso(predictedDate),
    confidence,
    sourceWeights: weights,
    explanationFactors: candidates.map((c) => c.note),
  };
}
