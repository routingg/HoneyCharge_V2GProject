import { clampSoc } from "../assert";
import { marginForConfidence } from "./safetyMargin";
import type { GuaranteedSocResult } from "./types";

export interface GuaranteedSocInput {
  tripRequirementSoc: number;
  userReserveSoc: number;
  hardMinimumSoc: number;
  /** Conservative combined confidence of departure + trip-energy predictions. */
  confidence: number;
}

/**
 * §22: guaranteedSoc = tripRequirement + userReserve + uncertaintyMargin,
 * floored at the user's hard minimum, clamped to a valid SOC.
 */
export function calculateGuaranteedSoc(
  input: GuaranteedSocInput,
): GuaranteedSocResult {
  const uncertaintyMarginSoc = marginForConfidence(input.confidence);
  const calculated =
    input.tripRequirementSoc + input.userReserveSoc + uncertaintyMarginSoc;
  const guaranteedSoc = clampSoc(Math.max(calculated, input.hardMinimumSoc));

  const reasoning = [
    `Trip requirement: ${input.tripRequirementSoc.toFixed(1)}%`,
    `User reserve: ${input.userReserveSoc.toFixed(1)}%`,
    `Prediction uncertainty margin (confidence ${input.confidence.toFixed(2)}): ${uncertaintyMarginSoc}%`,
    `Calculated total: ${calculated.toFixed(1)}%`,
    input.hardMinimumSoc > calculated
      ? `Raised to user's hard minimum: ${input.hardMinimumSoc}%`
      : `Above hard minimum (${input.hardMinimumSoc}%), no floor applied`,
  ];

  return {
    guaranteedSoc: Number(guaranteedSoc.toFixed(1)),
    tripRequirementSoc: Number(input.tripRequirementSoc.toFixed(1)),
    userReserveSoc: Number(input.userReserveSoc.toFixed(1)),
    uncertaintyMarginSoc,
    hardMinimumSoc: input.hardMinimumSoc,
    confidence: input.confidence,
    reasoning,
  };
}
