# Roadmap

## Completed

### P1 — Foundation
Initial scaffold, design language, brand identity (Digital Temple).

### P2 — Lovable Cloud Integration
Auth, profiles, RLS, super-admin role gating, AI gateway wiring, prediction history persistence.

### P3 — UI Refactor
Quantum prediction console layout, holographic panel system, multi-engine result tabs, disclaimer flow, responsive header.

### P4 — Algorithm Core (12 sub-phases)
- P4.1 astro-time + calendar primitives
- P4.2 Bazi
- P4.3 Tieban
- P4.4 Ziwei
- P4.5 Liu Yao
- P4.6 Meihua
- P4.7 Qimen
- P4.8 Liuren + Taiyi
- P4.9 Western + Vedic
- P4.10 Numerology + Mayan + Kabbalah
- P4.11 Orchestrator overlay
- P4.12 Determinism guard + audit + P5 readiness gate

13 deterministic engines. 0 `Math.random`. 0 non-timing `Date.now()`. Every output capped per implementation status.

### P5 — Frontend Sync (this release)
- 10 new shared audit components in `src/components/hpulse/`
- New **Audit** result tab composing AlgorithmIntegrity + FateVector + EngineAuditMatrix + WarningCenter + ExplanationTraceViewer
- New **Bazi** result tab driven by `engineOutputs.find(e => e.engineName === 'bazi')`
- 8 markdown docs (this set)
- Desktop / tablet / mobile responsive overhaul; tabs scroll on every viewport

## Upcoming

### P6 — Prediction Verification Ledger
- Persist every `EngineOutput` with its `cappedConfidence`, `implementationStatus`, `sourceGrade`, `warnings`, full trace.
- Capture user-reported actuals (event date, magnitude, polarity) — the absolute source of truth.
- Score each engine over time: precision, recall, calibration. Per-engine, per-domain, per-life-stage.
- Block ledger writes when `auditEngineOutputs(...).blockers.length > 0`.
- `tieban` cannot enter the death-fusion vote weight until it leaves `needs_source_validation`.

### P7 — Rule Knowledge Base Expansion
- Migrate every `partial` engine toward `complete` by filling in missing rules: 调候用神, 化气格, 博士十二神, 反吟伏吟评分, Antardasha, Haab, Calendar Round, etc.
- Per-rule citation in `algorithmSourceRegistry.ts`.

### P8 — User Long-term Feedback Calibration
- Bayesian update of per-engine, per-domain weights based on ledger outcomes.
- User-private vs. global calibration channels.
- Drift detection.

### P9 — Multi-platform Delivery
- Mobile PWA polish; tablet split-pane.
- Native shell (Capacitor or Tauri) wrapping.
- Offline-first ledger draft.

### P10 — Commercialization & Permissions
- Membership tiers + AI credit accounting (already partly scaffolded).
- Per-feature gating via roles.
- Audit export for premium tiers.
- Affiliate / API access for B2B integrations.

## Non-Goals
- We will **not** add gambling, lottery prediction, illegal-content advice, self-harm encouragement, or directed harm to others.
- We will **not** present partial engines as complete to inflate perceived accuracy.
- We will **not** replace the deterministic core with LLM hallucination. AI is interpretation only.
