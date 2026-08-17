# Mobility Prediction

Two independent predictions feed the guaranteed-SOC engine: **when** the
vehicle will likely depart, and **how much energy** that trip will likely
need. Both are deterministic statistical baselines first (§17); Gemini
only ever contributes one additional weighted candidate to the departure
prediction (§18), and never touches the energy prediction at all (§21 —
"independent from Gemini").

## Departure prediction (`lib/domain/mobility/departurePrediction.ts`)

1. **Historical candidate**: same-weekday trips (falls back to all trips
   if fewer than 3 same-weekday samples exist), recency-weighted
   (14-day half-life, `HISTORY_RECENCY_HALF_LIFE_DAYS`) mean and standard
   deviation of departure minute-of-day.
   Confidence = `sampleFactor × consistencyFactor × weekdaySpecificityBonus`,
   where `sampleFactor = min(1, sampleCount/8)` and
   `consistencyFactor = clamp(1 - std/180, 0.1, 0.95)` — more samples and
   tighter historical consistency both increase confidence, but confidence
   never exceeds what the evidence supports (§19: "avoid arbitrary
   hardcoded claims").
2. **Calendar candidate**: the next non-all-day upcoming event within a
   36h lookahead. Without Gemini, a shared location is a weak heuristic
   signal (`vehicleNeedProbability = 0.6` vs `0.25` for no location) —
   this is a signal, not ground truth (§18). With a Gemini classification
   available for that event, its `vehicleNeedProbability`/`confidence`
   replace the heuristic values, and the candidate's source label changes
   from `"calendar"` to `"gemini"` for the sake of honest attribution.
3. **Combination**: candidates are blended by confidence-weighted average
   minute-of-day. An agreement bonus (+0.10 confidence) applies when
   sources agree within 30 minutes; a spread penalty
   (`min(0.4, spreadMinutes/720)`) applies when they disagree. Both the
   final `predictedDeparture` and the per-source `sourceWeights` are
   returned so the UI can show exactly how much each source contributed
   (§55).
4. **No history at all**: falls back to a conservative 08:00 default with
   confidence 0.2 rather than a fabricated precise time (§40).

## Trip energy prediction (`lib/domain/mobility/tripEnergyPrediction.ts`)

```
requiredEnergyKWh = medianRecentTripDistanceKm × medianRecentConsumptionKWhPerKm
requiredTripSoc   = requiredEnergyKWh / batteryCapacityKWh × 100
```

Both medians come from `summarizeMobilityProfile`
(`lib/domain/mobility/mobilityProfile.ts`), which reduces raw trip history
to a small quantitative summary (§96) — this is also the only thing ever
sent to Gemini, never raw history. Confidence scales with sample count
(`0.3 + 0.6 × min(1, sampleCount/10)`), so an empty history yields
confidence ≤ 0.3, not a false-precision number.

## Combined confidence into the guaranteed-SOC engine

`calculateGuaranteedSoc` receives
`confidence = min(departurePrediction.confidence, tripEnergyPrediction.confidence)`
— the conservative minimum of the two, so a strong departure prediction
can never mask a weak trip-energy prediction (or vice versa) when sizing
the safety margin. See `docs/guaranteed-soc.md`.
