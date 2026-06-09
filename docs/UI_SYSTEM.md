# UI System — Digital Temple

H-Pulse is presented as a **Quantum Prediction Console**, not a SaaS dashboard and not an entertainment astrology site. The UI system is called **Digital Temple**: deep-space + antique-gold, classical Chinese serif paired with terminal-style monospace.

## Design Principles

1. **Audit-first**: every prediction surfaces sourceGrade, implementationStatus, confidence, warnings, and an explanation trace.
2. **No fake completeness**: partial engines are visually distinct from complete ones. Fallback clauses must never look like exact matches.
3. **Restraint**: animation is sparing; no neon flicker; no high-frequency motion. On mobile, animation is reduced further.
4. **Information density on desktop, progressive disclosure on mobile**: long traces and tables collapse by default on small viewports.

## Color Tokens (semantic — see `src/index.css` and `tailwind.config.ts`)

| Role | Token / hue (HSL) | Usage |
|---|---|---|
| background | deep navy-black 225 20% 7% | base |
| primary | antique gold 40 65% 55% | brand, CTAs, key data |
| accent | quantum blue 210 60% 60% | secondary signals |
| success / `complete` | jade 150 60% 55% | rule complete |
| warning / `partial` | amber 38 90% 60% | partial implementation |
| info / `needs_source_validation` | gold-purple 270 50% 65% | audit-pending |
| destructive / `failed` | dim blood-red 0 65% 50% | failures, sensitive areas |
| muted | low-sat slate | borders, hints |

Never use raw color classes (`text-white`, `bg-black`). Use semantic tokens.

## Typography

- **Headings**: Noto Serif SC + Inter — wide tracking (`tracking-[0.22em]` to `0.32em`)
- **Body**: Inter
- **IDs / signatures / traces / numeric metrics**: monospace
- **Explanation trace**: terminal-like, line-numbered

## Component Patterns

- **HolographicPanel** — base glass container with antique-gold border + low-opacity halo
- **MetricCard / AuditMetricCard** — labelled stat tiles with tone variants
- **SourceGradeBadge** — A/B/C/D pill (jade / gold / amber / red)
- **ImplementationStatusBadge** — complete / partial / needs_source_validation / failed pill
- **AlgorithmIntegrityPanel** — top-level audit summary
- **EngineAuditMatrix** — desktop table / mobile card list
- **ExplanationTraceViewer** — folded per-engine terminal log with copy
- **WarningCenter** — never-hidden warnings and uncertainty notes
- **FateVectorDashboard** — confidence-weighted fused 10-dim view

## Result Page Structure

Public tabs: `Overview` · `Engines` · `Tree` · `Path` · `Destiny` · `Quantum` · `QuantumCollapse`.
Super-admin tabs: the 13 per-engine algorithm panels (data-driven map in `Index.tsx`), **`Audit`**, and `Orchestration`.

Tabs are horizontally scrollable on every viewport.

## Frontend Hygiene

- The app flow is single-purpose: `input → calculating → verification (六亲校时) → projecting → result` (`AppStep` in `src/pages/Index.tsx`).
- Legacy/unreferenced result components (e.g. `UnifiedResultsPanel`, `ResponsiveResultTabs`, `QuantumField`, `KaoKeVerification`) have been removed; the result page is composed only from live components under `src/components/`.
- `npm run lint` must stay at **0 errors** (`@typescript-eslint/no-explicit-any` enforced — use real types from engine modules instead of `any`).

## Sensitive Content

Death, illness, disasters, relationship rupture, major loss are **not** removed. They are rendered with destructive tone, optional default collapse, and explicit "敏感预测" label. No threatening, illegal, self-harm, or other-harm advice is generated.

## Loading Stages

`calculating` and `projecting` show real algorithm phases (standardize input → calendar context → engine activation → orchestration → fate vector fusion → world tree → unique path).

See `RESPONSIVE_DESIGN.md` for breakpoints and per-viewport behaviours.
