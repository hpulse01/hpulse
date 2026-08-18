# Roadmap

## Completed

### P1 — Foundation
Initial scaffold, design language, brand identity (Digital Temple).

### P2 — Lovable Cloud Integration
Auth, profiles, RLS, super-admin role gating, AI gateway wiring, prediction history persistence.

### P3 — UI Refactor
Quantum prediction console layout, holographic panel system, multi-engine result tabs, disclaimer flow, responsive header.

### P4 — Algorithm Core Scaffold (12 sub-phases)
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

13 deterministic engine implementations. Determinism and structural tests pass, but source and golden-case validation remains open; this phase must not be described as algorithm completion.

### P5 — Frontend Sync
- 10 new shared audit components in `src/components/hpulse/`
- New **Audit** result tab composing AlgorithmIntegrity + FateVector + EngineAuditMatrix + WarningCenter + ExplanationTraceViewer
- New **Bazi** result tab driven by `engineOutputs.find(e => e.engineName === 'bazi')`
- 8 markdown docs (this set)
- Desktop / tablet / mobile responsive overhaul; tabs scroll on every viewport

### P6 — Prediction Verification Ledger (this release)
- Every unified prediction run is archived to `prediction_runs` (RLS owner-private): per-engine `cappedConfidence`, `implementationStatus`, `sourceGrade`, `warnings`, full trace, fused fate vector.
- User-reported actuals (event date, domain, magnitude, polarity) stored in `prediction_actuals` — the absolute source of truth.
- Deterministic scoring in `src/utils/ledgerScoring.ts`: per-engine, per-domain claims/hits, hit rate, average capped confidence, calibration gap — surfaced on the Prediction Ledger page.
- Ledger writes are blocked when `auditEngineOutputs(...).blockers.length > 0`.
- `EngineOutput.confidence` is now normalized to the canonical 0-1 scale at every adapter boundary (`normalizeConfidence01`).
- `tieban` remains low-quality/degraded in evidence fusion until it leaves `needs_source_validation` and gains an authoritative core adapter.

## Upcoming

### P7 — Rule Knowledge Base and Golden-Case Validation
- Version every rule by school, edition, page/reference, and rule ID.
- Fill the declared gaps for all 13 engines and add independent golden corpora.
- Keep every engine partial until its `missingRules` list is empty and reviewed.

### P8 — User Long-term Feedback Calibration
- Bayesian update of per-engine, per-domain weights based on ledger outcomes.
- User-private vs. global calibration channels.
- Drift detection.

### P9 — Multi-platform Delivery (in progress)
- Capacitor iOS and Android projects are present; CI and physical-device QA remain.
- Native signing, store metadata, accessibility, and beta distribution remain release gates.

### P10 — Free Commercial Beta Readiness (in progress)
- Privacy/terms/account deletion foundation implemented; staging deployment and end-to-end proof remain.
- No paid membership, affiliate, or B2B billing will be enabled during the free beta.
- Security, operations, legal review, and store declarations remain release gates.

## Non-Goals
- We will **not** add gambling, lottery prediction, illegal-content advice, self-harm encouragement, or directed harm to others.
- We will **not** present partial engines as complete to inflate perceived accuracy.
- We will **not** replace the deterministic core with LLM hallucination. AI is interpretation only.
