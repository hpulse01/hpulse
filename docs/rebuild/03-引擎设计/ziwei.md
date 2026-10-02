# 紫微斗数引擎设计（engineId `ziwei`）

> 本文是 H-Pulse 重建的引擎设计文档，只做设计，不含业务代码。所有关于现有代码的陈述都附文件路径；「未核实」表示本文作者没有亲自读到或验证。
> 来源可靠性四级：`verified`（已对照原典或权威技术参考逐条核过）/ `cited_unverified`（典籍名可信，卷章待查，或口诀广泛流传但尚未对照具体版本）/ `unverified`（连出处都说不准）/ `project_assumption`（项目自定的工程口径，不冒充命理规则）。
> 本文**没有一条规则达到 `verified`**：作者手边没有可核对的具体版本典籍，诚实起见全部按 `cited_unverified` 或更低登记，等拿到版本后逐条升级。

---

## 1. 结论摘要

1. **定位**：紫微是第一阶段两个主干本命引擎之一（`engineClass: 'natal'`）。它向一级世界交付以「大限（10 年）→ 小限 / 流年（1 年）」为骨架的时间线、以十二宫为单位的领域信号，以及以父母/兄弟/夫妻/子女/交友/官禄宫为结构的他人描述（`relationSlots`）。
2. **第一版流派**：**三合派（全书传统）的安星与行限**，四化只用「生年四化 + 大限宫干四化 + 流年年干四化」三层，**不做飞星派的宫干飞化、自化、来因宫**。理由：安星部分各派基本一致，分歧集中在「怎么解读」；三合派的行限与四化叠宫在实践中最普遍，规则条数少，便于逐条登记来源。
3. **第一版范围**：命身宫、五行局（纳音法）、十四主星、六吉六煞、禄存天马、生年四化、大限、小限、流年及流年四化、十二宫他人槽位。亮度只做十四主星，并且在亮度表的版本选定以前不参与任何信号。格局、杂曜、十二神、流月流日不进第一版。
4. **最大风险**：旧代码**安星主干是错的**。命宫/身宫公式在 144 种「月 × 时」组合下全部与口诀不符；五行局表在实际调用路径上 120 种组合里有 94 种与纳音不符；天马、火星、地空地劫的安法也不对（见第 8 节）。因此旧盘面不能当回归基线，新引擎必须从口诀重写，用外部排盘软件做黄金用例。
5. **第二大风险**：外部语料与 `external/ziwei/patterns.ts` 的出处和许可都不清楚，其中「《紫微斗数全书》公版」语料混入了现代白话改写的段落。第一版不让这些语料进入规则层。
6. **建议初始状态**：`needs_source_validation`。安星与行限规则拿到独立黄金用例并逐条核对来源后升为 `partial`。解读类信号规则（key_node）在可预见的时期内达不到 `complete`。

---

## 2. 声明的流派和范围

### 2.1 流派比较与选择

| 流派 | 核心方法 | 与本项目的契合度 |
|---|---|---|
| **三合派**（以《紫微斗数全书》《紫微斗数全集》为宗的传统派，香港中州派常被归入此类） | 星曜组合、庙旺利陷、三方四正会照、格局、行限叠宫（大限/流年宫位与本命宫位重叠来看）。四化主要用生年四化，行限四化各家用法不一 | 安星规则有口诀可查，结构化程度高。缺点是格局解读条文多、依赖庙陷表，而庙陷表各版本不一致 |
| **飞星派 / 四化派**（台湾兴起的一支，常与「钦天门」「河洛派」等名号相连，具体师承谱系**未核实**） | 以宫干四化在十二宫间「飞」来论因果：自化、化忌冲、来因宫、象义，星曜吉凶退居次要 | 推演链条长，各门派规则互相冲突，且多出自现代讲义与口传，很难给每条规则登记稳定来源。第一版不采用 |
| **中州派**（王亭之所传） | 三合为主，大量杂曜、流曜，自有一套四化表与安星细则 | 依赖现代出版物，涉及版权，细节**未核实**。第一版不采用，可作为第二版候选流派配置 |
| **「南派 / 北派」** | 民间说法通常指「南派偏三合、北派偏飞星」，但标签用法各说各的 | **不以此作为流派声明**。旧代码 `src/core/ziwei/toEngineOutput.ts` 声明 `ruleSchool: '北派紫微 (经典 14 主星 + 四化 + 三方四正)'`，而实际做法更接近三合，前后矛盾，新设计不沿用这个标签 |
| **倪海厦《天纪》讲义体系** | 三合为本，强调本命四化固定不动 | 现代讲义，有版权，且旧语料中对其立场的描述自相矛盾（见 8.4）。不作为规则来源 |

**第一版声明**：`school: '三合派·《紫微斗数全书》传统安星与行限（不含飞星）'`。

**选择理由**：
- 命身宫、五行局、十四主星、六吉六煞的安法，三合、飞星、中州各派基本相同。差异集中在四化表的个别天干、亮度表、杂曜和解读方法上。所以只要把这几处做成「流派参数」，安星层就可以一次做对、多派共用。
- 三合派的行限规则（大限、小限、流年按太岁入宫）条目少，口诀流传广，最容易找到外部黄金用例来对照。
- 飞星派的价值在于「事件因果链」，但它的规则在本项目的来源要求下无法登记。第二版若要接入，应作为独立的 `school` 配置，用独立的 ruleId 前缀（例如 `ziwei.feixing.*`），不和三合派规则混用。

### 2.2 输入

