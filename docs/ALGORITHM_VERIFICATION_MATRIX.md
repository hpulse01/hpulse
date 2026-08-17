# Algorithm Verification Matrix

Last updated: 2026-08-17

This is the release source of truth for the thirteen engines. “Implemented” means code exists. “Verified” requires a cited rule, an independent golden case, boundary tests, and a reviewer-visible trace. No engine may be marked `complete` while `missingRules` is non-empty.

## Shared verification baseline

| Layer | Reference | Current evidence | Gate |
|---|---|---|---|
| Historical UTC offset | IANA Time Zone Database — https://www.iana.org/time-zones | DST gap, overlap, New York summer, and historical Shanghai tests | Passed in TypeScript; Rust/WASM CI pending |
| Julian date | USNO Julian Date Converter — https://aa.usno.navy.mil/data/JulianDate | Existing unit tests; independent corpus still small | Expand to boundary corpus |
| Gregorian/lunar conversion | Hong Kong Observatory — https://www.hko.gov.hk/en/gts/time/conversion.htm | Library-backed conversion exists | Add 1901–2100 sampled golden corpus |
| Planetary positions | Astronomy Engine — https://github.com/cosinekitty/astronomy | Library integration exists | Compare a fixed corpus against JPL Horizons |
| Input calendar | HPU-2 contract | Gregorian supported | Lunar input is rejected until explicit conversion ships |
| Required deterministic context | HPU-2 / legacy bridge | Query timestamp and IANA timezone are mandatory; fixed offset alone is rejected | Passed in TypeScript; Rust/WASM CI pending |
| Optional name spelling | Explicit user input only | NFKC + whitespace normalization; passed to Numerology/Kabbalah; blank skips name rules | Add multilingual fixture corpus; never infer account display name |
| Runtime normalizer artifact | Rust/WASM + deterministic TypeScript fallback | Placeholder binary removed; CI installs a generated WASM and verifies its magic bytes | Commercial build must pass `verify:runtime-assets`; fallback is development-only |

## Per-engine matrix

| Engine | Enforced status | Confirmed implemented trunk | Known gap / suspected risk | Next golden-case gate |
|---|---|---|---|---|
| 八字 Bazi | `partial` / C | 四柱、十神、藏干、大运、流年、强弱、基础合冲 | 盲派、神煞全表；日界/出生地规则需流派定版；强弱缺独立大样本 | 《子平真诠》版本化规则表 + 节气边界/日界 corpus |
| 铁板 Tieban | `needs_source_validation` / C | 项目自定义 base、刻分、六亲校时、条文查找 | 核心公式与条文库未获可靠版本交叉验证 | 先取得可授权的底本和条文编号映射；此前不得公开原始结论 |
| 紫微 Ziwei | `partial` / C | 命身宫、十二宫、五行局、十四主星、四化、大限/流年 | 南北派差异与闰月规则需定版；星表缺独立对盘 | 固定流派 + 100 例宫位/安星黄金盘 |
| 六爻 Liuyao | `partial` / C | 本变卦、动爻、世应、纳甲、六亲六神、日月建 | 时间起卦与京房纳甲混用需明确；卦身/星煞未实现 | 《增删卜易》《卜筮正宗》规则 ID + 64 卦装卦 corpus |
| 梅花 Meihua | `partial` / B | 农历年月日时/数字起卦、本互变、体用五行 | 外应、声音/字数法缺失；当地 00:00 日界与闰月同月序为产品固定口径 | 《梅花易数》逐条映射 + 8×8 卦及动爻性质测试 |
| 奇门 Qimen | `partial` / C | 时家转盘基础、局数、九宫、奇仪星门神、部分格局 | 飞盘、拐干、九遁与门派变体缺失 | 固定转盘流派 + 阴阳遁/换局边界黄金盘 |
| 大六壬 Liuren | `partial` / C | 月将、天地盘、四课、九宗门三传、基础课体 | 年命、毕法赋、课体全谱缺失 | 《大六壬指南》逐课比对 + 九宗门分支覆盖 |
| 太乙 Taiyi | `partial` / C | 积年、局、太乙/计神/十六神、主客算 | 阳九百六、三纪五元、游法、月日时计缺失 | 《太乙金镜式经》规则表 + 局数/宫位周期 corpus |
| Western | `partial` / B | 行星黄经、上升/天顶、Whole Sign/Placidus、主要相位 | 宫制算法与高纬回退需外部数值验证；解释层未验证 | JPL Horizons 行星 corpus + 公开房宫黄金盘 |
| Vedic | `partial` / C | Lahiri 恒星黄道、Rashi、Nakshatra、Vimshottari、D9 | ayanamsa 精度、节点口径、D10/Shadbala/Yoga 缺失 | 指定 Lahiri 版本 + Swiss Ephemeris/JHora 交叉 corpus |
| Numerology | `partial` / B | Pythagorean/Chaldean、主数、核心姓名数、业债、成熟数；显式姓名输入已贯通 | Pinnacles/Challenges 缺失；仅拉丁 A–Z 的产品口径与变音符转写仍待来源定版 | 规则表全组合测试 + Unicode/变音符输入 corpus |
| Mayan | `partial` / B | GMT 584283、Tzolkin、Haab、Long Count、Calendar Round、夜神 | 819 日与金星周期缺失；相关系选择必须显式 | 历元与已知铭文日期 corpus；替代相关系差异测试 |
| Kabbalah | `partial` / C | Mispar Hechrachi/Katan/Siduri、生命树映射；显式姓名输入已贯通 | Mispar Gadol 未实现；拉丁转写为项目 fallback；Tikkun/希伯来姓名规范不完整 | 希伯来原文字符 corpus + 各 Gematria 制式表 |

