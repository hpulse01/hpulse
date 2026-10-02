# 引擎设计：数字命理（engineId `numerology`）

## 1. 结论摘要

- **定位**：本命类（`engineClass: 'natal'`）。输入只有公历出生日期和用户**显式提供**的拉丁字母拼写姓名。计算部分（字母数值表、约简、Life Path、Pinnacle、Challenge、Personal Year）是确定的算术，可以做黄金用例。「解释」部分（某个数字对应什么领域、吉还是凶）来自现代通俗作者，各派说法不一，没有可核对的典籍。
- **第一版范围**：只做 Decoz 体系的毕达哥拉斯表（Pythagorean）计算。时间单位只有 Pinnacle（四个巅峰期）和 Personal Year（个人年）两种。
- **对一级世界的贡献很小**：每人一生约 **3 个 key_node**（Pinnacle 交接点，领域只有 `turning`，极性为 `neutral`）。Personal Year 和 Pinnacle 主题只产出 `tendency`。体系里**没有描述他人的结构**，`relationSlots` 为空。
- **区分度极低**：Personal Year 序列和 Pinnacle 交接年龄只取决于少数约简值。按出生日期，全体人口大约只分成 9 类，同一类人的序列完全相同（见第 7 节）。所以在博弈和坍缩阶段应给本引擎很低的权重。
- **主要风险**：把通俗作者的数字主题当成「规则」写进 signal；Pinnacle 边界的「到 N 岁」在含义上有歧义；姓名拼写（特别是中文姓名的拼音写法）直接改变结果。
- **建议初始状态**：`needs_source_validation`。计算层拿到黄金用例后可单独标注为可信，但 signal 层的来源目前都是 `cited_unverified` 或 `project_assumption`。

## 2. 声明的流派和范围

**流派**：`school: '毕达哥拉斯数字命理·Decoz 体系（分单元约简、保留主数 11/22/33）'`。

选择这一派的原因如下：
1. 旧的 `src/core/numerology/` 已经按 Decoz 公开文章（worldnumerology.com，见 `src/core/numerology/toEngineOutput.ts` 中的 `sourceUrls`）实现。
2. 这一派给出了 Pinnacle 的明确年龄公式（`36 − Life Path`），是少数能落到时间轴上的规则。
3. 其他流派与它有冲突，第一版不混用：
   - Dan Millman 在《The Life You Were Born to Live》中采用「全部数字相加、保留两位数」的方式，结果与 Decoz 不同。
   - Cheiro 的 Chaldean 体系见《Cheiro's Book of Numbers》。它的字母表不同，以常用名而不是出生名为准，看的是复合数而不是主数。

**输入**：

| 字段 | 必需 | 说明 |
|---|---|---|
| 出生地当地公历日期（年/月/日） | 必需 | 由 `astro-time` 根据出生时刻和出生地 IANA 时区给出当地民用日期。**不得使用 UTC 日期。**出生时刻本身不参与计算。 |
| `birthNameLatin`（出生证明上的全名，拉丁 A–Z 拼写） | 可选 | **只用用户显式填写的拼写**，不得从账号显示名、昵称或其他字段推断。缺失时姓名类数字不计算，记录 `omission: input_missing`。 |
| 出生地、性别、时区 | 不需要 | 性别在本体系中不影响任何规则。 |

**口径决策点**：

