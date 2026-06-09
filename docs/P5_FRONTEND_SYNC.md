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

## P5.1 — 铁板神数 + 紫微斗数 UI 接入

- 新增 7 个铁板组件:TiebanCorePanel / TiebanBaseTrace / ClauseLookupPanel / FamilyVerificationTrace / SystemOffsetPanel / TiebanDestinySections / TiebanAuditTrace
- 新增 10 个紫微组件:ZiweiCorePanel / ZiweiPalaceChart / ZiweiPalaceCard / ZiweiStarMatrix / ZiweiSihuaPanel / ZiweiDaxianTimeline / ZiweiLiunianPanel / ZiweiPatternPanel / ZiweiStrengthPanel / ZiweiAuditTrace
- 结果页新增 `tieban` / `ziwei` 选项卡
- 条文展示规则:exact = 玉色,fallback = 琥珀色,unavailable = 暗红;fallback 视觉上绝不冒充精确命中
- 紫微十二宫:桌面端 4×3 矩阵,移动端纵向卡片列表;命宫/身宫高亮
- 复用 SourceGradeBadge / ImplementationStatusBadge / ExplanationTraceViewer / WarningCenter / MobileSectionAccordion
- 文档总数:README + 8 个 docs 文档(共 9 个 Markdown 文件)
- 算法层与 Supabase 未改动
