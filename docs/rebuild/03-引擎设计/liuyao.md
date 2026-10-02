# 六爻引擎设计（engineId `liuyao`）

> 引擎类别：`divinatory`（占问类）。本文只做设计，不含业务代码。凡涉及现有代码的陈述都附了文件路径；凡典籍出处写不出卷章的，一律标「卷章待查」。

## 1. 结论摘要

- **定位**：六爻（又称「纳甲筮法」或「火珠林法」，即以京房八宫纳甲装卦、按用神断事的筮法）本质上是对**某一次提问、某一时刻**起卦。它没有从出生信息推一生的时间划分规则。
- **第一版范围**：不进入「由出生信息推演一生」的主流程，不产出 `EngineDelivery`。编排层只记一条 `omission`（`out_of_scope`）。第一版只做装卦内核和黄金用例，供第二版使用。
- **第二版**：采用「问事模式」。用户针对一个已经提取出的重大选择，在某一时刻起卦。起卦记录（六个爻值、时刻、时区、问题类别）作为输入固化保存，引擎的输出只作为该选择节点的附加信号。
- **不采用「以出生时刻起卦论一生」**。就我所知，六爻传统里的「终身」「身命」类占法，也是问卦人在**提问时**起卦，不是用出生时刻起卦（见 §2.4）。
- **主要风险**：(1) 旧代码六神表「己日」起错；(2) 旧代码的「时间起卦」既不是梅花易数的取数法，也不是六爻的传统起卦法；(3) 主流程用 `new Date()` 作为起卦时刻，同一出生信息每次运行结果都不同；(4) 用神、应期等断法规则的出处卷章尚未核对。
- **建议初始状态**：`needs_source_validation`。

## 2. 声明的流派和范围

### 2.1 流派

**声明的流派**：京房八宫纳甲装卦，加上《增删卜易》（野鹤老人著，李文辉增删）的用神与旺衰断法，以《卜筮正宗》（王洪绪）作为交叉参照。

**选它的理由**：
- 装卦部分（纳甲、八宫、世应、六亲、六神）各派基本一致，可以用公认排盘软件交叉验证。
- 断法部分，《增删卜易》以「用神为主、不重神煞」著称，规则边界比较清楚，适合做成规则表。
- 卦身、神煞（天乙贵人、驿马等）、《火珠林》的派别差异，第一、二版都不做（见 §4）。

### 2.2 输入（问事模式，第二版）

| 字段 | 必需 | 说明 |
|---|---|---|
| `castRecord.lines` | 是 | 六个爻值，取值 6/7/8/9，由下往上排列。**无论用哪种起卦法，最后固化的都是这六个值。** |
| `castRecord.method` | 是 | 取值 `coins-physical` / `coins-ui` / `manual-entry` / `meihua-time` / `meihua-numbers`，说明这六个值是怎么来的。 |
| `castRecord.castInstantUtc` + `timezoneIana` + 经纬度 | 是 | 用来求月建、日辰、旬空、六神。时间统一由 `astro-time` 层换算。 |
| `castRecord.questionCategory` | 是 | 从重大选择的 `Domain` 加上问事对象（自己/父母/配偶…）推出，用来选用神。**不再用关键字去猜问题文本。** |
| `askerGender` | 婚姻类必需 | 男问妻取妻财，女问夫取官鬼。缺失时输出 `omission(input_missing)`，不默认填一个值。 |
| `decisionNodeId` | 是 | 绑定的重大选择节点。 |
| 出生信息 | 否 | 六爻装卦和断法都不使用出生信息。是否参考「年命」（问卦人出生年的地支）属于待决问题（§9），第一、二版都不用。 |

### 2.3 口径决策点

| 口径 | 选项 | 建议 |
|---|---|---|
| 月建 | 以节气划月（月从立春、惊蛰等节交接） | 采用节气划月，由 `astro-time` 提供节气交接时刻。这是各家共识；具体出处卷章待查。 |
| 日辰换日 | 子初（23:00）换日，或民用 00:00 换日 | **待决**。这个口径会影响日辰、旬空、六神，必须由用户拍板，并写进 `chart.data.calendarPolicy`。 |
| 真太阳时 | 是否用真太阳时决定时辰 | 六爻只用日辰和月建，时辰只在「梅花时间起卦」路径中出现，那条路径沿用梅花引擎的口径。**待决**。 |
| 闰月 | 月建按节气划分，不受农历闰月影响 | 六爻本身不涉及闰月；只有梅花时间起卦路径需要处理（见 meihua.md）。 |

