import assert from "node:assert/strict";
import test from "node:test";
import { normalizeCalendarEvent } from "../../lib/domain/calendar/normalize.ts";

test("normalizeCalendarEvent drops fields outside the normalized shape (§10 data minimization)", () => {
  const raw = {
    id: "ev-1",
    start: "2026-08-24T09:00:00+09:00",
    end: "2026-08-24T10:00:00+09:00",
    allDay: false,
    location: "광주캠퍼스",
    locationSharingEnabled: true,
    // fields that must never survive normalization:
    attendees: ["a@example.com", "b@example.com"],
    description: "private meeting notes",
    attachments: [{ url: "https://example.com/secret.pdf" }],
  };
  const normalized = normalizeCalendarEvent(raw);
  assert.deepEqual(Object.keys(normalized).sort(), ["allDay", "end", "id", "location", "start"]);
  assert.equal(normalized.location, "광주캠퍼스");
});

test("location is omitted entirely when the user has not enabled location sharing", () => {
  const normalized = normalizeCalendarEvent({
    id: "ev-2",
    start: "2026-08-24T09:00:00+09:00",
    end: "2026-08-24T10:00:00+09:00",
    allDay: false,
    location: "광주캠퍼스",
    locationSharingEnabled: false,
  });
  assert.equal(normalized.location, undefined);
  assert.equal("location" in normalized, true); // present but undefined, never silently backfilled
});