## Promotion rule

An engine can move to `complete` only when all conditions are true:

1. Every implemented rule has a stable rule ID and edition/page or authoritative technical reference.
2. `missingRules` is empty for the declared school and product scope.
3. Independent golden cases cover normal, boundary, invalid, and ambiguous inputs.
4. The engine produces no uncited synthetic “death/lifespan” event.
5. Confidence is calibrated against recorded outcomes; deterministic output alone is not evidence of predictive accuracy.
6. A pull request includes the source diff, golden fixtures, and regression tests.

## Fixes already landed in the current audit branch

- Replaced fixed timezone offsets with historical IANA resolution; DST gaps are rejected and overlaps require an explicit offset.
- Rejected lunar input instead of silently treating lunar components as Gregorian.
- Corrected Bazi current-DaYun luck scoring to use the current DaYun stem element, not the birth-year stem element.
- Added a registry policy that downgrades overclaimed status/grade and caps confidence before fusion.
- Changed Meihua from `complete` to `partial` because known declared rules remain missing.
- Stopped silently mapping unsupported gender values to `male`.
- Converted the swallowed 13-engine integration test into a hard failure with output/status assertions.
- Made P4 core output the sole authority for scores/provenance; failed cores now quarantine legacy heuristics to a neutral zero-confidence result.
- Removed runtime mortality/lifespan fusion and death-termination logic; scenario trees now end at a finite analysis boundary that is explicitly not a lifespan estimate.
- Added public Tieban clause redaction at both report and database-fetch boundaries, with regression tests proving raw high-risk text does not survive serialization.
- Added a fail-closed commercial-readiness audit to every unified result; it currently blocks release because the registry still contains partial/unverified engines and missing rules.
- Replaced Meihua's Gregorian year/month/day surrogate with lunar year branch/month/day plus local hour branch, including Lunar New Year boundary tests and a stable primary-text reference.
- Added an explicit optional calculation-name input and propagated it through both legacy and HPU contracts; name-derived rules now compute only from user-supplied spelling and no persisted trace stores the literal spelling.
- Made query time and IANA timezone mandatory in the legacy bridge, removed wall-clock timestamps from algorithm outputs, and added a byte-stability integration test for the entire result.
- Removed placeholder zodiac assets and the placeholder WASM binary. Development can use a reported deterministic TypeScript normalizer fallback; commercial CI must generate and verify a real Rust/WASM artifact.
- Corrected the Kabbalah registry: Mispar Gadol was previously claimed but not implemented, so it is now an explicit release blocker.
- Reclassified the historical “quantum” layer as a classical deterministic scenario-scoring analogy. Public copy now states that no quantum computing or scientific event-probability model is used.
