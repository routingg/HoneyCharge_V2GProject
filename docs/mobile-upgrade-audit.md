# `/mobile` Upgrade — Feature Gap Audit

Date: 2026-08-18

## 0. Correction to the task's premise

The task brief assumes `/app` is "the richer end-user mobile experience" and `/mobile` is the
weaker one. After reading both in full, that's not what's in this repo:

- **`/app`** (`components/HoneyChargeApp.tsx`, 2886 lines) is a **grid-operator / fleet-operator
  desktop dashboard** — Sidebar, FleetView, VehicleTable (32 synthetic vehicles), EnergyChart,
  V2GSimulationView. It answers "how is the whole Jeju V2G fleet performing," not "is my car
  ready." `components/GridFlowApp.tsx` (2149 lines) is an **unused near-duplicate** of the same
  dashboard (not imported by any route) — noted for awareness, left untouched since deleting
  dead code wasn't requested and it's not part of this task's scope.
- **`/mobile`** (`components/mobile/*`) is already a genuine **consumer EV-owner app**, further
  along than the brief assumed: a working E-pit/myHyundai dual-skin system with Home, V2G
  schedule, SOC settings, station map (MapLibre, not the operator's Jeju infrastructure map),
  rewards/wallet, vehicle status, PnC flow, and a focus/charging screen. It already reuses a
  shared domain/services layer — there is no `/app`-vs-`/mobile` business-logic duplication to
  clean up (rule §4 of the brief is already satisfied).

So the real gap isn't "port /app screens down to phone size." It's:

1. `/mobile`'s home/V2G screens run on `lib/services/v2gScheduler.ts`, a simple **grid-balance**
   scheduler built for the fleet-wide dashboard simulation (minimum-SOC threshold only).
2. A second, more sophisticated **mobility-aware engine already exists** — `lib/domain/mobility/*`
   (departure prediction blending trip history + calendar + Gemini), `lib/domain/soc/guaranteedSoc.ts`,
   `lib/domain/v2g/scheduler.ts` (`buildAdaptiveSchedule`, guaranteed-SOC-aware), wired together by
   `lib/services/validationEngine.ts` (`computeSnapshot`) — but it currently powers **only**
   `/validation` (the engineer/judge backtest dashboard), not the live consumer UI.
3. Gemini is already correctly architected: server-only (`lib/services/ai/GeminiProvider.ts`),
   never called from client components, schema-validated, deterministic fallback on any failure.
   Two of three `AIService` methods have no API route yet (`explainSchedule`,
   `analyzeMobilityContext` — only `classifyCalendarEvent` has `/api/ai/calendar/analyze`).
4. The "schedule changed → protected SOC recalculates → V2G plan updates" demo story the brief
   asks for (§16, §40) is **not a new feature to invent** — `ValidationDashboard.tsx` already
   proves it end-to-end via `SimulationVehicleAdapter.applyEvent("EARLIER_DEPARTURE"/"CALENDAR_CHANGED")`.
   It just isn't exposed anywhere a normal user would see it.

## 1. Feature gap table

| Feature | `/app` | `/mobile` (before) | Real engine available? | Action |
|---|---|---|---|---|
| Vehicle SOC display | Yes (fleet table) | Yes (hero %, bar) | n/a | Improve — add guaranteed/available split |
| Guaranteed SOC (trip + reserve + uncertainty margin) | No | No | **Yes**, unused (`guaranteedSoc.ts`) | Wire in |
| Departure prediction (history+calendar+Gemini) | No | No | **Yes**, unused (`departurePrediction.ts`) | Wire in |
| Adaptive V2G scheduler (guaranteed-SOC-aware) | No | No (uses simple scheduler) | **Yes**, unused (`v2g/scheduler.ts`) | Wire in |
| V2G today's schedule timeline | Partial (desktop chart) | Yes (list of blocks) | via engine | Redesign as 24h visual timeline |
| "Why this plan?" explanation | No | No | **Yes**, `explainSchedule()` has no route | Add API route + UI |
| AI Mobility Insight card | No | No | **Yes**, `analyzeMobilityContext()` has no route | Add API route + UI |
| Calendar connect / sync UX | No | No | Normalizer exists, no OAuth | Add UI, mark Demo |
| Schedule-change notification (§16) | No | No | **Yes**, proven in `/validation` | Port interaction to mobile |
| User SOC safety-reserve control | No | Yes (`SocSettings`, UI-only, doesn't persist) | `hardMinimumSoc` param exists | Wire control to engine |
| Battery analysis / mobility pattern card | No | No | Partial (`mobilityProfile.ts`) | Add |
| Rewards / HoneyWallet / coupons | No | Yes (fairly complete) | n/a | Minor polish only |
| Station map (V2G-capable filter) | Different (infra map) | Yes (MapLibre, demo stations) | n/a | Keep as-is |
| Notifications | No | No | No | Add (client-only demo list) |
| Environmental report (CO₂, renewable absorption) | Partial (`renewableForecastService`, fleet-level) | No | Fleet-level only | Skip — no per-user data to show honestly; note as gap |
| Simulation / validation | n/a | n/a | Yes, full page at `/validation` | Keep as secondary/developer view, unchanged |

## 2. Architecture decision

No new duplicate services. Everything mobile-facing routes through the **existing** shared layer:

```
lib/domain/mobility, soc, v2g, safety, calendar   (pure, already shared, untouched)
        │
lib/services/validationEngine.ts  (computeSnapshot — already shared, reused as-is)
        │
NEW: lib/services/liveMobilityService.ts   (mobile-facing view-model mapper,
        same pattern as the existing mobileHomeService.ts, sits beside it —
        does NOT duplicate computeSnapshot's logic, only shapes it for UI)
        │
components/mobile/*  (Epit + myHyundai skins, both consume the same view model)
```

`app/api/ai/calendar/analyze` stays; adding `app/api/ai/schedule/explain` and
`app/api/ai/mobility/context` as thin routes to the already-implemented `GeminiProvider` methods.
No changes to `/app` are planned — it remains the operator-facing reference/secondary interface,
per the brief's rule §42.

## 3. Plan (phased, no approval checkpoint per brief §3)

Rough relative sizing (file/interaction count, not clock time — this repo has no prior sessions
to benchmark actual duration against):

| Phase | Scope | Size |
|---|---|---|
| 1 | `liveMobilityService.ts` + 2 new AI API routes | Small |
| 2 | Home hero (SOC/guaranteed/available), today's plan, AI insight, "why this plan?" | Medium |
| 3 | V2G screen: 24h timeline, tap-for-detail, safety-reserve control wired to engine | Medium |
| 4 | Schedule-change demo interaction (the §16/§40 story) | Small–Medium |
| 5 | Calendar connect UX (demo-labeled) | Small |
| 6 | Vehicle screen: mobility pattern / battery analysis card | Small |
| 7 | Notifications list | Small |
| 8 | Lint/typecheck/build verification + final report | Small |

Each phase ends with `npm run lint` at minimum; full `npm test`/build runs after phases 3-4 (the
ones touching shared services) and again at the end.