| 字段 | 必需 | 用途 | 缺失时 |
|---|---|---|---|
| 出生时刻（本地时间 + IANA 时区） | 必需 | 由 `astro-time` 转换为农历年月日和时辰 | 无法排盘 |
| 出生地经度 | 若选用真太阳时则必需 | 真太阳时校正 | `omission: input_missing`，退回区时并标记 |
| 出生时刻不确定度（分钟） | 建议提供 | 判断是否跨时辰边界 | 视为 0，但在 chart 中注明 |
| 性别（`male`/`female`） | 行限必需 | 大限、小限的顺逆方向（阳男阴女顺，阴男阳女逆；小限男顺女逆） | 命盘照排；大限/小限方向出 `omission: ambiguous_input`，不猜 |
| 姓名 | 不需要 | — | — |
| 查询年份 | 不需要 | 新设计一次性生成整条时间线，不依赖「当前年」 | — |

`src/types/prediction.ts` 中的 `Gender` 只有 `'male' | 'female'` 两种取值。新契约若扩展了性别取值，紫微对扩展值一律出 omission，不做推断。

### 2.3 口径决策点

| 编号 | 问题 | 选项 | 第一版默认 | 状态 |
|---|---|---|---|---|
| **D1 时辰基准** | 用钟表区时还是真太阳时定时辰 | (a) 区时（含历史夏令时修正）；(b) 地方平太阳时；(c) 真太阳时（含均时差） | **(c) 真太阳时**，同时在 chart 中记录 (a) 的时辰；两者不同时附加 `hourBasisConflict` 标记 | **待用户拍板**。古法以日晷定时，相当于真太阳时，但现代排盘软件多数默认区时，这是 `project_assumption` |
| **D2 子时换日** | 23:00–24:00（晚子时）属当天还是次日 | (a) 23:00 换日：晚子时按次日的农历日安星，时辰为子；(b) 0:00 换日：晚子时仍用当天的农历日，时辰为子 | **(a)**，可配置 | **待决**，`project_assumption`。注意：除夕 23:xx 按 (a) 会进入次年正月初一，年干和四化都会变，黄金用例必须覆盖这一情形 |
| **D3 闰月** | 闰月出生按哪个月安命宫、左辅右弼等月系星 | (a) 全月按本月；(b) 全月按下月；(c) 初一至十五按本月，十六起按下月 | **(c)** | **待决**，`cited_unverified`（流传口径，卷章待查）。旧代码用 `Math.abs(month)` 静默采用了 (a)（`src/core/ziwei/lunarAdapter.ts`） |
| **D4 年界** | 斗数的「年」（年干四化、大限顺逆的阴阳、流年）以什么为界 | (a) 正月初一；(b) 立春 | **(a) 正月初一** | `cited_unverified`。与八字（立春）不同，立春到春节之间出生的人两套引擎的年干会不一致，这是体系差异，不是 bug，要在 chart 中显式记录 |
| **D5 年龄制** | 大限岁数是虚岁还是周岁 | 虚岁（出生即 1 岁，逢正月初一加 1） | **虚岁** | `cited_unverified`，传统通例 |
| **D6 流年四化的叠宫口径** | 「流年化忌入某宫」的宫名按本命宫名还是流年宫名 | (a) 本命宫名；(b) 流年宫名（以流年命宫为起点重排十二宫）；(c) 两者都记录 | **(c)**：信号的 `domain` 按 (b) 映射，(a) 写入 `evidence` | **待决**，`project_assumption` |
| **D7 四化表异说** | 庚、壬、戊等天干的四化星各派说法不一 | 以 `school` 参数选表 | 采用旧代码同款表（见 3.1 `ziwei.sihua.year-stem-table`） | `cited_unverified`。庚干的常见异说包括「阳武阴同」「阳武同相」「阳武府同」等，具体由哪部典籍、哪个版本支持哪一说**待查** |
| **D8 天魁天钺异说** | 「六辛逢马虎」与「庚辛逢马虎」两说 | 参数化 | 前者（甲戊庚牛羊） | `cited_unverified` |
| **D9 农历历法源** | 公历转农历用哪套表 | `astro-time` 统一提供，对照香港天文台公历农历对照表 | — | 2057 等历法有争议的年份需单独核对（**未核实**具体年份清单） |

---

## 3. 计划实现的规则清单

说明：
- 「来源」中凡写「口诀」的，指斗数传统安星口诀。它们普遍收录在《紫微斗数全书》系的刊本中，但本文作者没有对照具体版本和卷次，所以一律标为 `cited_unverified`，卷章待查。
- 「全书」=《紫微斗数全书》，「全集」=《紫微斗数全集》，均为传世典籍名。旧语料中「罗洪先编」「陈抟传」之类的题署本文不采信，留待版本核对。
- 产出一列中的 `chart` 指写入 `ziwei.chart/1` 的结构；`period` 指时间单位；`signal(t)` 和 `signal(k)` 分别指 tendency 和 key_node。

### 3.1 历法与安宫

| ruleId | 规则内容 | 来源 | 可靠性 | 产出 |
|---|---|---|---|---|
| `ziwei.input.hour-branch` | 按 D1 的时间基准取时辰：23–1 子、1–3 丑……21–23 亥 | 通用时辰制；真太阳时由 `astro-time` 计算 | cited_unverified（时辰制）/ project_assumption（D1 选择） | chart |
| `ziwei.calendar.zi-hour-day-boundary` | 按 D2 处理晚子时换日 | 见 D2 | project_assumption | chart |
| `ziwei.calendar.leap-month-split-15` | 按 D3 处理闰月 | 流传口径，卷章待查 | cited_unverified | chart |
| `ziwei.calendar.year-boundary-new-year` | 年干、年支以正月初一为界（D4） | 卷章待查 | cited_unverified | chart, period |
| `ziwei.palace.ming-gong` | 寅宫起正月，顺数到生月；再从生月宫起子时，逆数到生时，所到之宫为命宫 | 口诀，全书卷章待查 | cited_unverified | chart |
| `ziwei.palace.shen-gong` | 从生月宫起子时，顺数到生时，所到之宫为身宫 | 同上 | cited_unverified | chart |
| `ziwei.palace.twelve-order` | 从命宫起逆时针依次排：命、兄弟、夫妻、子女、财帛、疾厄、迁移、交友（仆役）、官禄、田宅、福德、父母 | 口诀，卷章待查 | cited_unverified | chart |
| `ziwei.palace.stem-wuhudun` | 十二宫宫干由年干按五虎遁定：甲己丙寅、乙庚戊寅、丙辛庚寅、丁壬壬寅、戊癸甲寅，从寅宫顺排（子、丑两宫接在亥宫之后） | 五虎遁口诀，卷章待查 | cited_unverified | chart |
| `ziwei.palace.sanfang-sizheng` | 本宫、对宫（+6）、三合宫（+4、+8）构成三方四正 | 卷章待查 | cited_unverified | chart |
| `ziwei.bureau.nayin` | 五行局 = 命宫宫干支的六十甲子纳音五行：水二局、木三局、金四局、土五局、火六局。**直接按纳音计算，不手抄速查表** | 纳音表（古代通用历法知识）+ 斗数定局法，卷章待查 | cited_unverified | chart |

