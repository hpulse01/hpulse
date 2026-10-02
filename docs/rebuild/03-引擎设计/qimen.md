# 奇门遁甲引擎设计（engineId `qimen`）

## 1. 结论摘要

- 奇门遁甲是占问类（`engineClass: 'divinatory'`）体系：对某一时刻起局，回答「此时此事」的吉凶与方位，本身没有覆盖一生的时间轴。
- 建议第一版**不进入**「由出生信息推演一生」的主流程；`qimen` 只保留排盘核心（时家奇门、转盘、拆补），供第二版「问事模式」使用。
- 「以出生时刻起局论命」的做法（常称「命理奇门」「奇门命理」）我只能确认在近现代著作与民间教学中存在，**无法确认其有可靠的古籍依据**；不纳入第一版，也不作为第二版默认方式。
- 旧代码最严重的问题：八门转盘用一张固定的「时支→宫」映射代替「值使随时辰逐宫行」的规则（`src/core/qimen/constants.ts` 的 `HOUR_BRANCH_PALACE`），导致大部分时辰的八门位置错误；以及整条链路以「点击预测的当前时刻」起局，结果随运行时间变化（`src/hooks/usePredictionFlow.ts` 第 98、159 行 `new Date().toISOString()`）。
- 主要风险：流派分歧大（转盘/飞盘、拆补/置闰、中五寄宫方式），没有外部黄金盘就无法判断排盘对错。
- 建议初始状态：排盘核心 `needs_source_validation`；格局、用神、应期层 `experimental`。

## 2. 声明的流派和范围

**流派**：时家奇门 · 转盘式 · 拆补法定局 · 中五寄坤二。`school` 字段写「时家奇门·转盘·拆补法」。

选择理由：
- 时家奇门（以时辰为单位起局，一天 12 局）是现代最通行的用法，也是问事模式唯一需要的粒度。年家、月家、日家奇门不做。
- 转盘（九星、八门、天盘干作为整体沿八宫环绕旋转）是当代主流排法；飞盘（九星按洛书数序逐宫飞布，入中宫）规则体系不同，作为独立流派在后续版本另立，不在同一引擎里混用。
- 拆补法（三元直接由「当日符头」决定，节气按真实交节时刻切换）是确定性最好的定局方法，不需要「超神接气」的人工判断；置闰法列为待决的备选流派。

**输入**：
- 起局时刻（UTC 瞬时）+ IANA 时区 + 经纬度（用于真太阳时，若流派决定用真太阳时）。
- 问事模式额外需要：问题所属类别（决定用神）、求测人的出生年干支（「年命」，见 §2.1）。
- 不需要姓名、性别（个别流派以性别区分年命取法，属待决项）。

**口径决策点（待决，需用户或主设计者拍板）**：
1. 时辰用真太阳时还是区时（民用钟表时）。旧核心代码走 `normalizeBirthTime` 的真太阳时口径，并在缺坐标时回退到北京坐标（`src/core/qimen/calculateQimenChart.ts`）。新设计：缺坐标时**不回退**，而是在 `omissions` 里报 `input_missing`，或要求明确选择区时口径。
2. 日界：子初（23:00）换日还是子正（00:00）换日。这会影响日柱，进而影响符头与三元。必须与 `astro-time` 层统一。
3. 节气交接：按 `astro-time` 提供的真实交节时刻（精确到分钟）切换，不按公历日期近似。
4. 中五寄宫：本流派寄坤二；部分流派阳遁寄艮八、阴遁寄坤二，列为可选项。
5. 年命取法：以出生年干（立春换年）所在宫为求测人，是常见做法，但古籍出处未核实。

### 2.1 本命类 vs 占问类：奇门如何参与「由出生信息推演一生」

**(a) 是否存在以出生时刻起局论一生的流派**

- 存在被称为「命理奇门」或「奇门命理」的做法：以出生时刻起一张时家奇门盘，看日干、时干、年命所落之宫的星门神来论性格、六亲与一生起伏，有的还以宫位轮转排出「大运」。
- 我能确认的只是这类方法在近现代（大致 20 世纪后期以来）的出版物、讲义与网络教学中流传。我**无法确认**在明清及更早的奇门典籍（如《烟波钓叟歌》《奇门遁甲统宗》一类）中有成体系的「以出生时刻起局论终身」的章节。古典奇门的主体是兵家选择与占事。
- 因此该类规则的来源可靠性一律标 `unverified`。它的「大运」排法各家不一，我没有可核对的统一规则，不写入规则清单。

**(b) 两种参与方式的规则依据与风险**