1. **日界**：采用出生地当地民用日期的午夜作为日界，标为 `project_assumption`。数字命理文献只说「出生日期」，没有讨论跨时区问题。
2. **非拉丁姓名**：声明的字母表只有不带变音符的 A–Z。遇到 `é`、`ß`、汉字、西里尔字母等，一律 fail-closed（拒绝计算并说明原因），不静默丢字符，也不自动转写。中文用户必须自己写出拼音拼写。几个变量会改变结果：姓在前还是名在前、是否用连字符、用 Wade-Giles 还是汉语拼音，引擎都不替用户选。结果中的 omission 写成 `ambiguous_input`，说明「需显式拉丁拼写」。
3. **姓名分段**：按空格分段，每段先约简再合并（现有实现，见 `src/core/numerology/calculate.ts` 的 `calculateNameNumber`）。连字符 `Jean-Luc`、撇号 `O'Brien` 当作分隔符还是忽略，属于**待决**。现有 `splitNameParts` 用 `/[^A-Z]+/` 切分，把它们都当作分隔符。
4. **Y 的元音判定**：采用 Decoz 文章中的位置规则，标为 cited_unverified。来源本身承认存在音节例外，所以这条规则对少数名字可能与人工判读不一致。
5. **主数集合**：采用 {11, 22, 33}。旧 `src/utils/worldSystems/numerology.ts` 还加了 44，没有来源，弃用。33 在一些流派中不算主数，**待决**。
6. **Personal Year 的边界**：采用公历 1 月 1 日（Decoz 一派的写法，标为 cited_unverified）。另有作者主张从生日到生日，**待决**。两种口径必须二选一，并写进 `school`。
7. **Pinnacle 年龄窗口的含义**：Decoz 写的是「第一巅峰从出生到 36 − LP 岁」。「到 N 岁」可以理解为「到 N 岁生日」，也可以理解为「N 岁这一年整年」，两者相差一年。现有 `buildPinnacleCycles` 采用后者（`endAgeInclusive`）。这一点必须拿外部成例核对，现在列为**待决**。
8. **2 月 29 日出生者**：非闰年的周年日取 2 月 28 日还是 3 月 1 日，由 `astro-time` 统一决定（所有按周年换算的引擎共用），**待决**。
9. **历法范围**：只接受格里历日期（1900–2100 年作为产品范围）。只知道农历生日的用户，要先由 `astro-time` 转换。「用农历生日算数字命理」这种做法不支持。

## 3. 计划实现的规则清单

主要来源只有 Hans Decoz 的网站文章（URL 见 `src/core/shared/algorithmSourceRegistry.ts` 的 `numerology.sourceUrls`）。他的书《Numerology: Key to Your Inner Self》（与 Tom Monte 合著）的卷章待查。网页文章没有版本号，因此一律标 `cited_unverified`，需要存档快照。