### 3.2 安星

| ruleId | 规则内容 | 来源 | 可靠性 | 产出 |
|---|---|---|---|---|
| `ziwei.star.ziwei-position` | 设生日为 D、局数为 N。找最小的 x ≥ 0 使 N 整除 D+x，商为 q。从寅宫起数 q 宫；x 为偶数时再顺进 x 宫，为奇数时逆退 x 宫，所到之宫为紫微 | 安紫微诀，卷章待查 | cited_unverified | chart |
| `ziwei.star.tianfu-mirror` | 天府与紫微以寅申为轴对称 | 卷章待查 | cited_unverified | chart |
| `ziwei.star.ziwei-group` | 从紫微逆行：天机 −1，太阳 −3，武曲 −4，天同 −5，廉贞 −8 | 「紫微逆去天机星，隔一太阳武曲辰……」口诀，卷章待查 | cited_unverified | chart |
| `ziwei.star.tianfu-group` | 从天府顺行：太阴 +1，贪狼 +2，巨门 +3，天相 +4，天梁 +5，七杀 +6，破军 +10 | 口诀，卷章待查 | cited_unverified | chart |
| `ziwei.star.zuofu-youbi` | 左辅从辰宫起正月顺数到生月；右弼从戌宫起正月逆数到生月 | 口诀，卷章待查 | cited_unverified | chart |
| `ziwei.star.wenchang-wenqu` | 文昌从戌宫起子时逆数到生时；文曲从辰宫起子时顺数到生时 | 口诀，卷章待查 | cited_unverified | chart |
| `ziwei.star.kui-yue` | 天魁、天钺按年干：甲戊庚 丑未、乙己 子申、丙丁 亥酉、辛 午寅、壬癸 卯巳（魁在前，钺在后） | 口诀（D8 异说），卷章待查 | cited_unverified | chart |
| `ziwei.star.lucun-yang-tuo` | 禄存按年干：甲寅 乙卯 丙戊巳 丁己午 庚申 辛酉 壬亥 癸子；擎羊在禄存前一宫，陀罗在后一宫 | 口诀，卷章待查 | cited_unverified | chart |
| `ziwei.star.tianma` | 天马按年支：申子辰马在寅、寅午戌马在申、巳酉丑马在亥、亥卯未马在巳 | 驿马通例，卷章待查 | cited_unverified | chart |
| `ziwei.star.huo-ling` | 火星、铃星按年支三合定起点：寅午戌 火丑铃卯；申子辰 火寅铃戌；巳酉丑 火卯铃戌；亥卯未 火酉铃戌。从起点起子时，顺数到生时 | 口诀，卷章待查；「顺数」一说各派有分歧（有阴阳顺逆之说），**未核实** | cited_unverified | chart |
| `ziwei.star.dikong-dijie` | 从亥宫起子时：地劫顺数到生时，地空逆数到生时（**时系星，不是年系星**） | 口诀，卷章待查 | cited_unverified | chart |
| `ziwei.brightness.major-14` | 十四主星在十二地支的庙、旺、得、利、平、闲（不）、陷等级 | 必须选定**一个具体版本**的亮度表并登记；目前版本未定 | unverified（在选定版本前） | chart（在 `verified` 之前不参与 signal） |

### 3.3 四化与行限

| ruleId | 规则内容 | 来源 | 可靠性 | 产出 |
|---|---|---|---|---|
| `ziwei.sihua.year-stem-table` | 十干四化（禄、权、科、忌）：甲 廉破武阳、乙 机梁紫阴、丙 同机昌廉、丁 阴同机巨、戊 贪阴弼机、己 武贪梁曲、庚 阳武阴同、辛 巨阳曲昌、壬 梁紫左武、癸 破巨阴贪 | 口诀；庚、壬、戊等有异说（D7） | cited_unverified | chart |
| `ziwei.sihua.natal` | 生年四化 = 以年干（D4 年界）查上表 | 同上 | cited_unverified | chart, signal(t) |
| `ziwei.daxian.start-age` | 第一大限从命宫起，起限虚岁 = 局数，每限 10 年（如水二局为 2–11 岁） | 卷章待查 | cited_unverified | period |
| `ziwei.daxian.direction` | 阳年生男、阴年生女顺行；阴年生男、阳年生女逆行 | 卷章待查 | cited_unverified | period |
| `ziwei.daxian.palace-stem-sihua` | 大限四化 = 以大限所在宫的宫干查四化表 | 实践中广泛使用；典籍依据**卷章待查**，各派用法不同 | cited_unverified | chart, signal |
| `ziwei.tongxian.sequence` | 起限之前的童限（如「一命二财三疾厄……」）序列 | 流传口诀，具体序列**未核实** | unverified | period（第一版只占位，见 omission） |
| `ziwei.xiaoxian.start-direction` | 小限按年支三合起：寅午戌生人起辰、申子辰起戌、巳酉丑起未、亥卯未起丑；虚岁 1 岁在起点，男顺女逆，每年一宫 | 口诀，卷章待查 | cited_unverified | period |
| `ziwei.liunian.taisui-palace` | 流年命宫 = 本命盘中地支等于该流年年支的那一宫；从它逆排出流年十二宫 | 卷章待查 | cited_unverified | period, chart |
| `ziwei.liunian.year-stem-sihua` | 流年四化 = 以流年年干查四化表 | 卷章待查 | cited_unverified | signal |

