# 八字引擎设计（engineId: `bazi`）

> 状态：设计稿。本文只做设计，不包含实现。所有关于现有代码的陈述均附文件路径；未亲自读过的内容标「未核实」。
> 来源可靠性四档：`verified`（有可复核的权威技术参考或可直接数学推导）/ `cited_unverified`（确信该典籍存在且论及此题，但卷章未核对）/ `unverified`（说不准出自哪部典籍，多见于近现代通行书籍或口诀）/ `project_assumption`（本项目为可计算性做出的约定）。

---

## 1. 结论摘要

1. 八字是第一阶段两个主干引擎之一，在新系统中负责给出「以节气为骨架的十年（大运）—一年（流年）两级时间轴」以及每个时段上按领域、按六亲的倾向与关键节点；它是一级世界里时间刻度最清楚、分岔点来源最明确的引擎。
2. 第一版范围：排盘（四柱、十神、藏干、纳音、旬空）、大运（顺逆、起运、交运绝对日期）、流年（立春到立春）、原局与岁运之间的合冲刑害、宫位与十神两套六亲取法；**不做**数值化的日主强弱分数、不做自动用神判定、不做神煞、不做盲派、不做流月流日。
3. 关键节点（key_node）只来自少数「结构性事件」：大运交接、流年/大运冲四柱地支（尤其冲日支、冲月令）、岁运并临、天克地冲日柱。这些规则大多是通行说法，来源可靠性普遍只有 `cited_unverified` 或 `unverified`，文档逐条如实标出。
4. 主要风险：(a) 喜忌/用神流派分歧极大，第一版信号的极性（favorable/unfavorable）基本只能给 `neutral`/`mixed`，对下游博弈的区分度有限；(b) 日界（子时）、真太阳时、起运折算三处口径必须由产品拍板，否则同一出生信息会出不同的盘；(c) 旧代码在非东八区出生地的日柱计算上有实质性错误（见第 8 节）。
5. 建议初始状态：`partial`。排盘层在黄金用例齐备后可以单独达到可信；但规则层多数来源未核卷章，整体不能升 `complete`。若产品要求第一版就带喜忌极性，则该子模块单独标 `experimental`。

---

## 2. 声明的流派和范围

### 2.1 流派声明

`school: '子平法·四柱（立春切年、节气切月）；格局与六亲取法以《子平真诠》体系为主，参校《渊海子平》《三命通会》'`

选择理由：
- 子平法是目前通行四柱八字的主干，排盘规则（年月日时四柱、十神、藏干、大运）在各派之间基本一致，分歧集中在日界、起运折算和强弱用神，便于把「一致的部分」与「分歧的部分」切开。
- 《子平真诠》（清·沈孝瞻）以月令定格、讨论六亲配宫分，比《滴天髓》的气势论更容易落成离散规则；《滴天髓》（及任铁樵《滴天髓阐微》）的扶抑/气势判断和《穷通宝鉴》的调候用神作为「备选判断体系」登记，但第一版不启用。
- 不选盲派：其技法主要靠口传和近现代出版物，可引用的稳定底本缺乏。

### 2.2 输入

| 字段 | 必需性 | 用途 | 缺失时 |
|---|---|---|---|
| 出生本地日期时间（公历，精确到分钟） | 必需（日期）；时间可缺 | 四柱 | 时间缺失 → 只排三柱，时柱及依赖时柱的规则进入 `omissions`（`input_missing`）；起运精度降为区间 |
| IANA 时区 | 必需 | 本地时间→UTC 瞬时 | 拒绝排盘（`input_missing`），**不得**静默回落 UTC |
| 出生地经纬度 | 强烈建议 | 真太阳时（时柱、日界）；南半球标记 | 若产品口径为「用真太阳时」则时柱进入 `ambiguous_input`；若口径为「用民用时」可继续 |
| 性别（male/female） | 大运必需 | 大运顺逆；六亲取法男女不同 | 大运整条时间轴与六亲中依赖性别的条目进入 `omissions`（`input_missing`）；**不得**默认为男 |
| 子时/日界口径 | 产品配置，写入 `inputDigest` | 23:00–24:00 的日柱与时柱 | 用产品默认值，并在 `chart` 中记录所用口径 |
| 起运折算口径 | 产品配置，写入 `inputDigest` | 交运绝对日期 | 同上 |
| 姓名 | 不需要 | — | — |

农历输入：八字本身不依赖农历月（用节气月），农历闰月问题对排盘无影响。用户若以农历录入，由 `astro-time` 转公历；该转换的闰月口径不属本引擎。

### 2.3 口径决策点（需产品拍板的列为「待决」）

| 编号 | 问题 | 选项 | 建议 | 状态 |
|---|---|---|---|---|
| D1 | 年柱分界 | 立春瞬时 / 春节 / 公历元旦 | 立春瞬时（太阳视黄经 315°）。旧 `src/core/bazi/__tests__/parity.test.ts` 已记录旧实现按春节切年的错误 | 建议定案 |
| D2 | 月柱分界 | 「节」的瞬时 / 节所在日的 0 点 | 节的瞬时 | 建议定案 |
| D3 | 日界与子时 | A：23:00 换日（子初换日）；B：0:00 换日，23:00–24:00 为「夜子时」，日柱不变、时干按次日起（早晚子时派）；C：0:00 换日，23:00–24:00 时干仍按当日五鼠遁 | 默认 A，B 作为可选口径；C 不建议（无可引用的依据）。23:00–00:00 出生者在 `omissions` 里标 `ambiguous_input` 并在 `chart.alternatives` 给出另一口径的日柱/时柱 | **待决** |
| D4 | 判断「几点」用哪种时间 | 民用钟表时（含夏令时）/ 区时（去夏令时）/ 平太阳时 / 真太阳时 | 时柱与日界一律用真太阳时（地方视太阳时）；无经纬度时退回区时并标 `ambiguous_input`。理由（project_assumption）：古代计时本是日晷视太阳时，真太阳时比现代区时更接近原始口径。年柱、月柱、起运距离都比较 UTC 瞬时，与真太阳时无关 | **待决** |
| D5 | 起运折算 | (a) 3 日=1 岁、1 日=4 个月、1 时辰=10 日（离散折算，等价于 1 日→120 日）；(b) 同 (a) 但按分钟线性折算（1 分钟→2 小时）；(c) 以回归年长度线性折算（3 日→1 回归年） | 默认 (b)（与 (a) 在整时辰处一致、无取整跳变）；(a)(c) 作为可选口径，结果差异写入 `chart.dayun.startOffsetAlternatives` | **待决** |
| D6 | 大运每步长度的落地 | 交运日起每 10 个公历年（同月同日）/ 3652.42 日 | 每 10 个公历年的同一本地日期时刻（project_assumption） | 待决（影响小） |
| D7 | 起运前（童限）怎么处理 | 不设大运 / 小运（以时柱起） / 以月柱为「第 0 运」 | 设一个 `bazi.pre-dayun` 时段，不赋干支；小运不做（见第 4 节） | 建议定案 |
| D8 | 南半球月柱 | 照北半球 / 月支对冲调换 | 照北半球，标记 `southern_hemisphere` 供审阅；调换法为近现代少数派主张，来源 unverified | 建议定案 |
| D9 | 流年跨越大运交接 | 流年整体挂在年初所在大运下 / 按交运日切成两段 | 切成两段（periodId 带后缀，见第 6 节） | **待决**（需主设计者确认契约允许） |
| D10 | 支持年份范围 | — | 初定 1900–2100（节气与 tzdb 历史数据可交叉核验的范围）；范围外进入 `out_of_scope`。tzdb 自身声明 1970 年前的数据不保证准确，中国 1949 年前多时区情况尤其需要核对 | 待决 |