| 方式 | 规则依据 | 风险 |
|---|---|---|
| 以出生时刻起局论一生 | 排盘本身有依据（与问事同一套排盘规则）；但「用这张盘断一生」的解读规则只有近现代来源，且各家不一 | 解读规则无可靠来源，任何领域信号都会落入 `unverified`；没有原生时间轴，若硬造「大运」就违反「不编造规则」；与八字、紫微等本命引擎重复使用同一出生时刻，却没有独立信息增量 |
| 问事模式：针对某个已提取的重大选择，在某一时刻起局 | 这是奇门的本来用途；排盘、用神、格局有古籍与通行歌诀依据（卷章多数待查） | 起局时刻的选择会影响结果，必须把时刻作为输入固化并哈希；用神对照表的流派差异大；「应期」规则可靠性低 |

结论：第二版若引入奇门，只用问事模式。出生时刻起局最多作为 `experimental` 的研究选项，不进主流程。

**(c) 两种方式下分别交付什么**

- 问事模式：`chart` = 一张时家奇门盘（`qimen.chart/1`）；`timeline` = 一个 `NativePeriod`，`unit: 'qimen.query'`，`start` = 起局时刻，`end` = 该选择节点在世界层给出的决策窗口终点（这是项目约定，不是奇门规则，`ruleId: 'qimen.timeline.query-window'`，来源 `project_assumption`）；`signals` = 针对该问题用神宫的 `tendency`，`subjectRole: 'self'`；格局只作为 `evidence`，不分岔；`relationSlots` 只在问题本身涉及他人（如合作、婚恋）且所用用神规则有出处时给出。
- 出生时刻起局（若作为实验开启）：`chart` 同上；`timeline` 为空；`signals` 为空；`omissions` 写明「奇门无可核实的论终身规则」，`reason: 'no_rule'`。也就是只交付盘面，不交付解读。

## 3. 计划实现的规则清单

来源说明：下表中的歌诀与口诀在多种后世奇门书中重复出现，但我无法给出可靠的卷章，故统一标「卷章待查」。

| ruleId | 规则内容 | 来源 | 可靠性 | 产出 |
|---|---|---|---|---|
| `qimen.ju.dun-by-solar-term` | 冬至至芒种十二节气用阳遁，夏至至大雪十二节气用阴遁 | 《烟波钓叟歌》（卷章待查） | cited_unverified | chart |
| `qimen.ju.table-by-term-yuan` | 二十四节气 × 上中下三元对应局数（如冬至、惊蛰一七四，夏至、白露九三六） | 《烟波钓叟歌》（卷章待查） | cited_unverified | chart |
| `qimen.ju.yuan-by-futou-chaibu` | 拆补法：取当日之前最近的甲日或己日为符头，符头地支为子午卯酉上元、寅申巳亥中元、辰戌丑未下元 | 通行奇门教材，古籍出处未核实 | unverified | chart |
| `qimen.ju.zhirun` | 置闰法：超神接气，于芒种、大雪后置闰 | 古籍出处未核实 | unverified | 不实现（备选流派） |
| `qimen.earth.sanqi-liuyi` | 地盘：戊己庚辛壬癸丁丙乙，从局数宫起，阳遁按九宫数序顺布，阴遁逆布 | 《烟波钓叟歌》（卷章待查） | cited_unverified | chart |
| `qimen.xun.liujia-dun-yi` | 六甲遁于六仪：甲子戊、甲戌己、甲申庚、甲午辛、甲辰壬、甲寅癸 | 《烟波钓叟歌》（卷章待查） | cited_unverified | chart |
| `qimen.zhifu.star-follows-hour-stem` | 旬首所在宫的九星为值符，值符加时干所在宫（时干为甲时用其遁仪） | 《烟波钓叟歌》「值符常遣加时干」（卷章待查） | cited_unverified | chart |
| `qimen.star.rotate-turntable` | 转盘：九星与天盘干随值符整体沿八宫环转 | 转盘派通行排法，古籍出处未核实 | unverified | chart |
| `qimen.zhishi.gate-follows-hour` | 旬首所在宫的八门为值使，从旬首时起按九宫数序每时进一宫（阳顺阴逆），落于时辰所到之宫；其余八门随之环转 | 《烟波钓叟歌》「值使顺逆遁宫去」（卷章待查） | cited_unverified | chart |
| `qimen.center.lodge-kun` | 中五宫寄坤二（星、门、干的寄宫处理） | 流派分歧，出处未核实 | unverified | chart |
| `qimen.deity.eight-gods` | 八神（值符、螣蛇、太阴、六合、白虎、玄武、九地、九天）从值符所在宫起，阳遁顺布、阴遁逆布 | 转盘派通行排法，古籍出处未核实 | unverified | chart |
| `qimen.kongwang.hour-xun` | 时旬空亡：时柱所在旬的后两支为空亡 | 六甲旬空通则（卷章待查） | cited_unverified | chart |
| `qimen.pattern.stem-pairs` | 十干克应：天盘干加地盘干的组合格局（青龙返首、飞鸟跌穴、青龙逃走、白虎猖狂等） | 《烟波钓叟歌》及后世十干克应歌（卷章待查） | cited_unverified | chart（格局列表，作 evidence） |
| `qimen.pattern.liuyi-jixing` | 六仪击刑：戊临震三、己临坤二、庚临艮八、辛临离九、壬临巽四、癸临巽四 | 后世奇门书（卷章待查） | cited_unverified | chart |
| `qimen.pattern.sanqi-rumu` | 三奇入墓：乙临坤二、丙临乾六、丁临艮八（丁墓各家有异） | 后世奇门书（卷章待查），丁奇墓宫存在分歧 | unverified | chart |
| `qimen.pattern.sanzha-wujia` | 三诈五假（三奇得吉门合太阴/六合/九地等） | 后世奇门书（卷章待查） | cited_unverified | chart |
| `qimen.pattern.fuyin-fanyin` | 星盘不动为伏吟，星盘对冲为反吟 | 后世奇门书（卷章待查） | cited_unverified | chart |
| `qimen.yongshen.category-map` | 问题类别 → 用神（如求财取生门、婚姻取乙庚或六合等） | 各家差异大；当前旧表为项目自定 | project_assumption | signal(tendency) |
| `qimen.nianming.birth-year-stem` | 求测人以出生年干所落之宫为本人 | 通行做法，出处未核实 | unverified | signal 的 evidence |
| `qimen.timeline.query-window` | 问事盘的时段 = 起局时刻至选择节点决策窗口终点 | 项目约定 | project_assumption | period |
| `qimen.yingqi.*` | 应期（如值符/用神落空待填实之时） | 各家不一，出处未核实 | unverified | 第一、二版不实现 |

