# 引擎设计：卡巴拉（engineId `kabbalah`）

## 1. 结论摘要

- **定位**：名义上是本命类（`natal`），但从体系上说，「卡巴拉」本身**不是一套从出生信息推演一生的命理系统**。
  - 犹太卡巴拉是宗教神秘主义传统。其中可以确定计算的部分只有 **Gematria**（希伯来字母数值）。
  - 生命树的 22 条路径与塔罗、星体的对应，来自 19 世纪的赫尔墨斯派（Golden Dawn）体系。
  - 市面上的「卡巴拉生命数」「灵魂质点」大多是现代通俗产品，没有可核对的规则。
- **第一版范围**：只对用户**显式提供的希伯来文拼写**计算四种 Gematria（Hechrachi、Gadol 尾字母变体、Katan、Siduri），作为 chart 交付。
- **世界生成**：本体系没有时间单位，没有「时段 × 领域」的规则，也没有描述他人的结构。因此 `timeline`、`signals`、`relationSlots` 全部为空，**第一版不进入世界生成**。
- **主要风险**：
  - 继续用取模把数值映射到质点或路径，伪造出「命盘」。
  - 用粗糙的拉丁转写冒充 Gematria。
  - 以宗教传统的名义输出个人命运结论，涉及文化和宗教上的不当。
- **建议初始状态**：`experimental`。也建议主设计者考虑在产品中把它改名为「希伯来字母数值（Gematria）」，不再宣称是卡巴拉推命。

## 2. 声明的流派和范围

**流派**：`school: 'Gematria 字母数值（Mispar Hechrachi / Gadol 尾字母 500–900 变体 / Katan / Siduri），仅希伯来原文输入'`。

**希伯来原文与拉丁转写（决策）**：
- **只接受希伯来字母**（Unicode U+05D0–U+05EA，含五个尾形字母 ך ם ן ף ץ）。
- **拉丁或其他文字的输入一律 fail-closed**，不转写，记录 `omission: ambiguous_input`，说明「需提供希伯来文拼写」。理由如下：
  - 拉丁字母到希伯来字母没有唯一的对应关系，一个元音可以写成 א、ה、ו、י、ע 中的任何一个，也可以不写。
  - 希伯来人名本身就有「全写」与「缺写」（ktiv male / ktiv haser）的差异。
  - 词尾是否用尾形字母，又会改变 Gadol 值。
  - 旧代码的 `LATIN_TO_HEBREW` 表是项目自造的（例如 O→ע、E→ה、X→כ），没有来源。
- 用户提供的希伯来拼写**按原样计算**，引擎不替用户在全写和缺写之间选择。

**输入**：

| 字段 | 必需 | 说明 |
|---|---|---|
| `nameHebrew` | 必需（缺失时本引擎不运行，只返回 omission） | 用户显式填写，不得从账号显示名推断 |
| 出生日期 | 第一版**不使用** | 旧代码用出生日期反推「质点」，没有依据，删除 |

**规范化口径**：
1. NFKC 会把希伯来呈现形式（U+FB1D–U+FB4F，例如带点的 שׁ 和宽体字母）还原成基本字母加组合符号。这一步沿用 `normalizeCalculationName` 的做法，标为 `project_assumption`。
2. 元音点（niqqud）和吟诵符号（U+0591–U+05C7 范围内的组合符号）在计算时忽略，不计数值，标为 `project_assumption`。在常见用法中，它们不属于字母本身，但这一点我没有核对过典籍出处。
3. 空格、马卡夫（־）、geresh 和 gershayim（׳ ״）忽略。
4. 只要出现其他文字的字母，就整体拒绝计算（与数字命理的做法一致）。
5. 尾形字母写在词中间等不规范的情况，按字形本身计值，并给出警告，不做纠正。

## 3. 计划实现的规则清单

字母数值本身在希伯来传统中是稳定的公共知识，但下表仍要求取得可引用的参考文献后，才能标为 verified。

| ruleId | 规则内容 | 来源 | 可靠性 | 产出 |
|---|---|---|---|---|
| `kabbalah.gematria.hechrachi` | א–ט 为 1–9，י–צ 为 10–90，ק–ת 为 100–400；尾形字母按其基本字母计值 | 《Encyclopaedia Judaica》「Gematria」条（卷章待查）；旧代码引用的 encyclopedia.com 条目 | cited_unverified | chart |
| `kabbalah.gematria.gadol-finals` | 尾形字母 ך ם ן ף ץ 分别计 500、600、700、800、900 | 同上；chabad.org 文章（旧代码 `sourceUrls`） | cited_unverified（**命名在文献中不统一**：有的文献把标准值也叫 Mispar Gadol，所以 ruleId 以数值表本身为准，不以名称为准） | chart |
| `kabbalah.gematria.katan` | 每个字母的值去掉末尾的 0（10→1、200→2） | 同上 | cited_unverified | chart |
| `kabbalah.gematria.siduri` | 字母序数 1–22，尾形字母取其基本字母的序数 | 同上 | cited_unverified | chart |
| `kabbalah.input.hebrew-only-fail-closed` | 非希伯来字母时整体拒绝计算，不转写 | 项目决策 | project_assumption | omission |
| `kabbalah.input.ignore-niqqud` | 忽略元音点和吟诵符号 | 项目决策 | project_assumption | chart |

