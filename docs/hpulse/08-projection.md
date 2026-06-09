# HPU-8 — UI Projection Layer

Pure transformation `PipelineReport (HPU-7) → ProjectionView`. No React,
no i18n, no IO. Same input ⇒ same output (deterministic; FNV-1a signature).

## Output: `ProjectionView`

| Field | Source | Purpose |
|---|---|---|
| `header` | WorldTree.meta + DeathFusion.verdict + deathWindow | Banner / hero card |
| `fateDimensions[10]` | `fusion.verdict.lifetimeFateVector` | Radar / metric grid (`rank`, `bucket: top/mid/bottom`) |
| `engines[13]` | WorldTree + EngineRunResult[] | Engine status cards (`ok/degraded/skipped`, avg weight, contribution, obs count) |
| `stages[5]` | `tree.stages` + `fusion.stageConfidence` | Timeline rows (stage score, top dims, dominant engine, transition magnitude) |
| `death` | `fusion.deathWindow` | Lifespan panel |
| `explanationTrace` | `fusion.explanationTrace` | Audit trail |
| `warnings` | `engineResults[*].output.warnings` + failures | Warning Center |

## Determinism

- No `Math.random` / `Date.now`.
- All sorts have stable tie-breakers (`ALL_ENGINES` / `ALL_FATE_DIMENSIONS` index).
- `quantumSignature` = `HPU·` + FNV-1a(seedMaterial), 8 hex chars.

## Failure mode

`report.ok === false` ⇒ returns a zeroed `ProjectionView` with
`ok: false`, `reason`, and validation issues mirrored into `warnings`.
UI components must check `view.ok` and either render the input error or
the full dashboard.

## Usage

```ts
import { runPipeline, projectReport } from "@/hpulse";

const report = await runPipeline(rawInput, { event: "general" });
const view = projectReport(report);
// view → feeds DestinyDashboard / EngineStatusGrid and the result tabs in Index.tsx.
```

## Version

`PROJECTION_VERSION = "projection-1.0.0"`
