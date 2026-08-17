import { clampSoc, kWhToSocDelta } from "../assert";
import { SimulatedClock, toKstIso } from "../clock";
import {
  DEFAULT_CHARGE_EFFICIENCY,
  DEFAULT_DISCHARGE_EFFICIENCY,
} from "../config";
import type { VehicleState } from "../mobility/types";
import type { SimulationEvent, VehicleAdapter } from "./types";

export interface SimulationVehicleOptions {
  vehicleId: string;
  batteryCapacityKWh: number;
  initialSoc: number;
  maxChargePowerKW: number;
  maxDischargePowerKW: number;
  connected?: boolean;
  chargerConnected?: boolean;
}

type EnergyAction = "idle" | "charge" | "discharge";

/**
 * Deterministic software vehicle simulator (§32–§34). This is a SIL /
 * software-simulation environment, not a HILS test — no hardware is in
 * the loop (§99). Time only moves when `tick()` is called, so scenarios
 * are fully reproducible.
 */
export class SimulationVehicleAdapter implements VehicleAdapter {
  readonly clock: SimulatedClock;
  private readonly vehicleId: string;
  private readonly batteryCapacityKWh: number;
  private readonly maxChargePowerKW: number;
  private readonly maxDischargePowerKW: number;

  private soc: number;
  private connected: boolean;
  private chargerConnected: boolean;
  private driving = false;
  private drivingConsumptionKWhPerMinute = 0;
  private currentAction: EnergyAction = "idle";
  private currentPowerKW = 0;
  private communicationDelayMinutes = 0;
  private telemetryFrozenAt: Date | null = null;
  private lastTelemetryUpdate: Date;

  constructor(options: SimulationVehicleOptions, clock: SimulatedClock) {
    this.clock = clock;
    this.vehicleId = options.vehicleId;
    this.batteryCapacityKWh = options.batteryCapacityKWh;
    this.soc = options.initialSoc;
    this.maxChargePowerKW = options.maxChargePowerKW;
    this.maxDischargePowerKW = options.maxDischargePowerKW;
    this.connected = options.connected ?? true;
    this.chargerConnected = options.chargerConnected ?? true;
    this.lastTelemetryUpdate = clock.now();
  }

  async getState(): Promise<VehicleState> {
    return this.getStateSync();
  }

  /** Synchronous convenience accessor for UI render loops (the underlying state is never actually async). */
  getStateSync(): VehicleState {
    const timestamp = this.telemetryFrozenAt ?? this.lastTelemetryUpdate;
    return {
      vehicleId: this.vehicleId,
      timestamp: toKstIso(timestamp),
      soc: Number(this.soc.toFixed(1)),
      batteryCapacityKWh: this.batteryCapacityKWh,
      connected: this.connected,
      chargerConnected: this.chargerConnected,
      driving: this.driving,
      maxChargePowerKW: this.maxChargePowerKW,
      maxDischargePowerKW: this.maxDischargePowerKW,
      currentPowerKW:
        this.currentAction === "discharge" ? -this.currentPowerKW : this.currentPowerKW,
    };
  }

  async requestCharge(powerKW: number): Promise<void> {
    if (!this.connected || !this.chargerConnected || this.driving) return;
    this.currentAction = "charge";
    this.currentPowerKW = Math.max(0, Math.min(powerKW, this.maxChargePowerKW));
  }

  async requestDischarge(powerKW: number): Promise<void> {
    if (!this.connected || !this.chargerConnected || this.driving) return;
    this.currentAction = "discharge";
    this.currentPowerKW = Math.max(0, Math.min(powerKW, this.maxDischargePowerKW));
  }

  async stopEnergyTransfer(): Promise<void> {
    this.currentAction = "idle";
    this.currentPowerKW = 0;
  }

  /** Advances simulated time by `minutes`, integrating SOC (§33). */
  tick(minutes: number): void {
    this.clock.advanceMinutes(minutes);

    if (this.driving) {
      const consumedKWh = this.drivingConsumptionKWhPerMinute * minutes;
      this.soc = clampSoc(this.soc - kWhToSocDelta(consumedKWh, this.batteryCapacityKWh));
    } else if (this.currentAction === "charge" && this.currentPowerKW > 0) {
      const storedKWh =
        this.currentPowerKW * (minutes / 60) * DEFAULT_CHARGE_EFFICIENCY;
      this.soc = clampSoc(this.soc + kWhToSocDelta(storedKWh, this.batteryCapacityKWh));
    } else if (this.currentAction === "discharge" && this.currentPowerKW > 0) {
      const removedKWh =
        (this.currentPowerKW * (minutes / 60)) / DEFAULT_DISCHARGE_EFFICIENCY;
      this.soc = clampSoc(this.soc - kWhToSocDelta(removedKWh, this.batteryCapacityKWh));
    }

    if (!this.telemetryFrozenAt) {
      this.lastTelemetryUpdate = this.clock.now();
    }
  }

  startDriving(totalTripEnergyKWh: number, durationMinutes: number): void {
    this.driving = true;
    this.currentAction = "idle";
    this.currentPowerKW = 0;
    this.drivingConsumptionKWhPerMinute =
      durationMinutes > 0 ? totalTripEnergyKWh / durationMinutes : 0;
  }

  endDriving(): void {
    this.driving = false;
    this.drivingConsumptionKWhPerMinute = 0;
  }

  getTelemetryAgeMinutes(): number {
    const reference = this.telemetryFrozenAt ?? this.lastTelemetryUpdate;
    return (this.clock.now().getTime() - reference.getTime()) / 60_000;
  }

  getSoc(): number {
    return this.soc;
  }

  /** Injects a scenario event (§34, §37–§42). */
  applyEvent(event: SimulationEvent): void {
    switch (event.type) {
      case "UNEXPECTED_DEPARTURE":
      case "EARLIER_DEPARTURE": {
        const energyKWh = Number(event.payload?.tripEnergyKWh ?? 5);
        const durationMinutes = Number(event.payload?.durationMinutes ?? 30);
        this.startDriving(energyKWh, durationMinutes);
        break;
      }
      case "LATE_RETURN":
        // Driving window is extended by the caller re-deriving the
        // prediction; the simulator just keeps driving until endDriving().
        break;
      case "CHARGER_DISCONNECTED":
        this.chargerConnected = false;
        break;
      case "VEHICLE_DISCONNECTED":
        this.connected = false;
        this.chargerConnected = false;
        break;
      case "HIGH_TRIP_CONSUMPTION": {
        const multiplier = Number(event.payload?.multiplier ?? 1.5);
        this.drivingConsumptionKWhPerMinute *= multiplier;
        break;
      }
      case "LOW_SOC":
        this.soc = clampSoc(Number(event.payload?.soc ?? 20));
        break;
      case "COMMUNICATION_DELAY":
        this.communicationDelayMinutes = Number(event.payload?.minutes ?? 15);
        break;
      case "TELEMETRY_STALE":
        this.telemetryFrozenAt = this.clock.now();
        break;
      default:
        break;
    }
  }

  reconnect(): void {
    this.connected = true;
    this.chargerConnected = true;
    this.telemetryFrozenAt = null;
    this.lastTelemetryUpdate = this.clock.now();
  }
}
