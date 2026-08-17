import type { VehicleState } from "../mobility/types";

export interface VehicleAdapter {
  getState(): Promise<VehicleState>;
  requestCharge(powerKW: number): Promise<void>;
  requestDischarge(powerKW: number): Promise<void>;
  stopEnergyTransfer(): Promise<void>;
}

export type SimulationEventType =
  | "UNEXPECTED_DEPARTURE"
  | "EARLIER_DEPARTURE"
  | "LATE_RETURN"
  | "CALENDAR_CHANGED"
  | "CHARGER_DISCONNECTED"
  | "VEHICLE_DISCONNECTED"
  | "HIGH_TRIP_CONSUMPTION"
  | "LOW_SOC"
  | "COMMUNICATION_DELAY"
  | "TELEMETRY_STALE";

export interface SimulationEvent {
  type: SimulationEventType;
  atMinute: number;
  payload?: Record<string, unknown>;
}