## 4. 明确不做的部分

- **年家、月家、日家奇门**：问事只需时家；其他三家在旧代码中也未实现。
- **飞盘奇门**：与转盘规则不兼容，若要做应作为另一个流派配置，并配独立黄金用例。
- **置闰法**：需要「超神接气」判定，口径更多；先以拆补法跑通。
- **以出生时刻起局论一生的解读**：无可核实来源（见 §2.1）。
- **任何 0–100 分数、confidence 数值**：旧代码中的分数与格局 `impact` 数值都没有规则依据（见 §8）。
- **「凶即健康风险」之类的跨域推断**：没有出处，见 §8 对 `extractInstantEvents` 的说明。
- 拐干、九遁全部、门派变体格局：规则来源不明，暂不做。

## 5. 黄金用例需求

所有期望值必须来自代码之外。可用来源：公认排盘软件的输出截图或导出（需记录软件名称、版本、所选流派设置）、典籍或教材中的成例盘。我不在此给出任何具体期望值。

| 类别 | 需要什么 | 来源 | 格式要点 |
|---|---|---|---|
| 正常 | 阳遁、阴遁各至少 9 局（覆盖 1–9 局），每局至少 2 个不同时辰（含甲时、非甲时） | 至少两款公认排盘软件交叉一致的结果，流派设为「转盘、拆补、寄坤」 | 输入：UTC 时刻、IANA 时区、经纬度、时间口径；期望：节气、三元、局数、九宫各宫的地盘干、天盘干、九星、八门、八神、值符、值使、旬空 |
| 边界 | 交节前后各 1 分钟；冬至、夏至换遁；符头切换日（甲/己日）；子时换日前后；时干落中五；值符旬首仪在中五 | 同上，另需 `astro-time` 的节气时刻与香港天文台或 USNO 公布的节气时刻比对 | 标注所用日界口径和真太阳时口径 |
| 非法 | 缺时区、缺坐标（且未选择区时口径）、非法时刻字符串、超出 `astro-time` 支持范围的年份 | 无需外部数据，期望为结构化错误或 `omissions` | 期望错误码清单 |
| 歧义 | 夏令时重叠时段（同一钟表时刻对应两个 UTC 时刻）、交节时刻落在同一时辰内 | 天文历表 + 时区数据库 | 期望 `ambiguous_input`，不自动猜测 |

