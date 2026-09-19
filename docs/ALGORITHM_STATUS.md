# Algorithm Status — Audited Runtime Ceiling

Last updated: 2026-08-17.

This document records implemented code, not predictive validity. `algorithmSourceRegistry.ts` is the executable ceiling: local calculators that say `complete` for a limited sub-chart are downgraded before fusion whenever the engine-wide registry still lists missing rules. There are currently **no commercially complete engines**.

## Source Grade Legend
- **A** — classical rules complete, table-backed, fully tested
- **B** — main trunk complete, minor school-variation gaps surfaced as warnings
- **C** — simplified or partial implementation, capable of charting but incomplete
- **D** — placeholder or insufficient sources — must not be presented as real

## Implementation Status Legend
- `complete` — every declared rule implemented & tested
- `partial` — main rules implemented, minor rules acknowledged as missing
- `needs_source_validation` — formula is project-specific or unverified against authoritative sources
- `placeholder_removed` — engine has been retired

---

## Per-Engine Status

### 八字 Bazi
- **Status**: `partial` (alias `partial_rules`) · **Grade**: C · confidence cap **≤ 0.65**
- **Implemented**: 四柱 (立春切年/节气切月) · 十神 · 藏干 · 纳音 · 五行/阴阳平衡 · 十二长生 · 空亡 · 多因子日主强弱 · 用神候选 · 喜忌神 · 大运顺逆 · 起运年龄 · 当前大运 · 流年 · 合冲刑害基础 · 事业/财富/关系/健康/家庭分区 · 调候用神（穷通宝鉴全表） · 化气格 · 从格判断 · 流月细化
- **Missing**: 盲派技法 · 神煞全表
- **Tests**: `src/core/bazi/__tests__/calculateBaziChart.test.ts`

### 铁板神数 Tieban
- **Status**: `needs_source_validation` · **Grade**: C · confidence cap **≤ 0.45**
- **Implemented**: baseNumber · theoreticalBase · quarterKe · systemOffset · 六亲校时(用户事实优先) · 条文 exact/fallback 透明记录 · 七大报告分区
- **Missing**: 古籍完整公式校验 · 十三部条文齐备 · 增删神数交叉验证

### 紫微斗数 Ziwei
- **Status**: `partial` · **Grade**: C · cap **≤ 0.65**
- **Implemented**: 农历上下文 · 命/身/十二宫 · 五行局 · 紫微+天府定位 · 十四主星全部落宫 · 四化 · 辅星/煞星基础 · 三方四正 · 对宫 · 大限 · 流年 (`targetYear` 来自 input) · 博士十二神 · 星曜亮度全表 · 格局自动识别（含扩展格局）
- **Missing**: 南北派差异全谱

### 六爻 Liuyao
- **Status**: `partial` · **Grade**: C · cap **≤ 0.65**
- **Implemented**: 本/变卦 · 动爻 · 世应 · 纳甲 · 六亲 · 六神 · 日月建 · 旺衰 · 冲合刑害基础 · 空亡 · 时间起卦 · 手动起卦 · `castMethod` 记录 · 伏神/飞神 · 进退神 · 反吟伏吟评分 · 应期细化
- **Missing**: 卦身、星煞等派别扩展

### 梅花易数 Meihua
- **Status**: `partial` · **Grade**: B · cap **≤ 0.65**
- **Implemented**: 年月日时起卦 · 数字起卦 · 上下卦 · 动爻 · 本/互/变卦 · 体用关系 · 五行生克 · 吉凶趋势
- **Missing**: 外应 · 声音字数等高级起卦法

### 奇门遁甲 Qimen
- **Status**: `partial` · **Grade**: C · cap **≤ 0.65**
- **Implemented**: 阴/阳遁 · 局数 · 九宫 · 三奇六仪 · 九星 · 八门 · 八神 · 值符 · 值使 · 时家基础盘 · 用神宫 · 天盘干转宫 · 十干克应格局 · 三诈五假 · 击刑/入墓 · 三奇得门 · 伏吟反吟评分
- **Missing**: 飞盘法 · 拐干 · 九遁全部及门派变体格局

