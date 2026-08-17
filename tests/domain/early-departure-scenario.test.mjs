import assert from "node:assert/strict";
import test from "node:test";
import { compareStrategies } from "../../lib/domain/validation/compare.ts";
import { generateSimulatedGridSignals } from "../../lib/domain/grid/gridSignal.ts";

const START = new Date("2026-08-24T00:00:00+09:00");

// §37: the vehicle actually leaves earlier than predicted. The adaptive
// strategy's guaranteed SOC (with its built-in uncertainty margin) should
// be more likely to have already covered the trip requirement than the
// fixed baseline when the fixed floor is set lower than what an early
// departure actually needs.
test("an earlier-than-predicted departure is scored against the real departure time, not the plan", () => {
  const predictedDeparture = new Date(START.getTime() + 8 * 60 * 60_000); // planned 08:00
  const actualDeparture = new Date(START.getTime() + 1 * 60 * 60_000); // left at 01:00 instead
  const predictedReturn = new Date(predictedDeparture.getTime() + 60 * 60_000);

  const result = compareStrategies({
    startTime: START,
    slotMinutes: 30,
    horizonSlots: 48,
    initialSoc: 35,
    batteryCapacityKWh: 77.4,
    maxChargePowerKW: 7,
    maxDischargePowerKW: 5,
    connected: true,
    telemetryStale: false,
    predictedDeparture,
    predictedReturn,
    actualDeparture,
    predictedTripRequirementSoc: 8,
    predictedTripEnergyKWh: 6,
    actualTripEnergyKWh: 6,
    gridSignals: generateSimulatedGridSignals(START, 30, 48),
    adaptiveGuaranteedSoc: 45, // trip(8) + reserve(30) + margin(7)
    fixedMinimumSoc: 40,
    hardMinimumSoc: 20,
  });

  // The schedule was still preparing for an 08:00 departure — at the real
  // 01:00 departure it had not yet reached the guaranteed SOC. This must
  // be visible in the reported departureSocAvailable rather than silently
  // reading the (irrelevant) 08:00 projection.
  assert.ok(
    result.adaptiveOutcome.departureSocAvailable < 45,
    `got ${result.adaptiveOutcome.departureSocAvailable}`,
  );
  assert.ok(result.adaptiveOutcome.departureSocAvailable >= 34.9);
  // But the actual trip only needed ~7.75% SOC, so this was not unsafe.
  assert.equal(result.adaptiveOutcome.safetyViolated, false);
});
