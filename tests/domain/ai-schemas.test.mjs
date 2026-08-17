import assert from "node:assert/strict";
import test from "node:test";
import {
  validateCalendarMobilityAnalysis,
  validateMobilityContextAnalysis,
  validateScheduleExplanation,
} from "../../lib/services/ai/schemas.ts";

test("validateCalendarMobilityAnalysis accepts a well-formed response", () => {
  const result = validateCalendarMobilityAnalysis({
    mobilityRelevant: true,
    vehicleNeedProbability: 0.8,
    confidence: 0.7,
    reasons: ["on-site meeting"],
  });
  assert.equal(result.valid, true);
  assert.equal(result.value.vehicleNeedProbability, 0.8);
});

test("validateCalendarMobilityAnalysis rejects out-of-range probabilities (§8)", () => {
  const result = validateCalendarMobilityAnalysis({
    mobilityRelevant: true,
    vehicleNeedProbability: 1.5,
    confidence: 0.7,
    reasons: [],
  });
  assert.equal(result.valid, false);
  assert.ok(result.errors.length > 0);
});

test("validateCalendarMobilityAnalysis rejects malformed suggestedDepartureTime", () => {
  const result = validateCalendarMobilityAnalysis({
    mobilityRelevant: true,
    vehicleNeedProbability: 0.5,
    confidence: 0.5,
    reasons: [],
    suggestedDepartureTime: "not-a-date",
  });
  assert.equal(result.valid, false);
});

test("validateCalendarMobilityAnalysis rejects a non-object", () => {
  assert.equal(validateCalendarMobilityAnalysis(null).valid, false);
  assert.equal(validateCalendarMobilityAnalysis("hello").valid, false);
});

test("validateMobilityContextAnalysis requires notes as a string array", () => {
  assert.equal(
    validateMobilityContextAnalysis({ vehicleNeedProbability: 0.5, confidence: 0.5, notes: "oops" }).valid,
    false,
  );
  assert.equal(
    validateMobilityContextAnalysis({ vehicleNeedProbability: 0.5, confidence: 0.5, notes: [] }).valid,
    true,
  );
});

test("validateScheduleExplanation enforces length bounds so Gemini can't return a wall of text", () => {
  const tooLong = "x".repeat(400);
  assert.equal(
    validateScheduleExplanation({ headline: "ok", detail: tooLong }).valid,
    false,
  );
  assert.equal(
    validateScheduleExplanation({ headline: "충전 중", detail: "설명" }).valid,
    true,
  );
});