### 3.4 信号规则（解读层）

这一层是全部规则中**来源最弱**的部分，状态必须如实标注。

| ruleId | 规则内容 | 来源 | 可靠性 | 产出 |
|---|---|---|---|---|
| `ziwei.domain.palace-map` | 宫名到领域的映射：命→turning，兄弟→family（sibling），夫妻→relationship（spouse），子女→family（child），财帛→wealth，疾厄→health（只报「需关注」），迁移→migration，交友→career（friend/subordinate），官禄→career，田宅→family，父母→family，福德→不映射 | 各宫主事属通识，但映射到本项目 8 个领域是工程决定 | project_assumption | 供各信号使用 |
| `ziwei.signal.natal-sihua-palace` | 生年四化所落之宫：禄、权、科为 favorable 倾向，忌为 unfavorable 倾向，作用于全生 | 实践通例，卷章待查 | cited_unverified | signal(t) |
| `ziwei.signal.daxian-transition` | **大限换宫**：每个大限的起点，在 `turning` 领域对本人记一个关键节点，极性为 neutral（规则只说「此时运势主题转换」，不说吉凶） | 交限换运是行限法的基本含义；「交限之年有变动」的明确条文**卷章待查** | cited_unverified | **signal(k)** |
| `ziwei.signal.daxian-ji-palace` | **大限化忌入宫**：大限宫干的化忌星落入某宫，该宫对应领域在这个大限内记关键节点，极性 unfavorable | 实践通例，典籍条文未核实 | unverified | **signal(k)** |
| `ziwei.signal.daxian-lu-palace` | 大限化禄入宫：该宫领域在这个大限内为 favorable 倾向 | 同上 | unverified | signal(t) |
| `ziwei.signal.liunian-ji-overlap` | **流年化忌叠冲**：流年化忌星所在的宫，等于本命化忌或大限化忌所在的宫，或是其对宫。该宫领域在这一年记关键节点，极性 unfavorable | 「忌叠忌」「忌冲」为实践中常见断法，典籍条文未核实 | unverified | **signal(k)** |
| `ziwei.signal.liunian-ji-palace` | 流年化忌入宫，但没有叠冲：只记 unfavorable 倾向 | 实践通例 | unverified | signal(t) |
| `ziwei.signal.liunian-lu-palace` | 流年化禄入宫：favorable 倾向 | 实践通例 | unverified | signal(t) |
| `ziwei.signal.liunian-taisui-palace` | 流年命宫落在本命某宫：该宫领域为本年主题，极性 neutral | 卷章待查 | cited_unverified | signal(t) |
| `ziwei.signal.xiaoxian-palace` | 小限所在宫：该宫领域为本年辅助主题，neutral | 卷章待查 | cited_unverified | signal(t) |

`intensity` 在以上所有规则中一律为 `null`：没有任何一条规则本身规定了强弱等级。

### 3.5 他人结构（relationSlots）

| ruleId | 角色 | 指示宫/星 | 来源 | 可靠性 |
|---|---|---|---|---|
| `ziwei.relation.self` | self | 命宫、身宫 | 卷章待查 | cited_unverified |
| `ziwei.relation.parents-palace` | father, mother | 父母宫。**父母宫本身不区分父与母**，两个 slot 共用同一宫 | 卷章待查 | cited_unverified |
| `ziwei.relation.sun-moon-parents` | father ← 太阳，mother ← 太阴（作为辅助指示） | 流传说法 | unverified |
| `ziwei.relation.siblings-palace` | sibling | 兄弟宫 | 卷章待查 | cited_unverified |
| `ziwei.relation.spouse-palace` | spouse | 夫妻宫 | 卷章待查 | cited_unverified |
| `ziwei.relation.children-palace` | child | 子女宫 | 卷章待查 | cited_unverified |
| `ziwei.relation.friends-palace` | friend, subordinate | 交友（仆役）宫，古称奴仆宫 | 卷章待查 | cited_unverified |
| `ziwei.relation.superior` | superior | 官禄宫与父母宫两说 | 各派不一 | unverified |
| `ziwei.relation.business-partner` | business_partner | 兄弟宫（合伙）、交友宫两说 | 现代用法 | unverified |

每个 slot 的 `attributes` 只放**结构事实**：宫内主星、辅煞、四化、宫干，以及（亮度表核定后的）主星亮度，每项都带 ruleId。「父亲性格刚强」之类的解读属性第一版不输出。`mentor` 和 `rival` 在三合传统中没有对应的宫位规则，输出 omission。

---

## 4. 明确不做的部分

