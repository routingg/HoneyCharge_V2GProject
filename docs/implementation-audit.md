# HoneyCharge — Implementation Audit

## Current stack

- Next.js 16 (App Router) served through `vinext` (a Next-compatible adapter) on
  Cloudflare Workers/Pages, built with Vite 8 + `@cloudflare/vite-plugin`.
- React 19, TypeScript 5 (strict), Tailwind CSS 4.
- Drizzle ORM configured for Cloudflare D1, but `db/schema.ts` is intentionally
  empty — no tables exist yet.
- Recharts for charts, MapLibre GL for the infrastructure map.
- Two separate front ends:
  - `app/page.tsx` → `components/HoneyChargeApp.tsx` — a grid-operator
    dashboard (renewable/demand forecast, 32-vehicle fleet, infra map, cloud
    forecast map, reward settlement).
  - `app/mobile/page.tsx` → `components/mobile/MobileApp.tsx` — a separate
    Vite SPA (also built standalone into `public/app`) for the EV owner,
    skinned as "E-pit" or "myHyundai" (`SkinProvider`/`SkinSwitcher`): home,
    SOC settings, V2G schedule, station map, wallet, rewards, PnC flow.
- `worker/index.ts` is the actual Cloudflare Worker fetch handler. It
  special-cases `/api/kma-forecast` and `/_vinext/image`, serves the
  standalone `/app` SPA straight from `public/app`, and otherwise delegates
  to vinext's Next router (`handler.fetch`). New Next `app/api/**/route.ts`
  handlers should work through this fallthrough.
- Test harness: `npm test` runs `npm run build` then
  `node --test tests/rendered-html.test.mjs`. That file hand-transpiles
  individual `lib/services/*.ts` files with `ts.transpileModule` and executes
  them in a `vm` sandbox with a manual `require` shim — there is no Jest/
  Vitest. `tsx` is already present in `node_modules` (transitive dependency),
  so new tests can instead do `node --import tsx --test` and import `.ts`
  files directly; Node's test runner auto-discovers any file under `tests/`.

## Existing relevant functionality (reuse, do not rewrite)

- `lib/types.ts` — `Vehicle`, `HourlyEnergyData`, `ScheduleItem`,
  `VehicleSchedule`, `SimulationResult`, reward types. Single-day (24 hourly
  slots), per-vehicle `arrivalTime`/`departureTime`/`minimumSoc`/`targetSoc`
  are all **static** — set once in synthetic data, never predicted.
- `lib/services/v2gScheduler.ts` — pure, rule-based hour-by-hour
  charge/discharge decision using a fixed `minimumSoc`/`targetSoc`. This is
  the **fixed-SOC baseline** in spirit already, but it is wired into the
  production dashboards and must not be touched.
- `lib/services/simulationService.ts` — builds the 24h energy timeline and
  runs `scheduleVehicle` for all 32 mock vehicles, plus a `isV2GEnabled:
  false` baseline pass used only for reward accounting (not a true
  fixed-vs-adaptive experiment).
- `lib/services/stayDurationService.ts`, `mobileHomeService.ts` — derive
  UI view-models (range, energy state, weekly participation, etc.) from a
  `VehicleSchedule`. Good precedent for keeping calculation out of
  components.
- `lib/data/mockData.ts` — 32 synthetic vehicles, single `DEMO_DATE`,
  `DEMO_CURRENT_HOUR = 11`. No trip history, no calendar data.
- `.env` already declares `GEMINI_API_KEY` and `ANTHROPIC_API_KEY` (unused).
  No Gemini SDK dependency is installed yet.

## Missing functionality (per the V2G validation platform spec)

- Mobility context layer: trip history, mobility profile, calendar
  normalization.
- Departure prediction (statistical baseline + calendar signal + optional
  Gemini classification) with explicit confidence scoring.
- Required trip energy prediction independent of Gemini.
- Guaranteed SOC engine (trip requirement + user reserve + uncertainty
  margin, floored at a user hard minimum) with an explainable breakdown.
