import type { CalendarMobilityAnalysis } from "../../domain/calendar/types";
import type { MobilityContextAnalysis, ScheduleExplanation } from "./types";

/**
 * §8: structured output only. These are handed to Gemini as
 * `responseSchema` (so the model is constrained to emit exactly this
 * shape) AND used to validate the parsed JSON afterward — Gemini is not
 * trusted just because it returned 200 OK.
 */
export const calendarMobilityAnalysisSchema = {
  type: "object",
  properties: {
    mobilityRelevant: { type: "boolean" },
    vehicleNeedProbability: { type: "number" },
    suggestedDepartureTime: { type: "string" },
    confidence: { type: "number" },
    reasons: { type: "array", items: { type: "string" } },
  },
  required: ["mobilityRelevant", "vehicleNeedProbability", "confidence", "reasons"],
} as const;

export const mobilityContextAnalysisSchema = {
  type: "object",
  properties: {
    vehicleNeedProbability: { type: "number" },
    confidence: { type: "number" },
    notes: { type: "array", items: { type: "string" } },
  },
  required: ["vehicleNeedProbability", "confidence", "notes"],
} as const;

export const scheduleExplanationSchema = {
  type: "object",
  properties: {
    headline: { type: "string" },
    detail: { type: "string" },
  },
  required: ["headline", "detail"],
} as const;

interface ValidationResult<T> {
  valid: boolean;
  value?: T;
  errors: string[];
}

function isUnitInterval(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 1;
}

/** §8: rejects out-of-range or malformed values instead of silently accepting them. */
export function validateCalendarMobilityAnalysis(
  raw: unknown,
): ValidationResult<Omit<CalendarMobilityAnalysis, never>> {
  const errors: string[] = [];
  if (typeof raw !== "object" || raw === null) {
    return { valid: false, errors: ["response is not an object"] };
  }
  const r = raw as Record<string, unknown>;

  if (typeof r.mobilityRelevant !== "boolean") errors.push("mobilityRelevant must be boolean");
  if (!isUnitInterval(r.vehicleNeedProbability)) {
    errors.push("vehicleNeedProbability must be a number in [0, 1]");
  }
  if (!isUnitInterval(r.confidence)) errors.push("confidence must be a number in [0, 1]");
  if (
    r.suggestedDepartureTime !== undefined &&
    (typeof r.suggestedDepartureTime !== "string" || Number.isNaN(Date.parse(r.suggestedDepartureTime as string)))
  ) {
    errors.push("suggestedDepartureTime must be a valid ISO datetime when present");
  }
  if (!Array.isArray(r.reasons) || r.reasons.some((x) => typeof x !== "string") || r.reasons.length > 10) {
    errors.push("reasons must be an array of at most 10 strings");
  }

  if (errors.length > 0) return { valid: false, errors };

  return {
    valid: true,
    errors: [],
    value: {
      mobilityRelevant: r.mobilityRelevant as boolean,
      vehicleNeedProbability: r.vehicleNeedProbability as number,
      suggestedDepartureTime: r.suggestedDepartureTime as string | undefined,
      confidence: r.confidence as number,
      reasons: (r.reasons as string[]).slice(0, 10),
    },
  };
}

export function validateMobilityContextAnalysis(
  raw: unknown,
): ValidationResult<Omit<MobilityContextAnalysis, "source">> {
  const errors: string[] = [];
  if (typeof raw !== "object" || raw === null) {
    return { valid: false, errors: ["response is not an object"] };
  }
  const r = raw as Record<string, unknown>;
  if (!isUnitInterval(r.vehicleNeedProbability)) errors.push("vehicleNeedProbability must be in [0, 1]");
  if (!isUnitInterval(r.confidence)) errors.push("confidence must be in [0, 1]");
  if (!Array.isArray(r.notes) || r.notes.some((x) => typeof x !== "string")) {
    errors.push("notes must be an array of strings");
  }
  if (errors.length > 0) return { valid: false, errors };
  return {
    valid: true,
    errors: [],
    value: {
      vehicleNeedProbability: r.vehicleNeedProbability as number,
      confidence: r.confidence as number,
      notes: (r.notes as string[]).slice(0, 10),
    },
  };
}

export function validateScheduleExplanation(
  raw: unknown,
): ValidationResult<Omit<ScheduleExplanation, "source">> {
  const errors: string[] = [];
  if (typeof raw !== "object" || raw === null) {
    return { valid: false, errors: ["response is not an object"] };
  }
  const r = raw as Record<string, unknown>;
  if (typeof r.headline !== "string" || r.headline.length === 0 || r.headline.length > 60) {
    errors.push("headline must be a non-empty string up to 60 chars");
  }
  if (typeof r.detail !== "string" || r.detail.length === 0 || r.detail.length > 300) {
    errors.push("detail must be a non-empty string up to 300 chars");
  }
  if (errors.length > 0) return { valid: false, errors };
  return {
    valid: true,
    errors: [],
    value: { headline: r.headline as string, detail: r.detail as string },
  };
}
