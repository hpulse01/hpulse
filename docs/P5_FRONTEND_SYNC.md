# P5 — Frontend Sync

This phase syncs the React UI with the new `EngineOutput` metadata produced by P4. **No algorithm changes.** No Supabase changes. No prediction-flow changes.

## Goals
- Surface every audit field (`sourceGrade`, `implementationStatus`, `confidence`, `completenessScore`, `warnings`, `uncertaintyNotes`, `validationFlags`, `explanationTrace`, `timingBasis`, `computationTimeMs`, `fateVector`, `timeWindows`, `aspectScores`, `eventCandidates`) in the UI.
- Restructure the result page so the audit story is first-class, not buried.
- Adapt to desktop ≥ 1280, tablet 768–1279, mobile < 768.

## New Shared Components — `src/components/hpulse/`

| Component | Purpose |
|---|---|
| `SourceGradeBadge` | A/B/C/D pill (jade / gold / amber / red) |
| `ImplementationStatusBadge` | complete / partial / needs_source_validation / failed pill |
| `AuditMetricCard` | tone-variant labelled stat tile |
| `AlgorithmIntegrityPanel` | top-level audit dashboard (counts, avg conf, avg compl, total warnings) |
| `EngineAuditMatrix` | desktop table + mobile card list of every engine |
| `ExplanationTraceViewer` | folded terminal-style trace per engine, with copy |
| `WarningCenter` | never-hidden warnings, uncertainty notes, failed flags |
| `FateVectorDashboard` | confidence-weighted fused 10-dim semantic bars |
| `MobileSectionAccordion` | mobile-friendly collapsible section |
| `ResponsiveResultTabs` | horizontally-scrollable tab strip wrapper |

## New Engine Result Components

- `src/components/results/audit/AuditTracePanel.tsx` — composite for the new **Audit** tab
- `src/components/results/bazi/BaziCorePanel.tsx` — four-pillars + day master + pattern + Da Yun timeline driven by `engineOutputs.find(e => e.engineName === 'bazi')`

## Mapping — Algorithm Field → UI

| Field | Surfaced in |
|---|---|
| `engineName / engineNameCN / engineVersion` | EngineAuditMatrix, BaziCorePanel header |
| `sourceGrade` | SourceGradeBadge in matrix + bazi panel |
| `implementationStatus` | ImplementationStatusBadge in matrix + bazi panel |
| `confidence` | AuditMetricCard (avg) + matrix row + bazi header |
| `completenessScore` | AuditMetricCard (avg) + matrix row + bazi header |
| `warnings` | AlgorithmIntegrityPanel total + WarningCenter list + matrix count |
| `uncertaintyNotes` | WarningCenter |
| `validationFlags.failed` | WarningCenter (destructive tone) |
| `explanationTrace` | ExplanationTraceViewer (folded, copyable) |
| `timingBasis` | EngineAuditMatrix per row |
| `computationTimeMs` | EngineAuditMatrix per row |
| `fateVector` | FateVectorDashboard (fused) |
| `timeWindows` | BaziCorePanel Da Yun timeline (horizontal scroll → vertical on mobile) |
| `normalizedOutput.*` | BaziCorePanel pillar grid + day master cells |

## Result Page Tabs

`Overview · Bazi · Engines · Audit · Tree · Path · Destiny · Quantum · Orchestration(super)`

Tabs are horizontally scrollable on every viewport. The new **Audit** tab renders `AuditTracePanel`, which composes `AlgorithmIntegrityPanel + FateVectorDashboard + EngineAuditMatrix + WarningCenter + ExplanationTraceViewer`.

## Responsive Strategy

- **Desktop ≥ 1280** — `EngineAuditMatrix` shows the full 8-column table; integrity panel uses `xl:grid-cols-8`.
- **Tablet 768–1279** — table still visible but horizontally scrollable; integrity panel collapses to `lg:grid-cols-4`.
- **Mobile < 768** — table swaps for a card list (`md:hidden`); integrity panel uses `sm:grid-cols-3`; trace viewer keeps one engine open at a time, with each step max-height scrollable.

See [`RESPONSIVE_DESIGN.md`](./RESPONSIVE_DESIGN.md).

## Resilience

Every component degrades gracefully: missing `engineOutputs`, empty trace, empty warnings, missing fate vector — each renders an explicit fallback string ("该引擎尚未接入 P4 Core" / "暂无解释链" / etc.). Never a white screen.

## TODO (next iteration)

- Tieban panel (`TiebanCorePanel` + `ClauseLookupPanel` + `FamilyVerificationTrace`)
- Ziwei panel (`ZiweiPalaceChart` + `ZiweiSihuaPanel` + `ZiweiDaxianTimeline`)
- Input page advanced settings: `dayBoundaryPolicy`, `useTrueSolarTime`, `targetYear`, `questionText`
- Loading stages reflecting actual orchestration phases
- Admin orchestration console: show implementationStatus matrix, missingRules, fallback usage count
