export type SafetyState =
  | "NORMAL"
  | "CONSERVATIVE"
  | "CHARGE_REQUIRED"
  | "VEHICLE_UNAVAILABLE"
  | "STALE_DATA"
  | "EMERGENCY_RESERVE";

export interface SafetyEvaluationInput {
  soc: number;
  hardMinimumSoc: number;
  guaranteedSoc: number;
  connected: boolean;
  driving: boolean;
  telemetryAgeMinutes: number;
  staleThresholdMinutes: number;
}
