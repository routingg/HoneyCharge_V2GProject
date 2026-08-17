import assert from "node:assert/strict";
import test from "node:test";
import { compareStrategies, countSafetyViolations } from "../../lib/domain/validation/compare.ts";
import { buildStrategyRunResult, computeValidationMetrics } from "../../lib/domain/validation/metrics.ts";
import { generateSimulatedGridSignals } from "../../lib/domain/grid/gridSignal.ts";

const START = new Date("2026-08-24T00:00:00+09:00");

function scenario(overrides = {}) {
  const predictedDeparture = new Date(START.getTime() + 8 * 60 * 60_000);
  const predictedReturn = new Date(predictedDeparture.getTime() + 60 * 60_000);
  return {
    startTime: START,
    slotMinutes: 30,
    horizonSlots: 48,
    initialSoc: 70,
    batteryCapacityKWh: 77.4,
    maxChargePowerKW: 7,
    maxDischargePowerKW: 5,
    connected: true,
    telemetryStale: false,
    predictedDeparture,
    predictedReturn,
    predictedTripRequirementSoc: 8,
    predictedTripEnergyKWh: 6,
    actualTripEnergyKWh: 6,
    gridSignals: generateSimulatedGridSignals(START, 30, 48),
    adaptiveGuaranteedSoc: 42,
    fixedMinimumSoc: 50,
    hardMinimumSoc: 20,
    ...overrides,
  };
}

test("both strategies run against identical scenario inputs", () => {
  const result = compareStrategies(scenario());
  assert.equal(result.fixed.slots.length, result.adaptive.slots.length);
  assert.equal(result.fixed.slots[0].start, result.adaptive.slots[0].start);
});

test("countSafetyViolations is zero for a well-formed schedule", () => {
  const result = compareStrategies(scenario());
  assert.equal(countSafetyViolations(result.fixed, 20), 0);
  assert.equal(countSafetyViolations(result.adaptive, 20), 0);
});

test("an adaptive strategy is not assumed to beat the baseline: identical guaranteed floors tie", () => {
  const result = compareStrategies(
    scenario({ adaptiveGuaranteedSoc: 50, fixedMinimumSoc: 50 }),
  );
  assert.equal(result.adaptive.totalDischargedKWh, result.fixed.totalDischargedKWh);
});

test("computeValidationMetrics reports null improvement when baseline discharged nothing", () => {
  const run = buildStrategyRunResult("adaptive", [compareStrategies(scenario())]);
  const emptyBaseline = { strategyName: "fixed", outcomes: [], totalChargedKWh: 0, totalDischargedKWh: 0 };
  const metrics = computeValidationMetrics(run, emptyBaseline);
  assert.equal(metrics.adaptiveImprovementPercent, null);
});

test("computeValidationMetrics computes MAE and guarantee rate across multiple runs", () => {
  const runs = [
    compareStrategies(scenario({ actualTripEnergyKWh: 6 })),
    compareStrategies(scenario({ actualTripEnergyKWh: 12, predictedTripEnergyKWh: 6 })),
  ];
  const adaptiveRun = buildStrategyRunResult("adaptive", runs);
  const fixedRun = buildStrategyRunResult("fixed", runs);
  const metrics = computeValidationMetrics(adaptiveRun, fixedRun);
  assert.equal(metrics.runsEvaluated, 2);
  assert.ok(metrics.socPredictionMAE >= 0);
  assert.ok(metrics.mobilityGuaranteeRatePercent >= 0 && metrics.mobilityGuaranteeRatePercent <= 100);
});
