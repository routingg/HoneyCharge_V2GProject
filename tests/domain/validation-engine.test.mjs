import assert from "node:assert/strict";
import test from "node:test";
import { createValidationEngine, computeSnapshot } from "../../lib/services/validationEngine.ts";

function makeEngine(overrides = {}) {
  return createValidationEngine({
    vehicleId: "OWN-002",
    batteryCapacityKWh: 99.8,
    maxChargePowerKW: 6.4,
    maxDischargePowerKW: 9,
    hardMinimumSoc: 20,
    preferredReserveSoc: 15,
    seed: 7,
    initialSoc: 68,
    startTime: new Date("2026-08-24T00:00:00+09:00"),
    ...overrides,
  });
}

test("computeSnapshot resolves the '@/' path alias and produces a full pipeline snapshot", () => {
  const engine = makeEngine();
  const snapshot = computeSnapshot(engine, [], true);
  assert.ok(snapshot.guaranteedSocResult.guaranteedSoc >= engine.hardMinimumSoc);
  assert.ok(snapshot.schedule.slots.length > 0);
  assert.equal(snapshot.vehicleState.soc, 68);
});

test("available-for-V2G is zero, not negative, when SOC is below the guarantee", () => {
  const engine = makeEngine({ initialSoc: 22, hardMinimumSoc: 20 });
  const snapshot = computeSnapshot(engine, [], true);
  assert.equal(snapshot.availableForV2GSoc >= 0, true);
  if (snapshot.vehicleState.soc < snapshot.guaranteedSocResult.guaranteedSoc) {
    assert.equal(snapshot.availableForV2GSoc, 0);
  }
});

test("driving vehicles are reflected as VEHICLE_UNAVAILABLE in the safety state", () => {
  const engine = makeEngine();
  engine.adapter.startDriving(5, 30);
  const snapshot = computeSnapshot(engine, [], true);
  assert.equal(snapshot.safetyState, "VEHICLE_UNAVAILABLE");
});

test("stale telemetry is reflected in the safety state and the schedule stops controlling", () => {
  const engine = makeEngine();
  engine.adapter.applyEvent({ type: "TELEMETRY_STALE", atMinute: 0 });
  engine.clock.advanceMinutes(120);
  const snapshot = computeSnapshot(engine, [], true);
  assert.equal(snapshot.safetyState, "STALE_DATA");
  assert.ok(snapshot.schedule.slots.every((s) => s.action === "IDLE"));
});