| ruleId | 规则内容 | 来源 | 可靠性 | 产出 |
|---|---|---|---|---|
| `numerology.alphabet.pythagorean-table` | A–I、J–R、S–Z 依次对应 1–9 | Decoz 网站「do-your-own-reading」；毕达哥拉斯表在通俗文献中一致 | cited_unverified | chart |
| `numerology.reduce.master-preserve` | 数位反复相加直到个位数，途中遇到 11/22/33 时停止 | 同上 | cited_unverified | chart |
| `numerology.core.life-path-unit-reduction` | 月、日、年分别约简后相加再约简 | Decoz 网站（卷章待查）；与 Millman 的方法冲突 | cited_unverified | chart |
| `numerology.core.birthday-number` | 出生日约简 | Decoz 网站 | cited_unverified | chart |
| `numerology.name.part-reduction` | 姓名每段先约简再合计 | Decoz「numerology-expression」 | cited_unverified | chart |
| `numerology.name.y-classification` | Y 按首尾和相邻元音的位置判定元音或辅音 | Decoz「Y-vowel-consonant」 | cited_unverified | chart |
| `numerology.name.expression` | 全部字母求和（Expression/Destiny） | Decoz 网站 | cited_unverified | chart |
| `numerology.name.soul-urge` | 元音字母求和 | Decoz 网站 | cited_unverified | chart |
| `numerology.name.personality` | 辅音字母求和 | Decoz 网站 | cited_unverified | chart |
| `numerology.core.maturity` | Life Path + Expression 后约简 | Decoz 网站 | cited_unverified | chart |
| `numerology.karmic.debt-numbers` | 未约简的中间和或出生日为 13/14/16/19 时标记业债 | Decoz 网站（卷章待查） | cited_unverified | chart |
| `numerology.cycle.pinnacle-values` | P1=月+日、P2=日+年、P3=P1+P2、P4=月+年（各自约简，保留主数） | Decoz「numerology-pinnacles」 | cited_unverified | chart |
| `numerology.cycle.pinnacle-boundaries` | 第一巅峰结束于 36 − 个位化 LP 岁，第二、三巅峰各 9 年，第四巅峰开放到底 | 同上 | cited_unverified（「到 N 岁」的边界含义待核） | period |
| `numerology.cycle.challenge-values` | C1=\|月−日\|、C2=\|日−年\|、C3=\|C1−C2\|（主挑战）、C4=\|月−年\|，主数先化为个位数 | Decoz「numerology-challenges」 | cited_unverified | chart |
| `numerology.cycle.personal-year` | 个人年数 = 约简(出生月 + 出生日 + 目标公历年) | Decoz 网站 | cited_unverified | period |
| `numerology.cycle.personal-year-boundary-calendar` | 个人年按公历 1 月 1 日切换 | Decoz 网站（存在冲突流派） | cited_unverified | period |
| `numerology.input.latin-only-fail-closed` | 姓名中有非 A–Z 字母时整体拒算，不丢字符、不转写 | 项目决策 | project_assumption | omission |
| `numerology.signal.pinnacle-transition` | 巅峰期交接所在的时段记为「人生主题转换」 | Decoz 把 Pinnacle 描述为人生阶段主题（卷章待查）；「交接点 = 变动应期」是项目的解读 | project_assumption（依据文献的弱推论） | signal(key_node) |
| `numerology.signal.pinnacle-theme` | 巅峰期的数字主题作为该段的倾向 | Decoz 网站的数字释义；数字到领域的映射是项目映射 | 释义 cited_unverified，领域映射 project_assumption | signal(tendency) |
| `numerology.signal.personal-year-theme` | 个人年 1–9 的主题作为当年倾向（例如 5 对应变动/迁移，6 对应家庭/责任） | Decoz 网站的个人年释义；领域映射是项目映射 | 释义 cited_unverified，领域映射 project_assumption | signal(tendency) |
| `numerology.signal.main-challenge-theme` | 主挑战数（C3）作为终生倾向 | Decoz「numerology-challenges」 | cited_unverified | signal(tendency) |

**关于 signal 的诚实说明**：
- 通俗数字命理的数字释义大多写成「主题/课题」，不写吉凶，所以 `polarity` 一律为 `neutral`（极少数文献明说的除外，第一版不采用）。`intensity` 一律为 `null`。
- 「数字 → 八个领域」的映射在文献中没有统一表，任何映射都是项目假设。映射表必须单独版本化（`numerology.domain-map/1`），并在文档中逐条列出依据的原文措辞，不能临时编写。

## 4. 明确不做的部分

| 项目 | 理由 |
|---|---|
| 0–100 分数、旧 `FateVector` | 契约已作废。旧的 `NUMBER_BASE` 查表（`src/core/numerology/toEngineOutput.ts`）没有依据。 |
| Chaldean（Cheiro）姓名数 | 属于另一个流派，字母表和取名口径都不同。旧代码把它和保留主数的约简混在一起用（`calculateChaldeanDestiny` 调用 `reduceToDigit`），但 Cheiro 体系不采用主数。如果要做，应作为独立的 school 版本。 |
| Personal Month / Personal Day | 粒度过细，与一生尺度的世界生成无关，而且每 9 个月或 9 天循环一次，没有区分度。 |
| Essence / Transit 字母周期 | 见于 Matthew Oliver Goodwin《Numerology: The Complete Guide》（卷章待查）。规则复杂且依赖姓名，第一版不做。 |
| Bridge、Hidden Passion、Karmic Lessons（缺失数）、Subconscious Self | 旧实现（`src/utils/worldSystems/numerology.ts`）用**出生日期**算这些姓名类数字，概念本身就错了。第一版不做，以后需要时按姓名重新设计。 |
| 合盘或兼容性（LP 与 LP 配对表） | 通俗文献中的配对表来源杂乱，而且它不属于 relationSlot。 |
| 婚龄、事业峰值年龄、意外、法律、离婚等具体事件 | 体系内没有这类规则（见第 8 节旧代码）。 |
| 寿命、死亡 | 类型层面不存在。第四巅峰期的结束端开放，不给终点。 |

