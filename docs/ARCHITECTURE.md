# Architecture

```
┌────────────────────┐     ┌─────────────────────────┐     ┌──────────────────────┐
│  React Frontend    │ →   │  Algorithm Core (P4)    │ →   │  Lovable Cloud       │
│  (src/pages/*,     │     │  src/core/*             │     │  (Supabase)          │
│   src/components/*)│     │  Pure deterministic     │     │  Postgres + Edge Fn  │
└────────────────────┘     └─────────────────────────┘     └──────────────────────┘
         │                            │                              │
         │                            ▼                              │
         │                 ┌─────────────────────────┐               │
         │                 │  src/utils/*Algorithm   │               │
         │                 │  Wrappers + adapters    │               │
         │                 └─────────────────────────┘               │
         │                            │                              │
         │                            ▼                              │
         │             ┌──────────────────────────────────┐          │
         └─────────────│  QuantumPredictionEngine.predict │──────────┘
                       │  PredictionOrchestrator.execute  │
                       └──────────────────────────────────┘
```

## Layers

### 1. Algorithm Core (`src/core/`)
Pure deterministic TypeScript. **No** React, **no** Supabase, **no** browser globals, **no** `Math.random`, **no** non-timing `Date.now()`.

Per engine: `types.ts`, `constants.ts`, main calculator, `toEngineOutput.ts`, `index.ts`, and `__tests__/`.

Shared infra in `src/core/shared/`:
- `algorithmSourceRegistry.ts` — single source of truth for every rule's provenance
- `implementationStatus.ts` — canonical status enum + caps
- `validation.ts` — EngineOutput structural validator
- `confidence.ts` — confidence ceilings per status / grade
- `explanation.ts` — explanationTrace quality checker
- `determinismGuard.ts` — runtime + scan helpers
- `auditEngineOutput.ts` — composite audit facade
- `implementationAudit.ts` — multi-engine audit report

### 2. Wrapper Utils (`src/utils/`)
Legacy `*Algorithm.ts` files now act as adapters that call into `src/core/`. They preserve the public surface used by older UI code.

### 3. Orchestration
- `quantumPredictionEngine.ts` — runs every active engine, applies dynamic 3D weighting (system × domain × life-stage), produces `UnifiedPredictionResult`.
- `predictionOrchestrator.ts` — wraps the engine for dashboard + super-admin snapshots.

### 4. Frontend (`src/pages/`, `src/components/`)
- Result page (`pages/Index.tsx`) hosts the tab system: Overview · Bazi · Engines · **Audit** · Tree · Path · Destiny · Quantum · Orchestration.
- `src/components/hpulse/` — shared design-system + audit primitives.
- `src/components/results/` — per-engine result panels.

### 5. Cloud (Lovable Cloud / Supabase)
- Postgres tables for: profiles, user roles, calibration ledger, AI usage, etc.
- RLS on every table; admin role gated by `has_role(uid, 'super_admin')`.
- Edge functions for AI interpretation, history sync, and feedback ingestion.

## Prediction Flow

1. **Birth Input** (`BirthDataForm`) → `StandardizedInput`
2. **Kao Ke verification** (`SixRelationsVerification`) → `systemOffset`
3. **Engine fan-out** — every active engine executes in isolation; failures are recorded, not swallowed.
4. **Audit overlay** — each `EngineOutput` is annotated with `sourceGrade`, `implementationStatus`, capped confidence.
5. **FateVector fusion** — confidence-weighted average across the 10 dimensions.
6. **Tree generation + unique path collapse** — recursive destiny tree pruned to the most coherent terminal path.
7. **UI render** — Overview / Audit / per-engine tabs; everything is collapsible on mobile.

## EngineOutput Contract
See [`ENGINE_OUTPUT_SCHEMA.md`](./ENGINE_OUTPUT_SCHEMA.md).