**需要用户提供或外部获取的数据清单**：
1. 至少两款公认奇门排盘软件的名称、版本及其流派设置说明，以及按上表时刻导出的完整盘面。
2. 一本可引用的奇门典籍或教材中的成例盘（附书名、版本、页码，由人工核对后录入）。
3. 拆补法与置闰法在同一时刻给出不同局数的对照样本（用于将来增加置闰流派）。
4. 用户对 §2 中 5 个口径问题的决定。
5. 问事模式的用神对照表：需要用户指定以哪本书为准。

## 6. 向一级世界层交付的内容

**主流程（第一版）**：不交付。引擎注册表中 `qimen` 不被「由出生信息推演一生」的编排调用。

**问事模式（第二版）**：

- `timeline`：一个 `NativePeriod`，`periodId: 'qimen.query.<queryId>'`，`unit: 'qimen.query'`，`start` = 起局时刻（由 `astro-time` 规范化后的 UTC），`end` = 世界层给定的决策窗口终点，`parentPeriodId` = 该重大选择所在的本命引擎时段 ID（可为 null），`ruleId: 'qimen.timeline.query-window'`。
- `key_node`：**无**。奇门的应期规则无可核实来源，所以问事模式只产生 `tendency`，不让奇门制造分岔；它的结果作为附加信号影响该选择节点的博弈收益。
- `tendency`：由 `qimen.yongshen.category-map` 选出用神宫，再根据该宫的门、星、神与已核实的格局给出 `polarity`；`intensity` 一律为 `null`（没有分级规则）；`domain` 由问题类别映射；`subjectRole` 一般为 `self`。
- `relationSlots`：只有在问题涉及他人、且所用用神规则来源可核对时，才给出对方的宫位（例如合作问题中对方的用神宫）；否则为空。默认第二版为空。
- 典型 `omissions`：`{what:'一生时间轴', reason:'out_of_scope'}`、`{what:'应期', reason:'no_rule'}`、`{what:'用神（类别未提供）', reason:'input_missing'}`、`{what:'起局时刻处于夏令时重叠', reason:'ambiguous_input'}`、`{what:'年命宫（未提供出生年）', reason:'input_missing'}`。

## 7. 它的一套世界如何展开

- 在主流程中，奇门不生成一级世界，分岔点数为 0。
- 在问事模式中，每次起局只为一个已存在的选择节点附加 `tendency`，不新增分岔点，所以不会扩大 2^N 的世界数量。
- 一个人一生的 key_node 数量：0。依据是本引擎不存在可核实的「时段 × 领域有变动」规则。
- 时间保留：起局时刻以 UTC 瞬时 + 时区 + 口径设置固化在输入里，`inputDigest` 覆盖这些字段；同一问题重新运行必须得到同一张盘。

## 8. 从旧代码里可以借鉴什么

**可参考（仍需按 §3 重新核对来源）**：
- `src/core/qimen/constants.ts`：`JU_TABLE`（24 节气 × 三元局数）、`YANG_DUN_TERMS`/`YIN_DUN_TERMS`、`SAN_QI_LIU_YI_ORDER`、`XUN_SHOU_YI`、`STAR_AT_PALACE`、`GATE_AT_PALACE`、`FU_TOU_GROUP`、`LOOP_ORDER`、`PALACE_META`。我逐项对照了通行口诀，局数表与六甲遁仪表与我所知一致，但仍需黄金盘确认。
- `src/core/qimen/ju.ts` 的 `findFuTou`、`determineThreeYuan`、`resolveJu`：拆补法的符头与三元判定逻辑清楚，可借鉴结构。
- `src/core/qimen/stems.ts` 的 `placeSanQiLiuYi`：地盘按九宫数序顺逆布，逻辑正确。
- `src/core/qimen/stars.ts` 的 `rotateStars` 与 `src/core/qimen/advancedPatterns.ts` 的 `rotateHeavenStems`：值符加时干、星盘与天盘干同步旋转的做法可借鉴。
- `src/core/qimen/advancedPatterns.ts` 的 `JI_XING_PALACE`、`QI_MU_PALACE`、`STEM_PAIR_PATTERNS`（只借鉴格局名称与判定条件，不借鉴 `impact` 数值）。
- `src/utils/qimenAlgorithm.ts` 的 `calculateKongWang`（时旬空亡）可作参考。
- 每一步写入 `explanationTrace` 的做法值得保留，新设计可直接把 trace 的 `rule` 字段换成 `ruleId`。

