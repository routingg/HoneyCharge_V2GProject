# Requirements

Scoped to what this implementation actually delivers (§69). Each ID is
referenced by its implementing module and test in
`08_traceability_matrix.md`.

## Mobility (REQ-MOB)

- **REQ-MOB-001**: The software shall predict a probable next departure
  time from historical trip patterns.
- **REQ-MOB-002**: The prediction shall report a confidence score derived
  from sample count and historical consistency, not a fixed constant.
- **REQ-MOB-003**: When calendar signals are enabled, an upcoming
  calendar event may adjust the departure prediction, weighted by its own
  confidence.
- **REQ-MOB-004**: With no usable history, the software shall return a
  conservative default with low confidence rather than a fabricated
  precise prediction.

## SOC (REQ-SOC)

- **REQ-SOC-001**: The software shall calculate a guaranteed departure
  SOC that is no lower than the user's configured hard minimum SOC.
- **REQ-SOC-002**: The guaranteed SOC shall equal trip requirement + user
  reserve + a confidence-derived uncertainty margin, before the hard-
  minimum floor is applied.
- **REQ-SOC-003**: Lower prediction confidence shall strictly increase
  the uncertainty margin.
- **REQ-SOC-004**: The guaranteed SOC shall always be reported with its
  full decomposition (trip / reserve / margin / floor) for UI display.

## V2G (REQ-V2G)

- **REQ-V2G-001**: The optimizer shall never schedule a discharge while
  SOC is at or below the guaranteed SOC.
- **REQ-V2G-002**: The optimizer shall never schedule SOC outside
  `[0, 100]` or below the hard minimum SOC.
- **REQ-V2G-003**: The optimizer shall force charging when the vehicle
  would otherwise fail to reach the guaranteed SOC by the predicted
  departure.
- **REQ-V2G-004**: The optimizer shall never issue a CHARGE/DISCHARGE
  command while the vehicle is driving, disconnected, or its telemetry is
  stale.
- **REQ-V2G-005**: A fixed-SOC baseline strategy shall be runnable against
  identical scenario inputs as the adaptive strategy for comparison.

## AI (REQ-AI)

- **REQ-AI-001**: Gemini shall only be reachable through a single
  `AIService` interface; no other module shall import the Gemini SDK.
- **REQ-AI-002**: All Gemini responses shall be requested and validated as
  structured JSON against an explicit schema.
- **REQ-AI-003**: Any Gemini failure (disabled, missing key, timeout, rate
  limit, invalid JSON/schema, network/server error) shall fall back to a
  deterministic heuristic without throwing to the caller.
- **REQ-AI-004**: Automated tests shall never depend on a live Gemini API
  call.

## Calendar (REQ-CAL)

- **REQ-CAL-001**: Only event start, end, all-day flag, and (opt-in)
  location shall ever leave the calendar-normalization boundary —
  attendees, descriptions, and attachments shall never be read.

## Safety (REQ-SAFE)

- **REQ-SAFE-001**: The software shall maintain an explicit safety state
  (`NORMAL`/`CONSERVATIVE`/`CHARGE_REQUIRED`/`VEHICLE_UNAVAILABLE`/
  `STALE_DATA`/`EMERGENCY_RESERVE`) derived purely from current SOC,
  guarantee, connectivity, and telemetry freshness.
- **REQ-SAFE-002**: Every schedule shall be independently re-scannable
  for safety-constraint violations, without trusting the scheduler's own
  bookkeeping.

## Simulation (REQ-SIM)

- **REQ-SIM-001**: The vehicle simulator shall be deterministic — a given
  seed shall always reproduce the same synthetic trip history.
- **REQ-SIM-002**: The simulator shall support time control (tick-based
  advancement) and event injection (early departure, calendar change, low
  SOC, stale telemetry, charger/vehicle disconnect, high consumption).

## Communication / UI (REQ-COMM)

- **REQ-COMM-001**: The validation dashboard shall display the guaranteed
  SOC decomposition, V2G-available capacity, a 24h SOC timeline, and a
  fixed-vs-adaptive comparison, all computed live rather than hardcoded.