| 内容 | 理由 |
|---|---|
| 飞星派：宫干飞化、自化、来因宫、化忌冲转 | 规则来源无法按本项目要求登记，且派内互相冲突。旧代码中的 `detectSelfSihua` 和 `findIncomingPalaces`（`src/core/ziwei/fourTransformations.ts`）第一版不接入 |
| 格局判定（紫府同宫、杀破狼、阳梁昌禄等） | 格局成立条件和破格条件各书说法不一，且依赖亮度表。现有实现的分值是自造的（见第 8 节）。第二版逐条找到原文后，再以 tendency 形式接入 |
| 杂曜（天刑、天姚、红鸾、天喜、天哭、天虚等）、长生/博士/岁前/将前十二神、旬空截空 | 第一版信号不使用它们；博士十二神旧实现的方向规则不对（见 8.2） |
| 流月、流日、流时、斗君 | 精度超出出生时间可靠度；且旧实现的流月是按数组下标造出来的（见 8.3） |
| 寿元、死亡、疾病诊断 | 契约禁止。疾厄宫只输出「需关注的时段」 |
| 宫位分数、命格等级、`FateVector` | 契约已作废，且没有规则依据 |
| 借对宫星曜（空宫借对宫主星） | 解读层技法，第一版只在 chart 中记录「空宫」事实，不推导 |
| 南北派、中州派的完整差异 | 只把差异点做成 `school` 参数的接口，不实现第二套 |

---

## 5. 黄金用例需求

**原则**：期望值一律来自代码之外。排盘软件的结果只能作为「公认软件结果」使用，并且**至少要两家独立实现一致**，才能作为期望值；两家不一致的用例归入「歧义」类，人工裁定。

| 类别 | 需要覆盖的情形 | 外部来源 | 格式要点 |
|---|---|---|---|
| **正常** | 每种五行局 × 阴阳年 × 两种性别，至少 20 盘；含紫微落在十二宫各一次；含 x 为奇数和偶数（定紫微余数）的盘 | 文墨天机（商业软件）、iztro 开源库（据其仓库声明为 MIT 许可，**需核实**）。两者必须一致 | 输入写明公历时刻、时区、经度、性别和 D1–D5 口径；期望值包括命宫、身宫、五行局、十四主星和六吉六煞所在地支、生年四化、12 个大限的起止虚岁和宫位 |
| **边界** | 晚子时（23:30）；**除夕 23:30**（D2 会改变年干）；闰月初一、十五、十六（D3）；立春与春节之间出生（D4）；农历三十日；中国 1986–1991 夏令时期间出生；新疆、西藏等地真太阳时与北京时间差 2 小时左右（D1 会改变时辰）；时辰边界 ±1 分钟 | 农历换算对照香港天文台公历农历对照表；真太阳时对照 NOAA Solar Calculator 或 USNO 的均时差数据；排盘结果用两家软件，并在软件中设置为相同口径 | 每个用例注明它所检验的口径编号（D1–D5），并分别给出两种口径下的期望值 |
| **非法** | 时区里不存在的本地时刻（夏令时跳过的那一小时）；超出 `astro-time` 农历表范围的日期；缺出生时辰；性别缺失 | 不需要外部数据，期望值是「拒绝并给出哪种 omission」 | 期望写成 `omission.reason` 和缺失字段 |
| **歧义** | 夏令时回拨的重复小时；出生时间不确定度跨越时辰边界；性别为扩展取值；两家软件结果不一致的盘 | 人工裁定，并记录裁定人和依据 | 期望写成「输出两个候选 chart + `ambiguous_input`」，或裁定后的单一结果 |

**需要用户提供或外部获取的数据清单**：
1. 《紫微斗数全书》《紫微斗数全集》的**具体版本**（影印本或可信电子本），用于把 `cited_unverified` 逐条升级为 `verified`，重点核对安星口诀、四化表、亮度表和行限条文。
2. 选定一个亮度表版本，并取得该版本原文。
3. 文墨天机的盘面输出（至少 40 盘，含上表的边界用例），需要有人工操作或授权导出。
4. iztro 的同批输出，并核实其许可证和对晚子时、闰月的默认处理方式（**未核实**）。
5. 香港天文台 1901–2100 年公历农历对照表（`astro-time` 层共用）。
6. 用户拍板：D1（真太阳时）、D2（子时换日）、D3（闰月）、D6（叠宫口径）、D7（四化表）。
7. 若第二版要接中州派，需要王亭之相关著作的授权或可合法引用的安星表。

---

## 6. 向一级世界层交付的内容

### 6.1 时间单位与绝对日期算法

以下所有日期都由 `astro-time` 计算，使用出生地的 IANA 时区，不调用系统时钟。设 `Y0` 为出生时所在的农历年（D4 年界），`NY(y)` 为农历 y 年正月初一 00:00 的绝对时刻（按出生地时区）。

| unit | periodId | 起止 | parentPeriodId | ruleId |
|---|---|---|---|---|
| `ziwei.natal` | `ziwei.natal` | 出生时刻 → 时间线上限 | null | `ziwei.palace.ming-gong` |
| `ziwei.tongxian` | `ziwei.tongxian.{age}` | 虚岁 1 至局数 −1，每岁一段 | `ziwei.natal` | `ziwei.tongxian.sequence`（第一版只出时间段，宫位出 omission） |
| `ziwei.daxian` | `ziwei.daxian.{i}`（i = 1…12） | 起：虚岁 `a = 局数 + 10(i−1)` 的开始，即 `NY(Y0 + a − 1)`（第 1 段若早于出生则取出生时刻）。止：`NY(Y0 + a + 9)`（开区间） | `ziwei.natal` | `ziwei.daxian.start-age` + `ziwei.daxian.direction` |
| `ziwei.xiaoxian` | `ziwei.xiaoxian.{age}` | 虚岁 age：`NY(Y0 + age − 1)` → `NY(Y0 + age)`；age = 1 时从出生时刻起 | 包含它的大限（或童限） | `ziwei.xiaoxian.start-direction` |
| `ziwei.liunian` | `ziwei.liunian.{农历年}` | `NY(y)` → `NY(y+1)` | 包含它的大限 | `ziwei.liunian.taisui-palace` |

说明：
- 小限和流年的时间区间相同（都是一个农历年），但它们是两种规则，所以各自建 period，不合并。
- 小限的交接是否以生日为界，各说不一（**未核实**）。第一版统一用正月初一，并作为 `project_assumption` 登记。
- 时间线上限由主设计者统一给定（例如 100 虚岁）。引擎不对上限做任何「寿元」解读。

