# Apps Script Reference (Not Deployed)

These files are a **proof-of-concept reference only** — see
`docs/apps-script-integration.md` for the full design. None of this has
been deployed or executed against a real Google account as part of this
implementation.

## Files

- `config.gs` — reads all secrets from `PropertiesService`. Never hardcode
  keys in `.gs` files.
- `calendar.gs` — reads upcoming Google Calendar events and normalizes
  them to HoneyCharge's `NormalizedCalendarEvent` shape (§10 data
  minimization).
- `honeycharge.gs` — POSTs normalized events to
  `/api/ai/calendar/analyze` and logs the result.
- `gemini.gs` — an alternative path that calls the Gemini REST API
  directly from Apps Script. Shown for completeness only; the recommended
  integration goes through `honeycharge.gs` instead, so the Gemini key and
  prompt/schema logic live in exactly one place
  (`lib/services/ai/GeminiProvider.ts`).

## To actually try this (future work, outside this implementation's scope)

1. Create a new Apps Script project at script.google.com.
2. Paste these four files in.
3. In Project Settings -> Script Properties, set:
   - `HONEYCHARGE_BACKEND_URL` (e.g. `https://your-deployment/api/ai/calendar/analyze`)
   - `HONEYCHARGE_APPS_SCRIPT_TOKEN` (once auth is added server-side — see
     `docs/apps-script-integration.md`)
   - `GEMINI_API_KEY` / `GEMINI_MODEL` (only if using `gemini.gs` directly)
4. Run `syncUpcomingEvents` once manually to authorize Calendar access.
5. Add a time-driven trigger (e.g. every 15 minutes) for
   `syncUpcomingEvents`.

Steps 3-5 are intentionally not automated by these files — this repo does
not perform any Google OAuth flow or Apps Script deployment.
