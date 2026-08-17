import assert from "node:assert/strict";
import test from "node:test";
import { buildAdaptiveSchedule } from "../../lib/domain/v2g/scheduler.ts";
import { generateSimulatedGridSignals } from "../../lib/domain/grid/gridSignal.ts";

const START = new Date("2026-08-24T00:00:00+09:00");
const SLOT_MINUTES = 30;
const HORIZON = 48;

function baseInput(overrides = {}) {
  return {
    startTime: START,
    slotMinutes: SLOT_MINUTES,
    horizonSlots: HORIZON,
    initialSoc: 68,
    batteryCapacityKWh: 77.4,
    maxChargePowerKW: 7,
    maxDischargePowerKW: 5,
    hardMinimumSoc: 20,
    guaranteedSoc: 42,
    connected: true,
    telemetryStale: false,
    gridSignals: generateSimulatedGridSignals(START, SLOT_MINUTES, HORIZON),
    ...overrides,
  };
}

test("never discharges while SOC is at or below the guaranteed SOC (§27 scenario 39: low SOC)", () => {
  const result = buildAdaptiveSchedule(
    baseInput({ initialSoc: 24, guaranteedSoc: 45, hardMinimumSoc: 20 }),
  );
  const dischargeWhileLow = result.slots.some(
    (s) => s.action === "DISCHARGE" && s.predictedSocStart <= 45,
  );
  assert.equal(dischargeWhileLow, false);
});

test("SOC trajectory never dips below the hard minimum", () => {
  const result = buildAdaptiveSchedule(baseInput({ initialSoc: 22, hardMinimumSoc: 20 }));
  const anyBelowFloor = result.slots.some((s) => s.predictedSocEnd < 20 - 0.001);
  assert.equal(anyBelowFloor, false);
});

test("SOC trajectory always stays within [0, 100]", () => {
  const result = buildAdaptiveSchedule(baseInput({ initialSoc: 96, guaranteedSoc: 10, hardMinimumSoc: 5 }));
  const outOfBounds = result.slots.some(
    (s) => s.predictedSocEnd < -0.001 || s.predictedSocEnd > 100.001,
  );
  assert.equal(outOfBounds, false);
});

test("forces charging near a departure deadline it would otherwise miss (departure preparation)", () => {
  const predictedDeparture = new Date(START.getTime() + 3 * 60 * 60_000); // 03:00
  const result = buildAdaptiveSchedule(
    baseInput({
      initialSoc: 30,
      guaranteedSoc: 60,
      hardMinimumSoc: 20,
      predictedDeparture,
    }),
  );
  const departurePrepSlots = result.slots.filter(
    (s) => s.reasonCode === "DEPARTURE_PREPARATION",
  );
  assert.ok(departurePrepSlots.length > 0);
  // Physically cannot fully reach 60% given max charge power in 3h, but
  // should charge continuously and get close.
  assert.ok(result.projectedDepartureSoc >= 50, `got ${result.projectedDepartureSoc}`);
  assert.ok(result.projectedDepartureSoc <= 60);
});

test("driving window consumes trip energy and is marked vehicle-unavailable", () => {
  const predictedDeparture = new Date(START.getTime() + 8 * 60 * 60_000);
  const predictedReturn = new Date(predictedDeparture.getTime() + 60 * 60_000);
  const result = buildAdaptiveSchedule(
    baseInput({
      initialSoc: 70,
      guaranteedSoc: 42,
      predictedDeparture,
      predictedReturn,
      tripEnergyKWh: 6,
    }),
  );
  const drivingSlots = result.slots.filter(
    (s) => s.reasonCode === "VEHICLE_UNAVAILABLE",
  );
  assert.ok(drivingSlots.length > 0);
  const socBeforeTrip = drivingSlots[0].predictedSocStart;
  const socAfterTrip = drivingSlots[drivingSlots.length - 1].predictedSocEnd;
  assert.ok(socBeforeTrip - socAfterTrip > 0);
});

test("a disconnected charger never receives a CHARGE/DISCHARGE command", () => {
  const result = buildAdaptiveSchedule(baseInput({ connected: false }));
  const anyControlled = result.slots.some((s) => s.action !== "IDLE");
  assert.equal(anyControlled, false);
});

test("stale telemetry stops all control", () => {
  const result = buildAdaptiveSchedule(baseInput({ telemetryStale: true }));
  const anyControlled = result.slots.some((s) => s.action !== "IDLE");
  assert.equal(anyControlled, false);
  assert.ok(result.slots.every((s) => s.reasonCode === "STALE_TELEMETRY"));
});

test("surplus above the guaranteed SOC can be discharged for V2G", () => {
  const result = buildAdaptiveSchedule(
    baseInput({ initialSoc: 90, guaranteedSoc: 30, hardMinimumSoc: 20 }),
  );
  const dischargeSlots = result.slots.filter((s) => s.action === "DISCHARGE");
  assert.ok(dischargeSlots.length > 0);
  assert.ok(result.totalDischargedKWh > 0);
});
