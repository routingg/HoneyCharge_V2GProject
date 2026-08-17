export interface ValidationMetrics {
  mobilityGuaranteeRatePercent: number;
  socPredictionMAE: number;
  totalDischargedKWh: number;
  totalChargedKWh: number;
  netV2GEnergyKWh: number;
  adaptiveImprovementPercent: number | null;
  safetyViolations: number;
  runsEvaluated: number;
}

/** One departure event's realized outcome, used to score a strategy. */
export interface DepartureOutcome {
  predictedRequiredTripSoc: number;
  actualRequiredTripSoc: number;
  departureSocAvailable: number;
  hardMinimumSoc: number;
  safetyViolated: boolean;
}

export interface StrategyRunResult {
  strategyName: "fixed" | "adaptive";
  outcomes: DepartureOutcome[];
  totalChargedKWh: number;
  totalDischargedKWh: number;
}