### 2.4 本命类 vs 占问类：六爻如何参与「由出生信息推演一生」

**(a) 有没有以出生时刻起卦论一生的流派？**
- 就我所知，六爻传统中**没有**用出生时刻起卦论一生的成体系做法。
- 《增删卜易》和《黄金策》（明代刘基托名之作，《卜筮正宗》收录并注解）里有「身命」「终身」一类的章节。但那是问卦人**在提问当时**摇卦，问的是「我这一生如何」，起卦时刻是提问时刻，不是出生时刻。这些章节的具体卷章待查，可靠性标 `cited_unverified`。
- 网络上有人用生辰起六爻卦，我没有找到可信的典籍依据，标 `unverified`。
- 与此相关的另一种体系是《河洛理数》（托名陈抟、邵雍）。它用出生年月日时换算成卦，并以爻为单位排大运，确实是「出生起卦论一生」的体系。但它不是六爻，也不是梅花易数，规则来源的可靠性同样未核实。如果将来要引入，应当作为一个**独立的本命类引擎**单独立项。

**(b) 两种参与方式的依据与风险**

| 方式 | 规则依据 | 风险 |
|---|---|---|
| 以出生时刻起卦 | 无可靠依据。装卦虽然可以机械执行，但用神需要一个问题，而出生时刻没有问题；应期规则给出的是「某地支日/月」，没有一生尺度的时间划分规则。 | 会产生一个对每个人恒定、却没有规则支撑的「一生卦」，冒充本命信号；还会和八字等引擎重复使用同一份出生信息，造成重复计权。**不建议采用。** |
| 问事模式绑定重大选择 | 这是六爻的本来用法：一事一占，用神按所问之事选取，应期规则针对所问之事。 | (1) 结果取决于用户何时起卦，所以必须固化起卦记录才能复现；(2) 用户可能反复起卦，直到得到满意的结果。传统上有「初筮告，再三渎，渎则不告」（《周易·蒙》卦辞，`verified`）的告诫，产品上应规定**一个选择节点只认第一次起卦**，重复起卦另行记录并标注；(3) 问题类别要从选择节点映射过来，映射本身属于 `project_assumption`。 |

**(c) 两种方式分别交付什么**
- **出生起卦**：不交付。编排层记一条 `omission { what: 'liuyao natal', reason: 'out_of_scope' }`。
- **第一版（主流程）**：同上，不交付。
- **第二版问事模式**：对每个 (人, 选择节点) 最多交付一份 `EngineDelivery`，`engineClass: 'divinatory'`，内容见 §6。

## 3. 计划实现的规则清单

可靠性说明：`verified` 只用于经文本身或可机械复核的结构（例如八卦的爻画）；装卦表虽然各派一致，但在拿到排盘软件交叉结果之前，仍标 `cited_unverified`。