---

## 3. 计划实现的规则清单

说明：
- 「产出」列：`chart` = 盘面结构字段；`period` = 时间单位；`signal(tendency)` / `signal(key_node)`；`relationSlot`。
- 所有经典书名均为确信存在的典籍；卷章一律「卷章待查」，未写出页码、版本。
- 纯天文/历法规则以「技术参考」作来源，可以用外部历表独立复核，标 `verified` 的前提是黄金用例通过；在此之前写作「verified（待用例确认）」的，实际登记时先按 `cited_unverified` 处理。

### 3.1 排盘（pillar）

| ruleId | 规则内容 | 来源 | 可靠性 | 产出 |
|---|---|---|---|---|
| `bazi.pillar.year-boundary-lichun` | 年柱以立春瞬时（太阳视黄经 315°）为界 | 立春的天文定义：香港天文台/紫金山天文台节气时刻表、JPL Horizons 太阳黄经；「以立春换年柱」为子平通行口径，典籍出处：《渊海子平》（卷章待查） | 天文部分 verified（待用例确认）；换年口径 cited_unverified | chart |
| `bazi.pillar.year-ganzhi-cycle` | 年干支按六十甲子逐年递进（锚点用外部万年历核对） | 六十甲子纪年，技术参考：香港天文台公历农历对照表的年干支 | cited_unverified（待黄金用例与版本核定后升 verified） | chart |
| `bazi.pillar.month-boundary-jie` | 月支以十二「节」（立春、惊蛰…小寒）瞬时为界，立春起寅月 | 节气时刻表（同上）；节令定月为子平通行口径，《渊海子平》（卷章待查） | 天文部分 verified；口径 cited_unverified | chart |
| `bazi.pillar.month-stem-wuhudun` | 月干由年干按「五虎遁」起（甲己之年丙作首…） | 《渊海子平》（卷章待查）；与六十甲子连续性可数学自洽检验 | cited_unverified | chart |
| `bazi.pillar.day-ganzhi-cycle` | 日干支按六十甲子逐日连续循环，不受月、年、闰月影响 | 技术参考：以儒略日序号取模 60（锚点必须以外部万年历日干支核定，不在本文写死常数） | cited_unverified（锚点经外部万年历核定后升 verified） | chart |
| `bazi.pillar.day-boundary-zi-initial` | 口径 A：23:00（按 D4 所定时间）起即属次日，日柱进一 | 子初换日说，通行说法，具体典籍出处 unverified | unverified | chart |
| `bazi.pillar.day-boundary-midnight-yezi` | 口径 B：0:00 换日；23:00–24:00 为夜子时，日柱不变，时干按次日日干起 | 早晚子时说，近现代通行，典籍出处 unverified | unverified | chart |
| `bazi.pillar.hour-branch` | 时支按十二时辰，每时辰两小时，子时跨 23:00–01:00 | 通行十二时辰制，《渊海子平》（卷章待查） | cited_unverified | chart |
| `bazi.pillar.hour-stem-wushudun` | 时干由日干按「五鼠遁」起（甲己还加甲…） | 《渊海子平》（卷章待查） | cited_unverified | chart |
| `bazi.pillar.true-solar-time` | 时柱与日界所用时刻 = 地方真太阳时（经度修正 + 均时差） | 均时差：Meeus《Astronomical Algorithms》；实现由 `astro-time` 提供；在八字中使用真太阳时为产品口径 | 计算部分 verified；口径 project_assumption | chart |
| `bazi.pillar.boundary-ambiguity` | 出生时刻距任一节、子时边界、时辰边界小于产品设定阈值（例如真太阳时修正不确定度）时，标记歧义并给出另一候选柱 | — | project_assumption | chart + omission |

### 3.2 十神、藏干与基础属性（chart）

| ruleId | 规则内容 | 来源 | 可靠性 | 产出 |
|---|---|---|---|---|
| `bazi.chart.day-master` | 日柱天干为日主 | 子平通行；《渊海子平》（卷章待查） | cited_unverified | chart |
| `bazi.chart.ten-gods` | 以日主为我，按五行生克与阴阳同异定十神（同我比劫、生我印、我生食伤、我克财、克我官杀；同性为偏，异性为正） | 《渊海子平》《子平真诠》（卷章待查）；规则本身可由五行生克表完全推导 | cited_unverified（规则自洽，名称出处待查） | chart |
| `bazi.chart.hidden-stems` | 地支藏干表（本气/中气/余气） | 《渊海子平》《三命通会》均有地支藏干之说（卷章待查）。**各本顺序与内容有出入**：旧代码两个版本对「巳」的中气余气顺序就不一致（见第 8 节），需选定一部底本并逐支核对 | cited_unverified | chart |
| `bazi.chart.hidden-stem-weights` | 藏干力量权重 | 无可引用的统一数值（旧代码用 1/0.5/0.3 与 1/0.6/0.3 两套，均无出处） | — | **不输出**，见第 4 节 |
| `bazi.chart.renyuan-siling` | 人元司令（节后若干日由某藏干当令） | 《渊海子平》或《三命通会》有「人元司令分野」之说（卷章待查）；各本天数不一 | cited_unverified | 第一版不做，登记待用 |
| `bazi.chart.nayin` | 六十甲子纳音 | 《三命通会》论纳音（卷章待查）；表本身各本一致性高 | cited_unverified | chart |
| `bazi.chart.xunkong` | 以日柱所在旬定旬空两支 | 六十甲子分旬，可数学推导；《三命通会》（卷章待查） | cited_unverified | chart |
| `bazi.chart.twelve-stages` | 十二长生（阳干顺行、阴干逆行） | 《三命通会》（卷章待查）。**阴干是否另起长生有争议**（《滴天髓》系统对阴长生有批评，具体出处待查） | cited_unverified，阴干部分标争议 | chart（只作属性，不驱动信号） |
| `bazi.chart.season-command` | 月令（月支本气）对日主的关系：得令（同五行或生我）/ 失令 | 《子平真诠》以月令为提纲（卷章待查） | cited_unverified | chart |
| `bazi.chart.rooting` | 日主通根：四支藏干中是否有与日主同五行者，记录位置与本/中/余气 | 《滴天髓》论通根（卷章待查） | cited_unverified | chart（只列事实，不打分） |
| `bazi.chart.revealed` | 透干：月令藏干是否透出于年、月、时干 | 《子平真诠》论用神透干（卷章待查） | cited_unverified | chart |