## 5. 黄金用例需求

| 类别 | 需要什么 | 外部来源 | 格式要点 |
|---|---|---|---|
| 正常 | 至少 10 组「出生日期 + 姓名 → LP / Expression / Soul / Personality / Pinnacles / Challenges」 | Decoz 网站和书中的举例；Goodwin 书中的举例（卷章待查）；一款公认的数字命理软件的输出（具体软件待选，需记录版本） | 每条记录来源 URL 快照或书页，并保留中间值（各单元约简值、各名段和） |
| 边界 | 主数出现在中间和（如 1990-05-14 → 11）；业债 13/14/16/19；LP 为 11/22/33 时 Pinnacle 边界（36 − 2/4/6）；2 月 29 日出生；Y 在首、中、尾的各种情况 | 同上；Y 规则需要 Decoz 原文中的例名 | 现有测试里的 `1949-05-15 → Pinnacles 11/11/22/1`（`src/core/numerology/__tests__/calculate.test.ts`）号称来自 Decoz 举例，**必须回到原文核对后**才能入库 |
| 非法 | 不存在的日期（2025-02-29）、年份越界、空姓名、超长姓名 | 不需要外部数据 | 期望行为是拒绝或产出 omission，不产出数字 |
| 歧义 | 带变音符的名字（José）、中文名的多种拼音写法、连字符和撇号、Personal Year 的两种边界口径、「到 N 岁」的两种理解 | 需要 Decoz 原文对边界口径的表述；拼写类用例只断言 fail-closed 或 omission | 断言引擎拒绝替用户选择，并记录 `ambiguous_input` |

**需要用户提供或外部获取的数据清单**：
1. Decoz 网站相关页面的存档快照（Pinnacles、Challenges、Expression、Y 规则、Personal Year），附带抓取日期。
2. 《Numerology: Key to Your Inner Self》的具体版次和书中举例页（目前未核实）。
3. 至少一款公认数字命理软件对 10 组样本的输出（软件名和版本待定）。
4. Pinnacle「到 N 岁」边界含义的原文表述。
5. 用户侧：拉丁字母出生全名（显式填写），以及可选的「当前常用名」（第一版不使用，只预留字段）。

## 6. 向一级世界层交付的内容

**chart**：`kind: 'numerology.chart/1'`。内容包括 lifePath（含各单元中间值）、birthday、expression/soulUrge/personality/maturity（姓名缺失时为 null）、karmicDebts、pinnacles[4]、challenges[4]，以及 `nameSpellingDigest`（拼写的哈希值，不存原文）。

**timeline（自有时间单位）**：

| unit | periodId | 绝对日期算法 |
|---|---|---|
| `numerology.pinnacle` | `numerology.pinnacle.1`–`.4` | start/end 取「出生当地日期 + N 周年」，由 `astro-time` 的周年函数给出（2 月 29 日的处理待决）。N 由 `pinnacle-boundaries` 规则给出。`.4` 的 end 取世界层传入的建模时间上限，不代表任何寿命含义。 |
| `numerology.personal-year` | `numerology.personal-year.<YYYY>` | `[YYYY-01-01, (YYYY+1)-01-01)`，按出生地时区的民用日期（如果口径改为生日到生日，则改成周年日）。`parentPeriodId` 指向覆盖该年 1 月 1 日的 pinnacle。 |

**key_node**：只有 `numerology.signal.pinnacle-transition`。它挂在每个 pinnacle 2/3/4 的起始 personal-year 上（交接年），`domain: 'turning'`、`subjectRole: 'self'`、`polarity: 'neutral'`、`intensity: null`。

**tendency**：`pinnacle-theme`（每段 1 至若干领域）、`personal-year-theme`（每年 1 至 2 个领域）、`main-challenge-theme`（终生，挂在 pinnacle.1 至 .4 上，或者挂在世界层提供的 lifetime 时段上，**待主设计者定**）。