| ruleId | 规则内容 | 来源 | 可靠性 | 产出 |
|---|---|---|---|---|
| `liuyao.cast.record-lines` | 固化六个爻值（6/7/8/9），6 和 9 为动爻 | 三钱法爻值；《卜筮正宗》卷章待查 | cited_unverified | chart |
| `liuyao.cast.coins-ui` | 界面上掷钱，随机源只存在于界面，引擎只接收结果爻值 | 项目约定 | project_assumption | chart |
| `liuyao.cast.meihua-time` | 借用梅花易数的年月日时取数法得到卦和动爻，再装卦 | 引用 `meihua.cast.time` | cited_unverified | chart |
| `liuyao.najia.trigram-table` | 八经卦纳干支表（乾内甲子寅辰、外壬午申戌……） | 京房易传系统；《卜筮正宗》卷章待查 | cited_unverified | chart |
| `liuyao.palace.eight-palaces` | 八宫归属：本宫卦、一世至五世、游魂、归魂 | 京房八宫；卷章待查 | cited_unverified | chart |
| `liuyao.palace.shi-ying` | 世应位置：八纯世六；一世至五世世在相应爻；游魂世四；归魂世三；应爻与世爻隔两位 | 同上 | cited_unverified | chart |
| `liuyao.relative.five-relations` | 六亲：以本宫五行为「我」，同我兄弟、我生子孙、生我父母、我克妻财、克我官鬼 | 《增删卜易》卷章待查 | cited_unverified | chart, relationSlot |
| `liuyao.relative.changed-uses-origin-palace` | 变卦的六亲仍以本卦所属宫的五行来定 | 同上 | cited_unverified | chart |
| `liuyao.spirit.by-day-stem` | 六神：甲乙日起青龙，丙丁起朱雀，戊起勾陈，**己起螣蛇**，庚辛起白虎，壬癸起玄武，从初爻往上排 | 通行歌诀；卷章待查 | cited_unverified | chart |
| `liuyao.calendar.month-jian` | 月建取节气月的月支 | 通行口径；卷章待查 | cited_unverified | chart |
| `liuyao.calendar.xunkong` | 旬空：按日干支所在的旬求两个空亡地支 | 六十甲子旬空表（可机械复核） | cited_unverified（可机械复核；待黄金用例后升 verified） | chart |
| `liuyao.strength.month` | 爻的五行在月令中的旺相休囚死 | 《增删卜易》卷章待查 | cited_unverified | chart |
| `liuyao.strength.day` | 日辰对爻的生、克、扶、冲 | 同上 | cited_unverified | chart |
| `liuyao.strength.yuepo` | 月破：爻支被月建所冲 | 同上 | cited_unverified | chart, signal(tendency) |
| `liuyao.strength.anDong-riPo` | 静爻被日辰冲：旺者为暗动，衰者为日破 | 同上 | cited_unverified | chart, signal(tendency) |
| `liuyao.change.huitou` | 动爻化出的爻回头生、克本爻；化进神、化退神；化空、化墓、化绝 | 同上 | cited_unverified | chart, signal(tendency) |
| `liuyao.yongshen.select` | 按问题类别选取用神；同一六亲出现两次时，按「取世应、取动爻、取旺」等原则择一 | 《增删卜易》用神诸章，卷章待查 | cited_unverified | chart |
| `liuyao.yongshen.self-uses-shi` | 问自身之事以世爻为用神 | 同上 | cited_unverified | chart |
| `liuyao.yongshen.marriage-by-gender` | 男问妻用妻财，女问夫用官鬼 | 同上 | cited_unverified | chart |
| `liuyao.yongshen.yuan-ji-chou` | 元神、忌神、仇神的推导 | 同上 | cited_unverified | chart |
| `liuyao.fushen.from-palace-head` | 用神不出现时，到本宫首卦里找伏神，与本卦同位爻构成飞伏关系 | 同上 | cited_unverified | chart |
| `liuyao.judgment.yongshen-state` | 用神旺相且不受克，倾向成事；休囚、受克、空、破，倾向难成 | 同上 | cited_unverified | signal(tendency) |
| `liuyao.gua.liuchong-liuhe` | 六冲卦、六合卦：内外卦对应爻**三组全部**相冲或相合 | 卷章待查 | cited_unverified | signal(tendency) |
| `liuyao.gua.fanyin-fuyin` | 反吟、伏吟 | 卷章待查 | cited_unverified | signal(tendency) |
| `liuyao.yingqi.void-fill` | 用神旬空：出空或冲空之时为应期 | 《增删卜易》应期章，卷章待查 | cited_unverified | period, signal(key_node) |
| `liuyao.yingqi.static-chong` | 用神安静：逢冲之时为应期 | 同上 | cited_unverified | period, signal(key_node) |
| `liuyao.yingqi.moving-he` | 用神发动：逢值、逢合之时为应期 | 同上 | cited_unverified | period, signal(key_node) |
| `liuyao.yingqi.granularity` | 应期是取「日」「月」还是「年」，按所问之事的远近来定 | 原则见于典籍，具体判定细则卷章待查 | unverified | period |

**明确不进清单的旧代码规则**：`QUESTION_KEYWORDS` 关键字选用神（`src/core/liuyao/constants.ts`）、置信度数值、伏吟反吟扣分（`src/core/liuyao/advancedRules.ts` `detectFanFuYin`）、「综合」类默认取世爻（作为兜底规则没有依据）。

## 4. 明确不做的部分

