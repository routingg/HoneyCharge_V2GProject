import { assertNonNegative } from "../assert";
import type { MobilityProfile, TripEnergyPrediction } from "./types";

const DEFAULT_DISTANCE_KM = 20;
const DEFAULT_CONSUMPTION_KWH_PER_KM = 0.18;

/**
 * §21: required trip energy, computed independently of Gemini from the
 * locally-derived mobility profile (median recent distance × robust
 * recent efficiency).
 */
export function predictTripEnergy(
  profile: MobilityProfile,
  batteryCapacityKWh: number,
): TripEnergyPrediction {
  const predictedDistanceKm =
    profile.medianTripDistanceKm ?? DEFAULT_DISTANCE_KM;
  const expectedConsumptionKWhPerKm =
    profile.medianConsumptionKWhPerKm ?? DEFAULT_CONSUMPTION_KWH_PER_KM;

  const requiredEnergyKWh = assertNonNegative(
    Number((predictedDistanceKm * expectedConsumptionKWhPerKm).toFixed(2)),
    "requiredEnergyKWh",
  );
  const requiredTripSoc = Math.min(
    100,
    Number(((requiredEnergyKWh / batteryCapacityKWh) * 100).toFixed(1)),
  );

  const sampleFactor = Math.min(1, profile.historySampleCount / 10);
  const confidence = Number((0.3 + 0.6 * sampleFactor).toFixed(2));

  return {
    predictedDistanceKm: Number(predictedDistanceKm.toFixed(1)),
    expectedConsumptionKWhPerKm: Number(expectedConsumptionKWhPerKm.toFixed(3)),
    requiredEnergyKWh,
    requiredTripSoc,
    confidence,
  };
}
