import assert from "node:assert/strict";
import test from "node:test";
import { generateSyntheticTripHistory } from "../../lib/domain/mobility/tripHistory.ts";
import { summarizeMobilityProfile } from "../../lib/domain/mobility/mobilityProfile.ts";
import { predictTripEnergy } from "../../lib/domain/mobility/tripEnergyPrediction.ts";

const END_DATE = new Date("2026-08-24T00:00:00+09:00");

test("synthetic trip history is deterministic for a given seed", () => {
  const optionsA = {
    vehicleId: "OWN-002",
    days: 30,
    endDate: END_DATE,
    batteryCapacityKWh: 77.4,
    seed: 42,
  };
  const a = generateSyntheticTripHistory(optionsA);
  const b = generateSyntheticTripHistory(optionsA);
  assert.deepEqual(a, b);
});

test("different seeds produce different histories", () => {
  const base = { vehicleId: "OWN-002", days: 30, endDate: END_DATE, batteryCapacityKWh: 77.4 };
  const a = generateSyntheticTripHistory({ ...base, seed: 1 });
  const b = generateSyntheticTripHistory({ ...base, seed: 2 });
  assert.notDeepEqual(a, b);
});

test("all generated trips have physically valid SOC and non-negative energy", () => {
  const trips = generateSyntheticTripHistory({
    vehicleId: "OWN-002",
    days: 30,
    endDate: END_DATE,
    batteryCapacityKWh: 77.4,
    seed: 7,
  });
  assert.ok(trips.length > 10);
  for (const trip of trips) {
    assert.ok(trip.startSoc >= 0 && trip.startSoc <= 100);
    assert.ok(trip.endSoc >= 0 && trip.endSoc <= 100);
    assert.ok(trip.energyUsedKWh >= 0);
    assert.ok(trip.distanceKm > 0);
  }
});

test("mobility profile summarizes trip history into a small quantitative summary", () => {
  const trips = generateSyntheticTripHistory({
    vehicleId: "OWN-002",
    days: 30,
    endDate: END_DATE,
    batteryCapacityKWh: 77.4,
    seed: 7,
  });
  const profile = summarizeMobilityProfile(trips, 1);
  assert.equal(profile.historySampleCount, trips.length);
  assert.ok(profile.medianTripDistanceKm > 0);
  assert.ok(profile.medianConsumptionKWhPerKm > 0);
});

test("trip energy prediction is independent of Gemini and scales with battery capacity", () => {
  const trips = generateSyntheticTripHistory({
    vehicleId: "OWN-002",
    days: 30,
    endDate: END_DATE,
    batteryCapacityKWh: 77.4,
    seed: 7,
  });
  const profile = summarizeMobilityProfile(trips);
  const smallBattery = predictTripEnergy(profile, 40);
  const largeBattery = predictTripEnergy(profile, 100);
  assert.equal(smallBattery.requiredEnergyKWh, largeBattery.requiredEnergyKWh);
  assert.ok(smallBattery.requiredTripSoc > largeBattery.requiredTripSoc);
});

test("insufficient history yields low confidence rather than a fabricated precise value", () => {
  const profile = summarizeMobilityProfile([]);
  const prediction = predictTripEnergy(profile, 77.4);
  assert.ok(prediction.confidence <= 0.3);
});