### 6.2 key_node 与 tendency

| 产生 key_node 的规则 | 领域 | 极性 | 可靠性 |
|---|---|---|---|
| `ziwei.signal.daxian-transition` | turning | neutral | cited_unverified |
| `ziwei.signal.daxian-ji-palace` | 落入宫对应的领域 | unfavorable | unverified |
| `ziwei.signal.liunian-ji-overlap` | 落入宫对应的领域 | unfavorable | unverified |

只产生 tendency 的规则：`natal-sihua-palace`、`daxian-lu-palace`、`liunian-ji-palace`、`liunian-lu-palace`、`liunian-taisui-palace`、`xiaoxian-palace`。

**刻意的设计**：流年禄、权、科入宫**不**作为分岔点，只有「忌叠冲」才分岔。原因有两条：一是如果每年禄、忌都分岔，一生会有约 180 个分岔点（见第 7 节），世界数不可控；二是规则本身只说「主某方面」，并没有说「此年必有变动」，按契约应当归为 tendency。

`subjectRole`：兄弟、夫妻、子女宫的信号分别标为 sibling、spouse、child；父母宫标为 self 并以 `domain: 'family'` 表达，同时在 `evidence` 中写明「父母宫」（父母宫不分父母，不替用户猜是谁）；其余宫标为 self。疾厄宫的信号只表达「需关注的时段」，`evidence` 中不出现疾病名称。

### 6.3 relationSlots

见 3.5。`indicators` 示例：`palaces[branch=午].majorStars`、`sihua.natal[忌].palaceBranch`。

### 6.4 典型 omissions

| what | reason | detail |
|---|---|---|
| 大限、小限方向 | ambiguous_input | 性别缺失或为扩展取值 |
| 整盘 | input_missing | 缺出生时辰：只能给出年系星（禄存、羊陀、魁钺、天马、火铃的起点）和生年四化的星名，命宫无法确定，因此不出宫位信号 |
| 时辰 | ambiguous_input | 出生时间的不确定度跨越时辰边界，或 D1 两种口径得到不同时辰：输出候选列表 |
| 主星亮度 | not_implemented | 亮度表版本未定，chart 中亮度字段为 null |
| 童限宫位 | no_rule | 童限序列来源未核实 |
| 格局、杂曜、流月流日、飞星 | out_of_scope | 第一版范围外 |
| mentor、rival | no_rule | 三合派没有对应宫位规则 |
| 福德宫领域信号 | no_rule | 本项目的 8 个领域中没有对应项 |
| 学业（study）领域 | no_rule | 斗数没有专门的学业宫；以官禄宫或父母宫（文书）论学业属派内说法，未核实 |

---

## 7. 它的一套世界如何展开

- **分岔点来源**：只有 6.2 中的三条 key_node 规则。
- **数量级估计**（按时间线 100 虚岁计算）：
  - 大限换宫：一生约 9–10 个大限起点落在时间线内，**约 9 个**。
  - 大限化忌入宫：每个大限 1 个，**约 9 个**。
  - 流年化忌叠冲：化忌星由流年天干决定，十干对应 10 颗不同的忌星，每年必然落在某一宫。「叠冲」的条件是这一宫等于本命忌宫、大限忌宫或它们的对宫，即每年命中 2–4 个宫位之一。粗略估计每年的命中概率在 0.2–0.35 之间，因此一生**约 20–35 个**。这个数是对规则结构的估计，不是统计结果，实现后应当用 40 个黄金盘实测分布。
  - **合计约 40–55 个关键节点**，对应 2^40–2^55 个一级世界。按契约惰性定义，不物化。
  - 作为对照：如果把每年的流年禄、忌入宫都当作分岔点，会多出约 200 个，这正是 6.2 刻意避免的。
- **时间单位的保留与映射**：每条 signal 挂在原生 periodId 上（`ziwei.daxian.3`、`ziwei.liunian.2016` 等），period 自带绝对起止时刻。下游的博弈层和坍缩层用绝对时刻对齐其他引擎（例如八字以立春为界的流年），但**不改写**紫微 period 的边界。两个体系的年界差（春节和立春之间的几周）由下游显式处理，不在引擎内对齐。
- **嵌套**：流年和小限挂在大限下，大限挂在 `ziwei.natal` 下。同一个流年内可能同时有「大限换宫」和「流年忌叠冲」两个 key_node，二者独立分岔。

---

## 8. 从旧代码里可以借鉴什么

### 8.1 可以作为参考（仍需按第 3 节逐条重新核对）

- **定紫微**：`src/core/ziwei/starPlacement.ts` 的 `calculateZiweiPosition`（商 + 余数奇偶进退）与口诀一致。人工验算了水二局初一（得丑）、初二（得寅）。
- **天府镜像**：`calculateTianfuPosition`，`(12 − z) % 12`。
- **主星偏移**：`src/core/ziwei/constants.ts` 中的 `ZIWEI_GROUP_OFFSETS` 和 `TIANFU_GROUP_OFFSETS`。
- **左辅右弼、文昌文曲**：`src/core/ziwei/auxiliaryStars.ts` 的公式是对的。但左辅的注释写「寅起正月」，与它自己的代码（辰起）不一致，注释有误。
- **禄存、擎羊、陀罗表，以及天魁天钺表**（D8 的一种说法）：见 `src/core/ziwei/constants.ts`。
- **四化表**：`SIHUA_TABLE`（D7 的一种说法）。
- **五虎遁定宫干**：`src/core/ziwei/palaceStem.ts` 的 `getPalaceStem`，以及 `src/core/ziwei/wuxingJu.ts` 的 `calculateMingGongStem`，两者一致且正确。
- **十二宫逆排**：`src/core/ziwei/palaceLayout.ts` 的 `buildPalaceLayout` 已按逆时针排宫（`mingIndex − i`），修正了旧版 `src/utils/ziweiAlgorithm.ts` 中顺时针排宫（`(mingIndex + index) % 12`，约第 659 行）的错误。
- **大限方向与起限岁数**：`src/core/ziwei/daxian.ts` 的 `calculateDaxian` 与口诀一致，但没有转换成绝对日期。
- **确定性做法**：`src/core/ziwei/liunian.ts` 的 `resolveTargetYear` 不读系统时钟。另外 `explanationTrace` 逐步留痕的做法可以保留，改为挂 ruleId。

