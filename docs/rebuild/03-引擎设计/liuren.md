# 大六壬引擎设计（engineId `liuren`）

## 1. 结论摘要

- 大六壬是占问类（`engineClass: 'divinatory'`）体系：以「月将加占时」排出天地盘，再起四课、发三传、布十二天将，断某一时刻所问之事。
- 六壬是三式中**唯一在占课中明确吸纳求测人出生信息**的体系：「年命」（本命 = 出生年支，行年 = 按年龄推算的逐年位置）参与断课。这给出了出生信息进入问事模式的正当通道，但它不是「由出生时刻起课论一生」。
- 建议第一版**不进入**主流程；第二版在问事模式中使用，并把年命作为输入。
- 以出生时刻起课论终身的做法我**不能确认**有成体系的古籍依据，不纳入。
- 旧代码最严重的问题：十二天将的贵人被放在**地盘**的贵人支上，而不是天盘该支所临之处，导致除伏吟课外几乎所有盘的天将位置都错（`src/core/liuren/plate.ts` 的 `placeTwelveDeities`）。
- 建议初始状态：天地盘、四课、三传 `needs_source_validation`；年命、课体解读层 `experimental`。

## 2. 声明的流派和范围

**流派**：以《大六壬指南》《六壬大全》为主的通行六壬：月将按中气换将，九宗门发用，十二天将以昼夜贵人起。`school` 写「大六壬·中气换将·九宗门」。

**输入**：
- 起课时刻（UTC）+ IANA 时区 + 经纬度（若采用真太阳时口径）。
- 问事模式：问题类别、求测人出生年（立春换年后的年支，用于本命）、性别与年龄（用于行年）。
- 不需要姓名。

**口径决策点（待决）**：
1. **月将换将口径**：按中气换将（雨水后亥将、春分后戌将……），还是按太阳实际入宫（考虑岁差后与中气已相差约二十余天）。古法多按中气；现代有人主张按真实太阳位置。旧核心代码按中气（`src/core/liuren/constants.ts` 的 `MID_TERM_TO_GENERAL_BRANCH`）。
2. **昼夜贵人的分界**：卯时至申时为昼（旧代码做法），还是以当地日出日没为界，或卯酉为界。各家不一。
3. **贵人起例表的版本**：甲戊庚、辛、壬癸的昼夜贵人在不同书中存在差异（例如「甲羊戊庚牛」与「甲戊庚牛羊」两种读法导致甲日昼夜贵人对调）。旧代码采用其中一种（`NOBLE_PERSON_DAY`/`NOBLE_PERSON_NIGHT`），出处未标注。必须由用户指定以哪本书为准。
4. **日界**：子初换日还是子正换日，必须与 `astro-time` 统一。
5. **真太阳时**：占时用真太阳时还是区时。
6. **行年起例**：通行说法为男命一岁起丙寅顺行、女命一岁起壬申逆行，年龄按虚岁。来源卷章待查，且需确认年龄换算以立春还是生日为界。

### 2.1 本命类 vs 占问类：六壬如何参与「由出生信息推演一生」

**(a) 是否存在以出生时刻起课论一生的流派**

- 六壬的「年命」是确定存在的概念：本命是求测人出生年的地支，行年是该人当年所行到的干支位置。年命在占课中作为「求测人自身」的类神，与三传、天将、日辰的生克关系参与判断，并可因年命入传、年命上神等决定事情与本人关系的远近。此概念在后世六壬书中普遍出现，具体卷章待查，可靠性标 `cited_unverified`。
- 以出生年月日时起一课、以这课论一生命运（有时称「命课」）的说法我见过流传，但**不能确认**它在《大六壬指南》《六壬大全》等通行典籍中是成体系的章节，也不清楚其规则细节。来源可靠性标 `unverified`，不纳入。
- 行年本身是一条逐年推进的序列，理论上可以排出一个人一生每年的行年干支。但行年的断法是「在某一次占课中看行年与课传的关系」，**脱离具体课传，单独以行年论某年吉凶的规则我没有可核实的来源**。因此不能用行年构造一条本命时间轴。

**(b) 两种参与方式的规则依据与风险**

| 方式 | 规则依据 | 风险 |
|---|---|---|
| 以出生时刻起课论一生 | 排课规则本身有依据；以此论终身的解读规则来源不明 | 解读无出处；没有原生时间轴；会与八字等本命引擎重复使用出生时刻 |
| 问事模式 + 年命 | 起课与断课是六壬本来用途；年命参与断课有后世典籍普遍记载（卷章待查） | 起课时刻需固化；昼夜贵人与贵人起例的流派分歧会直接改变天将；课体断语（如毕法赋）体量大、规则化程度低 |