- **出生时刻起卦和一生尺度的时间线**：没有依据，理由见 §2.4。
- **卦身、神煞全表、《火珠林》派别差异**：派别分歧大，出处难以逐条核实。
- **种子 + 线性同余随机生成（LCG）起卦**（`src/core/liuyao/calculateHexagram.ts` `castFromSeed`）：随机生成算法本身会变成一条「规则」，而且结果依赖实现细节。新设计里，随机只在界面发生，引擎只接收固化后的六个爻值。
- **寿命、死亡、疾病诊断**：在类型层面就不存在。「测疾病以官鬼为用神」这类规则，只产出 `health` 领域的「需关注时段」倾向，不产出病名。
- **0–100 分数和吉凶等级**：契约已经作废这类输出。

## 5. 黄金用例需求

| 类别 | 需要什么 | 外部来源 | 格式要点 |
|---|---|---|---|
| 正常 | 64 卦全表：宫、世应、六爻纳甲干支、六亲 | 京房八宫卦表（多种出版物），以及至少两款公认排盘软件的输出比对 | 每卦一行：上下卦、宫、世应、六爻干支、六亲 |
| 正常 | 带日期的典籍断例：日干支、月建、得卦、动爻、用神选择 | 《增删卜易》《卜筮正宗》中的成例（原文摘录，注明章名） | 只比对盘面和用神选取，不比对断语 |
| 边界 | 节气交接前后、子时前后（两种换日口径各一组）、旬首和旬尾的旬空 | 节气时刻取香港天文台或 USNO 数据；日干支取天文台历表 | 期望值同时注明所用口径 |
| 边界 | 六爻全静、六爻全动、用神两现、用神不现需要找伏神 | 典籍成例 | — |
| 非法 | 爻值不在 6–9 之间、爻数不等于 6、缺少时区、问婚姻却缺少性别 | 规范本身（不需要外部数据） | 期望得到错误或 `omission` |
| 歧义 | 问题类别能对应多个用神（例如「借钱给朋友」）；时刻落在节气交接的同一分钟 | 需要用户或专家裁定 | 期望输出 `ambiguous_input` |

**需要外部获取的数据清单**：(1) 京房八宫 64 卦装卦表，含两款软件的截图或导出；(2) 《增删卜易》可靠点校本（用神章、应期章、身命章），需要确认版本；(3) 《卜筮正宗》或《黄金策》的点校本；(4) 1900–2100 年节气交接时刻表（香港天文台或 USNO）；(5) 日干支对照表；(6) 用户对日界口径的决定。

## 6. 向一级世界层交付的内容（仅第二版问事模式）

- **`chart`**：`kind: 'liuyao.chart/1'`。包含 `castRecord`（`lines`、`method`、`castInstantUtc`、`timezoneIana`、`decisionNodeId`、`questionCategory`、`calendarPolicy`）、本卦、变卦、逐爻的纳甲/六亲/六神/世应/旺衰标注、用神分析、伏神。
- **`timeline`**：
  - 一个根时段，`periodId: 'liuyao.query.<castId>'`，`unit: 'liuyao.query'`，`start` 为起卦时刻。`end` 由选择节点的时间窗给出，因为六爻自身没有关于时间跨度的规则。
  - 若干应期候选，`unit` 为 `liuyao.yingqi.day`、`liuyao.yingqi.month` 或 `liuyao.yingqi.year`，`parentPeriodId` 指向根时段。绝对日期的算法：从起卦时刻起，向后找第一个地支等于候选地支的日、节气月或年，取其 `[开始, 结束)`；日与日的边界、月与月的节气边界都由 `astro-time` 提供。如果 `liuyao.yingqi.granularity` 无法判定该取哪种粒度，就**不输出**这个应期，只记一条 `omission(no_rule)`。
