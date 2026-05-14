# H-Pulse Quantum Prediction System

> A deterministic, audit-ready, multi-system destiny projection engine.
> Sometimes called the **Destiny Operating System**.

H-Pulse is **not** an entertainment astrology site. It is a serious life-trajectory engine that fuses 13+ classical and modern divination systems into a single, traceable, falsifiable prediction. Every output ships with its own audit trail.

---

## Positioning

- **Mission**: project a single human life trajectory as honestly as the math allows.
- **Method**: 13 independent algorithm cores → standardized `EngineOutput` → confidence-weighted fusion → `FateVector` → recursive destiny tree → unique-path collapse.
- **Promise**: no `Math.random` in any prediction. No `Date.now()` baked into output. Every step has an `explanationTrace`.

H-Pulse never claims absolute foreknowledge. The system is calibrated **continuously** against ledger-stored predictions and user-reported outcomes (P6 onwards).

## Tech Stack

- **Frontend**: React 18 · Vite · TypeScript · TailwindCSS · shadcn/ui · Recharts · Framer Motion
- **Algorithm Core**: pure deterministic TypeScript modules in `src/core/`
- **Astronomy**: `astronomy-engine` (DE405/DE421-grade ephemeris)
- **Backend**: Lovable Cloud (Supabase: Postgres + Edge Functions + Realtime)
- **AI Layer**: Lovable AI Gateway (Sonar / Gemini / GPT models — interpretation only, never algorithm)

## Local Development

```bash
bun install        # or npm install
bun run dev        # Vite dev server
bun run build      # production bundle
bunx vitest run    # core algorithm tests
```

## Current Functional Surface

- ✅ Disclaimer-gated entry
- ✅ Birth-data + geo + IANA timezone capture
- ✅ Kao Ke (六亲校时) temporal-lock verification
- ✅ Quantum prediction orchestration across 13 engines
- ✅ Destiny tree + unique path collapse
- ✅ P5 audit UI (algorithm integrity, engine matrix, explanation trace, warnings, fate vector)
- ✅ Super-admin orchestration console

## Algorithm Status (Phase P4 final)

| Tier | Engines |
|---|---|
| **complete** | meihua, numerology (with name) |
| **partial** | bazi, ziwei, liuyao, qimen, liuren, taiyi, western, vedic, mayan, kabbalah |
| **needs_source_validation** | tieban |

See [`docs/ALGORITHM_STATUS.md`](docs/ALGORITHM_STATUS.md) for the full per-engine grade, implemented rules, and missing rules.

## Phase Roadmap

- **P3** — UI shell, design language, Lovable Cloud integration ✅
- **P4** — `src/core/` deterministic algorithm reconstruction (P4.1 → P4.12) ✅
- **P5** — Frontend sync with P4 algorithm metadata + responsive overhaul ✅ *(this phase)*
- **P6** — Prediction Verification Ledger
- **P7** — Rule knowledge base expansion
- **P8** — User long-term feedback calibration
- **P9** — Multi-platform delivery
- **P10** — Commercialization & permission layer

See [`docs/ROADMAP.md`](docs/ROADMAP.md) for details.

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — system architecture
- [`docs/ALGORITHM_STATUS.md`](docs/ALGORITHM_STATUS.md) — per-engine implementation status
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
