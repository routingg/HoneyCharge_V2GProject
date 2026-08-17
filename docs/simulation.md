# Simulation

**This is a SIL (software-in-the-loop) simulation. It is not HILS — no
hardware is in the loop (§32, §99).** Every "vehicle" is
`SimulationVehicleAdapter` (`lib/domain/vehicle/simulator.ts`), a plain
TypeScript class with no I/O.

## Determinism (§33)

- Time only advances when `tick(minutes)` is called explicitly (backed by
  `SimulatedClock`, `lib/domain/clock.ts`) — nothing uses `Date.now()`
  inside the domain layer.
- Synthetic trip history (`generateSyntheticTripHistory`,
  `lib/domain/mobility/tripHistory.ts`) uses a seedable xorshift32 PRNG,
  not `Math.random()` — the same seed always produces the same 30-day
  history (`tests/domain/trip-history.test.mjs` asserts this directly).
- The simulated grid signal (`generateSimulatedGridSignals`,
  `lib/domain/grid/gridSignal.ts`) is a pure function of time — no
  randomness at all.

## Vehicle simulator capabilities (§32, §34)

`SimulationVehicleAdapter` implements the `VehicleAdapter` interface
(`getState`, `requestCharge`, `requestDischarge`, `stopEnergyTransfer`)
plus simulation-only controls:

- `tick(minutes)` — integrates SOC forward: driving consumption, or
  charge/discharge at the last-commanded power and configured efficiency.
- `startDriving(tripEnergyKWh, durationMinutes)` / `endDriving()`.
- `applyEvent(SimulationEvent)` — injects `UNEXPECTED_DEPARTURE`,
  `EARLIER_DEPARTURE`, `LATE_RETURN`, `CHARGER_DISCONNECTED`,
  `VEHICLE_DISCONNECTED`, `HIGH_TRIP_CONSUMPTION`, `LOW_SOC`,
  `COMMUNICATION_DELAY`, `TELEMETRY_STALE`.
- `reconnect()` — clears disconnect/stale-telemetry state.
- Command safety: `requestCharge`/`requestDischarge` are no-ops while
  driving or disconnected — the simulator itself won't accept an unsafe
  command, independent of whether the scheduler would have issued one.

Covered by `tests/domain/vehicle-simulator.test.mjs` (charging/discharging
SOC integration, commands ignored while driving, stale telemetry freezing
the reported timestamp, SOC never exceeding physical bounds).

## Simulation controls in the dashboard (§34, §16 of the delivered scope)

`components/validation/ValidationDashboard.tsx` exposes: Start/Pause,
Reset, speed (1×/10×/60×, mapped to simulated minutes advanced per
500ms real-time tick), and seven event-injection buttons, each writing an
`AuditEvent` (§44) and re-running the full prediction -> SOC -> schedule
pipeline via `computeSnapshot`.

## Deliberately not built

- Multi-vehicle fleet simulation (out of scope for the mobility-adaptive
  hypothesis test, which is inherently single-user).
- A visual/graphical vehicle "map" or 3D representation.
- Persisted simulation state across page reloads (every session starts
  from `buildFreshEngine()`).
