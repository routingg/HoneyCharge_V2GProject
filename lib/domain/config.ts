import type { OptimizerWeights } from "./v2g/types";

/**
 * Confidence -> uncertainty-margin mapping (§20). Kept in domain config,
 * not buried in UI or scattered through prediction code, so the policy is
 * auditable and testable on its own.
 */
export const CONFIDENCE_MARGIN_POLICY: Array<{
  minConfidence: number;
  marginSocPoints: number;
}> = [
  { minConfidence: 0.85, marginSocPoints: 5 },
  { minConfidence: 0.7, marginSocPoints: 8 },
  { minConfidence: 0.5, marginSocPoints: 12 },
  { minConfidence: 0.3, marginSocPoints: 17 },
  { minConfidence: 0, marginSocPoints: 22 },
];

export const DEFAULT_OPTIMIZER_WEIGHTS: OptimizerWeights = {
  gridSupport: 1,
  renewableAbsorption: 1,
  economicValue: 0.6,
  batteryCyclingPenalty: 0.4,
};

export const DEFAULT_CHARGE_EFFICIENCY = 0.92;
export const DEFAULT_DISCHARGE_EFFICIENCY = 0.9;

/** Vehicle telemetry older than this is treated as unsafe to act on (§42). */
export const STALE_TELEMETRY_MINUTES = 30;

/** Recency half-life used when weighting historical trips (§17). */
export const HISTORY_RECENCY_HALF_LIFE_DAYS = 14;

export const DEFAULT_SLOT_MINUTES = 30;
export const DEFAULT_HORIZON_SLOTS = 48; // 24h at 30-minute resolution

export const DEFAULT_FIXED_BASELINE_MINIMUM_SOC = 50;
