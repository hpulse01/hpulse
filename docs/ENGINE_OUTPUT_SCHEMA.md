# EngineOutput Schema

The contract every algorithm core must satisfy. Defined in `src/types/prediction.ts`.

```ts
interface EngineOutput {
  engineName: string;          // 'bazi' | 'ziwei' | …
  engineNameCN: string;        // '八字命理'
  engineVersion: string;       // 'P4.2-core'
  sourceUrls: string[];        // authoritative references
  sourceGrade: 'A' | 'B' | 'C' | 'D';
  ruleSchool: string;          // e.g. '子平 (经典四柱 + 节气月)'

  confidence: number;          // 0..1, capped per status/grade
  computationTimeMs: number;   // pure timing — does not enter algorithm
  rawInputSnapshot: Record<string, unknown>;

  fateVector: FateVector;      // 10 dimensions, each 0..100
  normalizedOutput: Record<string, string>;
  aspectScores: Record<string, number>;
  eventCandidates: string[];

  warnings: string[];
  uncertaintyNotes: string[];
  validationFlags: {
    passed: string[];
    failed: string[];
    warnings: string[];
  };

  timingBasis: 'birth' | 'query' | 'hybrid';
  explanationTrace: string[];  // ≥1 step, each ≥4 chars, no placeholder words
  completenessScore: number;   // 0..100

  timeWindows: TimeWindow[];   // dimension-tagged temporal confidence
}
```

## FateVector (10 dimensions)

| Field | Meaning (zh) | Meaning (en) |
|---|---|---|
| life | 命运·事业 | Life & Career |
| wealth | 财富 | Wealth |
| relation | 人际·情感 | Relationships |
| health | 健康 | Health |
| wisdom | 智慧·创造 | Wisdom & Creativity |
| spirit | 灵性 | Spirituality |
| socialStatus | 社会地位 | Social Status |
| creativity | 创造力 | Creativity |
| luck | 运势 | Fortune & Luck |
| homeStability | 家庭和谐 | Home Stability |

All values must be **0..100**. Anything else fails `validateEngineOutput`.

## ValidationFlags

- `passed: string[]` — checks the engine ran and confirmed
- `failed: string[]` — checks that did not pass; surfaced in `WarningCenter` with destructive tone
- `warnings: string[]` — secondary advisories

## explanationTrace

- Must be a non-empty array.
- Each step ≥ 4 characters.
- Vacuous tokens (`tbd`, `lorem`, `placeholder`, `n/a`, `done`, `ok`) are rejected by `checkExplanation`.
- Recommended: 5–30 steps, each describing one deterministic computation or table lookup.

## implementationStatus

Stored in `normalizedOutput.implementationStatus` (or `p4ImplementationStatus`). One of:
- `complete`
- `partial`
- `needs_source_validation`
- `placeholder_removed`

Caps in `src/core/shared/confidence.ts`:

| Status | Max confidence |
|---|---|
| complete | 1.00 |
| partial | 0.65 |
| needs_source_validation | 0.45 |
| placeholder_removed | 0.00 |

## sourceGrade

| Grade | Cap | Meaning |
|---|---|---|
| A | 1.00 | classical rules complete + tested |
| B | 0.85 | main trunk complete |
| C | 0.65 | simplified |
| D | 0.45 | placeholder / insufficient |

## Audit Helpers

- `validateEngineOutput(eo)` — structural check
- `auditConfidence(eo)` — returns `{ rawConfidence, cappedConfidence, capReasons }`
- `checkExplanation(eo)` — non-empty + non-vacuous trace check
- `auditEngineOutputs(eos)` — multi-engine audit report (entries, atRisk, blockers, readyForP5)
- `auditAll(eos)` — composite of the above
