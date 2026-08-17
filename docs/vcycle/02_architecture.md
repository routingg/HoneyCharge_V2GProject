# Architecture (V-Cycle Left Side)

See `docs/architecture.md` for the full diagram and narrative. Summary of
the V-model mapping:

```
Requirements (01_requirements.md)          <-- validated by -->  Validation results (07)
      |                                                                  ^
      v                                                                  |
Architecture (this doc / docs/architecture.md)  <-- verified by -->  Simulation tests (06)
      |                                                                  ^
      v                                                                  |
Detailed design (03_detailed_design.md)     <-- verified by -->  Integration tests (05)
      |                                                                  ^
      v                                                                  |
Implementation (lib/domain/**, lib/services/ai/**)  <-- verified by --> Unit tests (04)
```

Each layer in `docs/architecture.md`'s CONTEXT -> PREDICTION -> SAFETY ->
OPTIMIZATION -> EXECUTION -> VALIDATION pipeline corresponds to one
`lib/domain/*` subdirectory, independently unit-testable and never
collapsed into a single service (§4).
