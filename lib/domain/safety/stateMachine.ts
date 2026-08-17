import type { SafetyEvaluationInput, SafetyState } from "./types";

/**
 * §43: pure function from current inputs to a safety state. Lives in
 * domain logic, not scattered through UI conditionals.
 */
export function evaluateSafetyState(input: SafetyEvaluationInput): SafetyState {
  if (input.telemetryAgeMinutes > input.staleThresholdMinutes) return "STALE_DATA";
  if (!input.connected || input.driving) return "VEHICLE_UNAVAILABLE";
  if (input.soc <= input.hardMinimumSoc) return "EMERGENCY_RESERVE";
  if (input.soc < input.guaranteedSoc) return "CHARGE_REQUIRED";
  if (input.soc < input.guaranteedSoc + 5) return "CONSERVATIVE";
  return "NORMAL";
}
