import type { NormalizedCalendarEvent, CalendarMobilityAnalysis } from "../../domain/calendar/types";
import type { MobilityProfile } from "../../domain/mobility/types";

export type AIResultSource = "gemini" | "fallback";

export interface CalendarEventContext {
  event: NormalizedCalendarEvent;
  mobilityProfile: MobilityProfile;
  nowIso: string;
}

export interface MobilityContext {
  nowIso: string;
  mobilityProfile: MobilityProfile;
  upcomingEvents: NormalizedCalendarEvent[];
}

export interface MobilityContextAnalysis {
  vehicleNeedProbability: number;
  confidence: number;
  notes: string[];
  source: AIResultSource;
}

export interface ScheduleExplanationInput {
  currentSoc: number;
  guaranteedSoc: number;
  tripRequirementSoc: number;
  userReserveSoc: number;
  departureTimeIso: string;
  historicalConfidence: number;
  calendarRelevance: "none" | "low" | "medium" | "high";
  action: "CHARGE" | "IDLE" | "DISCHARGE";
}

export interface ScheduleExplanation {
  headline: string;
  detail: string;
  source: AIResultSource;
}

/** §6: the domain-facing AI interface. UI/business logic depend on this, never the Gemini SDK directly. */
export interface AIService {
  classifyCalendarEvent(
    input: CalendarEventContext,
  ): Promise<CalendarMobilityAnalysis & { source: AIResultSource }>;

  analyzeMobilityContext(input: MobilityContext): Promise<MobilityContextAnalysis>;

  explainSchedule(input: ScheduleExplanationInput): Promise<ScheduleExplanation>;
}

export interface AiFallbackLogEntry {
  type: "AI_FALLBACK";
  provider: "gemini";
  reason:
    | "DISABLED"
    | "MISSING_KEY"
    | "TIMEOUT"
    | "RATE_LIMIT"
    | "INVALID_JSON"
    | "INVALID_SCHEMA"
    | "NETWORK_ERROR"
    | "SERVER_ERROR"
    | "UNKNOWN_ERROR";
  fallback: "HISTORICAL_PATTERN";
  detail?: string;
}
