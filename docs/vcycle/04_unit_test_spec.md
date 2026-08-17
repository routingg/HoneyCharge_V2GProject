# Unit Test Specification

All in `tests/domain/`, run via `npm run test:domain`
(`node --import tsx --test tests/domain/*.test.mjs`). No live network
calls anywhere in this suite (§72).

| File | Covers |
|---|---|
| `guaranteed-soc.test.mjs` | Margin tiers, summation, hard-minimum flooring, 100% clamp, confidence monotonicity |
| `departure-prediction.test.mjs` | Historical-only prediction, no-history fallback, calendar signal shifting the prediction, confidence scaling with sample count |
| `safety-state-machine.test.mjs` | All 6 safety states, correct precedence (stale > unavailable > emergency > charge-required > conservative > normal) |
| `v2g-scheduler.test.mjs` | No discharge at/below guarantee, hard-minimum floor never violated, `[0,100]` bounds, departure-preparation forcing, driving-window consumption, disconnected/stale telemetry blocking control, safe-surplus discharge |
| `early-departure-scenario.test.mjs` | Outcome scored against the real departure time, not the plan |
| `validation-compare.test.mjs` | Identical inputs for both strategies, zero-violation scan, tie when floors match, null improvement on zero baseline, MAE/guarantee-rate aggregation |
| `backtest.test.mjs` | Determinism, no-leakage scoring, equal run counts, physically sane metric bounds, adaptive-not-hardcoded-to-win |
| `trip-history.test.mjs` | Seed determinism, distinct seeds diverge, physical validity of generated trips, profile summarization, energy-prediction independence from Gemini, low-confidence-on-empty-history |
| `vehicle-simulator.test.mjs` | Charge/discharge SOC integration, commands ignored while driving, driving consumption proportional to time, charger-disconnect event, telemetry-stale freezing, SOC bounds under repeated charging |
| `ai-schemas.test.mjs` | Structured-output validators accept well-formed / reject out-of-range, malformed-date, non-object, oversized responses |
| `ai-fallback.test.mjs` | Fallback heuristic behavior (location presence, all-day events), `MockAIProvider` determinism |
| `ai-gemini-provider-disabled.test.mjs` | `GeminiProvider` degrades to fallback with `source: "fallback"` in <500ms with zero network calls, for all three `AIService` methods |
| `validation-engine.test.mjs` | `computeSnapshot` end-to-end pipeline wiring, `@/` path-alias resolution outside Next's bundler, available-for-V2G floor at zero, driving/stale-telemetry safety-state propagation |
| `calendar-normalize.test.mjs` | Data-minimization: attendees/description/attachments never survive normalization; location omitted unless sharing is enabled |

Run count and pass status: see `docs/implementation-status.md` and
`docs/vcycle/07_validation_results.md` for the exact numbers from the
last full run.
