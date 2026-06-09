# Responsive Design

## Breakpoints (Tailwind defaults)

| Name | Min width | Target |
|---|---|---|
| sm | 640px | small phone landscape / phablet |
| md | 768px | tablet portrait |
| lg | 1024px | tablet landscape / small laptop |
| xl | 1280px | desktop |
| 2xl | 1536px | wide desktop |

## Desktop ≥ 1280px
- 12-column grids; `AuditTracePanel` uses `lg:grid-cols-2` for matrix + warnings.
- `EngineAuditMatrix` renders the full 8-column table.
- `AlgorithmIntegrityPanel` uses `xl:grid-cols-8` for the 8 metric cards in one row.
- Result tabs render in a single row with all icons visible.
- Max content width capped at `max-w-7xl` to prevent ultra-wide stretching.

## Tablet 768–1279px
- `lg:grid-cols-4` on integrity panel; metrics wrap onto two rows.
- Engine matrix table still rendered (`md:block`) but horizontally scrollable.
- Result tabs scroll horizontally.
- Bazi pillar grid uses `sm:grid-cols-4` (still 4 across).

## Mobile < 768px
- All sections single column.
- `EngineAuditMatrix` swaps to card list (`md:hidden`); each engine becomes a card with status / grade pills + 4-column metric strip.
- `ExplanationTraceViewer`: only one engine open at a time; trace itself is `max-h-80 overflow-y-auto` to keep the page short.
- `MobileSectionAccordion` wraps long groups (used by future Tieban/Ziwei panels).
- Bazi pillar grid uses `grid-cols-2`; Da Yun timeline still scrolls horizontally with snap.
- Tabs strip uses `overflow-x-auto`; tabs sized for thumb taps (`py-2 px-3`).
- No horizontal page overflow — every row uses `min-w-0` + `truncate` where needed.

## Component-Specific Rules

### Tabs
The result tab strip (in `src/pages/Index.tsx`) is wrapped in `overflow-x-auto` and sets `whitespace-nowrap` on each trigger.

### Cards
Audit metric cards never exceed `text-lg` for the value to keep wrap short; hint text uses `truncate` with a `title` attribute for full content on hover.

### Timelines
- Bazi Da Yun horizontal scroll on every viewport with `overflow-x-auto` and `min-w-[110px]` per cell.
- Future engine timelines should follow the same pattern; on mobile they are kept horizontal (snap), not vertical, to preserve density.

### Trace Viewer
Mobile renders one trace at a time with internal `max-h-80 overflow-y-auto`. Copy button is right-aligned and full-tap-target.

## What We Test
- iPhone SE (375 × 667), iPhone 14 (390 × 844)
- Pixel 7 (412 × 915)
- iPad portrait (768 × 1024) and landscape (1024 × 1366)
- 1440 desktop and 1920 wide

No horizontal overflow on any of the above.
