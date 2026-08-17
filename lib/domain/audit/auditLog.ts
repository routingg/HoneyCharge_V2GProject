import type { AuditEvent } from "./types";
import type { SafetyState } from "../safety/types";

/**
 * §44: append-only, in-memory audit trail for the current session. Never
 * logs raw calendar contents — only derived facts (§44 note).
 */
export class AuditLog {
  private events: AuditEvent[] = [];

  record(
    trigger: string,
    details: Record<string, unknown>,
    safetyState?: SafetyState,
  ): AuditEvent {
    const event: AuditEvent = {
      timestamp: new Date().toISOString(),
      trigger,
      details,
      safetyState,
    };
    this.events.push(event);
    return event;
  }

  all(): readonly AuditEvent[] {
    return this.events;
  }

  clear(): void {
    this.events = [];
  }
}