### 大六壬 Liuren
- **Status**: `partial` · **Grade**: C · cap **≤ 0.65**
- **Implemented**: 月将 · 占时 · 天/地盘 · 四课 · 十二天将 · 九宗门完整三传（贼克/比用/涉害/遥克/昴星/别责/八专/伏吟/反吟） · 课体识别（元首/重审/知一/蒿矢/弹射等）
- **Missing**: 毕法赋七百诀 · 年命 · 课体九十八种全谱细化

### 太乙神数 Taiyi
- **Status**: `partial` · **Grade**: C · cap **≤ 0.65**
- **Implemented**: 积年 · 局数 · 太乙宫 · 计神（寅首逆行） · 十六神 · 文昌 · 始击（计神临宫） · 主客算累计 · 大将/参将
- **Missing**: 阳九/百六/三纪五元 · 大游小游 · 月/日/时计完整

### 西方占星 Western
- **Status**: `partial` · **Grade**: B · cap **≤ 0.65**
- **Implemented**: astronomy-engine 真实行星位置 · 10 行星黄经/星座/度数 · Whole Sign · Placidus（高纬回退 Whole Sign） · 上升点 Asc · 五大相位+orbs
- **Missing**: Koch 宫制 · 小行星 · 现代心理层

### 吠陀占星 Vedic
- **Status**: `partial` · **Grade**: C · cap **≤ 0.65**
- **Implemented**: Lahiri ayanamsa (J2000 锚 23.85° + 50.2388475″/年) · sidereal · Rashi · Nakshatra+Pada · Vimshottari Mahadasha 完整 120 年 · Antardasha · Rahu/Ketu 真交点 · Navamsa D9
- **Missing**: D10 等其余分宫盘 · Shadbala · Yogas

### 数字命理 Numerology
- **Status**: `partial` · **Grade**: B · cap **≤ 0.65**
- **Implemented**: Pythagorean 字母→数字 · 主数 11/22/33 保留 · Life Path 分单元约简 · 姓名分段约简 · Y 位置分类 · Destiny / Soul Urge / Personality / Personal Year · Chaldean 体系 · Karmic Debt (13/14/16/19) · Maturity Number · Pinnacles · Challenges
- **Missing**: 变音符/非拉丁姓名转写规则与独立黄金样本回归

### 玛雅历 Mayan
- **Status**: `partial` · **Grade**: B · cap **≤ 0.65**
- **Implemented**: Tzolkin day sign + tone · Long Count (vigesimal, 1 tun = 18 uinal, JD 584283 = 4 Ahau) · Haab 365 日历 · Calendar Round 52 年 · 夜之主 G1-G9
- **Missing**: 819 日周期 · 金星周期表

### 卡巴拉 Kabbalah
- **Status**: `partial` · **Grade**: C · cap **≤ 0.65**
- **Implemented**: Mispar Hechrachi gematria · 拉丁转写 fallback · Sephirot 映射 · Mispar Gadol 显式尾字母 500–900 变体 · Mispar Katan/Siduri · 22 路径完整解读
- **Missing**: Tikkun 细化 · 希伯来原文转写表扩充

---

## Confidence Policy

`src/core/shared/confidence.ts` enforces:

| Status | Max confidence |
|---|---|
| complete | 1.00 |
| partial | 0.65 |
| needs_source_validation | 0.45 |
| placeholder_removed | 0.00 |

| Source grade | Max confidence |
|---|---|
| A | 1.00 |
| B | 0.85 |
| C | 0.65 |
| D | 0.45 |

Plus: −0.05 per warning (cap −0.30) and a soft cap of `completenessScore / 100`.

The source registry policy is applied before both legacy and HPU fusion, so an overclaimed calculator status can no longer inflate the fused confidence.

## Determinism Guarantees
- 0 occurrences of `Math.random` in `src/core/`
- 0 non-timing `Date.now()` / `new Date()` calls in `src/core/`
- All `targetYear` / 流年 derived from `input.targetYear` or `input.queryTimeUtc`
- Verified by `src/core/shared/__tests__/determinismGuard.full.test.ts`
