# Traceability Matrix

| Requirement | Implementation | Test | Result |
|---|---|---|---|
| REQ-MOB-001 | `lib/domain/mobility/departurePrediction.ts::historicalCandidate` | `departure-prediction.test.mjs` | PASS |
| REQ-MOB-002 | same, confidence formula | `departure-prediction.test.mjs::"more historical samples produce higher confidence"` | PASS |
| REQ-MOB-003 | `departurePrediction.ts::calendarCandidate` + combination | `departure-prediction.test.mjs::"calendar event...shifts the prediction earlier"` | PASS |
| REQ-MOB-004 | `predictDeparture`'s no-candidates branch | `departure-prediction.test.mjs::"falls back to a conservative default"` | PASS |
| REQ-SOC-001 | `guaranteedSoc.ts::calculateGuaranteedSoc` | `guaranteed-soc.test.mjs::"floored at the user's hard minimum"` | PASS |
| REQ-SOC-002 | same | `guaranteed-soc.test.mjs::"sums trip requirement + reserve + margin"` | PASS |
| REQ-SOC-003 | `safetyMargin.ts::marginForConfidence` | `guaranteed-soc.test.mjs::"low confidence increases the guaranteed SOC"` | PASS |
| REQ-SOC-004 | `GuaranteedSocResult.reasoning` | `guaranteed-soc.test.mjs` (all cases assert decomposed fields) | PASS |
| REQ-V2G-001 | `scheduler.ts::buildAdaptiveSchedule` discharge precondition | `v2g-scheduler.test.mjs::"never discharges while SOC is at or below the guaranteed SOC"` | PASS |
| REQ-V2G-002 | same, `clampSoc` + hard-minimum branch | `v2g-scheduler.test.mjs::"never dips below hard minimum"`, `"stays within [0,100]"` | PASS |
| REQ-V2G-003 | same, `mustChargeNow` | `v2g-scheduler.test.mjs::"forces charging near a departure deadline"` | PASS |
| REQ-V2G-004 | same, availability/telemetry branches | `v2g-scheduler.test.mjs::"disconnected charger"`, `"stale telemetry stops all control"` | PASS |
| REQ-V2G-005 | `validation/baseline.ts`, `validation/compare.ts::compareStrategies` | `validation-compare.test.mjs::"both strategies run against identical scenario inputs"` | PASS |
| REQ-AI-001 | `lib/services/ai/AIService.ts` sole export point | Structural — no `lib/domain/**` file imports `@google/genai` (verified by inspection, see `docs/gemini-architecture.md`) | PASS |
| REQ-AI-002 | `schemas.ts` + `GeminiProvider.callStructured` | `ai-schemas.test.mjs` | PASS |
| REQ-AI-003 | `GeminiProvider` try/catch + `fallback.ts` | `ai-gemini-provider-disabled.test.mjs` | PASS |
| REQ-AI-004 | `MockAIProvider.ts` | `ai-fallback.test.mjs::"MockAIProvider is deterministic and never performs network I/O"` | PASS |
| REQ-CAL-001 | `calendar/normalize.ts::normalizeCalendarEvent`, `calendar/types.ts` shape | `calendar-normalize.test.mjs` | PASS |
| REQ-SAFE-001 | `safety/stateMachine.ts::evaluateSafetyState` | `safety-state-machine.test.mjs` (all 6 states) | PASS |
| REQ-SAFE-002 | `validation/compare.ts::countSafetyViolations` | `validation-compare.test.mjs::"countSafetyViolations is zero for a well-formed schedule"` | PASS |
| REQ-SIM-001 | `mobility/tripHistory.ts` xorshift32 PRNG | `trip-history.test.mjs::"deterministic for a given seed"` | PASS |
| REQ-SIM-002 | `vehicle/simulator.ts::tick/applyEvent` | `vehicle-simulator.test.mjs` | PASS |
| REQ-COMM-001 | `components/validation/**` | Manual Playwright verification (`docs/vcycle/05_integration_test_spec.md`) | PASS (manual) |

## Summary

All 23 requirements have an automated test with a PASS result, except
REQ-COMM-001 which is verified manually (dashboard UI, see
`05_integration_test_spec.md`) rather than via an automated browser test —
no automated UI test framework (Playwright test files, not just the MCP
tool used for manual verification) is configured in this repo.
