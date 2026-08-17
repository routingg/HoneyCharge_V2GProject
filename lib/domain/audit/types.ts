import type { SafetyState } from "../safety/types";

export interface AuditEvent {
  timestamp: string;
  trigger: string;
  details: Record<string, unknown>;
  safetyState?: SafetyState;
}
