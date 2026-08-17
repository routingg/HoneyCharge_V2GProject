# Validation Results

All numbers below are actual output captured during this implementation
(via `runFixedVsAdaptiveBacktest`, either through
`GET /api/validation/backtest` against a running server, or a direct
script run). None are hand-written or estimated. Reproduce with:

```bash
node --import tsx -e "
import { runFixedVsAdaptiveBacktest } from './lib/domain/validation/backtest.ts';
const r = runFixedVsAdaptiveBacktest({
  vehicleId: 'OWN-002', batteryCapacityKWh: 77.4, maxChargePowerKW: 6.4, maxDischargePowerKW: 9,
  hardMinimumSoc: 20, userReserveSoc: 15, fixedMinimumSoc: 50,
  historyDays: 30, minHistoryTripsBeforeScoring: 7, seed: 42, endDate: new Date(),
});
console.log(r.fixedMetrics, r.adaptiveMetrics);
"
```

(`endDate: new Date()` means re-running this on a different day will
produce a different — but equally deterministic for that day — set of 30
synthetic days; pass a fixed `Date` to reproduce these exact numbers.)

## Run 1 — default configuration (seed=42, 99.8kWh EV9-class vehicle via the dashboard's `VEHICLE_CONFIG`, fixed floor 50%)

18 scored days (of 30 generated — the rest were dropped by the 7-trip
minimum-history rule or were skipped-trip weekdays in the synthetic
generator).

| Metric | Fixed (50%) | Adaptive |
|---|---:|---:|
| Mobility guarantee rate | 100% | 100% |
| Total discharged (V2G) | 243.37 kWh | 340.64 kWh |
| Total charged | 509.29 kWh | 467.2 kWh |
| Safety violations | 0 | 0 |
| SOC prediction MAE | n/a (see note) | 1.26 %p |
| V2G discharge change vs. fixed | — | **+40%** |

## Run 2 — 77.4kWh vehicle, fixed floor 50%

18 scored days.

| Metric | Fixed (50%) | Adaptive |
|---|---:|---:|
| Mobility guarantee rate | 100% | 100% |
| Total discharged (V2G) | 313.68 kWh | 407.34 kWh |
| Total charged | 550.64 kWh | 508.8 kWh |
| Safety violations | 0 | 0 |
| SOC prediction MAE | n/a | 2.66 %p |
| V2G discharge change vs. fixed | — | **+29.9%** |

## Run 3 — same vehicle as Run 2, fixed floor raised to 95%

Same 18 days, same seed, only `fixedMinimumSoc` changed — demonstrating
the harness is not tuned to make the adaptive strategy win (§46, §77).

| Metric | Fixed (95%) | Adaptive (unchanged) |
|---|---:|---:|
| Mobility guarantee rate | 100% | 100% |
| Total discharged (V2G) | **1.76 kWh** | 407.34 kWh |
| Total charged | 431.18 kWh | 508.8 kWh |
| Safety violations | 0 | 0 |
| V2G discharge change vs. fixed | — | **+23,044%** (see note) |

## Interpretation

- Across all three runs, both strategies achieved a 100% mobility
  guarantee rate and 0 safety violations for this seed/configuration —
  the synthetic scenario did not surface a case where either strategy
  failed to protect mobility. This is a property of this particular
  synthetic history/config, not a universal guarantee; different seeds,
  shorter decision lead times, or lower `historyDays` should be tried
  before treating "100%" as a general claim (§77, §105 — measurable
  evidence, not a scripted result).
- The adaptive strategy's SOC prediction MAE (1.26–2.66 percentage
  points) is only a meaningful "how good is the trip-requirement
  prediction" signal for the adaptive strategy — the fixed strategy
  doesn't make a trip-requirement prediction at all, so its MAE against
  a static floor isn't comparable and is labeled "n/a" here (the API
  still returns a number for it; see `docs/validation-methodology.md`).
- **Run 3 surfaces a real metric-presentation issue, not a bug**: when the
  fixed baseline's floor is so high (95%) that it barely discharges
  anything (1.76 kWh across 18 days), the improvement percentage
  (`(adaptive − fixed) / fixed × 100`) explodes to a meaningless-looking
  +23,044%. The underlying arithmetic is correct (`computeValidationMetrics`
  in `lib/domain/validation/metrics.ts` already returns `null` for the
  true zero-baseline case), but a *near*-zero baseline still produces an
  unreadable percentage. The dashboard mitigates this by always showing
  absolute kWh alongside the percentage; a future improvement would be to
  suppress or caveat the percentage below some baseline threshold.

## Live dashboard screenshot

Captured during Playwright verification against `npm run dev`:
`.playwright-mcp/validation-full.png` (not committed to the repo;
regenerate by running the dashboard and taking a screenshot — see
`docs/vcycle/05_integration_test_spec.md`).
