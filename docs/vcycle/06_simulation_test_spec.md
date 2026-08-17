# Simulation Test Specification

Maps the master prompt's §36–§42 core scenarios to what is actually
implemented and where each is exercised.

| # | Scenario | Implemented as | Verified by |
|---|---|---|---|
| §36 | Normal commuter | Default `SimulationVehicleAdapter` + `computeSnapshot` | `validation-engine.test.mjs`; live dashboard default state |
| §37 | Early departure | `SimulationEventType: "EARLIER_DEPARTURE"` / `"UNEXPECTED_DEPARTURE"`, scored via `compareStrategies`' `actualDeparture` param | `early-departure-scenario.test.mjs`; dashboard "출발 시각 앞당김" button |
| §38 | Calendar update | `NormalizedCalendarEvent` injection re-triggering `predictDeparture`->`calculateGuaranteedSoc`->`buildAdaptiveSchedule` | Dashboard "일정 변경 추가" button (manual Playwright verification, see `05_integration_test_spec.md`) |
| §39 | Low current SOC | `SimulationEventType: "LOW_SOC"` | `v2g-scheduler.test.mjs::"never discharges..."`; dashboard "SOC 급감" button |
| §40 | Insufficient history | Empty/short `trips` array | `departure-prediction.test.mjs::"falls back to a conservative default"`, `trip-history.test.mjs::"insufficient history yields low confidence"` |
| §41 | High trip consumption | `SimulationEventType: "HIGH_TRIP_CONSUMPTION"`; backtest's ground-truth-vs-predicted energy gap | `backtest.test.mjs` (MAE metric); simulator supports the event, not separately unit-tested in isolation |
| §42 | Stale telemetry | `SimulationEventType: "TELEMETRY_STALE"`, `getTelemetryAgeMinutes()` | `vehicle-simulator.test.mjs`, `v2g-scheduler.test.mjs::"stale telemetry stops all control"`, `validation-engine.test.mjs` |

## Additional scenarios beyond the minimum set

- `CHARGER_DISCONNECTED` / `VEHICLE_DISCONNECTED` — `v2g-scheduler.test.mjs::"a disconnected charger never receives a command"`; dashboard "충전기 분리" button.
- `COMMUNICATION_DELAY` — implemented in `SimulationVehicleAdapter.applyEvent` (offsets the reported telemetry timestamp) but not independently unit-tested; lower priority since its effect is a subset of the stale-telemetry path once the delay exceeds `STALE_TELEMETRY_MINUTES`.

## Gap

No automated test exercises a full **multi-event sequence within a single
running simulation** (e.g., early departure -> return -> calendar change
-> low SOC, all on one ticking clock) — each event type is tested
individually. The live dashboard supports arbitrary sequences (manually
verified via Playwright — see `05_integration_test_spec.md`), but this
is not captured as a repeatable automated test. Recommended next test:
a `tests/domain/multi-event-scenario.test.mjs` driving a
`SimulationVehicleAdapter` through a scripted sequence and asserting on
the final state.
