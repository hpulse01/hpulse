# P5.3 — Frontend Sync: Remaining 7 Engines

Status: complete · 2026-05-14

## Engines Now Surfaced
P5.3 wires the final 7 engines into the result UI:

1. 大六壬 (`liuren`) — 月将 / 占时 / 天地盘 / 四课 / 三传 / 十二天将 / 用神 / 吉凶
2. 太乙神数 (`taiyi`) — 积年 / 局数 / 太乙宫 / 文昌·始击·大游·太岁·合击 / 主客 / 风险与机遇
3. 西方占星 (`western`) — Sun/Moon/...Pluto 黄经度数 / 星座 / 宫位 / 相位矩阵 / 房屋系统
4. 吠陀占星 (`vedic`) — Lahiri ayanamsa / Rashi / Lagna / Nakshatra+pada / Vimshottari Dasha
5. 数字命理 (`numerology`) — Life Path / Birthday / Personal Year + 姓名衍生数字（缺姓名时降级）
6. 玛雅历 (`mayan`) — Tzolkin daySign / Galactic Tone / Long Count
7. 卡巴拉 (`kabbalah`) — Gematria / Tree of Life / Sephirot（缺姓名或希伯来输入时降级）

## Shared Infrastructure
- `src/components/results/_shared/EnginePanelShell.tsx` — `EnginePanelHeader`, `EngineMissingNotice`, `EngineWarningStrip`, `EngineAuditTrace`, `KVRow`. Every new panel reuses the same audit footer and badge composition (`SourceGradeBadge`, `ImplementationStatusBadge`, `ExplanationTraceViewer`).
- New tab strip in `Index.tsx` is horizontally scrollable on mobile and wraps on desktop, supporting all 13 engines without overflow.

## Field Mapping (per engine `normalizedOutput` JSON keys)
| Engine | Key keys |
| --- | --- |
| liuren | `yueJiang`, `zhanShi`, `fourLessons`, `threeTransmissions`, `twelveGenerals`, `yongShen`, `verdict` |
| taiyi | `taiyiAccumulatedYears`, `juNumber`, `yangYin`, `taiyiPalace`, `wenChang`, `shiJi`, `daYou`, `taiSui`, `heJi`, `host`, `guest`, `riskFlags`, `opportunityFlags` |
| western | `planets[]`, `houses[]`, `aspects[]`, `houseSystem`, `ascendant`, `sunSign`, `moonSign`, `themes` |
| vedic | `ayanamsa`, `ayanamsaValue`, `zodiacSystem`, `lagna`, `rashi`, `moonRashi`, `nakshatra`, `nakshatraPada`, `nakshatraLord`, `vimshottariDasha[]` |
| numerology | `lifePath`, `birthdayNumber`, `personalYear`, `destiny`, `soulUrge`, `personality` |
| mayan | `daySign`, `dayGlyph`, `kin`, `galacticTone`, `toneName`, `longCount`, `baktun`, `katun`, `tun`, `uinal` |
| kabbalah | `gematria`, `gematriaMethod`, `nameLetters[]`, `sephirot[]`, `activePath`, `hebrewInput` |

## Degradation Rules (no fabrication)
- **Numerology**: missing name → name-derived numbers render as `—` with explicit "missing input" badge via `NumerologyMissingInputPanel`.
- **Kabbalah**: missing name and/or Hebrew input → `KabbalahMissingInputPanel` lists which inputs are absent; gematria suppressed when name absent.
- **Vedic**: missing Lagna → `RashiPanel` shows ⚠ "Lagna missing — house inference incomplete".
- **Western**: `houseSystem` defaults to "Whole Sign"; if the engine emits `Placidus` warnings they surface via `EngineWarningStrip`.
- **Mayan**: missing Long Count → `LongCountPanel` shows ⚠ instead of zeros.
- **Liu Ren**: missing 月将 → ⚠ in heaven/earth plate; transmissions/generals fall back to canonical placeholder list with empty values.

## Responsive Strategy
- Desktop (`lg+`): two-column composition per engine; tables for planets/houses; full audit footer below.
- Tablet/Mobile (`<lg`): every section becomes a `MobileSectionAccordion`; tables collapse into stacked cards (`md:hidden`); tab strip is horizontally scrollable.
- All audit metadata (status / grade / confidence / completeness / computationMs) lives in the unified `EnginePanelHeader` and never overflows.

## Compatibility
- Panels accept `engineOutput?: EngineOutput | null` and render `EngineMissingNotice` when absent.
- All sub-components defensively handle missing arrays / undefined fields and never throw.
- No core algorithm or Supabase migration touched.

## Next Step
P6 — Prediction Verification Ledger: persist every `EngineOutput` snapshot + user-reported outcomes for Bayesian calibration of weights and source grades.
