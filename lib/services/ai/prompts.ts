import type { CalendarEventContext, MobilityContext, ScheduleExplanationInput } from "./types";

/**
 * §81: prompts are versioned so experiment results (§52) stay
 * reproducible — the version id is recorded alongside every AI call in
 * the audit log.
 */
export const PROMPT_VERSIONS = {
  calendarMobility: "calendar-mobility-v1",
  mobilityContext: "mobility-context-v1",
  scheduleExplanation: "schedule-explanation-v1",
} as const;

/**
 * §10: only start/end/allDay/location are ever sent — never attendee
 * lists, descriptions, or attachments, because `NormalizedCalendarEvent`
 * cannot carry them in the first place.
 */
export function buildCalendarMobilityPrompt(input: CalendarEventContext): string {
  return [
    "You are a mobility-context classifier for an EV smart-charging system.",
    "Given a single normalized calendar event and the driver's statistical mobility profile,",
    "estimate whether this event will require the driver's own vehicle.",
    "This is a classification task, not creative writing — be concise and consistent.",
    "",
    `Current time: ${input.nowIso}`,
    `Event: start=${input.event.start} end=${input.event.end} allDay=${input.event.allDay} location=${
      input.event.location ?? "(not shared)"
    }`,
    `Driver mobility profile: ${JSON.stringify(input.mobilityProfile)}`,
    "",
    "Respond with the required JSON schema only.",
  ].join("\n");
}

export function buildMobilityContextPrompt(input: MobilityContext): string {
  return [
    "You are a mobility-context analyst for an EV smart-charging system.",
    "Given upcoming (data-minimized) calendar events and a statistical mobility profile,",
    "estimate the overall probability the driver will need their vehicle soon.",
    "",
    `Current time: ${input.nowIso}`,
    `Mobility profile: ${JSON.stringify(input.mobilityProfile)}`,
    `Upcoming events: ${JSON.stringify(input.upcomingEvents)}`,
    "",
    "Respond with the required JSON schema only.",
  ].join("\n");
}

/**
 * §97: Gemini may rewrite the FACTS into natural language, but must not
 * change the numbers. The facts block is presented as given data, and the
 * instruction explicitly forbids altering it.
 */
export function buildScheduleExplanationPrompt(input: ScheduleExplanationInput): string {
  return [
    "You are writing a short, reassuring explanation for an EV owner about",
    "why HoneyCharge is charging, discharging, or idling their vehicle right now.",
    "Use ONLY the facts below. Do not invent or alter any numbers.",
    "",
    "FACTS",
    `Current SOC: ${input.currentSoc}%`,
    `Guaranteed SOC: ${input.guaranteedSoc}%`,
    `Trip requirement portion: ${input.tripRequirementSoc}%`,
    `User reserve portion: ${input.userReserveSoc}%`,
    `Predicted departure: ${input.departureTimeIso}`,
    `Historical confidence: ${input.historicalConfidence}`,
    `Calendar relevance: ${input.calendarRelevance}`,
    `Current action: ${input.action}`,
    "",
    "Respond with the required JSON schema only. Keep the headline under 60",
    "characters and the detail under 300 characters, in Korean.",
  ].join("\n");
}
