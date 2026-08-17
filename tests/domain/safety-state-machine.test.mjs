import assert from "node:assert/strict";
import test from "node:test";
import { evaluateSafetyState } from "../../lib/domain/safety/stateMachine.ts";

const base = {
  soc: 60,
  hardMinimumSoc: 20,
  guaranteedSoc: 42,
  connected: true,
  driving: false,
  telemetryAgeMinutes: 1,
  staleThresholdMinutes: 30,
};

test("stale telemetry always wins regardless of SOC", () => {
  assert.equal(
    evaluateSafetyState({ ...base, telemetryAgeMinutes: 999 }),
    "STALE_DATA",
  );
});

test("driving or disconnected is VEHICLE_UNAVAILABLE", () => {
  assert.equal(evaluateSafetyState({ ...base, driving: true }), "VEHICLE_UNAVAILABLE");
  assert.equal(evaluateSafetyState({ ...base, connected: false }), "VEHICLE_UNAVAILABLE");
});

test("soc at/below hard minimum is EMERGENCY_RESERVE", () => {
  assert.equal(evaluateSafetyState({ ...base, soc: 20 }), "EMERGENCY_RESERVE");
  assert.equal(evaluateSafetyState({ ...base, soc: 15 }), "EMERGENCY_RESERVE");
});

test("soc between hard minimum and guaranteed is CHARGE_REQUIRED", () => {
  assert.equal(evaluateSafetyState({ ...base, soc: 30 }), "CHARGE_REQUIRED");
});

test("soc just above guaranteed is CONSERVATIVE, comfortably above is NORMAL", () => {
  assert.equal(evaluateSafetyState({ ...base, soc: 43 }), "CONSERVATIVE");
  assert.equal(evaluateSafetyState({ ...base, soc: 60 }), "NORMAL");
});
