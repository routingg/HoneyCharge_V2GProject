export type VehicleSource = "manual" | "hyundai";

export interface RegisteredVehicle {
  id: string;
  source: VehicleSource;
  manufacturer: string;
  model: string;
  plateNumber?: string;
  batteryCapacityKWh: number;
  connectedAt: string;
}