**展示用参考（不参与任何推导）**：Golden Dawn 的 22 路径与字母的对应（`src/core/kabbalah/paths.ts` 的 `TREE_PATHS`）。我核对过路径编号 11–32 与两端质点的对应，和常见的 Golden Dawn 图示一致，但没有核对原始出处（unverified）。路径的 `meaning` 文字是项目自己写的。如果保留，ruleId 用 `kabbalah.reference.golden-dawn-paths`，标为 unverified，只在百科说明中展示，不与用户的姓名或日期发生任何映射。

## 4. 明确不做的部分

| 项目 | 理由 |
|---|---|
| 「主质点」：Gematria 总值或出生日期取模 10 映射到 10 个质点 | 没有任何来源，属于哈希取模。旧的 `sephirahFromNumber` 就是这样做的。 |
| 「主路径」：名字首字母或总值取模 22 映射到路径 | 没有来源，旧的 `pathFromLetter` 和 `pathFromNumber` 就是这样做的。 |
| 拉丁转 希伯来的转写 | 见第 2 节。 |
| 出生日期回退 | 「没有名字就用生日算质点」没有依据。 |
| Tikkun（修复课题） | 通俗卡巴拉产品中常见，有的版本从月亮交点推出。各家规则不一，我说不出可靠的典籍依据（unverified）。 |
| Qliphoth 阴影、四界平衡、闪电路径位置、Da'at 开启、支柱平衡 | 旧 worldSystems 实现全部自造，见第 8 节。 |
| 《创造之书》（Sefer Yetzirah）中字母与月份、行星的对应，以及希伯来历生日 | 理论上可以算出「出生的希伯来月份对应哪个字母」。但 Sefer Yetzirah 的各个传本（短本、长本、Saadia 本、Gra 本）在行星与字母的对应上不一致，而且它也不产出时段规则。第一版不做，将来可以作为 chart 扩展的候选项（希伯来历换算需要 `astro-time` 支持，以日落为日界）。 |
| 0–100 分数、旧 FateVector | 契约已作废。 |
| 寿命、死亡 | 类型层面不存在。 |

## 5. 黄金用例需求

| 类别 | 需要什么 | 外部来源 | 格式要点 |
|---|---|---|---|
| 正常 | 15 组以上的「希伯来词 → Hechrachi / Gadol / Katan / Siduri」 | 传统文献中广为引用的成例，候选如下，每条都要取得原文出处后才能入库：<br>- חי = 18<br>- 《塔木德·Eruvin》65a「נכנס יין יצא סוד」中 יין 与 סוד 同值（出处页码待核）<br>- שלום = 376（现有测试在用，需补出处）<br><br>另需一个公认的 Gematria 工具的四制式输出（工具待选，记录版本） | 逐字母列出数值，四种制式分别断言 |
| 边界 | 五个尾形字母；全部 22 个字母各出现一次（可以和数值表逐项核对）；带 niqqud 的拼写；带 geresh 或 gershayim 的拼写；NFKC 呈现形式字符 | 同上；Unicode 规范（用于规范化） | 断言带点和不带点的拼写结果相同 |
| 非法 | 空输入、纯拉丁、纯汉字、中文和希伯来文混合 | 不需要外部数据 | 期望不产出数值，只返回 omission |
| 歧义 | 同一个名字的全写和缺写（例如以 ו 或 י 作元音字母与否）；尾形字母写在词中间 | 需要一位希伯来语使用者提供真实名字的两种常见拼写 | 断言两种拼写分别计算、互不替代，并且引擎不自动选择 |

**需要用户提供或外部获取的数据清单**：
1. 《Encyclopaedia Judaica》「Gematria」条目的版次和页码，或者其他可引用的学术参考。
2. 塔木德成例的准确出处（篇名和页码）。
3. 一个公认 Gematria 工具及其版本，用来交叉核对四种制式。
4. 用户侧：希伯来文拼写的姓名（显式填写）。没有这一项，本引擎不运行。

## 6. 向一级世界层交付的内容

- **chart**：`kind: 'kabbalah.gematria/1'`。内容包括 `{ hechrachi, gadolFinals, katan, siduri, letterCount, spellingDigest }`。为了隐私，不存逐字母明细，因为逐字母明细等于名字原文。是否允许存储逐字母明细，**待主设计者决定**。
- **timeline**：`[]`，体系内没有时间单位。
- **signals**：`[]`。没有 key_node，也没有 tendency。Gematria 数值没有被任何有据可查的规则映射到领域或时段。
- **relationSlots**：`[]`，体系内没有描述他人的结构。他人只有在用户提供其希伯来文拼写时，才单独计算 Gematria，仅用于展示。
- **典型 omissions**：
  - `{what:'gematria', reason:'input_missing', detail:'未提供希伯来文拼写'}`
  - `{what:'gematria', reason:'ambiguous_input', detail:'含非希伯来字母，不做转写'}`
  - `{what:'timeline', reason:'no_rule'}`
  - `{what:'signals', reason:'no_rule'}`
  - `{what:'relation-slots', reason:'no_rule'}`
  - `{what:'tikkun', reason:'out_of_scope'}`

