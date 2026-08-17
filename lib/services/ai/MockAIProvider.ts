import type { CalendarMobilityAnalysis } from "../../domain/calendar/types";
import type {
  AIService,
  CalendarEventContext,
  MobilityContext,
  MobilityContextAnalysis,
  ScheduleExplanation,
  ScheduleExplanationInput,
} from "./types";

/**
 * §72: deterministic AI provider used by automated tests so they never
 * depend on network access, incur API cost, or become flaky. Never used
 * in production — see `AIService.ts`.
 */
export class MockAIProvider implements AIService {
  async classifyCalendarEvent(
    input: CalendarEventContext,
  ): Promise<CalendarMobilityAnalysis & { source: "gemini" }> {
    const relevant = Boolean(input.event.location) && !input.event.allDay;
    return {
      mobilityRelevant: relevant,
      vehicleNeedProbability: relevant ? 0.8 : 0.1,
      confidence: 0.9,
      reasons: ["mock-provider: deterministic test double"],
      source: "gemini",
    };
  }

  async analyzeMobilityContext(input: MobilityContext): Promise<MobilityContextAnalysis> {
    return {
      vehicleNeedProbability: input.upcomingEvents.length > 0 ? 0.7 : 0.2,
      confidence: 0.9,
      notes: ["mock-provider: deterministic test double"],
      source: "gemini",
    };
  }

  async explainSchedule(input: ScheduleExplanationInput): Promise<ScheduleExplanation> {
    return {
      headline: `MOCK: ${input.action}`,
      detail: `mock-provider explanation for guaranteedSoc=${input.guaranteedSoc}`,
      source: "gemini",
    };
  }
}
