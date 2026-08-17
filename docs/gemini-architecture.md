# Gemini Integration Architecture

## Role boundary (§5) — the single most important rule here

> Gemini understands context. HoneyCharge calculates safety. The
> optimizer schedules energy. The safety layer authorizes execution.

Concretely, `GeminiProvider` (`lib/services/ai/GeminiProvider.ts`) can
only ever influence the **weight and direction of one candidate** inside
`predictDeparture`'s weighted blend
(`lib/domain/mobility/departurePrediction.ts`). It cannot:

- set `guaranteedSoc` directly (`lib/domain/soc/guaranteedSoc.ts` never
  imports anything from `lib/services/ai/**`),
- choose a `CHARGE`/`DISCHARGE`/`IDLE` action (`lib/domain/v2g/scheduler.ts`
  never imports anything from `lib/services/ai/**`),
- lower a hard SOC floor, or
- send a command to a vehicle (`VehicleAdapter` is a domain interface with
  no AI dependency).

This is enforced structurally, not just by convention: `lib/domain/**` has
no import of `@google/genai` or `lib/services/ai/**` anywhere (verified —
see `docs/implementation-status.md`'s final verification section).

## Provider abstraction (§6)

```
lib/services/ai/
  types.ts        AIService interface + result types
  config.ts        centralized GEMINI_* env config
  schemas.ts        request/response JSON Schemas + hand-written validators
  prompts.ts        versioned prompt templates (§81)
  GeminiProvider.ts  real implementation (this is the ONLY file that imports @google/genai)
  MockAIProvider.ts  deterministic test double (§72)
  fallback.ts        deterministic heuristic used on any Gemini failure (§9)
  AIService.ts       getAIService() factory — the only entry point callers use
```

UI components and domain logic never import `GeminiProvider` or
`@google/genai` directly — they call `getAIService()`.

## Structured output + validation (§8)

Every Gemini call sets `responseMimeType: "application/json"` and a
`responseJsonSchema` (see `lib/services/ai/schemas.ts`). The parsed JSON is
then independently re-validated (range-checked probabilities/confidences,
bounded string arrays, valid ISO dates) — a 200 response with malformed
content is treated exactly like a network failure.

## Failure handling (§9)

`GeminiProvider` never throws out to a caller. Every method:

```
try Gemini (with an 8s timeout, configurable via GEMINI_TIMEOUT_MS)
  -> classify the failure reason (TIMEOUT / RATE_LIMIT / SERVER_ERROR / NETWORK_ERROR / INVALID_JSON / INVALID_SCHEMA / MISSING_KEY / DISABLED)
  -> log a structured {"type":"AI_FALLBACK", provider:"gemini", reason, fallback:"HISTORICAL_PATTERN"} entry
  -> return the deterministic fallback (lib/services/ai/fallback.ts)
```

Verified by `tests/domain/ai-gemini-provider-disabled.test.mjs`: with
`GEMINI_ENABLED` unset (the default in this repo and in CI), all three
`AIService` methods return a `source: "fallback"` result in well under
500ms, with zero network calls attempted.

## Cost control (§94–§96)

- Gemini is only called when a calendar event actually changes (the
  `/validation` dashboard's "일정 변경 추가" scenario button, or a real
  future Apps Script sync — see `docs/apps-script-integration.md`), never
  on a timer or per-simulation-tick.
- Only a locally-computed `MobilityProfile` summary (a handful of numbers)
  is sent, never raw 30-day trip history (`lib/domain/mobility/mobilityProfile.ts`).

## What was NOT verified

No live call to the Gemini API was made as part of this implementation —
there was no network access to the real Gemini endpoint in this sandbox.
`GeminiProvider`'s request/response shape was built directly against the
installed `@google/genai@2.17.1` SDK's TypeScript definitions
(`node_modules/@google/genai/dist/node/node.d.ts`), and the fallback path
is fully tested, but the live-Gemini path itself needs a real
`GEMINI_API_KEY` + `GEMINI_ENABLED=true` smoke test before relying on it
in production. The default `GEMINI_MODEL` (`gemini-2.5-flash`) should also
be reverified against the current Gemini model lineup at deploy time.
