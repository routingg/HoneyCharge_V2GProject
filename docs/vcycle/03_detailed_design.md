# Detailed Design

Per-module design docs (algorithms, formulas, edge cases):

- Mobility prediction: `docs/mobility-prediction.md`
- Guaranteed SOC: `docs/guaranteed-soc.md`
- V2G optimizer: `docs/v2g-optimizer.md`
- Simulation: `docs/simulation.md`
- Gemini integration: `docs/gemini-architecture.md`
- Validation/backtest methodology: `docs/validation-methodology.md`

## Module inventory

| Module | File | Responsibility |
|---|---|---|
| Clock | `lib/domain/clock.ts` | `Clock`/`SimulatedClock` abstraction, KST-aware ISO formatting |
| Config | `lib/domain/config.ts` | Confidence->margin policy, efficiencies, horizon defaults |
| Assert | `lib/domain/assert.ts` | Physical-bound validation, SOC<->kWh conversion |
| Mobility types | `lib/domain/mobility/types.ts` | `VehicleState`, `TripRecord`, `MobilityContext`, `MobilityProfile`, prediction result types |
| Trip history | `lib/domain/mobility/tripHistory.ts` | Deterministic synthetic 30-day trip generator |
| Mobility profile | `lib/domain/mobility/mobilityProfile.ts` | Reduces trips to a small quantitative summary |
| Departure prediction | `lib/domain/mobility/departurePrediction.ts` | Historical + calendar (+ optional Gemini) blend |
| Trip energy prediction | `lib/domain/mobility/tripEnergyPrediction.ts` | Distance × efficiency -> required SOC |
| Calendar | `lib/domain/calendar/{types,normalize}.ts` | Data-minimized event shape + normalizer |
| SOC | `lib/domain/soc/{guaranteedSoc,safetyMargin,types}.ts` | Guaranteed-SOC formula and margin policy |
| Grid | `lib/domain/grid/{types,gridSignal}.ts` | Simulated grid demand/renewable-surplus signal |
| V2G | `lib/domain/v2g/{scheduler,types}.ts` | Rolling-horizon charge/discharge optimizer |
| Safety | `lib/domain/safety/{stateMachine,types}.ts` | Safety-state derivation |
| Vehicle | `lib/domain/vehicle/{types,simulator,futureConnectedVehicleAdapter}.ts` | `VehicleAdapter` interface, SIL simulator, future stub |
| Validation | `lib/domain/validation/{baseline,compare,metrics,backtest,types}.ts` | Fixed-vs-adaptive comparison and metrics |
| Audit | `lib/domain/audit/{auditLog,types}.ts` | In-memory structured audit trail |
| AI service | `lib/services/ai/**` | Gemini provider, fallback, schemas, prompts, factory |
| Orchestration | `lib/services/validationEngine.ts` | Wires the pipeline together for the live dashboard |
| API | `app/api/{ai/calendar/analyze,validation/backtest}/route.ts` | Server boundaries (Gemini key, batch backtest) |
| UI | `app/validation/page.tsx`, `components/validation/**` | Dashboard |

## Key design decisions

- **Domain layer has zero framework dependencies.** Runs identically under
  `node --test` (via `tsx`) and in the browser bundle — no mocking layer
  needed to test it, and the live dashboard runs the real pipeline
  client-side.
- **AI is structurally isolated.** No file under `lib/domain/**` imports
  `@google/genai` or `lib/services/ai/**`.
- **The fixed baseline reuses the adaptive scheduler**, parameterized
  differently — one implementation, two configurations, so the comparison
  can't silently diverge in behavior.