**relationSlots**：`[]`。数字命理没有描述父母、配偶、子女等他人的结构。他人只有在用户录入其出生日期和显式拼写的姓名时，才对其独立运行本引擎。

**典型 omissions**：
- `{what:'name-numbers', reason:'input_missing'}`
- `{what:'name-numbers', reason:'ambiguous_input', detail:'含非 A–Z 字母，需要显式拉丁拼写'}`
- `{what:'challenge-period-boundaries', reason:'no_rule', detail:'来源未给出 C1/C2/C4 的确切年龄窗口'}`
- `{what:'relation-slots', reason:'no_rule'}`
- `{what:'chaldean', reason:'out_of_scope'}`

## 7. 一套世界如何展开

- **分岔点**：只来自 Pinnacle 交接，第 2、3、4 巅峰的起点，**每人 3 个 key_node**。因此一级世界有 2³ = 8 支，每支只表示「交接时人生主题是否发生可感知的转换」，不带方向。
- **数量级的依据**：Pinnacle 的数量固定为 4。第一个交接年龄在 27（LP 9）到 35（LP 1）岁之间，之后每隔 9 年一次，因此 3 个交接点都落在 27–53 岁之间。Personal Year 每年都有，但它只是倾向，不分岔。如果把 PY1 或 PY9 也当作 key_node，一生会多出约 18 个分岔点。这种做法没有任何文献依据，而且会让一个低区分度的体系主导世界数量，所以明确不这样做。
- **区分度**：Personal Year 序列只取决于 `reduce(reduce(月)+reduce(日))`，再加上不保留主数时的个位化，按出生日期把人口大约分成 9 类。Pinnacle 交接年龄只取决于个位化的 LP（9 类）。所以本引擎的世界在大约 1/9 的人口中完全相同。博弈层权重应体现这一点（建议由主设计者统一定义按区分度降权的方法）。
- **时间映射**：保留原生的 periodId（`numerology.personal-year.2031`），绝对时间只用于和其他引擎对齐。交接年本身就是一个 personal-year 时段，不再细分到日。

## 8. 从旧代码里可以借鉴什么

**可以参考的部分（仍需按第 5 节黄金用例重新核对）**：
- `src/core/numerology/reduce.ts`：`reduceToDigit`（保留主数）和 `reduceToSingleDigit`（不保留主数）区分清楚，可以沿用。
- `src/core/numerology/calculate.ts`：
  - `lifePathTotal`（分单元约简并保留中间值，用于业债判断）
  - `calculateNameNumber`（名段先约简）
  - `isNumerologyVowel`（Y 的位置规则）
  - `calculatePinnacles`、`calculateChallenges`（主数先化为个位数再取绝对差）
  - 对非 A–Z 字母 fail-closed，并给出 `unsupported_name_letters` 警告
  - 用 `validateGregorianDate` 拒绝非法日期
- `src/core/numerology/calculate.ts` 里 Challenge 不绑定精确年龄窗口的做法是诚实的，应该保留。
- `src/core/shared/calculationName.ts` 的 `normalizeCalculationName`：把计算用拼写与账号显示名分开（注释写明）。`src/components/BirthDataForm.tsx` 有独立的 `calculationName` 字段，方向正确。

**无依据的捏造（新设计中一律删除）**：
- `src/utils/eventSeedExtractors.ts` 的 `extractNumerologyEvents`：
  - 婚恋关键期 `const marriageAge = 20 + (report.lifePath % 5) * 2`，典型的取模推年龄。
  - 事业峰值 `28 + report.lifePath * 2`。
  - 生命数主题期固定在 33 岁（`earliestAge: 30, latestAge: 38`）。
  - 挑战期固定在 `challengeAge = 40`，并且被归入 `health` 领域。
  - 所有 `probability: 0.55/0.5/0.45/0.4/0.25` 都是固定概率。
  - PY4 对应意外、PY8 对应法律纠纷、PY9 对应财务危机、PY7 对应「婚姻危机/离婚」，这些都没有来源。
  - Pinnacle 年龄用的是未个位化的 `36 - report.lifePath`（LP=22 时得 14），再被 `Math.max(18, ...)` 截断。