### 3.3 合冲刑害（interaction）

适用于三种关系：原局内部、岁运（大运或流年）与原局、大运与流年。

| ruleId | 规则内容 | 来源 | 可靠性 | 产出 |
|---|---|---|---|---|
| `bazi.interaction.stem-five-combine` | 天干五合（甲己、乙庚、丙辛、丁壬、戊癸） | 《三命通会》论十干合（卷章待查） | cited_unverified | chart |
| `bazi.interaction.stem-combine-transform` | 五合是否「化」（化神得月令、无克化之神等条件） | 《子平真诠》《滴天髓》均论合化（卷章待查），条件说法不一 | cited_unverified，条件标争议 | 第一版只记录「合」，不判定「化」 |
| `bazi.interaction.stem-clash` | 天干相冲（甲庚、乙辛、丙壬、丁癸） | 通行说法；典籍出处 unverified | unverified | chart |
| `bazi.interaction.branch-six-combine` | 地支六合（子丑、寅亥、卯戌、辰酉、巳申、午未） | 《三命通会》论支元六合（卷章待查） | cited_unverified | chart, signal(tendency) |
| `bazi.interaction.branch-three-combine` | 地支三合局（申子辰水等）及半合 | 《三命通会》（卷章待查）；半合是否成局各说不一 | cited_unverified；半合 unverified | chart, signal(tendency) |
| `bazi.interaction.branch-three-meet` | 地支三会方（寅卯辰木等） | 通行说法（卷章待查） | cited_unverified | chart |
| `bazi.interaction.branch-six-clash` | 地支六冲（子午、丑未、寅申、卯酉、辰戌、巳亥） | 《三命通会》（卷章待查） | cited_unverified | chart, signal(key_node 见 3.7) |
| `bazi.interaction.branch-punish` | 三刑（寅巳申、丑戌未、子卯）与自刑（辰午酉亥） | 《三命通会》论三刑（卷章待查）；三刑需三支齐全还是两支即算，各说不一 | cited_unverified，成立条件标争议 | chart, signal(tendency) |
| `bazi.interaction.branch-harm` | 六害（子未、丑午、寅巳、卯辰、申亥、酉戌） | 《三命通会》（卷章待查） | cited_unverified | chart |
| `bazi.interaction.branch-break` | 六破 | 来源说不准 | unverified | 第一版不做 |

### 3.4 大运（dayun）

| ruleId | 规则内容 | 来源 | 可靠性 | 产出 |
|---|---|---|---|---|
| `bazi.dayun.direction` | 阳年男、阴年女顺行；阴年男、阳年女逆行（以年干阴阳论，年干按立春后年柱） | 《渊海子平》《三命通会》论起大运（卷章待查） | cited_unverified | chart |
| `bazi.dayun.sequence` | 首运为月柱在六十甲子中顺进一位或逆退一位，此后每运依次推进 | 同上 | cited_unverified | chart, period |
| `bazi.dayun.start-distance` | 顺行数到出生后的下一个「节」，逆行数到出生前的上一个「节」（只数节，不数中气），取两瞬时之差 | 同上；瞬时由节气表给出 | cited_unverified | chart |
| `bazi.dayun.start-offset-120x` | 口径 (a)/(b)：三日折一岁，一日折四月，一时辰折十日；即出生后起运时刻 = 出生瞬时 + 距节时长 × 120 | 「三日为一岁」见《三命通会》论大运（卷章待查）；一日四月、一时辰十日为通行的细化折算 | cited_unverified | period |
| `bazi.dayun.start-offset-tropical` | 口径 (c)：距节时长 ÷ 3 日 × 1 回归年 | 近现代软件常见做法，典籍出处无 | project_assumption | period（可选口径） |
| `bazi.dayun.step-length` | 每步大运十年 | 同 `bazi.dayun.direction` | cited_unverified | period |
| `bazi.dayun.ten-god` | 大运干对日主之十神、大运支藏干十神 | 同 `bazi.chart.ten-gods` | cited_unverified | chart |
| `bazi.dayun.stem-branch-weight` | 「上五年看干、下五年看支」 | 民间通行说法，另有「干支各管十年、合看」之说；出处 unverified | unverified | 第一版不做（不切分大运） |

### 3.5 流年（liunian）

| ruleId | 规则内容 | 来源 | 可靠性 | 产出 |
|---|---|---|---|---|
| `bazi.liunian.boundary-lichun` | 流年以当年立春瞬时起、次年立春瞬时止 | 与 `bazi.pillar.year-boundary-lichun` 同一口径 | 同左 | period |
| `bazi.liunian.ganzhi` | 流年干支即该年年柱干支 | 同 `bazi.pillar.year-ganzhi-cycle` | cited_unverified（待黄金用例与版本核定后升 verified） | chart, period |
| `bazi.liunian.ten-god` | 流年干对日主之十神 | 同 `bazi.chart.ten-gods` | cited_unverified | chart, signal(tendency) |

### 3.6 强弱 / 格局 / 用神（第一版只给事实或不做）

此部分是流派分歧最大处：《子平真诠》以月令定格、取「相神」；《滴天髓》重扶抑与气势、有从化之论；《穷通宝鉴》以调候为先；近现代还有大量计分法。没有一个可引用的、各派公认的数值算法。第一版策略：**只输出可直接核对的事实项**，不输出「身强/身弱」结论，不输出用神。