- V2G optimizer operating over a rolling multi-slot horizon with explicit
  safety constraints (vs. the existing scheduler's simple threshold rules).
- Safety state machine (`NORMAL`/`CONSERVATIVE`/`CHARGE_REQUIRED`/etc.).
- Deterministic vehicle simulator with event injection (early departure,
  calendar change, stale telemetry, charger disconnect, etc.) and a
  `VehicleAdapter` abstraction.
- Gemini provider behind an `AIService` interface, with structured JSON
  output, schema validation, and a deterministic fallback when Gemini is
  disabled/unavailable/invalid.
- Fixed-SOC vs. adaptive-SOC baseline comparison harness + validation
  metrics (mobility guarantee rate, SOC prediction error, V2G energy,
  safety violations).
- `/validation` dashboard, audit log, Apps Script reference integration,
  V-cycle documentation.

## Architecture conflicts / technical debt affecting this work

- The existing `Vehicle`/`VehicleSchedule` model has no concept of multiple
  days, trip history, or calendar — it cannot represent "predicted
  departure" vs. "scheduled departure." Rather than overload it, the new
  domain model is additive and lives in `lib/domain/**`, independent of
  `lib/types.ts`. The two are bridged only where useful (e.g. reusing
  `Vehicle` shape for the simulator's static config), never by mutating the
  existing type.
- There is no server API layer yet (`app/api` is empty). New API routes are
  additive.
- No AI SDK is installed. `@google/genai` (current official Google GenAI
  SDK) will be added — verified not already present.
- Env var plumbing for Cloudflare Pages: `worker/index.ts`'s `Env` interface
  only declares `ASSETS`, `KMA_SERVICE_KEY`, `DB`, `IMAGES`. Whether
  `GEMINI_API_KEY` reaches `process.env` in the Next RSC server environment
  under `nodejs_compat` is unverified in this sandbox (no live Cloudflare
  deploy available to test). The Gemini provider is built so the system
  behaves correctly either way: `GEMINI_ENABLED=false` (or a missing key)
  cleanly falls back to the deterministic predictor. This must be verified
  against a real Cloudflare Pages environment-variable binding before
  relying on live Gemini calls in production.

## Planned additions (new files/directories)

```
lib/domain/
  clock.ts
  mobility/{types,tripHistory,mobilityProfile,departurePrediction,tripEnergyPrediction}.ts
  calendar/{types,normalize}.ts
  soc/{guaranteedSoc,safetyMargin}.ts
  v2g/{scheduler,safetyStateMachine}.ts
  grid/gridSignal.ts
  vehicle/{adapter,simulator}.ts
  validation/{baseline,metrics,compare}.ts
  audit/auditLog.ts
lib/services/ai/
  {config,types,schemas,prompts,GeminiProvider,MockAIProvider,AIService,fallback}.ts
data/scenarios/*.json
app/api/{mobility,soc,v2g,simulation,validation,ai}/**/route.ts
app/validation/page.tsx
components/validation/**
examples/apps-script/{calendar.gs,gemini.gs,honeycharge.gs,config.gs,README.md}
docs/{architecture,gemini-architecture,mobility-prediction,guaranteed-soc,
  v2g-optimizer,simulation,validation-methodology,apps-script-integration,
  future-vehicle-integration,implementation-status,final-engineering-report}.md
docs/vcycle/01..08_*.md
tests/domain/*.test.mjs
```

## Planned refactors

- None to existing working code. `package.json` `test` script is extended
  (not replaced) to also pick up new `tests/domain/*.test.mjs` files via
  `node --import tsx --test`.

## Files expected to change

- `package.json` (add `@google/genai` dependency, extend `test` script).
- `.env.example` (new, documents `GEMINI_API_KEY`/`GEMINI_MODEL`/
  `GEMINI_ENABLED`).
- `README.md` (new section pointing at the validation platform + how to run
  it), not a rewrite of the existing content.

## Explicit non-goals / will not fake

- No real Hyundai vehicle API, no real charger control, no real Google
  Calendar OAuth flow, no real HILS hardware loop. All clearly labeled
  `SIMULATED` in code/UI/docs per the master prompt's non-negotiable rules.
