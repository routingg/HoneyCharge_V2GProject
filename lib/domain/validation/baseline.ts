import { DEFAULT_FIXED_BASELINE_MINIMUM_SOC } from "../config";

/**
 * Strategy A — fixed SOC baseline (§45). A single configurable floor,
 * completely independent of mobility prediction. Used as the
 * apples-to-apples comparison point for the adaptive strategy; the
 * comparison harness runs both against identical scenario inputs (§46).
 */
export function fixedBaselineMinimumSoc(overrideSoc?: number): number {
  return overrideSoc ?? DEFAULT_FIXED_BASELINE_MINIMUM_SOC;
}