| ruleId | 规则内容 | 来源 | 可靠性 | 产出 / 第一版处理 |
|---|---|---|---|---|
| `bazi.strength.facts` | 列出得令/失令、通根位置、透干、比劫印绶与克泄耗的十神计数（只计数，不加权求和） | 由 3.2 各规则组合，不引入新判断 | 同所引规则 | chart |
| `bazi.strength.verdict` | 日主强弱结论 | 各派说法不一，无统一算法 | — | **不做**，`omissions`（`no_rule`） |
| `bazi.pattern.month-command` | 月令本气（或透出的藏干）十神定格（正官格、七杀格、财格、印格、食神格、伤官格；建禄、月刃另论） | 《子平真诠》论用神、论格局（卷章待查） | cited_unverified | chart（只作候选，带「透/不透」事实，不给置信度） |
| `bazi.pattern.special` | 从格、化气格、专旺格 | 《滴天髓》等（卷章待查），成立条件分歧大 | cited_unverified，条件争议 | 不做 |
| `bazi.yongshen.tiaohou-table` | 调候用神表（日干 × 月支 → 用神天干序列） | 《穷通宝鉴》（卷章待查）。旧代码已有一张表（`src/core/bazi/tiaohou.ts`），其注释称来自《穷通宝鉴》及韦千里《千里命稿》，**未经底本逐格核对** | cited_unverified | 第一版只作 chart 附录，标注未核对，不驱动信号极性 |
| `bazi.yongshen.fuyi` | 扶抑用神（弱者喜印比，强者喜食财官） | 《滴天髓》（卷章待查） | cited_unverified | 不做（依赖强弱结论） |
| `bazi.polarity.xiji` | 根据用神给岁运定喜忌极性 | 依赖以上任一用神体系 | — | 第一版不做；信号极性一律 `neutral`/`mixed`，见第 6 节。若产品坚持，作为 `experimental` 子模块启用 `bazi.yongshen.tiaohou-table` 驱动极性，并在 `school` 中明示 |

### 3.7 关键节点（key_node）规则

这是本引擎向一级世界提供分岔点的地方。每条规则都写清触发条件、指向领域与当事人、能否给方向。所有条目的「应期」含义是「此时段此领域有变动可能」，不判定吉凶，极性默认 `mixed`。

| ruleId | 触发条件 | 领域 / 当事人 | 来源 | 可靠性 | 产出 |
|---|---|---|---|---|---|
| `bazi.keynode.dayun-transition` | 交运时刻所在的流年段（交运前后各一个流年段内的那一段，以包含交运日的流年段为准） | `turning` / self | 「交运」「交脱之年多变动」为民间通行说法；《三命通会》论大运处是否有此说未核实 | unverified | signal(key_node) |
| `bazi.keynode.clash-day-branch` | 流年地支冲日支 | `relationship` / spouse 与 self；`migration` / self | 日支为夫妻宫：《子平真诠》论宫分配六亲（卷章待查）；「冲夫妻宫主婚姻或居处变动」为近现代通行解读，典籍出处 unverified | 宫位部分 cited_unverified；应期解读 unverified | signal(key_node) |
| `bazi.keynode.clash-month-branch` | 流年地支冲月支（月令/提纲） | `career` / self；`family` / father、mother | 月令为提纲：《子平真诠》（卷章待查）；「提纲被冲主事业或家宅变动」通行说法 unverified | 提纲 cited_unverified；应期 unverified | signal(key_node) |
| `bazi.keynode.clash-year-branch` | 流年地支冲年支（俗称冲太岁） | `family` / father、mother；`turning` / self | 年柱为祖上/父母宫：《子平真诠》论宫分（卷章待查）；「冲太岁」为民俗通行说法 | unverified | signal(key_node) |
| `bazi.keynode.clash-hour-branch` | 流年地支冲时支 | `family` / child | 时柱为子女宫：同上（卷章待查）；应期解读 unverified | unverified | signal(key_node) |
| `bazi.keynode.dayun-clash-pillar` | 大运地支冲原局某支（整步大运内持续） | 同上各条对应领域 | 同上 | unverified | 第一版作 signal(tendency)，挂在大运时段上；不作分岔（持续十年，不构成「时点」） |
| `bazi.keynode.suiyun-binglin` | 流年干支与所在大运干支完全相同（岁运并临） | `turning` / self | 「岁运并临」见于《渊海子平》或《三命通会》论太岁处（卷章待查）。**原文含凶死之意，本引擎只保留「重大转折」含义，绝不输出寿命或死亡类结论**；这一改写本身是 project_assumption | cited_unverified + project_assumption | signal(key_node) |
| `bazi.keynode.tianke-dichong-day` | 流年（或大运）与日柱天干相克且地支相冲（天克地冲） | `turning` / self；`relationship` / spouse | 通行说法，典籍出处 unverified；「天克」是只取克日干一方向还是双向，各说不一，第一版只取流年干克日干 | unverified | signal(key_node) |
| `bazi.keynode.fuyin-day` | 流年干支与日柱完全相同（伏吟） | `turning` / self | 「反吟伏吟」口诀通行，出处 unverified | unverified | 第一版作 tendency，不分岔（证据弱） |
| `bazi.keynode.combine-day-branch` | 流年地支合日支（六合） | `relationship` / self、spouse | 「合日支（夫妻宫）主婚恋之应」为近现代通行说法，出处 unverified | unverified | 第一版作 tendency；是否升为 key_node 列入未决 |

说明：以上规则即使来源不可靠，仍建议实现，原因是它们是八字「应期」论的主干，且触发条件完全确定、可复核；可靠性如实写进 `rulesUsed` 对应的规则登记，由下游决定权重。如果主设计者认为 `unverified` 规则不应产生分岔，可以把所有 `unverified` key_node 降级为 tendency，代价是八字一生的分岔点只剩岁运并临一条（见第 7 节）。

### 3.8 十神类象 → 领域（tendency）

| ruleId | 规则内容 | 来源 | 可靠性 | 产出 |
|---|---|---|---|---|
| `bazi.tendency.ten-god-domain` | 大运干、流年干的十神映射到领域：官杀→career；财→wealth（男命兼 relationship）；印→study、family/mother；食伤→study、career（女命兼 family/child）；比劫→wealth（争夺）、family/sibling | 十神类象见《渊海子平》论十神、《子平真诠》（卷章待查）；映射到本项目八个领域是 project_assumption | cited_unverified + project_assumption | signal(tendency)，极性 `neutral` |
| `bazi.tendency.interaction-natal` | 岁运与原局的六合、三合（含半合）、刑、害：只标「该柱所对应宫位/十神被引动」 | 同 3.3 | 同 3.3 | signal(tendency)，极性 `mixed` |

### 3.9 六亲（relationSlot）

八字有两套描述他人的结构：**宫位**（年月日时四柱的位置）与**十神**（以日主论生克）。两套在各书中并用，具体搭配有分歧。