- **`key_node` 信号**：只来自 `liuyao.yingqi.*` 这几条规则。`domain` 取选择节点的领域；`polarity` 取 `liuyao.judgment.yongshen-state` 的结论（判定不了就填 `neutral`）；`intensity: null`。
- **`tendency` 信号**：来自用神状态、月破、日破、暗动、回头生克、六冲卦、六合卦、反吟、伏吟，`periodId` 都挂在根时段上。
- **`relationSlots`**：这里描述的是**本次所问之事**中涉及的人，不是一生的六亲。
  - 父母爻 → `father` / `mother` / `mentor`（长辈、文书）
  - 兄弟爻 → `sibling` / `friend` / `rival`
  - 妻财爻 → `spouse`（男问）
  - 官鬼爻 → `spouse`（女问）、`superior`
  - 子孙爻 → `child` / `subordinate`
  - 应爻 → 所问之事的对方，可能是 `business_partner` 或 `rival`，要看问题类别
  
  以上都是 `cited_unverified`。其中「子孙爻对应 subordinate」「应爻对应 rival」属于 `project_assumption`。
- **典型 `omissions`**：
  - `askerGender` 缺失（`input_missing`）
  - 应期粒度判定不了（`no_rule`）
  - 问题类别映射到多个用神（`ambiguous_input`）
  - 卦身、神煞（`not_implemented`）
  - 出生起卦（`out_of_scope`）

## 7. 它的一套世界如何展开

- **分岔点**：只来自应期 `key_node`。每个应期候选把世界分成「事在此期应验」和「未应验」两支，应验支的极性取用神状态的判断。
- **数量级**：
  - 一次起卦，按 §3 的应期规则，通常给出 1–3 个候选地支；如果加上伏神、克神被冲开之类的情形，最多大约 4 个。这个估计依据旧实现 `deriveYingQi` 的分支数（`src/core/liuyao/advancedRules.ts`），最终数量以核实后的规则为准。
  - 一生的总量 = 用户实际起卦的选择节点数 × 每次 1–4 个。按一生请教 5–30 个重大选择估算，大约有 10¹–10² 个分岔点。**完全由用户行为驱动，不是由出生信息决定的。**
  - 出生起卦和第一版：0 个。
- **时间单位的保留与映射**：保留六爻原生的「某支日/月/年」标签，例如「应期 卯日」。绝对日期按 §6 的算法求出，并存入 `NativePeriod`。

## 8. 从旧代码里可以借鉴什么

### 可以参考（但必须按 §3 的来源要求重新核对）

- `src/core/liuyao/hexagramTables.ts` 的 `NA_JIA`：八卦纳干支表。我逐项核对过，与通行纳甲表一致。
- `src/core/liuyao/hexagramTables.ts` 的 `SHI_YING_TABLE`。
- `src/core/liuyao/sixRelatives.ts` 的 `patternForPalaceOrder` 和 `determinePalace`：用「从八纯卦依次变爻」的方式枚举出 64 卦的归宫，做法正确，可以照搬思路。
- `src/core/liuyao/constants.ts`：`XUN_KONG_TABLE`、`MONTHLY_STRENGTH`、`BRANCH_CHONG`、`BRANCH_HE`、`BRANCH_HAI`、`getSixRelative`。
- `src/core/liuyao/advancedRules.ts`：`JIN_PAIRS`（进神对）和 `findFuShen` 的思路。
- `src/core/liuyao/changingLines.ts`：变卦六亲以本宫为准的处理。

### 已知 bug 和无依据的捏造

1. **六神「己日」起错**：`src/core/liuyao/constants.ts` 的 `SIX_SPIRITS_BY_STEM['己']`，以及旧版 `src/utils/liuYaoAlgorithm.ts` 的 `SIX_SPIRITS_TABLE['己']`，都写成了从勾陈起。通行歌诀是「己日起螣蛇」。
2. **`calculateLiuYaoHexagram` 有 `new Date()` 默认参数**：`src/utils/liuYaoAlgorithm.ts:639` 写的是 `calculateLiuYaoHexagram(timestamp: Date = new Date())`。另外：
   - 爻值由 `calculateLineValue` 对 16 取模的公式生成（`src/utils/liuYaoAlgorithm.ts:540`），这是捏造。
   - `getTimeGanZhi` 用本地时区的 `getHours` 和 `new Date(2000,0,1)` 推日干，依赖运行环境的时区。
   - `determinePalaceAndShiYing` 用「与八纯卦相同的爻数」来判归宫，这是错的。
   - `assessTendency` 用加减分来定吉凶，也是捏造。
   - `src/utils/quantumPredictionEngine.ts:1082` 在六爻引擎失败时，会退回用**出生时刻**起卦，等于悄悄把六爻当成了本命引擎。
