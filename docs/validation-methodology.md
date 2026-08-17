# Validation Methodology

This is how the central hypothesis (§0) gets a real, falsifiable answer:

> Adaptive mobility-aware SOC protection can preserve user mobility while
> increasing V2G utilization compared with a fixed minimum-SOC policy.

## Backtest design (`lib/domain/validation/backtest.ts`)

For each trip in 30 days of synthetic history (deterministic, seeded —
see `docs/simulation.md`):

1. Take only the trips **strictly before** this one as "known history" —
   no leakage. A trip is only scored once at least
   `minHistoryTripsBeforeScoring` (default 7) prior trips exist (§40).
2. Run `predictDeparture` + `predictTripEnergy` on that history alone, at
   a decision point `decisionLeadHours` (default 6h) before the trip's
   actual departure.
3. Compute `calculateGuaranteedSoc` from those predictions.
4. Run **both** strategies — fixed-floor and adaptive-guarantee — through
   the identical `buildAdaptiveSchedule`/`compareStrategies` call, with
   identical `startTime`, `initialSoc` (the trip's real starting SOC),
   grid signals, battery/power specs, and — critically — the trip's
   **actual realized energy consumption** as ground truth (§46).
5. Outcomes are scored against the SOC the schedule had reached at the
   trip's **real** departure time, not the plan's assumed departure time
   (`compareStrategies`' `actualDeparture` parameter) — so an
   earlier-than-predicted departure is scored honestly (§37).

## Metrics (`lib/domain/validation/metrics.ts`, §47–§51)

- **Mobility guarantee rate**: % of trips where `departureSocAvailable >=
  actualRequiredTripSoc`.
- **SOC prediction MAE**: mean absolute error between predicted and
  actual required trip SOC. Only meaningful for the adaptive strategy —
  the fixed strategy doesn't predict a trip requirement, it just applies
  a static floor, so its "MAE" against that floor isn't a genuine
  prediction-quality signal (the `/validation` dashboard says this
  explicitly, see `ComparisonPanel.tsx`).
- **Total charged/discharged kWh**, **net V2G energy**.
- **Adaptive improvement %**: `(adaptive − fixed) / fixed × 100` on
  discharged kWh, `null` (not `0` or `NaN`) when the baseline discharged
  nothing (§50 — "handle division by zero correctly").
- **Safety violations**: from an independent post-hoc scan
  (`countSafetyViolations`) of the produced schedule against physical
  bounds and command-while-unsafe rules — not the scheduler's own
  bookkeeping (§51).

## The comparison is not rigged (§46, §77)

`tests/domain/backtest.test.mjs::"the adaptive strategy is not hardcoded
to win"` sets the fixed floor to 95% and confirms the fixed strategy's
mobility guarantee rate is at least as good as the adaptive strategy's,
while its V2G energy is at most as good — i.e., the harness can and does
produce results where "fixed" wins on one axis. Nothing in
`compareStrategies` special-cases which strategy is "adaptive."

## Endpoints

- `GET /api/validation/backtest?seed=&fixedMinimumSoc=&hardMinimumSoc=&userReserveSoc=&historyDays=`
  — runs the backtest server-side, returns per-day results plus both
  strategies' aggregate `ValidationMetrics`. This is what
  `components/validation/ComparisonPanel.tsx` renders.

## A/B/C Gemini modes (§52) — scope delivered

The domain layer already supports three configurations by construction:

- **A (history only)**: `calendarEnabled: false` in `predictDeparture`.
- **B (+ calendar, no Gemini)**: `calendarEnabled: true`,
  `geminiCalendarAnalysis` omitted — uses the location-presence heuristic.
- **C (+ Gemini)**: `geminiCalendarAnalysis` populated from
  `GeminiProvider.classifyCalendarEvent` results.

The backtest endpoint currently always runs in mode A (no calendar data
exists in the synthetic history generator). Wiring modes B/C into a
batch A/B/C comparison endpoint — and thereby actually measuring whether
Gemini improves departure-timing error or false-positive/negative
mobility classification, as §52 asks — is the most valuable next
increment on top of this implementation; see
`docs/final-engineering-report.md`'s limitations section.