| ruleId | 内容 | 来源 | 可靠性 | 产出 |
|---|---|---|---|---|
| `bazi.liuqin.palace` | 年柱祖上、月柱父母兄弟、日支配偶、时柱子女 | 《子平真诠》论宫分用神配六亲（卷章待查）；年柱为祖还是为父母各书说法不一 | cited_unverified | relationSlot |
| `bazi.liuqin.male.spouse` | 男命正财为妻（偏财为妾/他性伴侣之说为旧时语境） | 《渊海子平》《子平真诠》（卷章待查） | cited_unverified | relationSlot(spouse) |
| `bazi.liuqin.female.spouse` | 女命正官为夫（七杀之解读各书不一） | 同上 | cited_unverified | relationSlot(spouse) |
| `bazi.liuqin.father` | 偏财为父（推理：正印为母，克正印且与之相合者为偏财） | 同上；另有以正财为父之说，出处待查 | cited_unverified，标争议 | relationSlot(father) |
| `bazi.liuqin.mother` | 正印为母（另有偏印为母或为继母之说） | 同上 | cited_unverified，标争议 | relationSlot(mother) |
| `bazi.liuqin.sibling` | 比肩劫财为兄弟姐妹 | 同上 | cited_unverified | relationSlot(sibling) |
| `bazi.liuqin.male.child` | 男命官杀为子女（哪一个为子、哪一个为女，各书说法不一） | 同上，阴阳对应待查 | cited_unverified，标争议 | relationSlot(child) |
| `bazi.liuqin.female.child` | 女命食伤为子女（阴阳对应各书不一） | 同上 | cited_unverified，标争议 | relationSlot(child) |
| `bazi.liuqin.extended` | 官杀→上司、印→师长、财→合伙、比劫→朋友/对手、食伤→下属 | 近现代类象延伸，无可引用的经典出处 | unverified | 第一版不做（`omissions`，`no_rule`） |

`relationSlot.attributes` 只放可核对的事实，每项带 ruleId，例如：`star_revealed`（该六亲星是否透干，`bazi.chart.revealed`）、`star_rooted`（`bazi.chart.rooting`）、`star_in_season`（`bazi.chart.season-command`）、`palace_clashed_natal`（宫位在原局是否被冲，`bazi.interaction.branch-six-clash`）、`palace_xunkong`（`bazi.chart.xunkong`）。**不输出**「父缘薄」「克妻」一类结论。

---

## 4. 明确不做的部分

| 内容 | 理由 |
|---|---|
| 日主强弱分数、0–100 的任何领域分数、FateVector | 契约已废止笼统分数；强弱无统一算法，旧代码的权重都无出处（见第 8 节） |
| 用神自动判定、喜忌极性（默认关闭） | 三大体系（格局、扶抑、调候）结论可能相反；没有可引用的统一取舍规则 |
| 从格、化气格、专旺格判定 | 成立条件分歧大，误判会整体翻转喜忌 |
| 神煞（天乙、桃花、驿马、羊刃等） | 神煞表在《三命通会》等书中数量庞大、起法不一（如桃花以年支还是日支起）；且旧代码把神煞直接映射成事件，误导性强。第二版视需要单独立项 |
| 盲派、新派（如各种「象法」） | 无稳定底本 |
| 小运、胎元、命宫、身宫 | 来源存在（如《三命通会》论小运、论胎元，卷章待查），但对第一版时间轴无增量；登记为后续候选 |
| 流月、流日、流时 | 每年 12 个流月会使 key_node 数量膨胀一个数量级；而流月断应期的规则可靠性不高于流年 |
| 藏干权重、五行「百分比」 | 无出处的常数 |
| 健康领域 key_node 与五行配脏腑 | 五行配五脏出自中医典籍，但在八字中据此推疾病属近现代延伸、来源不可靠；按项目约束健康只出「需关注时段」，第一版不出任何健康信号，记入 `omissions` |
| 寿命、死亡、「岁运并临」原义中的凶死判断 | 项目硬约束；类型层不存在 |
| 南半球月柱调换 | 少数派主张，来源 unverified |
| 合婚、择日 | 不属于本命一生推演 |

---

## 5. 黄金用例需求

所有期望值必须来自代码之外；以下只列需求，不给期望值。

### 5.1 四类用例

| 类别 | 覆盖什么 | 外部来源 | 格式要点 |
|---|---|---|---|
| 正常 | 30 例以上，分布在 1900–2100，含中国大陆、香港、台湾、海外（纽约、伦敦、悉尼）出生；四柱、大运方向、首运干支、起运距离（天，精确到分钟）、十神、藏干 | 至少两款独立排盘软件结果交叉一致者（候选：元亨利贞网在线排盘、问真八字 App，选型待定；**不能用 lunar-typescript/lunar-javascript，因为它是被测实现的依赖**） | 每例记录：本地时间、IANA 时区、经纬度、性别、所用日界与真太阳时口径、两款软件截图或导出文件、获取日期 |
| 边界 | (1) 立春前后各 1–10 分钟出生；(2) 其余 11 个节前后几分钟；(3) 23:00–00:59 出生（D3 三种口径各一组）；(4) 真太阳时使时辰跨界（如乌鲁木齐、喀什按北京时间 13:30 出生）；(5) 中国 1986–1991 夏令时期间出生；(6) 起运距离接近 0 与接近 30 天；(7) 流年跨越交运日 | 节气瞬时：香港天文台二十四节气时刻表、紫金山天文台《中国天文年历》、JPL Horizons 太阳视黄经 315°/345°…；日干支：外部万年历；夏令时：IANA tzdb 原始文件 | 节气时刻统一换算为 UTC 并注明原表时区；每例写明所测规则 ruleId |
| 非法 | 2 月 30 日、25 点、经纬度越界、时区名不存在、夏令时「跳过」的不存在时刻、性别缺失或非 male/female、超出支持年份范围 | 无需外部数据，期望行为由契约规定（拒绝或进入 omissions） | 断言错误码 / omission.reason，而非盘面 |
| 歧义 | 夏令时回拨的重复时刻；时间未知（只给日期）；出生时间只精确到时辰；距节或子时边界小于阈值；缺经纬度但口径要求真太阳时 | 同边界类 | 断言 `ambiguous_input` omission 存在，且 `chart.alternatives` 给出的候选盘与外部软件在另一口径下的结果一致 |

### 5.2 规则层用例（key_node、六亲）

排盘以外的规则无法用天文数据验证，只能验证「规则是否按声明被执行」：
- 典籍命例：《子平真诠》（徐乐吾评注本）、《滴天髓阐微》《穷通宝鉴》书中附有大量命例的四柱与大运，可用于核对大运干支序列、格局候选与六亲取法的执行（命例只给干支、不给公历时刻，故只能核对排盘之后的步骤）。需人工摘录，注明版本与页码。
- 流年冲合类 key_node：期望值由人工按规则表在外部排盘结果上手算，由第二人复核；记录复核人。

### 5.3 需要用户提供或外部获取的数据清单

