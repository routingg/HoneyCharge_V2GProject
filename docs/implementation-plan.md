# HoneyCharge — Implementation Plan

Scope note: the source instruction (105 sections) specifies an entire
platform. This plan executes it as an additive `lib/domain` module plus a
new `/validation` surface, in the phase order the instruction itself
prescribes (its §88), so the core hypothesis-testing pipeline exists and is
tested before any UI is built on top of it. Status is tracked in
`docs/implementation-status.md`, updated per phase — nothing is marked DONE
without a passing test or a build that exercises it.

## Phase order

1. Domain types & module boundaries (mobility, calendar, SOC, V2G, safety,
   simulation, validation, audit) — `lib/domain/**`.
2. Synthetic mobility data: 30-day trip history generator + mobility
   profile summarizer.
3. Deterministic vehicle simulator (`VehicleAdapter` + `SimulationVehicleAdapter`)
   with time control and event injection.
4. Statistical departure prediction (weekday distribution + recent
   weighted average + variance → confidence).
5. Trip energy prediction (robust recent efficiency × predicted distance).
6. Guaranteed SOC engine (trip requirement + reserve + confidence-mapped
   margin, floored at hard minimum) with explainable decomposition.
7. V2G schedule engine (rolling horizon, CHARGE/IDLE/DISCHARGE, safety
   constraints, reason codes).
8. Safety state machine (NORMAL/CONSERVATIVE/CHARGE_REQUIRED/
   VEHICLE_UNAVAILABLE/STALE_DATA/EMERGENCY_RESERVE) + audit log.
9. Fixed-SOC baseline strategy, run side-by-side with adaptive strategy on
   identical inputs.
10. Validation metrics: mobility guarantee rate, SOC prediction error
    (MAE), V2G energy totals, adaptive improvement %, safety violation
    count.
11. Domain-layer tests (`tests/domain/*.test.mjs`) covering 1–10 before any
    AI or UI work starts.
12. Gemini provider behind `AIService` interface; centralized config
    (`GEMINI_ENABLED`/`GEMINI_MODEL`/`GEMINI_API_KEY`); structured JSON
    output + schema validation.
13. Calendar normalization + calendar-aware mobility classification
    (data-minimized payload to Gemini).
14. Deterministic fallback (historical predictor + larger safety margin)
    on any Gemini failure mode; `MockAIProvider` for tests; A/B mode
    (history-only vs. +calendar vs. +Gemini) support in the compare harness.
15. `/validation` dashboard: current vehicle, next mobility, guaranteed SOC
    breakdown, V2G availability, 24h timeline, baseline-vs-adaptive
    comparison, reason-code explanations.
16. Scenario controls: start/pause/reset, time multiplier, event injection,
    predefined scenarios (normal commuter, early departure, calendar
    change, low SOC, insufficient history, high trip consumption, stale
    telemetry, charger disconnect).
17. Apps Script compatibility docs + non-deployed reference scripts.
18. V-cycle documentation set (requirements → traceability matrix), scoped
    to the requirements this implementation actually delivers.
19. Full verification (`lint`, `tsc --noEmit`, `npm test`, `npm run build`)
    and the final engineering report.

## Explicit priority call

Phases 1–11 (the deterministic core) are the load-bearing part of the
central hypothesis and get the most scrutiny/testing. Gemini (12–14) is
additive on top and the system must be provably correct with
`GEMINI_ENABLED=false`. UI (15–16) visualizes real domain output only —
no hardcoded numbers. Docs (17–19) describe what was actually built.
