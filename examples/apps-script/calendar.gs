/**
 * Reference only — not deployed (see README.md in this directory).
 *
 * Reads upcoming Google Calendar events and normalizes them to
 * HoneyCharge's NormalizedCalendarEvent shape (lib/domain/calendar/types.ts).
 * §10: only start/end/allDay/location are ever read — never attendees,
 * description, attachments, or conferencing details.
 */
function getNormalizedUpcomingEvents() {
  const config = getConfig();
  const now = new Date();
  const horizon = new Date(now.getTime() + config.calendarLookaheadHours * 60 * 60 * 1000);

  const calendar = CalendarApp.getDefaultCalendar();
  const events = calendar.getEvents(now, horizon);

  return events.map(function (event) {
    return {
      id: event.getId(),
      start: event.getStartTime().toISOString(),
      end: event.getEndTime().toISOString(),
      allDay: event.isAllDayEvent(),
      location: config.locationSharingEnabled ? (event.getLocation() || undefined) : undefined,
    };
  });
}