- `src/utils/worldSystems/numerology.ts`：
  - `PERSONAL_YEAR_ENERGY` 中的 energy 数值（如 8 → 85、7 → 40）是捏造的。
  - `lpBoost` 和 `lifeVectors` 的加减分。
  - Pinnacle 和 lifePeriods 中的 `Math.max(firstPinnacleEnd, 27)`、`Math.max(periodTransition1, 25) + 27`。
  - `destinyExpression` 用出生日期而不是姓名计算（概念错误）。
  - `hiddenPassion`、`missingNumbers` 用日期数字计算（这些本应来自姓名字母）。
  - `detectKarmicDebts` 拿 `digitSum(year)` 比较 13/14/16/19。
  - 主数中加入了 44。
- `src/core/numerology/toEngineOutput.ts`：`NUMBER_BASE` 分数表，以及 `fateVector` 中的 `+5` 加成。

**已知 bug 和教训**：
1. 上面 `extractNumerologyEvents` 中的多段逻辑是**死代码**。`PERSONAL_YEAR_ENERGY` 里 4、8、9 的 energy 分别是 55、85、50，而触发条件是 `energy < 35`、`< 40`、`< 35`，永远不会成立。它们说明旧代码从未被规则驱动过，也没有被测试覆盖。
2. `src/core/numerology/calculate.ts` 中，缺少 `referenceYear` 时 Personal Year 退回到出生年，否则取 `queryTimeUtc` 的年份。结果依赖查询时刻，而且退回值没有意义。新设计改为在 timeline 上为每一年都生成 personal-year，不需要参考年。
3. `src/core/numerology/constants.ts` 第 22–24 行的注释说「Y 一律当作辅音」，与 `calculate.ts` 实际采用的位置规则矛盾。这个注释已经过时，新代码中注释必须与规则 ID 同步。
4. `src/core/shared/calculationName.ts` 在超过 120 字符时会**静默截断**（`slice(0, CALCULATION_NAME_MAX_LENGTH)`），截断会改变计算结果。新设计应改为拒绝并返回 `ambiguous_input`。另外，它使用 NFKC 规范化，`calculate.ts` 又做了一次 NFC。NFKC 会把全角拉丁字母转成半角，这是期望的行为，但规范化步骤应由一个规则 ID 统一说明。
5. 旧的 core 引擎仍然通过 `src/utils/p4CoreOverlay.ts` 的 `runCoreNumerology` 运行，旧的 worldSystems 版本通过 `src/utils/quantumPredictionEngine.ts`（第 730 行、第 1097 行）运行，两套实现**并存**，结果互相矛盾（例如 Expression 的定义完全不同）。新系统只保留一套。
6. 未核实：现有测试是否全部通过。本地 `npx vitest` 报错「Cannot find package 'vite'」，没能运行。

## 9. 未决问题与风险

1. Pinnacle「到 N 岁」的边界含义，以及 Personal Year 按 1 月 1 日还是按生日切换。这两点决定了所有 period 的绝对日期，必须先拿到原文。
2. 「Pinnacle 交接 = key_node」是项目从文献的阶段性描述中做的推论，不是文献明说的「应期」规则。如果主设计者认为这还不够格，本引擎就只贡献 tendency（0 个 key_node）。
3. 「数字 → 领域」的映射完全是项目假设。它决定了 tendency 落在哪些领域，需要列出原文措辞并经过评审。
4. 区分度极低，在坍缩阶段可能稀释更有信息量的引擎。需要统一的降权机制。
5. 姓名拼写由用户掌握，同一个人换一种拼法，Expression 就会改变。产品上需要明确提示：「结果只对你填写的这一拼写有效」。
6. 隐私：姓名属于个人信息。chart 只存数值和拼写的哈希，不存原文，inputDigest 同样如此。