**已知 bug 与需带入新设计的教训**：
1. **八门转盘规则错误**：`src/core/qimen/gates.ts` 的 `rotateGates` 用 `src/core/qimen/constants.ts` 的 `HOUR_BRANCH_PALACE`（子1、丑寅8、卯3……）把值使门直接放到「时支对应的后天卦宫」。通行规则是值使从旬首时所在宫起，按九宫数序每时进一宫（阳顺阴逆，经过中五时寄宫）。两者只在少数时辰巧合一致。这是最严重的排盘错误。
2. **天禽固定在中宫**：`src/core/qimen/stars.ts` 把天禽始终留在 5 宫，值符为天禽时取其名但按坤二旋转。转盘派通常让天禽随寄宫之星同行，需要按所选流派明确定义。
3. **缺坐标静默回退北京**：`src/core/qimen/calculateQimenChart.ts` 在未提供经纬度时使用北京坐标，只发 warning。新设计应报 `input_missing` 或要求明确口径。
4. **未知节气回退阳遁 1 局**：`src/core/qimen/ju.ts` 的 `resolveJu` 在查不到节气时回退到阳遁 1 局。新设计应抛错，而不是给出看似正常的盘。
5. **测试没有外部期望值**：`src/core/qimen/__tests__/calculateQimenChart.test.ts` 只检查结构（9 宫、八门各一次、确定性），没有任何来自排盘软件或典籍的期望盘，所以第 1 条 bug 未被发现。

**无依据的捏造（不得迁移）**：
- `src/core/qimen/calculateQimenChart.ts`：`confidence = 72 + …` 的公式与 `completenessScore = 85`。
- `src/core/qimen/advancedPatterns.ts`：各格局的 `impact` 数值（+9、−7 等）以及 `detectFuYinFanYin` 的 `scoreAdjustment`（−5、−8）。
- `src/core/qimen/toEngineOutput.ts` 的 `buildFateVector`：基准 50、吉门 +15、吉星 +8 等加减分，以及十维 `FateVector`。
- `src/core/qimen/constants.ts` 的 `YONG_SHEN_MAP`：类别到用神的映射没有注明出处（例如「决策」「其他」取天辅），属项目自定。
- `src/utils/qimenAlgorithm.ts`：`getApproxJieqiIndex` 按公历月日近似节气；`getJuNumber` 用 `day % 3` 决定三元；`runQimen` 用 `getFullYear()/getHours()` 依赖运行环境时区；`confidence: 0.65`、`sourceGrade: 'B'` 与核心版本的 `C` 矛盾。整个文件不应作为参考，只有空亡、马星等常量可查阅。
- `src/utils/eventSeedExtractors.ts` 的 `extractInstantEvents`：以 `queryTimeUtc` 的年份减出生年得到「当前年龄」，固定生成 `[年龄, 年龄+2]` 的事件；无年龄时固定用 28–33 岁；概率固定 0.65/0.55/0.45；奇门判凶即归入 `accident`，并另外生成「需注意健康与安全」的种子（概率 0.35）。这些都没有规则依据。此外它读取的 `no['吉凶']`、`no['遁局']` 等键在核心适配器 `src/core/qimen/toEngineOutput.ts` 的 `normalizedOutput` 中不存在（核心输出的是 `dun`、`ju`、`zhiFuStar` 等），所以吉凶判定实际取决于旧实现覆盖后的字段，行为不透明（覆盖逻辑见 `src/utils/p4CoreOverlay.ts` 的 `applyCoreOverlay`，其合并细节未核实）。
- **起局时刻 = 用户点击时刻**：`src/hooks/usePredictionFlow.ts` 第 98、159 行用 `new Date().toISOString()` 作为 `queryTimeUtc`，`src/config/engineActivation.ts` 让奇门在 `natalAnalysis` 中也处于激活状态。结果是同一个人的「一生预测」每运行一次都会变，这是占问类引擎被误用于本命流程的直接表现。

## 9. 未决问题与风险

1. §2 的 5 个口径决策（真太阳时、日界、中五寄宫、年命取法、置闰）需要拍板。
2. 第二版问事模式的用神表以哪本书为准；不定下来，`tendency` 只能标 `project_assumption`。
3. 问事模式的起局时刻由谁决定：用户真实提问的时刻，还是允许用户选择时刻。后者使结果可被「挑选」，需要在产品层说明。
4. 「命理奇门」的典籍依据未能确认；若用户坚持纳入，需要用户提供可引用的书目，并接受 `experimental` 状态。
5. 黄金用例完全依赖外部排盘软件，而不同软件之间也存在流派差异，需要在用例中记录软件的流派设置。
