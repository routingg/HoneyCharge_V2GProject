import { CONFIDENCE_MARGIN_POLICY } from "../config";

/** §20: deterministic confidence -> uncertainty-margin mapping. */
export function marginForConfidence(confidence: number): number {
  for (const tier of CONFIDENCE_MARGIN_POLICY) {
    if (confidence >= tier.minConfidence) return tier.marginSocPoints;
  }
  return CONFIDENCE_MARGIN_POLICY[CONFIDENCE_MARGIN_POLICY.length - 1].marginSocPoints;
}
