import type { VehicleState } from "../mobility/types";
import type { VehicleAdapter } from "./types";

/**
 * NOT IMPLEMENTED. AUTHORIZED API REQUIRED.
 *
 * Documentation/interface stub only (§31, §98). This is intentionally not
 * a real Hyundai (or any manufacturer) vehicle integration — no
 * proprietary API name or endpoint is assumed. It exists so the domain
 * layer's dependency on `VehicleAdapter` is visibly satisfiable by a real
 * connected-vehicle backend in the future without changing any
 * prediction/SOC/optimizer code.
 *
 * Required inputs from a real integration, at minimum: SOC, plug state,
 * charge state, max charge/discharge power, vehicle availability,
 * telemetry timestamp, an authorized command endpoint, and command
 * acknowledgements (§98).
 */
export class FutureConnectedVehicleAdapter implements VehicleAdapter {
  getState(): Promise<VehicleState> {
    throw new Error(
      "FutureConnectedVehicleAdapter.getState: NOT IMPLEMENTED — requires an authorized vehicle API.",
    );
  }

  requestCharge(_powerKW: number): Promise<void> {
    throw new Error(
      "FutureConnectedVehicleAdapter.requestCharge: NOT IMPLEMENTED — requires an authorized vehicle API.",
    );
  }

  requestDischarge(_powerKW: number): Promise<void> {
    throw new Error(
      "FutureConnectedVehicleAdapter.requestDischarge: NOT IMPLEMENTED — requires an authorized vehicle API.",
    );
  }

  stopEnergyTransfer(): Promise<void> {
    throw new Error(
      "FutureConnectedVehicleAdapter.stopEnergyTransfer: NOT IMPLEMENTED — requires an authorized vehicle API.",
    );
  }
}
