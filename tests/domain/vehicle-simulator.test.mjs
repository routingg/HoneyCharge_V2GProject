import assert from "node:assert/strict";
import test from "node:test";
import { SimulationVehicleAdapter } from "../../lib/domain/vehicle/simulator.ts";
import { SimulatedClock } from "../../lib/domain/clock.ts";

function makeAdapter(overrides = {}) {
  const clock = new SimulatedClock(new Date("2026-08-24T00:00:00+09:00"));
  const adapter = new SimulationVehicleAdapter(
    {
      vehicleId: "OWN-002",
      batteryCapacityKWh: 77.4,
      initialSoc: 50,
      maxChargePowerKW: 7,
      maxDischargePowerKW: 5,
      ...overrides,
    },
    clock,
  );
  return { adapter, clock };
}

test("charging increases SOC over simulated time", async () => {
  const { adapter } = makeAdapter();
  await adapter.requestCharge(7);
  adapter.tick(60); // 1 hour
  const state = await adapter.getState();
  assert.ok(state.soc > 50, `soc was ${state.soc}`);
});

test("discharging decreases SOC over simulated time", async () => {
  const { adapter } = makeAdapter();
  await adapter.requestDischarge(5);
  adapter.tick(60);
  const state = await adapter.getState();
  assert.ok(state.soc < 50, `soc was ${state.soc}`);
});

test("charge commands are ignored while driving", async () => {
  const { adapter } = makeAdapter();
  adapter.startDriving(5, 30);
  await adapter.requestCharge(7);
  const state = await adapter.getState();
  assert.equal(state.currentPowerKW, 0);
});

test("driving consumes SOC proportionally to elapsed time", async () => {
  const { adapter } = makeAdapter();
  adapter.startDriving(10, 30); // 10kWh over 30 minutes
  adapter.tick(15); // half the trip
  const state = await adapter.getState();
  const expectedSoc = 50 - (5 / 77.4) * 100;
  assert.ok(Math.abs(state.soc - expectedSoc) < 0.5, `soc was ${state.soc}`);
});

test("SIMULATION_EVENT charger-disconnected blocks further charge commands", async () => {
  const { adapter } = makeAdapter();
  adapter.applyEvent({ type: "CHARGER_DISCONNECTED", atMinute: 0 });
  await adapter.requestCharge(7);
  const state = await adapter.getState();
  assert.equal(state.chargerConnected, false);
  assert.equal(state.currentPowerKW, 0);
});

test("TELEMETRY_STALE freezes the reported timestamp even as the clock advances", async () => {
  const { adapter } = makeAdapter();
  const before = await adapter.getState();
  adapter.applyEvent({ type: "TELEMETRY_STALE", atMinute: 0 });
  adapter.tick(120);
  const after = await adapter.getState();
  assert.equal(before.timestamp, after.timestamp);
  assert.ok(adapter.getTelemetryAgeMinutes() >= 120);
});

test("SOC never exceeds physical bounds under repeated charging", async () => {
  const { adapter } = makeAdapter({ initialSoc: 98 });
  await adapter.requestCharge(7);
  for (let i = 0; i < 10; i++) adapter.tick(60);
  const state = await adapter.getState();
  assert.ok(state.soc <= 100);
});