1. 香港天文台 1900–2100 年二十四节气时刻表（或紫金山天文台同类出版物），并记录其时间标准（北京时间/香港时间）。
2. JPL Horizons 导出的太阳视黄经数据，用于独立核验至少 50 个「节」的瞬时（容差需另定，建议 1 分钟）。
3. 外部万年历的日干支表（至少每十年抽样若干日，含 1900 年前后、1949 年前后），用于核定日干支锚点。
4. 两款独立排盘软件的选型与授权确认（能否把其结果作为测试数据入库）。
5. 产品对 D3（子时口径）、D4（真太阳时）、D5（起运折算）、D9（流年跨运）的决定。
6. 《子平真诠》《渊海子平》《三命通会》《穷通宝鉴》各一部指定版本（出版社、年份），用于把本文所有「卷章待查」补齐；补齐之前这些规则保持 `cited_unverified`。
7. IANA tzdb 中国 1949 年前时区（如 Asia/Harbin、Asia/Chongqing、Asia/Urumqi 等，现多为链接）的历史准确性评估，或产品决定对 1949 年前出生者要求用户直接给出当时钟表所用时区。

---

## 6. 向一级世界层交付的内容

### 6.1 chart

`chart.kind = 'bazi.chart/1'`，包含：四柱（干、支、十神、藏干及其十神、纳音、旬空标记）、日主、月令关系、通根与透干事实、原局合冲刑害列表、格局候选（无置信度）、调候表查得值（标「未核对」）、大运列表（干支、十神、交运瞬时）、所用口径（日界、真太阳时、起运折算）、`alternatives`（歧义时的候选盘）。

### 6.2 timeline 与绝对日期算法

| unit | periodId | 起止 | ruleId | parentPeriodId |
|---|---|---|---|---|
| `bazi.pre-dayun` | `bazi.dayun.0` | 出生瞬时 → 首次交运瞬时 | `bazi.dayun.start-offset-120x`（或所选口径） | null |
| `bazi.dayun` | `bazi.dayun.1` … `bazi.dayun.N` | 交运瞬时 T₁ = 出生瞬时 + Δ；Tₖ₊₁ = Tₖ 的本地日期时刻加 10 个公历年 | `bazi.dayun.step-length` | null |
| `bazi.liunian` | `bazi.liunian.2016`；跨运时切段为 `bazi.liunian.2016.a` / `.b` | 当年立春瞬时 → 次年立春瞬时（跨运时在交运瞬时切开） | `bazi.liunian.boundary-lichun` | 该段所在的大运（或 `bazi.dayun.0`） |

- Δ 的计算：`astro-time` 给出出生瞬时与相邻「节」瞬时（UTC），差值按 D5 所选口径折算；口径 (b) 下 Δ = 距节时长（分钟）× 120。
- 所有边界以 UTC ISO 字符串输出（end 为开区间），由 `astro-time` 计算，不读系统时区。
- N 的取值：覆盖到产品设定的分析边界（例如出生后 100 年）为止；这是分析范围，不是寿命估计。
- 立春瞬时与交运瞬时都可能落在当地日期的任意时刻；下游若需「按年龄」展示，由展示层换算，引擎只给绝对瞬时。

### 6.3 key_node 与 tendency

- 产生 `key_node`：`bazi.keynode.dayun-transition`、`bazi.keynode.clash-day-branch`、`bazi.keynode.clash-month-branch`、`bazi.keynode.clash-year-branch`、`bazi.keynode.clash-hour-branch`、`bazi.keynode.suiyun-binglin`、`bazi.keynode.tianke-dichong-day`。key_node 一律挂在流年（段）上。
- 只产生 `tendency`：`bazi.tendency.ten-god-domain`、`bazi.tendency.interaction-natal`、`bazi.keynode.dayun-clash-pillar`、`bazi.keynode.fuyin-day`、`bazi.keynode.combine-day-branch`。tendency 挂在大运或流年上。
- `polarity`：第一版默认 `mixed`（冲、刑类）或 `neutral`（十神类象）；只有启用 `experimental` 喜忌模块时才出现 `favorable`/`unfavorable`，且该信号的 ruleId 必须指向所用用神规则。
- `intensity`：所有规则本身都不分等级，一律 `null`。（「冲提纲重于冲他支」之类说法可能存在，但未找到可引用的分级，不自造。）
- `evidence`：指向 chart 路径，如 `pillars.day.branch`、`dayun[3].branch`、`liunian.2016.branch`。

### 6.4 relationSlots

| role | ruleId | indicators（示例路径） |
|---|---|---|
| spouse | `bazi.liuqin.palace`（日支）+ `bazi.liuqin.male.spouse` / `bazi.liuqin.female.spouse` | `pillars.day.branch`；所有正财（男）/正官（女）出现位置 |
| father | `bazi.liuqin.father`（+ 宫位：月柱或年柱，按选定底本） | 偏财位置；`pillars.month` / `pillars.year` |
| mother | `bazi.liuqin.mother` | 正印位置 |
| sibling | `bazi.liuqin.sibling`（+ 月柱宫位） | 比肩、劫财位置 |
| child | `bazi.liuqin.male.child` / `bazi.liuqin.female.child` + 时柱宫位 | 官杀（男）/ 食伤（女）位置；`pillars.hour` |

性别缺失时 spouse、child 两项不输出（`input_missing`）；时辰缺失时以时柱为宫位的指标不输出。mentor、superior、subordinate、business_partner、friend、rival 不输出（`no_rule`）。

### 6.5 典型 omissions

| what | reason | detail |
|---|---|---|
| 日主强弱结论 | `no_rule` | 各派无统一算法，只给事实项 |
| 用神与岁运喜忌 | `no_rule` | 格局/扶抑/调候三派可能矛盾；未选定 |
| 神煞 | `not_implemented` | 第一版不做 |
| 健康信号 | `no_rule` | 无可靠来源；健康只允许「需关注时段」，第一版不出 |
| 时柱及其派生规则 | `input_missing` | 出生时间未知 |
| 大运时间轴 | `input_missing` | 性别缺失或非 male/female |
| 日柱/时柱 | `ambiguous_input` | 出生时刻落在子时口径分歧区或节、时辰边界阈值内 |
| 时柱（真太阳时） | `ambiguous_input` | 缺经纬度，退回区时 |
| 小运、流月 | `out_of_scope` | 第一版范围外 |
| 1900 年前 / 2100 年后 | `out_of_scope` | 节气与时区数据未核验 |
| 六亲扩展角色 | `no_rule` | 只有近现代类象延伸 |

---

## 7. 它的一套世界如何展开

**分岔点来源**：只来自 6.3 中列出的 key_node。每个 key_node 把世界分成「应验 / 未应验」两支；由于第一版极性默认 `mixed`，应验支不带好坏方向，只表示「该领域在该时段发生了变动」。

