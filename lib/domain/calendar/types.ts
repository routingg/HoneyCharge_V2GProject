/** Data-minimized calendar event (§10) — never attendees/description/attachments. */
export interface NormalizedCalendarEvent {
  id: string;
  start: string;
  end: string;
  allDay: boolean;
  location?: string;
}

export interface CalendarMobilityAnalysis {
  mobilityRelevant: boolean;
  vehicleNeedProbability: number;
  suggestedDepartureTime?: string;
  confidence: number;
  reasons: string[];
}