## 7. 一套世界如何展开

- **分岔点**：0 个，一级世界为空。
- **在六段式流程中的角色**：第一版**不进入**世界生成、重大选择提取、博弈和坍缩。只在用户提供希伯来文拼写时，在个人档案中展示 Gematria 数值。
- 如果未来要参与，前提是找到一个流派，它对「名字或出生日 → 时段 × 领域」有成文且可核对的规则。我目前不知道有这样的流派。

## 8. 从旧代码里可以借鉴什么

**可以参考的部分**：
- `src/core/kabbalah/constants.ts`：`HEBREW_GEMATRIA`（标准值，尾形字母按基本字母计值）、`HEBREW_FINAL_GADOL`（500–900）、`HEBREW_ALPHABET`。我逐项看过，数值与通行表一致，仍需按第 5 节的外部来源核对。
- `src/core/kabbalah/gematria.ts`：
  - `gematria` 中 Katan 用 `reduceValue` 去掉末尾的 0，Siduri 用 `ordinalValue` 并把尾形字母归到基本字母。
  - Gadol 只对**用户显式输入的尾形字母**应用 500–900，不推测（测试 `gematria('ךםןףץ').gadol === 3500`）。这一原则是对的。
- `src/core/kabbalah/paths.ts` 的 `TREE_PATHS`：路径 11–32 与两端质点的对应可以作为展示参考，`meaning` 文字是项目自写的。

**无依据的捏造（删除）**：
- `src/core/kabbalah/treeOfLife.ts` 的 `sephirahFromNumber`：`((n - 1) % 10 + 10) % 10 + 1`，用 Gematria 总值或日期取模 10 得到「主质点」。
- `src/core/kabbalah/paths.ts` 的 `pathFromNumber`：总值取模 22 得到路径。`src/core/kabbalah/calculate.ts` 用 `pathFromLetter(gem.letters[0].letter)` 把名字首字母当作「主路径」。
- `src/core/kabbalah/calculate.ts`：没有名字时用 `reduceToDigit(sumDigits(year)+sumDigits(month)+sumDigits(day))` 回退到质点。
- `src/core/kabbalah/constants.ts` 的 `LATIN_TO_HEBREW` 粗转写表。`calculate.ts` 对拉丁输入仍然把 `derivedFromName` 设为 true。
- `src/core/kabbalah/toEngineOutput.ts` 的 `SEPHIRAH_BASE` 分数表，以及 `damped = base * 0.85`。
- `src/utils/worldSystems/kabbalah.ts` 整个文件：
  - `dateToSephirahIndex` 中的 `(year + month*3 + day*7) % 10 + 1`；
  - 人格质点 `((month + day) % 10) + 1`；
  - 能量 `(day*month + s.index) % 20`；
  - 主路径 `(soulIdx + personalityIdx) % PATHS.length`；
  - 把出生日期数字之和叫作「gematria」（`calculateGematria`）；
  - 四界、Da'at、闪电路径、Qliphoth 等全部自造。

  该文件 `PATHS` 中的塔罗对应与 Golden Dawn 不一致：Beth 标为「女祭司」，Golden Dawn 通常对应魔术师；Vav 标为「星星」，通常对应教皇。这些都说明它没有出处。
- `src/utils/eventSeedExtractors.ts` 的 `extractKabbalahEvents`：
  - 情感期 `relAge = 24 + (soul + personality) % 8`；
  - 财运 `35 + personalitySephirah.index`；
  - 健康 `50 + soulSephirah.index`；
  - 固定的 40 岁「灵性突破」和 30 岁「事业显现」；
  - `sephirothAges = [10, 18, 25, …, 78]` 生命树阶段年龄表；
  - 固定概率 0.3–0.45。

  全部删除。

**教训**：
1. 当体系本身没有推运规则时，旧代码倾向于用取模和固定年龄「补齐」，让每个引擎看起来都能产出事件。新设计必须允许一个引擎合法地交出空的 signals。
2. 两套实现并存：`src/utils/quantumPredictionEngine.ts`（第 814 行、第 1099 行）使用 worldSystems 版本，`src/utils/p4CoreOverlay.ts` 的 `runCoreKabbalahEngine` 使用 core 版本。
3. 未核实：现有测试能否通过（本地缺少 vite，没能运行）。

## 9. 未决问题与风险

1. 是否保留这个引擎。我的建议是降级为「Gematria 展示」，不再称为推命引擎。这需要主设计者和用户拍板。
2. 是否存储逐字母明细（涉及隐私），以及 chart 的最小内容。
3. niqqud 忽略、geresh 处理等规范化口径缺少典籍依据，目前是项目假设。
4. 文化和宗教敏感性：以犹太宗教传统的名义给出个人命运结论，可能被视为挪用。UI 文案必须克制。
5. 如果将来做 Sefer Yetzirah 的月份字母，需要先选定传本，并由 `astro-time` 提供以日落为日界的希伯来历换算。