**数量级估计**（以 0–90 岁的分析范围为例）：
- 大运交接：约 8–9 次。
- 流年冲四柱地支：流年地支每 12 年轮一圈，对每个原局地支各冲一次。四支互不重复时 4 × (90/12) ≈ 30 次；原局有重复地支时更少。只启用冲日支、冲月支两条时约 15 次。
- 岁运并临：流年与大运干支相同，每步大运十年中至多出现一次（大运干支在六十甲子中的位置与该十年流年干支吻合才出现），一生通常 0–2 次。
- 天克地冲日柱：对一个固定日柱，满足条件的流年干支在六十甲子中只有 1 个左右（只取流年克日干时），一生约 1–2 次。
- 合计约 40–45 个「规则 × 流年段」事件。每个事件按 6.3 映射到 1–2 个领域、1–2 位当事人，展开成约 60–100 条 key_node 信号。

**对世界层的建议**：如果每条 key_node 信号独立分岔，2^80 量级只能惰性定义；更合理的是把同一 `ruleId + periodId` 下的多条信号视为**一个分岔事件**（共同应验或共同不应验），则八字一生约 2^40–2^45 套世界。是否这样合并属于世界层契约，列为未决问题。若主设计者决定 `unverified` 规则不分岔，八字一生仅剩岁运并临（约 0–2 个），此时八字几乎只提供 tendency。

**时间单位的保留与映射**：世界层应保留 `periodId`（大运 / 流年段）作为原生时间刻度，用 `start`/`end` 绝对瞬时与其他引擎对齐；流年的起点是立春瞬时（约公历 2 月 4 日前后），不是公历元旦，跨引擎比较时不能按公历年合并。交运瞬时与立春不对齐，因此跨运的流年会被切成两段，两段各自 parent 到不同大运。

---

## 8. 从旧代码里可以借鉴什么

### 8.1 可作参考（按第 3 节来源要求重新核对后再用）

- 天干地支、五行、阴阳、藏干、六十甲子、旬空计算：`src/core/calendar/ganzhi.ts`（`HIDDEN_STEMS`、`sixtyJiazi`、`jiaziIndex`、`voidBranches`）。旬空用「所在旬起点 +10/+11」推导，可数学验证；藏干表需与选定底本逐支核对。
- 十神：`src/core/calendar/tenGods.ts` 的 `tenGodOf`，用五行关系 + 阴阳同异推导，逻辑正确，可保留思路。
- 五鼠遁时干：`src/core/calendar/chineseHour.ts` 的 `hourStemOf`（公式 `(日干序 % 5) * 2 + 时支序`），与注释中的口诀表一致；`hourBranchOf` 的整点映射可参考，但新设计要改为接收分钟级真太阳时。
- 五虎遁、六合、六冲、三合、三会、刑、害、破、十二长生起点：`src/core/bazi/constants.ts`。表内容与通行说法一致，来源都需补登记；`BRANCH_XING` 已把子卯刑与自刑列出，三刑成立条件未建模。
- 纳音表：`src/core/calendar/nayin.ts`（30 项按甲子序成对），与 `src/utils/baziDeepAnalysis.ts` 中按 60 项列出的 `NA_YIN` 两份可互相对照（其中「沙中金/砂中金」用字不同，需按底本统一）。
- 大运顺逆与首运推法：`src/core/bazi/calculateDaYun.ts` 的 `calculateDaYun`，只数「节」不数中气（`JIE_NAMES`）、顺取下一节逆取上一节，方向与本文一致。
- 节气瞬时：`src/core/calendar/solarTerms.ts` 通过 lunar-typescript 的 `getJieQiTable()` 取得北京时间节气并换算 UTC。可作为过渡实现，但它是被测对象的依赖，不能充当黄金用例来源。
- 时区解析：`src/core/astro-time/timezone.ts` 的 `resolveLocalTime` 能识别夏令时跳过（`nonexistent_local_time`）与重复（`ambiguous: true` + `alternatives`），可直接对应本文非法、歧义两类输入。
- 真太阳时：`src/core/astro-time/solarTime.ts` 的 `trueSolarTimeHours` 用 astronomy-engine 的 `HourAngle` 求地方视太阳时，思路正确。
- 调候表：`src/core/bazi/tiaohou.ts` 的 `TIAOHOU_TABLE`，可作为与《穷通宝鉴》底本逐格比对的起点，**不能直接视为已核对**。
- 立春切年的回归测试：`src/core/bazi/__tests__/parity.test.ts` 记录了旧实现按春节切年的错误（1990-02-01 应为己巳），这类边界用例思路应保留，但期望值要换成外部来源。

### 8.2 无依据的捏造（新设计不得沿用）

- `src/utils/eventSeedExtractors.ts` 的 `extractBaziEvents`：几乎全部为固定年龄 + 固定概率。例如正官格「28 岁、45 岁」、七杀格「25 岁、35 岁」、官星「32 岁」、财星「35 岁」、婚姻「27 岁」、印星「20 岁」、日主极弱「45–70 岁健康 critical」、火占 ≥35% 则「35–55 岁防火灾/心血管」、劫财即「羊刃」并在「38 岁防意外手术」、官杀混杂「36 岁法律纠纷」、比劫加财星「35 岁离婚」、金或木占 ≥25% 即「驿马 28 岁迁移」、食伤「18 岁学业」。probability/confidence 为 0.7、0.65、0.6、0.4、0.3、0.25 等固定常数。其中「劫财=羊刃」「金木旺=驿马」在概念上就是错的（羊刃按日干帝旺位取，驿马按年支或日支所属三合局取）。
- `src/core/bazi/analyzeStrength.ts`：月令 30/25/15/5/0 分、通根 ×12.5、透干比劫 8 印 6、生扶比 ×25，阈值 75/60/40/25，均无出处。
- `src/core/bazi/calculateBaziChart.ts`：`pickUsefulGod` 的 `score: 80 - i * 10`；`buildDomainAnalyses` 的各领域 `50 + …` 加减分；`baseConf = 74` 与 sourceGrade 扣分；`completenessScore` 公式。
- `src/core/bazi/toEngineOutput.ts` 的 `buildFateVector`：十维分数全部为常数加计数乘系数。
- `src/core/bazi/congHua.ts`：化气格置信度 72/45/25，从格 68/50/66，十神累计权重 1.0/0.4/0.2。
- `src/core/bazi/analyzePattern.ts`：格局置信度 75/55/35/20/30 与 +15 加成。
- `src/core/bazi/wuxing.ts`：月令 `MONTH_BRANCH_BONUS = 1.5`，`rootStrengthScore` 中位置加成 1.5/1.2/1.0。
- 藏干权重：`src/core/bazi/calculateBazi.ts` 与 `src/core/bazi/hiddenStems.ts` 用 1.0/0.5/0.3，`src/utils/baziDeepAnalysis.ts` 用 1.0/0.6/0.3（`HIDDEN_STEM_WEIGHTS`），两者互相矛盾且都无出处。
- `src/utils/baziDeepAnalysis.ts` 的 `calculateElementBalance` 用百分比阈值 30/22/15/8 套「旺相休囚」，与旺相休囚的本义（按季节论）无关。

