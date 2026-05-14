# Algorithm Status — P4 Final

Last updated: P4.12 audit ledger.

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
- **Implemented**: 四柱 (立春切年/节气切月) · 十神 · 藏干 · 纳音 · 五行/阴阳平衡 · 十二长生 · 空亡 · 多因子日主强弱 · 用神候选 · 喜忌神 · 大运顺逆 · 起运年龄 · 当前大运 · 流年 · 合冲刑害基础 · 事业/财富/关系/健康/家庭分区
- **Missing**: 调候用神细化 · 化气格 · 从格 · 流月细化
- **Tests**: `src/core/bazi/__tests__/calculateBaziChart.test.ts`

### 铁板神数 Tieban
- **Status**: `needs_source_validation` · **Grade**: C · confidence cap **≤ 0.45**
- **Implemented**: baseNumber · theoreticalBase · quarterKe · systemOffset · 六亲校时(用户事实优先) · 条文 exact/fallback 透明记录 · 七大报告分区
- **Missing**: 古籍完整公式校验 · 十三部条文齐备 · 增删神数交叉验证

### 紫微斗数 Ziwei
- **Status**: `partial` · **Grade**: C · cap **≤ 0.65**
- **Implemented**: 农历上下文 · 命/身/十二宫 · 五行局 · 紫微+天府定位 · 十四主星全部落宫 · 四化 · 辅星/煞星基础 · 三方四正 · 对宫 · 大限 · 流年 (`targetYear` 来自 input)
- **Missing**: 博士十二神完整 · 星曜亮度全表 · 南北派差异 · 格局自动识别

### 六爻 Liuyao
- **Status**: `partial` · **Grade**: C · cap **≤ 0.65**
- **Implemented**: 本/变卦 · 动爻 · 世应 · 纳甲 · 六亲 · 六神 · 日月建 · 旺衰 · 冲合刑害基础 · 空亡 · 时间起卦 · 手动起卦 · `castMethod` 记录
- **Missing**: 伏神 · 飞神 · 进退神 · 反吟伏吟评分 · 应期细化

### 梅花易数 Meihua
- **Status**: `complete` · **Grade**: B · cap **≤ 0.85**
- **Implemented**: 年月日时起卦 · 数字起卦 · 上下卦 · 动爻 · 本/互/变卦 · 体用关系 · 五行生克 · 吉凶趋势
- **Missing**: 外应 · 声音字数等高级起卦法

### 奇门遁甲 Qimen
- **Status**: `partial` · **Grade**: C · cap **≤ 0.65**
- **Implemented**: 阴/阳遁 · 局数 · 九宫 · 三奇六仪 · 九星 · 八门 · 八神 · 值符 · 值使 · 时家基础盘 · 用神宫
- **Missing**: 三诈五假 · 伏吟反吟评分 · 高级格局识别

### 大六壬 Liuren
- **Status**: `partial` · **Grade**: C · cap **≤ 0.65**
- **Implemented**: 月将 · 占时 · 天/地盘 · 四课 · 三传 · 十二天将 · 基础判断
- **Missing**: 毕法赋 · 九宗门 · 课体识别

### 太乙神数 Taiyi
- **Status**: `partial` · **Grade**: C · cap **≤ 0.65**
- **Implemented**: 积年 · 局数 · 太乙宫 · 文昌 · 始击 · 主客基础
- **Missing**: 计神 · 岁/月/日/时计完整 · 十六神将

### 西方占星 Western
- **Status**: `partial` · **Grade**: B · cap **≤ 0.65**
- **Implemented**: astronomy-engine 真实行星位置 · 10 行星黄经/星座/度数 · Whole Sign · 上升点 Asc · 五大相位+orbs
- **Missing**: Placidus / Koch (warning + Whole Sign 回退) · 小行星 · 现代心理层

### 吠陀占星 Vedic
- **Status**: `partial` · **Grade**: C · cap **≤ 0.65**
- **Implemented**: Lahiri ayanamsa (J2000 锚 23.85° + 50.2388475″/年) · sidereal · Rashi · Nakshatra+Pada · Vimshottari Mahadasha 完整 120 年
- **Missing**: Antardasha · Rahu/Ketu · D9 等分宫盘

### 数字命理 Numerology
- **Status**: `complete` (含姓名) / `partial` (缺姓名) · **Grade**: B
- **Implemented**: Pythagorean 字母→数字 · 主数 11/22/33 保留 · Life Path / Destiny / Soul Urge / Personality / Personal Year
- **Missing**: Chaldean · Karmic Debt 高级解读

### 玛雅历 Mayan
- **Status**: `partial` · **Grade**: B · cap **≤ 0.65**
- **Implemented**: Tzolkin day sign + tone · Long Count (vigesimal, 1 tun = 18 uinal, JD 584283 = 4 Ahau)
- **Missing**: Haab 365 日历 · Calendar Round 52 年组合

### 卡巴拉 Kabbalah
- **Status**: `partial` · **Grade**: C · cap **≤ 0.65**
- **Implemented**: Mispar Hechrachi gematria · 拉丁转写 fallback · Sephirot 映射
- **Missing**: 扩展 gematria · 22 路径完整解读

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

## Determinism Guarantees
- 0 occurrences of `Math.random` in `src/core/`
- 0 non-timing `Date.now()` / `new Date()` calls in `src/core/`
- All `targetYear` / 流年 derived from `input.targetYear` or `input.queryTimeUtc`
- Verified by `src/core/shared/__tests__/determinismGuard.full.test.ts`
