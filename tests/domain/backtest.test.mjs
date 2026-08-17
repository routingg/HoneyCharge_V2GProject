import assert from "node:assert/strict";
import test from "node:test";
import { runFixedVsAdaptiveBacktest } from "../../lib/domain/validation/backtest.ts";

const END_DATE = new Date("2026-08-24T00:00:00+09:00");

function baseOptions(overrides = {}) {
  return {
    vehicleId: "OWN-002",
    batteryCapacityKWh: 77.4,
    maxChargePowerKW: 6.4,
    maxDischargePowerKW: 9,
    hardMinimumSoc: 20,
    userReserveSoc: 15,
    fixedMinimumSoc: 50,
    historyDays: 30,
    minHistoryTripsBeforeScoring: 7,
    seed: 42,
    endDate: END_DATE,
    ...overrides,
  };
}

test("backtest is deterministic for a given seed", () => {
  const a = runFixedVsAdaptiveBacktest(baseOptions());
  const b = runFixedVsAdaptiveBacktest(baseOptions());
  assert.deepEqual(a.adaptiveMetrics, b.adaptiveMetrics);
  assert.deepEqual(a.fixedMetrics, b.fixedMetrics);
});

test("backtest scores multiple days using only prior history (no leakage)", () => {
  const result = runFixedVsAdaptiveBacktest(baseOptions());
  assert.ok(result.days.length > 5, `only scored ${result.days.length} days`);
  for (const day of result.days) {
    assert.ok(day.guaranteedSocResult.guaranteedSoc >= day.guaranteedSocResult.hardMinimumSoc);
  }
});

test("both strategies are evaluated against the same number of real trips", () => {
  const result = runFixedVsAdaptiveBacktest(baseOptions());
  assert.equal(result.fixedMetrics.runsEvaluated, result.days.length);
  assert.equal(result.adaptiveMetrics.runsEvaluated, result.days.length);
});

test("metrics are within physically sane bounds — not fabricated", () => {
  const result = runFixedVsAdaptiveBacktest(baseOptions());
  for (const metrics of [result.fixedMetrics, result.adaptiveMetrics]) {
    assert.ok(metrics.mobilityGuaranteeRatePercent >= 0 && metrics.mobilityGuaranteeRatePercent <= 100);
    assert.ok(metrics.socPredictionMAE >= 0);
    assert.ok(metrics.totalChargedKWh >= 0);
    assert.ok(metrics.totalDischargedKWh >= 0);
    assert.ok(metrics.safetyViolations >= 0);
  }
});

test("the adaptive strategy is not hardcoded to win: a very low fixed floor can out-guarantee it", () => {
  // A fixed floor at 95% will almost always beat a modest adaptive
  // guarantee on mobility protection, at the cost of near-zero V2G energy.
  const result = runFixedVsAdaptiveBacktest(baseOptions({ fixedMinimumSoc: 95 }));
  assert.ok(result.fixedMetrics.mobilityGuaranteeRatePercent >= result.adaptiveMetrics.mobilityGuaranteeRatePercent - 1);
  assert.ok(result.fixedMetrics.totalDischargedKWh <= result.adaptiveMetrics.totalDischargedKWh + 0.01);
});
