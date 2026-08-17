# Integration Test Specification

Cross-module and cross-boundary behavior not covered by pure-function unit
tests.

## Automated

- `tests/domain/validation-engine.test.mjs` — exercises the full
  CONTEXT->PREDICTION->SAFETY->OPTIMIZATION pipeline as one call
  (`computeSnapshot`), the same function the live dashboard uses, and
  confirms the `@/` path alias resolves correctly outside Next's own
  bundler (via `tsx`) — a real integration risk given the domain layer is
  consumed from both a plain Node test runner and a Vite/RSC client
  bundle.
- `tests/rendered-html.test.mjs` (pre-existing, unmodified) — confirms
  the existing grid dashboard's server-rendering path still works
  unaffected by this implementation.

## Manual, performed once during this implementation (see
`07_validation_results.md` for outcomes)

- `npm run build` after each phase — confirmed the Vite/vinext/Cloudflare
  build pipeline accepts the new `app/api/**/route.ts` handlers, the new
  `app/validation/page.tsx` route, and the new dependency
  (`@google/genai`).
- `curl` smoke tests against `npm run start` (production build) for both
  new API routes:
  - `GET /api/validation/backtest?seed=42` — returned real aggregate
    metrics (see `07_validation_results.md`).
  - `POST /api/ai/calendar/analyze` with a located, non-all-day event —
    returned a `source: "fallback"` classification (Gemini disabled in
    this environment), consistent with the fallback heuristic.
- Playwright browser session against `npm run dev`:
  - `/validation` renders all six cards, the timeline chart, scenario
    controls, comparison panel, and audit log with live-computed values
    (screenshot captured).
  - Clicking "SOC 급감" (Low SOC) correctly dropped SOC to 22% and flipped
    the safety-state badge to "충전 필요" (`CHARGE_REQUIRED`).
  - Clicking "일정 변경 추가" (Calendar change) triggered a real round-trip
    to `/api/ai/calendar/analyze`, which fell back (Gemini disabled) and
    the dashboard correctly displayed the fallback trust-language message
    (§60–§61) rather than claiming Gemini involvement it didn't have.
  - Idle-state check: 5 seconds with no user interaction produced zero
    additional audit-log entries — confirms no spontaneous/uncommanded
    state changes.

## Known gap

No integration test exercises a **live** Gemini API call (no network
access to the real API in this environment — see
`docs/gemini-architecture.md`'s "What was NOT verified" section). This is
the highest-priority integration test to add before relying on
`GEMINI_ENABLED=true` in production.
