import type { StrategyComparisonResult } from "./compare";
import type { DepartureOutcome, StrategyRunResult, ValidationMetrics } from "./types";

export function buildStrategyRunResult(
  strategyName: "fixed" | "adaptive",
  runs: StrategyComparisonResult[],
): StrategyRunResult {
  const outcomes: DepartureOutcome[] = runs.map((r) =>
    strategyName === "fixed" ? r.fixedOutcome : r.adaptiveOutcome,
  );
  const schedules = runs.map((r) => (strategyName === "fixed" ? r.fixed : r.adaptive));
  return {
    strategyName,
    outcomes,
    totalChargedKWh: Number(
      schedules.reduce((sum, s) => sum + s.totalChargedKWh, 0).toFixed(2),
    ),
    totalDischargedKWh: Number(
      schedules.reduce((sum, s) => sum + s.totalDischargedKWh, 0).toFixed(2),
    ),
  };
}

/**
 * §47–§51: computes validation metrics for one strategy, optionally
 * relative to a baseline run for the adaptive-improvement percentage.
 * Never fabricates a result — division-by-zero and empty-run cases are
 * handled explicitly rather than producing NaN/Infinity.
 */
export function computeValidationMetrics(
  run: StrategyRunResult,
  baselineRun?: StrategyRunResult,
): ValidationMetrics {
  const n = run.outcomes.length;

  const successCount = run.outcomes.filter(
    (o) => o.departureSocAvailable >= o.actualRequiredTripSoc,
  ).length;
  const mobilityGuaranteeRatePercent = n > 0 ? Number(((successCount / n) * 100).toFixed(1)) : 0;

  const absoluteErrors = run.outcomes.map((o) =>
    Math.abs(o.predictedRequiredTripSoc - o.actualRequiredTripSoc),
  );
  const socPredictionMAE =
    n > 0
      ? Number((absoluteErrors.reduce((a, b) => a + b, 0) / n).toFixed(2))
      : 0;

  const safetyViolations = run.outcomes.filter((o) => o.safetyViolated).length;

  const adaptiveImprovementPercent =
    baselineRun && baselineRun.totalDischargedKWh > 0
      ? Number(
          (
            ((run.totalDischargedKWh - baselineRun.totalDischargedKWh) /
              baselineRun.totalDischargedKWh) *
            100
          ).toFixed(1),
        )
      : null;

  return {
    mobilityGuaranteeRatePercent,
    socPredictionMAE,
    totalDischargedKWh: run.totalDischargedKWh,
    totalChargedKWh: run.totalChargedKWh,
    netV2GEnergyKWh: Number((run.totalDischargedKWh - run.totalChargedKWh).toFixed(2)),
    adaptiveImprovementPercent,
    safetyViolations,
    runsEvaluated: n,
  };
}
