# P4 — Algorithm Core

P4 is the deterministic algorithm reconstruction phase. It runs in 12 sub-phases:

| Sub-phase | Scope |
|---|---|
| P4.1 | astro-time + calendar primitives |
| P4.2 | Bazi |
| P4.3 | Tieban |
| P4.4 | Ziwei Doushu |
| P4.5 | Liu Yao |
| P4.6 | Meihua Yishu |
| P4.7 | Qi Men Dun Jia |
| P4.8 | Da Liu Ren + Tai Yi |
| P4.9 | Western + Vedic astrology |
| P4.10 | Numerology + Mayan + Kabbalah |
| P4.11 | Orchestrator integration overlay |
| P4.12 | Determinism guard, audit, ledger gating |

## Hard Rules

1. **No `Math.random`** in any file under `src/core/`.
2. **No `Date.now()` / `new Date()`** influencing prediction output. Allowed only for measuring `computationTimeMs`.
3. **No hash-modulo masquerading as a divinatory method.**
4. **No fixed 50-score scoring**, no random events, no fabricated tables.
5. **No silent fallback**. Missing rules → `warnings`. Missing source → `needs_source_validation`.
6. **All "current year"** must come from `input.targetYear` or `input.queryTimeUtc`.

## Required Output

Every engine must emit an `EngineOutput` containing:
- `engineName`, `engineNameCN`, `engineVersion`, `sourceUrls`, `sourceGrade`, `ruleSchool`
- `confidence`, `completenessScore`, `computationTimeMs`, `timingBasis`
- `fateVector` (10 dimensions, 0..100)
- `normalizedOutput`, `aspectScores`, `eventCandidates`
- `warnings`, `uncertaintyNotes`, `validationFlags`
- `explanationTrace` (non-empty, ≥2 substantive steps)
- `timeWindows`
- `rawInputSnapshot`

See [`ENGINE_OUTPUT_SCHEMA.md`](./ENGINE_OUTPUT_SCHEMA.md).

## Source Grade Mechanism

`src/core/shared/algorithmSourceRegistry.ts` is the single source of truth for what each engine claims. Audit code cross-checks declared grade against this registry.

## Partial Strategy

`partial` is acceptable. `partial` masquerading as `complete` is not. The audit layer (`src/core/shared/auditEngineOutput.ts`) refuses to upgrade confidence above the per-status ceiling.

## Tests

- `src/core/shared/__tests__/determinismGuard.full.test.ts` — scans all of `src/core/` for forbidden tokens
- `src/core/shared/__tests__/engineOutputValidation.test.ts` — structural validator
- `src/core/shared/__tests__/implementationAudit.test.ts` — multi-engine audit
- per-engine tests in `src/core/<engine>/__tests__/`

See [`ALGORITHM_STATUS.md`](./ALGORITHM_STATUS.md) for the per-engine status board.
