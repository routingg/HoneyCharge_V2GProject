# Guaranteed SOC Engine

`lib/domain/soc/guaranteedSoc.ts`, policy in `lib/domain/soc/safetyMargin.ts`
and `lib/domain/config.ts::CONFIDENCE_MARGIN_POLICY`.

## Formula (§22)

```
guaranteedSoc = max(
  tripRequirementSoc + userReserveSoc + uncertaintyMarginSoc,
  hardMinimumSoc
)
```

clamped to `[0, 100]`.

- `tripRequirementSoc` — from `predictTripEnergy` (§21).
- `userReserveSoc` — from `UserMobilityPreferences.preferredReserveSoc`,
  user-configurable, never overridden by automation.
- `uncertaintyMarginSoc` — a deterministic function of prediction
  confidence (§20), not a fixed buffer:

  | confidence | margin |
  |---|---|
  | ≥ 0.85 | 5 pts |
  | 0.70–0.85 | 8 pts |
  | 0.50–0.70 | 12 pts |
  | 0.30–0.50 | 17 pts |
  | < 0.30 | 22 pts (conservative fallback) |

  This table is the entire content of `CONFIDENCE_MARGIN_POLICY` — one
  place, not scattered through UI code (§20's explicit requirement).
- `hardMinimumSoc` — the user's absolute floor
  (`UserMobilityPreferences.hardMinimumSoc`). Automation can never push
  the guarantee below this, only raise it (§16).

## Explainability (§23, §56)

`calculateGuaranteedSoc` returns a `GuaranteedSocResult` with every term
broken out plus a `reasoning: string[]` built from the actual numbers
(not a template with placeholders) — this is exactly what the
`/validation` dashboard's "보장 SOC 구성" card renders, and exactly what
`buildScheduleExplanationPrompt` hands to Gemini as immutable FACTS when
generating a natural-language explanation (§97).

## Tests

`tests/domain/guaranteed-soc.test.mjs` covers: the margin-tier table
exactly, correct summation, flooring at the hard minimum, clamping at
100%, and that lower confidence strictly increases the guarantee. All 5
pass.