### 8.3 已知 bug 与教训（必须带入新设计）

1. **非东八区出生地的日柱用错了日期**。`src/core/calendar/fourPillars.ts` 的 `fourPillarsFromAstro` 把 UTC 瞬时换算为北京时间后交给 lunar-typescript（`src/core/calendar/lunar.ts` 的 `lunarFromUtc`）取日柱。纽约当地下午出生的人，北京时间已是次日凌晨，日柱会错一天。新设计：日柱必须按出生地本地（按 D4 口径的）日期取，年柱和月柱才按 UTC 瞬时比较。
2. **日界口径可能不受配置控制**。同一函数用 `getDayInGanZhiExact()` 取日柱，又在 `zi-shi-23` 口径下手动把 23 点后的时刻加 1 小时。据我对 lunar-javascript 系列的了解，`...Exact` 系列的日干支本身已按 23:00 换日，这样 `midnight-00` 口径对北京时间 23 点出生者可能无效。依赖包未安装（仓库中没有 `node_modules`），此点**未核实**，需在实现前用测试确认。
3. **`useTrueSolarTime` 是摆设**。`src/core/bazi/types.ts` 定义了 `useTrueSolarTime`，但 `fourPillarsFromAstro` 始终用 `astro.localDateTime.hour`（民用钟表时，含夏令时）取时柱；`src/core/bazi/calculateBaziChart.ts` 只在缺经纬度时发警告。中国 1986–1991 年夏令时期间出生者，时柱可能差一个时辰。
4. **缺失输入被静默填充**。`calculateBaziChart` 对缺失的经纬度填 `0`、时区填 `'UTC'`（`geoLatitude: input.geoLatitude ?? 0` 等），而 `src/core/astro-time/normalizeBirthTime.ts` 只对非有限数和空时区报错，所以这两种缺失都不会触发 `GEO_MISSING` / `TZ_MISSING`。
5. **交运日期粗化到元旦**。`calculateDaYun` 的 `startYear = 出生年 + floor(startAge)`；`calculateBaziChart` 再把 `startDate` 设为该年 1 月 1 日。新设计必须给出精确交运瞬时。
6. **流年不按立春**。`src/core/bazi/analyzeFlowYear.ts` 以 1984=甲子 按公历年取干支，`age = 目标年 - 出生年`；`calculateBaziChart` 的 `currentDaYun` 同样用公历年差与小数起运年龄比较。1–2 月出生或查询的情况会错位。
7. **流年风险标记取错了干**。`analyzeFlowYear` 里 `riskFlags` 的条件用的是 `chart.fourPillars.year.stemElement`（原局年干五行），而不是流年干五行。
8. **流月按公历月近似**。`src/core/bazi/analyzeFlowMonth.ts` 的 `CIVIL_MONTH_TO_BRANCH` 把公历 2 月整月当寅月，节前几天全部错位；七杀流月的条件 `unfavorableElements.includes(dayMasterElement) === false` 语义不明。
9. **建禄/羊刃格判定逻辑可疑**。`src/core/bazi/analyzePattern.ts` 在月令本气与日主同五行时，阳干加成「建禄格」、阴干加成「羊刃格」；但建禄是月支为日干之禄（阴阳干都有），羊刃通常只就阳干论（阴干有无羊刃本身有争议）。例如乙日生寅月会被加成为「羊刃格」，不合通行定义。
10. **藏干顺序两份代码不一致**。`src/core/calendar/ganzhi.ts` 中巳为 `['丙','戊','庚']`，`src/utils/baziDeepAnalysis.ts` 中巳为 `['丙','庚','戊']`。凡涉及中气/余气的规则（人元司令、格局取中气）结果都会不同，必须按选定底本定一个。
11. **旧引擎年柱按春节切**。`src/utils/baziDeepAnalysis.ts` 的 `performDeepBaZiAnalysis` 用 `getYearInGanZhi()` / `getMonthInGanZhi()`（非 Exact），且直接把输入当北京时间处理，不经时区换算。
12. **登记表与实际不符**。`src/core/shared/algorithmSourceRegistry.ts` 的 bazi 条目把「日主强弱」「用神候选」「从格判断」「调候用神（穷通宝鉴全表）」列为 implementedRules，`sourceUrls` 只有三部书名，没有卷章；`docs/ALGORITHM_VERIFICATION_MATRIX.md` 也承认「强弱缺独立大样本」「日界/出生地规则需流派定版」。新设计的规则登记以本文第 3 节为准。
13. 现有测试只验证自洽（确定性、步数、方向），唯一的外部期望值是 1990 年立春前后的年柱（`src/core/calendar/__tests__/fourPillars.test.ts`、`parity.test.ts`），期望值出处未注明。本次未运行测试（依赖未安装）。

---

## 9. 未决问题与风险

1. **口径待拍板**：D3 子时、D4 真太阳时、D5 起运折算、D9 流年跨运。每一项都会改变盘面或时间轴，在决定之前黄金用例无法定稿。
2. **key_node 来源普遍偏弱**：除岁运并临（cited_unverified）外，应期类规则都是 unverified。需要主设计者决定「unverified 规则能否产生分岔」；如果不能，八字的一级世界几乎没有分岔点。
3. **多领域信号是否合并为一个分岔事件**：影响世界数量的量级（2^40 与 2^80 之别），属于世界层契约。
4. **极性缺失的下游影响**：第一版信号基本是 `mixed`/`neutral`，博弈层可能无法从八字得到「好坏」差异。若产品必须有极性，建议只启用一个用神体系（候选：调候表，因为它是查表、可逐格核对），整个喜忌模块标 `experimental`，并在 `school` 中写明。
5. **藏干、六亲取法的底本选择**：《渊海子平》《三命通会》《子平真诠》在藏干顺序、父星与子女星的阴阳对应上有出入，需要指定一部为准，其余作为备选口径。
6. **历史时区可靠性**：tzdb 对 1970 年前（尤其 1949 年前的中国）的数据不保证准确；对这部分出生者是否要求用户直接给出当时所用钟表时间的偏移，需要产品决定。
7. **lunar-typescript 依赖**：节气瞬时与日干支目前依赖它。新设计中 `astro-time` 应自行计算节气（太阳视黄经），lunar-typescript 只作对照；它的 `...Exact` 系列在日界上的行为需先用测试确认（第 8.3 节第 2 条，未核实）。
8. **他人推演的偏差放大**：没有出生信息的家人只能由 relationSlots 推出，而六亲取法本身多处标争议；应在世界层把这类他人信号的权重整体压低，或至少保留 ruleId 让博弈层自行判断。
9. **「岁运并临」等规则的原义改写**：原文含凶死之意，本项目只取「重大转折」含义。这一改写须在规则登记中显式写明（project_assumption），避免下游或文案把原义带回来。
