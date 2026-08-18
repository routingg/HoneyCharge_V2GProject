import type { CalendarMobilityAnalysis } from "../../domain/calendar/types";
import type {
  AiFallbackLogEntry,
  CalendarEventContext,
  MobilityContext,
  MobilityContextAnalysis,
  ScheduleExplanation,
  ScheduleExplanationInput,
} from "./types";

/** §9: structured, greppable fallback logging — never silent. */
export function logAiFallback(entry: AiFallbackLogEntry): void {
  console.warn(JSON.stringify(entry));
}

/**
 * §9, §18: the deterministic historical/heuristic predictor used whenever
 * Gemini is disabled, unavailable, or returned an invalid response. Uses
 * the same location-presence heuristic the domain layer falls back to
 * when no AI analysis is supplied at all, so behavior is consistent
 * whether or not Gemini was ever involved.
 */
export function fallbackCalendarMobilityAnalysis(
  input: CalendarEventContext,
): CalendarMobilityAnalysis & { source: "fallback" } {
  const hasLocation = Boolean(input.event.location);
  const vehicleNeedProbability = input.event.allDay ? 0.1 : hasLocation ? 0.6 : 0.25;
  const confidence = input.event.allDay ? 0.15 : hasLocation ? 0.5 : 0.2;

  return {
    mobilityRelevant: vehicleNeedProbability >= 0.4,
    vehicleNeedProbability,
    confidence,
    reasons: [
      hasLocation
        ? "Event has a shared location and is not all-day — treated as a weak mobility signal."
        : "No location shared and event is not all-day — low-confidence weak signal.",
      "Gemini unavailable: using the deterministic location-presence heuristic (larger safety margin applies downstream).",
    ],
    source: "fallback",
  };
}

export function fallbackMobilityContextAnalysis(
  input: MobilityContext,
): MobilityContextAnalysis {
  const relevantEvents = input.upcomingEvents.filter((e) => !e.allDay && e.location);
  const vehicleNeedProbability = relevantEvents.length > 0 ? 0.55 : 0.2;
  return {
    vehicleNeedProbability,
    confidence: 0.3,
    notes: [
      `Gemini를 사용할 수 없어 규칙 기반으로 판단했어요 — 위치가 있는 예정 일정 ${relevantEvents.length}건을 참고했어요.`,
    ],
    source: "fallback",
  };
}

export function fallbackScheduleExplanation(
  input: ScheduleExplanationInput,
): ScheduleExplanation {
  const actionText =
    input.action === "CHARGE" ? "충전" : input.action === "DISCHARGE" ? "방전" : "대기";
  return {
    headline: `현재 ${actionText} 중이에요`,
    detail: `보장 잔량 ${input.guaranteedSoc}%(이동 ${input.tripRequirementSoc}% + 여유 ${input.userReserveSoc}%)를 지키면서 현재 SOC ${input.currentSoc}%를 관리하고 있어요.`,
    source: "fallback",
  };
}
