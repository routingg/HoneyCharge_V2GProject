import assert from "node:assert/strict";
import test from "node:test";
import { GeminiProvider } from "../../lib/services/ai/GeminiProvider.ts";

// This process never sets GEMINI_ENABLED=true, so GeminiProvider must
// degrade to the deterministic fallback without attempting any network
// call (§9, §72: never rely on a live Gemini API in standard tests).

test("GeminiProvider.classifyCalendarEvent falls back instantly when disabled", async () => {
  const provider = new GeminiProvider();
  const start = Date.now();
  const result = await provider.classifyCalendarEvent({
    event: {
      id: "ev-1",
      start: "2026-08-24T09:00:00+09:00",
      end: "2026-08-24T10:00:00+09:00",
      allDay: false,
      location: "광주캠퍼스",
    },
    mobilityProfile: { historySampleCount: 0 },
    nowIso: "2026-08-24T06:00:00+09:00",
  });
  const elapsedMs = Date.now() - start;
  assert.equal(result.source, "fallback");
  assert.ok(elapsedMs < 500, `expected an instant fallback, took ${elapsedMs}ms`);
});

test("GeminiProvider.explainSchedule falls back instantly when disabled", async () => {
  const provider = new GeminiProvider();
  const result = await provider.explainSchedule({
    currentSoc: 68,
    guaranteedSoc: 42,
    tripRequirementSoc: 7,
    userReserveSoc: 30,
    departureTimeIso: "2026-08-24T08:00:00+09:00",
    historicalConfidence: 0.8,
    calendarRelevance: "low",
    action: "DISCHARGE",
  });
  assert.equal(result.source, "fallback");
  assert.ok(result.headline.length > 0);
});

test("the system remains usable end-to-end with Gemini disabled (§9)", async () => {
  const provider = new GeminiProvider();
  const [calendar, mobility, explanation] = await Promise.all([
    provider.classifyCalendarEvent({
      event: { id: "e", start: "2026-08-24T09:00:00+09:00", end: "2026-08-24T10:00:00+09:00", allDay: false },
      mobilityProfile: { historySampleCount: 0 },
      nowIso: "2026-08-24T06:00:00+09:00",
    }),
    provider.analyzeMobilityContext({
      nowIso: "2026-08-24T06:00:00+09:00",
      mobilityProfile: { historySampleCount: 0 },
      upcomingEvents: [],
    }),
    provider.explainSchedule({
      currentSoc: 50,
      guaranteedSoc: 40,
      tripRequirementSoc: 5,
      userReserveSoc: 30,
      departureTimeIso: "2026-08-24T08:00:00+09:00",
      historicalConfidence: 0.5,
      calendarRelevance: "none",
      action: "IDLE",
    }),
  ]);
  assert.equal(calendar.source, "fallback");
  assert.equal(mobility.source, "fallback");
  assert.equal(explanation.source, "fallback");
});
