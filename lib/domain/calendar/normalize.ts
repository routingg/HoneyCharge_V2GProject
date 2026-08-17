import type { NormalizedCalendarEvent } from "./types";

/**
 * §10: strips a raw calendar-provider event down to the minimal fields
 * HoneyCharge needs. Attendees, descriptions, attachments, and contact
 * details are never read past this boundary.
 */
export function normalizeCalendarEvent(raw: {
  id: string;
  start: string;
  end: string;
  allDay?: boolean;
  location?: string;
  locationSharingEnabled: boolean;
}): NormalizedCalendarEvent {
  return {
    id: raw.id,
    start: raw.start,
    end: raw.end,
    allDay: Boolean(raw.allDay),
    location: raw.locationSharingEnabled ? raw.location : undefined,
  };
}
