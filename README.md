# H-Pulse Mobile — Free Beta

> A deterministic, auditable implementation of thirteen traditional-rule systems for cultural research, entertainment, and self-reflection.

H-Pulse rules are not scientifically validated and must not be presented as factual forecasts or professional advice. The repository is undergoing a source-by-source algorithm audit before commercial release; a working screen or passing unit test does not mean an engine is historically or independently validated.

---

## Positioning

- **Mission**: implement declared traditional rules transparently and make every limitation visible.
- **Method**: 13 independent algorithm cores → standardized `EngineOutput` → confidence-weighted fusion → `FateVector` → recursive destiny tree → unique-path collapse.
- **Promise**: no `Math.random` in any prediction. No `Date.now()` baked into output. Every step has an `explanationTrace`.

H-Pulse never claims absolute foreknowledge. The system is calibrated **continuously** against ledger-stored predictions and user-reported outcomes (P6 onwards).

## Tech Stack

- **Frontend**: React 18 · Vite · TypeScript · TailwindCSS · shadcn/ui · Recharts · Framer Motion
- **Algorithm Core**: pure deterministic TypeScript modules in `src/core/`
- **Astronomy**: `astronomy-engine`, with independent golden-case verification still required
- **Backend**: Supabase (Auth, Postgres, Edge Functions)
- **Native delivery**: Capacitor projects for iOS and Android

## Local Development

```bash
npm ci
npm run dev
npm run check
npm run native:sync
```

## Current Functional Surface

- ✅ Disclaimer-gated entry
- ✅ Birth-data + geo + IANA timezone capture
- ✅ Kao Ke (六亲校时) temporal-lock verification
- ✅ Deterministic orchestration across 13 declared engines
- ⚠️ Destiny tree and terminal-path models are restricted to super-admin audit while their source validation is incomplete
- ✅ P5 audit UI (algorithm integrity, engine matrix, explanation trace, warnings, fate vector)
- ✅ Super-admin orchestration console

## Audited Algorithm Status

| Tier | Engines |
|---|---|
| **complete** | none yet |
| **partial** | bazi, ziwei, liuyao, meihua, qimen, liuren, taiyi, western, vedic, numerology, mayan, kabbalah |
| **needs_source_validation** | tieban |

The runtime registry now enforces these statuses and caps confidence before fusion. See [`docs/ALGORITHM_VERIFICATION_MATRIX.md`](docs/ALGORITHM_VERIFICATION_MATRIX.md) for the per-engine evidence and release gates.

## Phase Roadmap

- **P3** — UI shell, design language, Lovable Cloud integration ✅
- **P4** — deterministic core scaffold and tests ✅; source validation remains open
- **P5** — frontend sync and responsive overhaul ✅
- **P6** — Prediction Verification Ledger
- **P7** — Rule knowledge base expansion
- **P8** — User long-term feedback calibration
- **P9** — iOS/Android native foundation and CI 🚧
- **P10** — privacy, account deletion, store readiness, and controlled free beta 🚧

See [`docs/ROADMAP.md`](docs/ROADMAP.md) for details.

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — system architecture
- [`docs/ALGORITHM_STATUS.md`](docs/ALGORITHM_STATUS.md) — per-engine implementation status
- [`docs/ALGORITHM_VERIFICATION_MATRIX.md`](docs/ALGORITHM_VERIFICATION_MATRIX.md) — source/golden-case audit matrix
- [`docs/COMMERCIAL_BETA_READINESS.md`](docs/COMMERCIAL_BETA_READINESS.md) — release gates and current blockers
- [`docs/UI_SYSTEM.md`](docs/UI_SYSTEM.md) — Digital Temple design system
- [`docs/P4_ALGORITHM_CORE.md`](docs/P4_ALGORITHM_CORE.md) — P4 algorithm core spec
- [`docs/P5_FRONTEND_SYNC.md`](docs/P5_FRONTEND_SYNC.md) — P5 frontend sync changelog
- [`docs/RESPONSIVE_DESIGN.md`](docs/RESPONSIVE_DESIGN.md) — desktop / tablet / mobile layout
- [`docs/ENGINE_OUTPUT_SCHEMA.md`](docs/ENGINE_OUTPUT_SCHEMA.md) — `EngineOutput` field contract
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — phased roadmap

## P5.1 (2026-05) — 铁板/紫微 UI 接入
- 新增 17 个 panel 组件,完整暴露铁板的 baseNumber / theoreticalBase / quarterKe / systemOffset / clauseLookup / 六亲校时 / 9 大报告分区
- 紫微展示十二宫、四化、大限、流年、格局、命格强度、星曜矩阵
- 复用 P5 共享审计组件,无重复造轮子
- 文档总数:README + 8 个 docs 文档(共 9 个 Markdown 文件)

## P5.2 + P5.3 (2026-05) — 剩余 10 引擎 UI 接入
- P5.2: 六爻 / 梅花 / 奇门 完整 panel + 子组件
- P5.3: 六壬 / 太乙 / 西方占星 / 吠陀 / 数字命理 / 玛雅 / 卡巴拉 完整 panel
- 新增共享 `EnginePanelShell` 减少重复 (header / warnings / audit / KV)
- 13 引擎全部接入结果页 Tab (移动端横向滚动,桌面端可换行)
- 缺姓名 / 缺希伯来 / 缺 Lagna / 缺 Long Count / 缺月将 → 显式降级,不伪造
- 详见 [`docs/P5_3_FRONTEND_SYNC.md`](docs/P5_3_FRONTEND_SYNC.md)

---

## P5-FIX (UI Display Fix)

Fixes a class of "engine ran but UI was blank" issues without modifying any
algorithm code or Supabase configuration:

- `EngineOutput.normalizedOutput` widened from `Record<string,string>` to
  `Record<string,unknown>` so engines can pass structured data
  (`palaces[]`, `sihua[]`, `daxian[]`, `liunian[]`, `patterns[]`,
  `strengthAnalysis`, `clauseLookups`, ...) directly to the UI without
  lossy stringify.
- `mergeCoreOverlay` now merges BOTH `legacy.normalizedOutput` AND
  `core.normalizedOutput` (preserving each under
  `legacyNormalizedOutput` / `coreNormalizedOutput`) so panels can read
  canonical P4 keys (`yearGZ`, `dayMaster`, `palaces`, ...) AND legacy
  Chinese keys (`日主`, `四柱`, `格局`, ...).
- `BaziCorePanel` now reads both P4 canonical keys and legacy 中文 keys,
  parses `四柱` into individual pillars, and uses `formatPercent` /
  `formatScore` helpers for confidence/completeness display.
- `ZiweiCorePanel` now reads structured `palaces[]`, `sihua[]`, `daxian[]`,
  `liunian[]`, `patterns[]`, `strengthAnalysis` from `normalizedOutput`,
  with graceful fallback to `aspectScores`.
- New `GenericEnginePanel` renders any `EngineOutput` (header, fateVector,
  normalizedOutput keys, timeWindows, eventCandidates, warnings,
  uncertaintyNotes, explanationTrace) as a safe fallback.
- New `QuantumCollapsePanel` + `quantumCollapse` result tab surface the
  existing legacy / event-driven destiny tree and collapse summary, with
  an explicit warning that the deterministic P6 Quantum Collapse Core is
  not yet wired.
- New `src/utils/displayFormat.ts` (`formatPercent`, `formatScore`,
  `normalizePercent`, `asText`) unifies display of confidence values
  whether engines report on a `0..1` or `0..100` scale.

No core algorithm files were rewritten; no Supabase migrations were issued.