结论：第二版只用问事模式；年命作为必填输入纳入，这是六壬比奇门、太乙更适合与用户本人绑定的地方。

**(c) 两种方式下分别交付什么**

- 问事模式：`chart` = `liuren.chart/1`（天地盘、四课、三传、十二天将、课体、旬空、本命与行年及其上神）；`timeline` = 一个 `unit: 'liuren.query'` 的时段（见 §6）；`signals` = 以初传、末传及年命关系为依据的 `tendency`；`relationSlots` 仅在问题涉及他人且类神规则可核对时给出。
- 出生时刻起课（若作为实验开启）：只交付 `chart`；`signals` 为空；`omissions` 写 `{what:'以出生课论终身', reason:'no_rule'}`。

## 3. 计划实现的规则清单

| ruleId | 规则内容 | 来源 | 可靠性 | 产出 |
|---|---|---|---|---|
| `liuren.plate.month-general-by-zhongqi` | 月将按中气换将：雨水后登明亥、春分后河魁戌……大寒后神后子 | 《六壬大全》（卷章待查） | cited_unverified | chart |
| `liuren.plate.general-on-hour` | 以月将加于占时之上，天盘十二支随之顺布 | 《大六壬指南》（卷章待查） | cited_unverified | chart |
| `liuren.ke.stem-lodging` | 日干寄宫：甲寅、乙辰、丙戊巳、丁己未、庚申、辛戌、壬亥、癸丑 | 《大六壬指南》（卷章待查） | cited_unverified | chart |
| `liuren.ke.four-lessons` | 四课：干上神为一课，一课上神之上神为二课，支上神为三课，三课上神之上神为四课 | 《大六壬指南》（卷章待查） | cited_unverified | chart |
| `liuren.chuan.zeike` | 贼克：一课下贼上（重审）或一课上克下（元首）取为初传；下贼上优先 | 《大六壬指南》九宗门（卷章待查） | cited_unverified | chart |
| `liuren.chuan.biyong` | 比用：多课有克，取与日干阴阳相比者（知一） | 同上 | cited_unverified | chart |
| `liuren.chuan.shehai` | 涉害：俱比或俱不比，取历涉受克深者；深浅相同以孟仲季取舍 | 同上；计数方式（是否计寄宫干）各家有异 | cited_unverified | chart |
| `liuren.chuan.yaoke` | 遥克：四课无克，取上神克日（蒿矢）或日克上神（弹射） | 同上 | cited_unverified | chart |
| `liuren.chuan.maoxing` | 昴星：无克无遥，阳日取地盘酉上神，阴日取天盘酉下神 | 同上 | cited_unverified | chart |
| `liuren.chuan.biezhe` | 别责：四课缺一，阳日取干合之寄宫上神，阴日取支前三合 | 同上 | cited_unverified | chart |
| `liuren.chuan.bazhuan` | 八专：干支同位，阳日干上神顺数三位，阴日四课上神逆数三位 | 同上 | cited_unverified | chart |
| `liuren.chuan.fuyin` | 伏吟：天地盘不动，有克取克，无克阳取干上、阴取支上，中末以刑递取 | 同上 | cited_unverified | chart |
| `liuren.chuan.fanyin` | 反吟：天地盘对冲，有克取克；无克取驿马为初传 | 同上 | cited_unverified | chart |
| `liuren.chuan.middle-last` | 中传 = 初传上神，末传 = 中传上神（伏吟、八专、别责、昴星等另有规则） | 同上 | cited_unverified | chart |
| `liuren.general.noble-table` | 昼夜贵人起例表 | 待用户指定版本（见 §2 第 3 条） | unverified | chart |
| `liuren.general.noble-on-heaven` | 贵人乘于天盘贵人支之上；贵人所临地盘在亥至辰则顺布，在巳至戌则逆布 | 《大六壬指南》（卷章待查） | cited_unverified | chart |
| `liuren.general.day-night` | 昼夜判定方式 | 待决 | unverified | chart |
| `liuren.xunkong.day-xun` | 日旬空亡 | 六甲旬空通则（卷章待查） | cited_unverified | chart |
| `liuren.nianming.benming` | 本命 = 出生年支（立春换年） | 后世六壬书（卷章待查） | cited_unverified | chart |
| `liuren.nianming.xingnian` | 行年：男一岁丙寅顺行，女一岁壬申逆行 | 后世六壬书（卷章待查） | cited_unverified | chart |
| `liuren.nianming.in-chuan` | 年命入传或年命上神与三传、日干的生克关系，判断此事与本人的关系及利弊 | 后世六壬书（卷章待查） | cited_unverified | signal(tendency) |
| `liuren.leishen.category-map` | 问题类别 → 类神（如财取妻财爻、婚取天后六合等） | 各家差异，需指定版本 | unverified | signal(tendency) |
| `liuren.bifa.*` | 毕法赋诸条 | 《大六壬毕法赋》（卷章待查） | cited_unverified | 第二版不实现 |
| `liuren.timeline.query-window` | 问事课时段 = 起课时刻至选择节点决策窗口终点 | 项目约定 | project_assumption | period |