### 8.2 已知错误（新设计必须修正，并作为回归用例）

以下判断以第 3 节的口诀为准（口诀本身为 `cited_unverified`），最终以黄金用例确认。

1. **命宫和身宫公式全错**：`src/core/ziwei/palaceLayout.ts` 的 `calculateMingShenGong` 用 `mingIndex = (lunarMonth + hourIndex − 1) % 12`，其中 `hourIndex = hourBranchIndex + 1`，即命宫 = 月 + 时。口诀是「月顺、时逆」，即命宫 = (月 − 1) − 时。脚本穷举 12 月 × 12 时，**144 种组合的命宫全部不同**（两个公式相等需要 2h ≡ −1 (mod 12)，无解）。例：正月子时，口诀得寅，代码得卯。旧版 `src/utils/ziweiAlgorithm.ts` 第 552 行同样有这个错误。由于命宫决定五行局、紫微位置和全部宫名，**旧引擎的整个盘面都不可用**。
2. **五行局表错误**：`src/core/ziwei/constants.ts` 的 `WUXING_JU_TABLE` 以命宫天干为行索引，内容却既不是「命宫干支纳音」，也不是「年干 × 命宫地支」的标准速查表（后者在午未和申酉两列把土、金对调了）。按实际调用路径（五虎遁得命宫干，再查表）穷举 10 年干 × 12 宫，**120 种组合中有 94 种与纳音不符**。现有测试 `src/core/ziwei/__tests__/wuxingJu.test.ts` 断言「丙寅 → 水二局」，但丙寅纳音为炉中火，应为火六局，**测试固化了错误值**。新设计改为直接按纳音计算。
3. **天马全错**：`TIANMA_TABLE` 把寅午戌映射到巳、申子辰映射到亥……四组全部与驿马通例（寅午戌马在申等）不符。旧版 `src/utils/ziweiAlgorithm.ts` 第 207 行同样错误。
4. **火星、铃星起点错**：`src/core/ziwei/auxiliaryStars.ts` 中火星的起点是巳酉丑→午、亥卯未→戌、其余→辰，与口诀（丑、寅、卯、酉）全部不符；铃星对寅午戌、申子辰两组给的是午，应分别为卯、戌。旧版 `calculateHuoxing` 和 `calculateLingxing`（`src/utils/ziweiAlgorithm.ts` 第 262–277 行）同样错误。
5. **地空地劫按年支安**：`DIKONG_TABLE` 和 `DIJIE_TABLE` 以年支为键，而口诀以生时安（亥宫起子时）；而且地劫表「子→丑」与任何一种起法都对不上。
6. **博士十二神方向**：`placeAuxiliaryStars` 只按年干阴阳决定顺逆，忽略了性别（通例是阳男阴女顺、阴男阳女逆，卷章待查）。
7. **子时换日名不副实**：`src/core/ziwei/lunarAdapter.ts` 默认 `zi_hour` 并声称「23 时换日」，但农历日直接取自公历日期，23:00 之后并没有进位到次日。
8. **闰月静默按本月**：`lunarAdapter.ts` 用 `Math.abs(lunarMonthRaw)`，没有口径声明。
9. **流年年界与年龄**：`src/core/ziwei/liunian.ts` 的 `yearToGanZhi` 用公历年 `(year − 4) % 10` 定干支，忽略了春节之前的一两个月；`age = year − birthYear` 不是虚岁，与大限的虚岁口径不一致。
10. **亮度表可疑**：`STAR_BRIGHTNESS` 中紫微在卯、申为「陷」，这与「紫微无陷地」的常见说法冲突（该说法的出处待查）；地空地劫十二宫全为「平」，魁钺和禄存十二宫全为「庙」，像是填充值；查不到时默认返回「平」（`brightnessOf`）。整张表没有版本出处。

### 8.3 没有依据的捏造（不得迁移）

- `src/core/ziwei/brightness.ts` 的 `scorePalace`：权重 2.5、1.5、1.2、0.5，四化加减 +8、+6、+5、−10，空宫 −5，并截断到 5–95。
- `src/core/ziwei/strength.ts`：命格等级的阈值（85、75……）、`favorableElements` 用局的五行加「生我」五行。
- `src/core/ziwei/calculateZiweiChart.ts`：`confidence = 0.72` 及其扣分规则、`completenessScore`。
- `src/core/ziwei/patterns.ts`：每个格局的 `impact` 分值。其中「日月并明」只要全盘任意宫有太阳庙旺加太阴庙旺就成立，与命宫无关；「辅弼夹命」实际检测的是左辅或右弼**在**命宫，并不是「夹」；「魁钺同宫」只要一颗就成立。
- `src/core/ziwei/extendedPatterns.ts` 的 `mapLevel`：excellent→9、good→6、caution→−6。
- `src/core/ziwei/toEngineOutput.ts` 的 `buildZiweiFateVector`：用宫分平均值合成十维分数，以及 `creativity = 加成*3 + 40` 等。整个函数随 FateVector 作废。
- `src/utils/eventSeedExtractors.ts` 的 `extractZiweiEvents`：
  - 宫位事件年龄 `baseAge = 20 + palace.index * 3`，宫位与年龄的关系纯属捏造；
  - 固定概率 0.6、0.65、0.4、0.8 等；
  - 流月段用 `report.palaces[monthOffset]`，即按数组下标轮转，与流月规则无关；
  - 迁移宫天马禄存固定在 22–35 岁（mergeKey `age-28`）；
  - 疾厄宫化忌固定为「38 岁前后防意外」（33–45 岁），既是固定年龄，又越过了健康领域只报「需关注」的边界。