3. **主流程起卦时刻是系统当前时间**：`src/hooks/usePredictionFlow.ts:98` 和 `:159` 都写了 `queryTimeUtc = new Date().toISOString()`，这个值经过 `src/utils/p4CoreOverlay.ts` 的 `runCoreLiuyao` 传进六爻引擎。结果是同一份出生信息，每次运行都得到不同的卦。
4. **核心版「时间起卦」取数错误**：`src/core/liuyao/calculateHexagram.ts` 的 `castFromTime` 及其调用处：
   - 年数用的是「年干序数 + 年支序数」，月数和日数用的是月支和日支的序数，都不是农历的月数和日数；
   - 「年月日」之和被当成下卦，「年月日 + 时」之和被当成上卦，与梅花易数正好颠倒（梅花易数是年月日之和为上卦）。
   
   所以它既不是梅花易数的取数法，也不是六爻的传统起卦法。
5. **缺历法时退回默认干支**：`src/core/liuyao/calculateHexagram.ts` 的 `defaultCalendar`，在缺少历法信息时用「甲子年月日时、旬空戌亥」来装卦，属于用固定常数填充。另外，`queryTimeUtc` 不带时区标记时被当作当地时间解析（`buildCalendarContext`），字段名和语义不一致。
6. **「冲卦」「合卦」定义不对**：`src/core/liuyao/clashCombine.ts` 只要世爻与应爻相冲或相合，就判为「冲卦」「合卦」。传统的六冲卦、六合卦要求内外卦三组对应爻**全部**相冲或相合。另外，自刑被 `other.branch !== ln.branch` 排除掉了，永远检测不到。
7. **用神选取的问题**：`src/core/liuyao/yongshen.ts`：
   - 只取第一个出现的用神爻，没有处理用神两现的情况；
   - 婚姻类不区分问卦人性别；
   - 没有实现月破、日破、暗动、回头生克。
8. **捏造的数值**：
   - `src/core/liuyao/toEngineOutput.ts` 的 `buildFateVector` 用 85、70、45 等常数映射分数；
   - `src/core/liuyao/calculateHexagram.ts` 的 `baseConfidence` 以及 `completenessScore` 的 90 和 60，都是常数；
   - 只要历法齐全，`implementationStatus` 就填 `'complete'`，而 `src/core/shared/algorithmSourceRegistry.ts` 中六爻登记的状态是 `partial`，两者自相矛盾。
9. **`extractInstantEvents` 的问题**：`src/utils/eventSeedExtractors.ts:2367`：
   - 固定概率：0.65、0.55、0.45；
   - 固定年龄兜底：28–33 岁、30 岁；
   - 卦凶就把类别归为 `accident`，并另外追加一个「需注意健康与安全」的种子。
   
   另外，按代码阅读推断（未运行验证）：它读取的是 `normalizedOutput['卦名']`、`['吉凶']`，而 `src/utils/p4CoreOverlay.ts` 的 `mergeCoreOverlay` 把顶层键替换成了核心版的键（`mainHexagram` 等），旧版六爻的输出里本来也只有 `'总评'`（`src/utils/quantumPredictionEngine.ts` 的 `runLiuYao`）。所以六爻这一支很可能永远走「中平」分支。

### 未核实

我没有成功运行 `npx vitest run src/core/liuyao`，因为依赖解析报了 `ERR_MODULE_NOT_FOUND`。所以现有测试能否通过未核实。

## 9. 未决问题与风险

1. 日辰换日口径（子初还是 00:00）：需要用户拍板。
2. `EngineDelivery` 契约里没有 `decisionNodeId` 字段。本文暂时把它放在 `chart.data.castRecord` 中，并纳入 `inputDigest`。是否要升级契约，需要主设计者决定。
3. 应期粒度（日、月、年）的判定细则出处未核实。拿不准的时候宁可不输出，这意味着第二版的 `key_node` 可能很少。
4. 是否参考「年命」：不确定，`unverified`。
5. 重复起卦的产品规则（只认第一次）需要用户确认。
6. 如果将来有「出生起卦论一生」的需求，应该另立《河洛理数》引擎评估，不要塞进六爻。
7. 《增删卜易》《卜筮正宗》需要选定点校版本，否则所有断法规则只能停留在 `cited_unverified`。