## 4. 明确不做的部分

- **毕法赋、课体九十八种全谱的断语**：条文数量大、多为情境性断语，规则化需要逐条核对来源，不在第二版范围。
- **应期推算**：六壬有多种应期法，各家不一，出处未核实；不产生 `key_node`。
- **以出生时刻起课论终身**：无可核实来源。
- **以行年单独论某年吉凶**：无可核实来源（见 §2.1）。
- **0–100 分数与 confidence**：旧代码中的数值没有依据（见 §8）。
- 金口诀、小六壬：是不同的术数，不在本引擎内。

## 5. 黄金用例需求

| 类别 | 需要什么 | 来源 | 格式要点 |
|---|---|---|---|
| 正常 | 九宗门每一门至少 2 个实例（共不少于 18 课），昼贵与夜贵各半，阳日与阴日各半 | 《大六壬指南》或《六壬大全》中的成例课（由人工抄录书名、版本、页码）；或至少两款公认六壬排盘软件交叉一致的结果 | 输入：UTC 时刻、时区、经纬度、口径设置；期望：月将、天地盘 12 格、四课、三传及发用方法、十二天将位置、旬空 |
| 边界 | 中气交接前后各 1 分钟（换将）；昼夜分界时辰；子时换日；伏吟与反吟课；八专日；四课重复（别责） | 同上 + 天文历表的中气时刻 | 标注昼夜判定口径与贵人表版本 |
| 非法 | 缺时区、非法时刻、问事模式缺出生年 | 无需外部数据 | 期望错误或 `omissions` |
| 歧义 | 夏令时重叠；出生在立春当天、换年时刻附近（本命年支歧义） | 时区数据库 + 天文历表 | 期望 `ambiguous_input` |
| 年命 | 已知出生年、性别、占年的行年干支实例 | 典籍成例或排盘软件 | 期望本命支、行年干支及其上神 |

**需要用户提供或外部获取的数据清单**：
1. 用户指定贵人起例表的依据书目与版本。
2. 用户对昼夜判定、月将口径、日界、真太阳时的决定。
3. 至少两款六壬排盘软件的名称、版本与流派设置，以及按上表导出的盘。
4. 典籍成例课的人工录入（书名、版本、页码、原文）。
5. 行年起例的书证与年龄口径（虚岁、换岁时点）。

## 6. 向一级世界层交付的内容

**主流程（第一版）**：不交付。

**问事模式（第二版）**：

- `timeline`：一个 `NativePeriod`，`periodId: 'liuren.query.<queryId>'`，`unit: 'liuren.query'`，`start` = 起课时刻，`end` = 世界层给定的决策窗口终点，`parentPeriodId` = 对应本命引擎时段，`ruleId: 'liuren.timeline.query-window'`。
- `key_node`：**无**（应期规则不实现）。
- `tendency`：依据 `liuren.leishen.category-map` 选出类神，结合三传与年命关系（`liuren.nianming.in-chuan`）给出极性；`intensity: null`；`subjectRole` 默认 `self`。
- `relationSlots`：六壬以类神表示他人（例如以天后、六合论配偶，以官鬼论上司），但类神表版本未定，第二版默认为空；版本确定后再逐条加入并标注可靠性。
- 典型 `omissions`：`{what:'年命', reason:'input_missing'}`（未提供出生年）、`{what:'应期', reason:'no_rule'}`、`{what:'毕法赋断语', reason:'not_implemented'}`、`{what:'贵人（昼夜分界歧义）', reason:'ambiguous_input'}`、`{what:'一生时间轴', reason:'out_of_scope'}`。

## 7. 它的一套世界如何展开

- 主流程中不生成一级世界，分岔点数为 0。
- 问事模式只为已有的选择节点附加 `tendency`，不新增分岔点。
- 一个人一生的 key_node 数量：0。依据是本引擎没有可核实、能脱离具体问事而成立的「时段 × 领域有变动」规则。
- 时间保留：起课时刻、时区、口径设置、出生年与性别全部进入 `inputDigest`；行年按起课时刻所在年份计算，并在 `chart` 中保留所用年龄口径。

## 8. 从旧代码里可以借鉴什么

