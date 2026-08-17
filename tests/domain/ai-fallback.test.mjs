import assert from "node:assert/strict";
import test from "node:test";
import {
  fallbackCalendarMobilityAnalysis,
  fallbackMobilityContextAnalysis,
} from "../../lib/services/ai/fallback.ts";
import { MockAIProvider } from "../../lib/services/ai/MockAIProvider.ts";

function event(overrides = {}) {
  return {
    id: "ev-1",
    start: "2026-08-24T09:00:00+09:00",
    end: "2026-08-24T10:00:00+09:00",
    allDay: false,
    ...overrides,
  };
}

test("fallback calendar heuristic treats a located, non-all-day event as more mobility-relevant", () => {
  const withLocation = fallbackCalendarMobilityAnalysis({
    event: event({ location: "광주캠퍼스" }),
    mobilityProfile: { historySampleCount: 0 },
    nowIso: "2026-08-24T06:00:00+09:00",
  });
  const withoutLocation = fallbackCalendarMobilityAnalysis({
    event: event(),
    mobilityProfile: { historySampleCount: 0 },
    nowIso: "2026-08-24T06:00:00+09:00",
  });
  assert.ok(withLocation.vehicleNeedProbability > withoutLocation.vehicleNeedProbability);
  assert.equal(withLocation.source, "fallback");
});

test("fallback calendar heuristic treats all-day events as low mobility relevance", () => {
  const allDay = fallbackCalendarMobilityAnalysis({
    event: event({ allDay: true, location: "somewhere" }),
    mobilityProfile: { historySampleCount: 0 },
    nowIso: "2026-08-24T06:00:00+09:00",
  });
  assert.equal(allDay.mobilityRelevant, false);
});

test("fallback mobility context analysis never throws and stays within [0,1]", () => {
  const result = fallbackMobilityContextAnalysis({
    nowIso: "2026-08-24T06:00:00+09:00",
    mobilityProfile: { historySampleCount: 0 },
    upcomingEvents: [event({ location: "x" }), event({ allDay: true })],
  });
  assert.ok(result.vehicleNeedProbability >= 0 && result.vehicleNeedProbability <= 1);
  assert.ok(result.confidence >= 0 && result.confidence <= 1);
});

test("MockAIProvider is deterministic and never performs network I/O", async () => {
  const provider = new MockAIProvider();
  const a = await provider.classifyCalendarEvent({
    event: event({ location: "x" }),
    mobilityProfile: { historySampleCount: 0 },
    nowIso: "2026-08-24T06:00:00+09:00",
  });
  const b = await provider.classifyCalendarEvent({
    event: event({ location: "x" }),
    mobilityProfile: { historySampleCount: 0 },
    nowIso: "2026-08-24T06:00:00+09:00",
  });
  assert.deepEqual(a, b);
});
