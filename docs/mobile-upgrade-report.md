# `/mobile` Upgrade — Final Report

Date: 2026-08-18. See also `docs/mobile-upgrade-audit.md` for the pre-implementation gap analysis.

## Before

`/mobile` was already a working two-skin (E-pit / myHyundai) consumer app — Home, V2G schedule
list, SOC settings, station map, rewards/wallet, vehicle status — but every screen ran on
`lib/services/v2gScheduler.ts`, a flat minimum-SOC grid-balance scheduler built for the fleet-wide
dashboard simulation. The mobility-aware engine (guaranteed SOC = trip requirement + user reserve
+ prediction-uncertainty margin, departure prediction blending trip history + calendar + Gemini,
an adaptive guaranteed-SOC-aware V2G scheduler) already existed in `lib/domain/*` but only powered
`/validation`, the engineer-facing backtest dashboard. `/mobile` had no guaranteed-SOC hero, no
plan explanation, no AI insight, no calendar UX, no schedule-change reaction, and no
notifications.

## `/app` — what it actually is

`/app` (`HoneyChargeApp.tsx`) is a grid/fleet-operator desktop dashboard, not a richer version of
the consumer app the brief assumed. It was used only as a visual/design-language reference; no
screens or business logic were ported 1:1 because its screens answer a different question
("how is the fleet doing") than `/mobile`'s ("is my car ready"). `/app` is unchanged.

## New shared architecture

```
lib/domain/{mobility,soc,v2g,safety,calendar}/*   — pure, already shared, mostly unchanged
        │
lib/services/validationEngine.ts (computeSnapshot)  — reused as-is, still powers /validation
        │
lib/services/liveMobilityService.ts (NEW)  — mobile view-model shaping only:
        │   TimelineBlock aggregation, MobilityHomeViewModel, MobilityPatternViewModel,
        │   demo time-jump, schedule-change calendar-event builder, energy-state adapter
        │
components/mobile/useLiveMobility.ts (NEW)  — client hook: holds the engine instance,
        │   Gemini-classification effect, demo controls, notifications (AuditLog-backed)
        │
components/mobile/{Epit,MyHyundai}Home.tsx, V2G/SocSettings/Vehicle screens
        (both skins consume the same view model; only chrome/visual language differs)
```

No new duplicate V2G/SOC/scheduling logic was written. The only domain-layer change was adding an
optional `v2gEnabled` gate to `buildAdaptiveSchedule` (lib/domain/v2g/scheduler.ts) so the mobile
"Automatic V2G" toggle has something real to control — additive, defaults to `true`, all 65
existing domain tests still pass unmodified.

## New/changed routes

- `/mobile` — Home, V2G, SOC settings, Vehicle rebuilt (both skins)
- `/mobile` → **Calendar** (new, reachable from Home) — connect/demo UX
- `/mobile` → **Notifications** (new, reachable from Home bell icon)
- `app/api/ai/schedule/explain` (new) — server-only Gemini route for "왜 이런 계획인가요?"
- `app/api/ai/mobility/context` (new) — server-only Gemini route for the AI Mobility Insight card

## V2G UX

- **Current SOC / Guaranteed SOC / Available for V2G**: hero stacked bar on Home, restated on the
  V2G screen and SOC settings — all three always read from the same `MobilityHomeViewModel`.
- **Schedule**: 24h segmented, tap-for-detail timeline (charge/idle/discharge/drive), built from
  the real `buildAdaptiveSchedule` output, not a chart approximation.
- **User safety reserve**: `hardMinimumSoc` slider on both the V2G screen and a dedicated SOC
  settings screen; saving it mutates the live engine and the guaranteed-SOC floor immediately
  reflects it everywhere (verified: raising it above the auto-computed value floors the schedule).
- **Automatic V2G on/off**: real gate on the scheduler, not a decorative switch — verified in
  browser that turning it off removes all discharge blocks from the timeline.

## Gemini integration

Gemini was already correctly architected (server-only, schema-validated, deterministic fallback,
audit-logged) — only two of three `AIService` methods lacked an API route. Both are now wired:
- `explainSchedule` → "왜 이런 계획인가요?" on Home
- `analyzeMobilityContext` → AI Mobility Insight card's "자세히 보기"

Gemini never determines guaranteed SOC, charge/discharge power, or safety floors — it only
classifies calendar events and phrases already-computed facts, per the existing architecture.
Verified with `GEMINI_API_KEY` unset: both cards render the deterministic fallback copy correctly
with no console errors.

## Calendar readiness

No OAuth integration exists (out of scope of this pass and not part of the original codebase).
The Calendar screen is explicitly labeled Demo and exposes on/off + the events currently feeding
the predictor. The demo's calendar-driven departure shift is real, not scripted: the "일정 변경"
button injects a calendar event anchored to the *current* prediction and lets
`predictDeparture()`/`calculateGuaranteedSoc()` compute whatever the weighted blend actually
produces — verified in-browser (예상 출발 08:23 → 08:05; protected SOC recalculated).

## Simulation vs. real

- **Real, computed**: guaranteed SOC, departure prediction, V2G schedule, safety state, mobility
  pattern card, all reward/point figures (unchanged from before), Gemini fallback behavior.
- **Simulated, clearly labeled**: the demo vehicle/trip history (synthetic, seeded), the Google
  Calendar connection (Demo badge, no OAuth), PnC flow (already labeled SIMULATED · DEMO).
- **Session-only, not persisted**: all engine mutations (hardMinimumSoc, v2gEnabled, calendar
  events, notifications) live in React state — a page reload resets to the seeded scenario. No
  backend/DB was added; this matches the rest of the app.

## Remaining gaps (honest list)

| Item | Status |
|---|---|
| Home / V2G / SOC settings / Vehicle on live engine | WORKING |
| Schedule-change demo interaction | WORKING |
| "Why this plan?" / AI Mobility Insight | WORKING (Gemini) / WORKING (fallback) |
| Automatic V2G on/off | WORKING |
| Notifications | WORKING (session-only) |
| Calendar connect UX | SIMULATED (clearly labeled, no OAuth) |
| Mobility pattern / battery-analysis card | WORKING (myHyundai skin only) |
| E-pit "마이카" tab | NOT IMPLEMENTED (still the pre-existing placeholder — E-pit's vehicle screen was never built, not just this pass) |
| Epit Focus/PnC screens | PARTIAL — still read the old grid-simulation view model, not the live engine; SOC shown there can differ slightly from Home after a demo interaction. Known, not fixed this pass. |
| Environmental report (CO₂, renewable absorption) | NOT IMPLEMENTED — only fleet-level data exists (`renewableForecastService`); no honest per-user number to show, so it was intentionally skipped rather than fabricated |
| Real Hyundai / charger / grid / Calendar integration | BLOCKED BY EXTERNAL API (unchanged from before this pass) |

## Verification performed

- `npx tsc --noEmit`: clean (one pre-existing, untouched error in unused `GridFlowApp.tsx`)
- `npm run lint`: 0 errors (2 pre-existing warnings in an untouched file)
- `npm run test:domain` (65 tests) and `node --test tests/rendered-html.test.mjs` (11 tests): all pass
- `npm run build`: succeeds; both new API routes registered correctly
- Manual in-browser verification (Playwright) at 360px/400px/430px widths, both skins: Home, V2G
  (toggle, slider, tap-detail), SOC settings (save → propagates), Vehicle, Notifications,
  Calendar, schedule-change flow — zero console errors throughout, zero horizontal overflow
