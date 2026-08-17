import assert from "node:assert/strict";
import test from "node:test";
import { calculateGuaranteedSoc } from "../../lib/domain/soc/guaranteedSoc.ts";
import { marginForConfidence } from "../../lib/domain/soc/safetyMargin.ts";

test("marginForConfidence follows the configured tiers", () => {
  assert.equal(marginForConfidence(0.9), 5);
  assert.equal(marginForConfidence(0.85), 5);
  assert.equal(marginForConfidence(0.8), 8);
  assert.equal(marginForConfidence(0.6), 12);
  assert.equal(marginForConfidence(0.35), 17);
  assert.equal(marginForConfidence(0.1), 22);
});

test("guaranteedSoc sums trip requirement + reserve + margin", () => {
  const result = calculateGuaranteedSoc({
    tripRequirementSoc: 7,
    userReserveSoc: 30,
    hardMinimumSoc: 20,
    confidence: 0.9, // -> 5pt margin
  });
  assert.equal(result.guaranteedSoc, 42); // 7 + 30 + 5
  assert.equal(result.uncertaintyMarginSoc, 5);
  assert.ok(result.reasoning.length > 0);
});

test("guaranteedSoc is floored at the user's hard minimum", () => {
  const result = calculateGuaranteedSoc({
    tripRequirementSoc: 2,
    userReserveSoc: 5,
    hardMinimumSoc: 40,
    confidence: 0.9,
  });
  assert.equal(result.guaranteedSoc, 40);
});

test("guaranteedSoc never exceeds the valid SOC range", () => {
  const result = calculateGuaranteedSoc({
    tripRequirementSoc: 80,
    userReserveSoc: 50,
    hardMinimumSoc: 20,
    confidence: 0.1,
  });
  assert.equal(result.guaranteedSoc, 100);
});

test("low confidence increases the guaranteed SOC via a larger margin", () => {
  const confident = calculateGuaranteedSoc({
    tripRequirementSoc: 10,
    userReserveSoc: 10,
    hardMinimumSoc: 0,
    confidence: 0.9,
  });
  const uncertain = calculateGuaranteedSoc({
    tripRequirementSoc: 10,
    userReserveSoc: 10,
    hardMinimumSoc: 0,
    confidence: 0.2,
  });
  assert.ok(uncertain.guaranteedSoc > confident.guaranteedSoc);
});