**可参考（仍需核对来源）**：
- `src/core/liuren/constants.ts`：`MID_TERM_TO_GENERAL_BRANCH`（中气换将，与我所知通行口诀一致）、`MONTH_GENERAL_BRANCH`（十二月将名）、`DAY_STEM_PALACE`（日干寄宫，与通行规则一致）、`DEITY_ORDER`（十二天将次序）。
- `src/core/liuren/plate.ts`：`buildPlates`（月将加时）与 `buildFourClasses`（四课）逻辑正确，可直接借鉴结构。
- `src/core/liuren/keti.ts` 的 `deriveThreeTransmissionsFull`：贼克、比用、遥克、昴星、别责、八专的取法与我所知通行规则基本一致，可作为骨架；每一支都需要黄金课验证。

**已知 bug 与教训**：
1. **十二天将位置错误（最严重）**：`src/core/liuren/plate.ts` 的 `placeTwelveDeities` 直接把贵人放在地盘的贵人支（`out[eIdx].deity` 以地盘下标写入），并按该地盘支判断顺逆。通行规则是贵人乘天盘的贵人支，落在该天盘支所临的地盘位置，顺逆也按所临地盘判断。只有伏吟课两者一致。
2. **伏吟中末传用三合代替三刑**：`src/core/liuren/keti.ts` 伏吟分支用 `SAN_HE_NEXT` 取中末传，代码注释也承认是简化。通行规则以刑递取（自刑则取冲），需重写。
3. **反吟无克取支冲代替驿马**：同文件反吟分支以 `oppositeBranch(dayBranch)` 为初传，注释称「驿马（简化取支冲）」。通行规则取驿马。
4. **涉害计数方式存疑**：`shePoHaiDepth` 只计「天盘神所克的地盘支」，不区分下贼上与上克下两种情形下应计的是「受克」还是「克」，也不计寄宫干。我对各家计数细节没有把握，需按所选典籍重写并用成例验证。
5. **八专日注释不准**：`isBaZhuanDay` 的注释列出「戊戌」，但按代码自己的寄宫表戊寄巳，戊戌并不满足判定条件；实现与注释不一致，说明这块没有用外部例子验证过。
6. **缺坐标回退北京**：`src/core/liuren/calculateLiurenChart.ts` 同奇门。
7. **月将回退登明**：`resolveMonthGeneral` 在查不到节气时回退亥将，新设计应报错。
8. **测试无外部期望值**：`src/core/liuren/__tests__/calculateLiurenChart.test.ts` 只检查结构与确定性。

**无依据的捏造（不得迁移）**：
- `src/core/liuren/calculateLiurenChart.ts`：`confidence: 65 + …`、`completenessScore: 85`。
- `src/core/liuren/toEngineOutput.ts`：`base = 50`、贼克 +10、初传天将吉凶 ±8 等加减分与十维 `FateVector`。
- `src/utils/liurenAlgorithm.ts`：`runLiuRen` 用公历月份 `MONTH_JIANG[(localMonth - 1) % 12]` 取月将（与中气换将不符）；`buildTianJiang` 按昼夜而不是按贵人所临地盘决定顺逆；`analyzeNianMing` 用 `(birthYear - 4) % 12` 取本命年支，未按立春换年，也没有行年；`analyzeDeHe` 中 `BRANCHES[(month + 1) % 12]` 标注为 approx；`assessAuspiciousness` 与 `mapToFateVector` 的分数。旧文件中的「年命」只是年支与初传的五行生克，不是六壬年命规则的实现。
- `src/utils/eventSeedExtractors.ts` 的 `extractInstantEvents`：六壬判凶即归入 `health` 类并另生成「需注意健康与安全」种子；年龄窗口、概率均为固定常数（详见 `qimen.md` §8 同一函数的分析）。读取的 `no['课体']`、`no['三传']` 键在核心适配器 `src/core/liuren/toEngineOutput.ts` 的 `normalizedOutput`（键为 `keTi`、`threeTransChu` 等）中不存在。
- 起课时刻为点击时刻：`src/hooks/usePredictionFlow.ts` 第 98、159 行；`src/config/engineActivation.ts` 在 `natalAnalysis` 中激活六壬。

## 9. 未决问题与风险

1. §2 的 6 个口径问题需拍板，其中贵人起例表与昼夜分界会直接改变天将，影响最大。
2. 类神表与年命断法要以哪本书为准；不定下来，问事信号只能是 `project_assumption` 或 `unverified`。
3. 涉害法计数细节需要典籍核对。
4. 是否允许用户指定起课时刻（可被挑选），需要产品层决定。
5. 年命需要出生年与性别，问事模式会因此读取用户的出生信息；需确认这与「问事模式与主流程分离」的设计不冲突。
