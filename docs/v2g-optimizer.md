# V2G Optimizer

`lib/domain/v2g/scheduler.ts::buildAdaptiveSchedule`. Rolling horizon
(default 24h at 30-minute slots, `DEFAULT_HORIZON_SLOTS`/`DEFAULT_SLOT_MINUTES`
in `lib/domain/config.ts`), one `CHARGE`/`IDLE`/`DISCHARGE` decision per
slot.

## Why greedy, not a global optimum (§29)

The spec is explicit: "Do not over-engineer mathematical sophistication
before correctness." This scheduler is a safety-first greedy heuristic,
not a MILP/LP solve. Every decision is auditable in one pass and every
slot carries a human-readable `reasonCode`/`explanation` — that
explainability requirement (§59) would be harder to satisfy with a
black-box optimizer, and correctness (never violating a safety
constraint) matters more than squeezing out the last kWh of V2G value.

## Per-slot decision order

1. **Driving** (inside `[predictedDeparture, predictedReturn)`): forced
   `IDLE`, `reasonCode: VEHICLE_UNAVAILABLE`, SOC decremented by the trip
   energy spread evenly across the driving slots.
2. **Telemetry stale / disconnected**: forced `IDLE`,
   `STALE_TELEMETRY`/`CHARGER_DISCONNECTED` — never issues a command on
   data the system can't trust (§42, §51).
3. **`soc <= hardMinimumSoc`**: forced `CHARGE` at max power,
   `LOW_SOC` — the absolute floor always wins (§27, §39).
4. **Departure preparation**: if the energy still needed to reach
   `guaranteedSoc` by the predicted departure is at or above what the
   remaining slots can physically deliver (accounting for
   `maxChargePowerKW` and charge efficiency), force `CHARGE`,
   `DEPARTURE_PREPARATION` — this is what guarantees the vehicle is ready
   on time whenever physically possible (§25).
5. **Otherwise**, score the (simulated) grid signal:
   `dischargeScore = gridSupport·demand + economicValue·energyValue − cyclingPenalty`,
   `chargeScore = renewableAbsorption·(surplusKW/400) − cyclingPenalty/2`.
   - `DISCHARGE` only if `soc > guaranteedSoc` **and** available energy
     clears `minDischargeKWh` **and** `dischargeScore > 0` and wins over
     `chargeScore` — `V2G_SAFE_SURPLUS`. Discharging at or below the
     guarantee is structurally impossible (`soc > guaranteedSoc` is a
     precondition, not a check that can be skipped).
   - `CHARGE` opportunistically when there's renewable surplus and
     `soc < 95` — `RENEWABLE_ABSORPTION`.
   - Otherwise `IDLE` — `USER_RESERVE` (below the guarantee, protecting
     it) or `GRID_BALANCED`.

## Safety constraints as tests, not just comments

`tests/domain/v2g-scheduler.test.mjs` asserts, over the actual scheduler
output: SOC never dips below the hard minimum, never leaves `[0,100]`,
never discharges at/below the guaranteed SOC, a disconnected or
stale-telemetry vehicle never receives a `CHARGE`/`DISCHARGE` command, and
a tight departure deadline forces continuous charging. A second,
independent scan (`countSafetyViolations` in
`lib/domain/validation/compare.ts`) re-checks these same invariants over
any produced schedule — used by the validation/backtest pipeline so a
"0 safety violations" claim isn't just the scheduler grading its own
homework (§51).

## Fixed-SOC baseline is the same function

`lib/domain/validation/baseline.ts` + `compareStrategies`
(`lib/domain/validation/compare.ts`) call the exact same
`buildAdaptiveSchedule` with `guaranteedSoc = hardMinimumSoc = fixedMinimumSoc`
instead of the computed guarantee — so "fixed vs. adaptive" is a genuine
apples-to-apples comparison against identical scenario inputs (§46), not
two different code paths that could be tuned to favor one side.