### 8.4 外部语料与 patterns.ts 的来源与许可问题

依据 `src/core/ziwei/external/README.md` 以及对目录内容的抽查：

1. **许可不明**：README 称语料来自 `hpulse01/ziwei-doushu`（fork 自 `Renhuai123/ziwei-doushu`），许可写作「MIT-style」。但 `external/` 目录中**没有 LICENSE 文件**，上游许可**未核实**。
2. **「公版古籍」名不副实**：`external/classics/data/quanshu.ts.txt` 文件头写「公版（明代罗洪先编）」，但段落 `qs-1-2` 是现代白话（「落陷之人有『不甘』二字推动，反能爆发出庙旺命格做不到的逆袭」），**不是《紫微斗数全书》原文**。这类内容被标成古籍出处后进入 RAG，会让下游把现代改写当成典籍引用。`gusuifu.ts.txt` 和 `quanji.ts.txt` 是否存在同样的问题**未核实**，需要逐段比对原文。
3. **现代有版权的内容**：`external/nihai/*.ts.txt` 是倪海厦讲义体系的整理，含传记、医案方剂等（`renji.ts.txt` 有 659 行），属于现代作品，版权状态不明，而且大部分与紫微无关。
4. **`patterns.ts` 不是冻结语料，而是运行时代码**：README 说 `.ts.txt` 文件不参与运行，但 `external/ziwei/patterns.ts` 和 `types.ts` 是真正的 `.ts`，被 `src/core/ziwei/extendedPatterns.ts` 直接 import 进排盘流程。它给每个格局标注了诸如「《紫微斗数全书·紫府同宫格》」之类带篇名的 `source`（全文共约 45 个格局）。这些篇名是否真实存在**未核实**，按本项目规则只能视为 `unverified`。
5. **立场自相矛盾**：`external/ziwei/patterns.ts` 的头注释称「倪师立场：不使用宫干自化、来因宫等飞星派工具」，而 `external/ziwei/sihua.ts.txt` 又写「倪师体系常用：化忌的来因宫」。
6. **名人盘不可用作黄金用例**：`external/ziwei/famous.ts.txt` 自己注明「时辰为估算值」，并附有「命盘显示极强的破格重建之力」之类的事后附会。
7. **排盘算法依赖 iztro**：`external/ziwei/algorithm.ts.txt` 注明「基于 iztro 开源库」。iztro 可以作为黄金用例的交叉核对来源之一（许可待核），但不能作为唯一来源。
8. **RAG 服务**：`supabase/functions/ziwei-rag-explain/index.ts` 用 service role key 查询 `ziwei_corpus`，允许调用方指定 `model`，系统提示词要求「遵循倪海厦体系」。迁移文件 `supabase/migrations/20260607082532_…sql` 对 anon 角色授予了 SELECT。这些属于解释层，不属于引擎规则层；新设计中引擎**不读取**语料库，解释层若保留，必须先完成第 2 条所说的出处清洗。

**处理建议**：第一版规则层**完全不依赖** `external/`。`external/ziwei/patterns.ts` 从排盘流程中移除。语料在完成「逐段比对原文、给出许可结论」之前，不作为任何 ruleId 的来源。

### 8.5 测试现状

`src/core/ziwei/__tests__/` 的 8 个测试文件只断言确定性、数量（12 宫、14 星）和互补性等性质，**没有一条外部期望值**；唯一的具体期望值（丙寅→水二局）是错的。`docs/ALGORITHM_VERIFICATION_MATRIX.md` 中紫微一行已经写明「星表缺独立对盘」「固定流派 + 100 例宫位/安星黄金盘」，与本文的判断一致。`src/core/shared/algorithmSourceRegistry.ts` 把「博士十二神完整」「星曜亮度全表」列为已实现，`sourceUrls` 只写书名，这与本节发现的错误不符，新注册表应当以 ruleId 为粒度重建。本文作者没有运行测试（仓库未安装依赖），上面的穷举结论来自对代码公式的独立脚本复算。

---

## 9. 未决问题与风险

1. **D1–D7 口径待用户拍板**，其中 D1（真太阳时）、D2（子时换日）、D3（闰月）会直接改变命宫，影响面最大。
2. **典籍版本缺失**：没有具体版本，就没有一条规则能升到 `verified`，引擎达不到 `complete`。这需要用户提供或授权采购。
3. **解读层规则（第 3.4 节）大多是 `unverified`**。key_node 依赖「忌叠冲」这类实践断法，典籍原文支持程度不明。如果用户要求只保留 `cited_unverified` 及以上的规则，key_node 就只剩「大限换宫」一条（约 9 个），一级世界会明显稀疏。这需要主设计者权衡。
4. **与八字的年界冲突**：春节到立春之间出生的人，两个引擎的年干不同，下游融合时必须知情，不能当作错误去「修正」。
5. **黄金用例的独立性**：文墨天机和 iztro 可能有共同的上游口径，两者一致不等于正确。边界用例需要人工依据口诀复核。
6. **他人推断的边界**：父母宫不分父母；交友宫同时承载 friend 和 subordinate。从槽位推出的属性只能是结构事实。如果用户录入了他人的出生信息，应当对他人单独排盘，不用槽位结论覆盖。
7. **旧数据污染**：旧版输出的命盘、事件种子和 RAG 解释若已存进数据库，都建立在错误的命宫和五行局之上。重建时需要标记作废，不可迁移。
