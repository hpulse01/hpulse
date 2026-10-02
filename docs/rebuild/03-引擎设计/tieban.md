# 铁板神数（engineId `tieban`）引擎设计

> 状态：设计稿，待用户在第 0 节的三个选项中拍板。本文只做设计，不含业务代码。
> 文中凡是关于现有代码的陈述都附文件路径；凡是关于典籍出处的陈述，写不出卷章的都标「卷章待查」。

## 0. 需要用户拍板的决定

铁板神数（下称「铁板」）是一种以出生时刻起数、再按「条文号」查一本条文书得出断语的本命术数。它与八字、紫微的根本差别在于：**算法的产物不是盘面结构，而是一串条文编号；断语全部在条文书里**。因此它能否成立，取决于两样东西同时可靠：起数公式和条文书底本（含编号）。现在仓库里两样都不可靠（详见第 8 节）：

- 核心公式 `baseNumber / theoreticalBase / quarterKe / systemOffset` 是项目自定义的，仓库自己的登记表也这么写（`src/core/shared/algorithmSourceRegistry.ts` 的 `tieban.validationNotes`：「当前公式属项目自定义校时模型」）。
- 条文数据 `src/data/tieban-clauses.json`（986,265 字节，12,001 条记录）来源和版权状态不明，编号区间也和代码假设对不上（见 8.3）。

### 选项甲：取得可靠底本后正式实现

- **前提**：(1) 一个来源清楚、可合法使用的条文底本（明确的版本、刊印或抄本信息，条文与编号一一对应）；(2) 与该底本配套的起数和考刻方法文献，能把「出生时刻 → 条文号」的每一步落到文字；(3) 至少一批出自代码之外的成例（文献中给出生时刻、考刻结果、条文号的命例）用作黄金用例；(4) 对用到的每一条条文做人工标注（领域、当事人、极性、是否说明应期），标注本身登记为 `project_assumption`，由第二人复核；(5) 法务确认底本能存储、展示到什么程度。
- **交付**：完整的 `EngineDelivery`，包括 `chart`（四柱、刻、起数中间量、命中的条文号）、按「岁」的 `timeline`、来自已标注条文的 `signals`、来自考刻和后续条文的 `relationSlots`，以及考刻子步骤（第 2.4 节）。
- **风险**：可靠底本可能根本拿不到。铁板向来以秘传、版本互异著称，坊间流传的「条文」很多没有说明起数方法。工作量集中在文献整理和人工标注，而不是写代码，周期难以估计。另外条文里有大量涉及寿元、刑克、六亲存亡的内容，需要整体过滤（第 4 节）。
- **初始状态**：`needs_source_validation`。只有满足第 0 节契约中升级为 `complete` 的条件后才升级；按目前掌握的情况，第一版不可能达到 `partial` 以上。

### 选项乙：只在研究模式出现

- **前提**：产品上要有一个「研究模式」开关，其输出不进入一级世界、不参与选择提取和坍缩，界面明确标注「项目自定义 / 未验证」。
- **交付**：`EngineDelivery`，其中 `status: 'experimental'`、`signals: []`、`relationSlots: []`、`timeline: []`。`chart` 只放有来源或纯天文历法的部分：四柱（复用 astro-time 和八字的共享历法层）、出生时刻落在时辰的第几刻（明确使用的时间口径）、按太玄数求得的四柱数值。所有依赖条文号的内容都放进 `omissions`，`reason: 'no_rule'`。如果用户坚持看条文，只能在研究模式里显示「条文号 + 不显示正文」，或者在法务许可后显示经过过滤的正文，且要标注编号映射是项目自定义的。
- **风险**：一旦在任何界面出现，用户会把它当成正式结论；研究模式的边界必须由类型层保证（世界层直接拒收 `experimental` 引擎），不能只靠界面上的文字。保留条文数据的版权风险依旧存在。

### 选项丙：这次不做

- **前提**：无。
- **交付**：引擎注册表里保留 `tieban` 条目，`status: 'needs_source_validation'`，在主流程中关闭；本文档作为将来重启时的输入。旧的六亲校时界面（`src/components/SixRelationsVerification.tsx`）不再是任何人的必经步骤，其他引擎不依赖铁板。
- **风险**：几乎没有技术风险。产品上会失去一个对外宣传的卖点；旧流程里铁板是入口（`src/hooks/usePredictionFlow.ts` 的 `input → calculating → verification → projecting → result`），要改流程。

### 条文数据是否继续留在仓库

不管选哪个选项，**建议把 `src/data/tieban-clauses.json` 从公开仓库移出**，放到受控的私有存储，保留其哈希和结构说明，直到版权状态查明。理由：
1. 来源不明。git 历史只有一个提交（`fd94628`，2026-05-18，提交信息与条文无关），无法追溯出处。
2. 它同时被导入数据库，而数据库表对所有人开放读取（`supabase/migrations/20251224082344_0edd01fd-8b3a-42fb-bc22-7a758e9c4f2b.sql`：`CREATE POLICY "Anyone can read clauses" ... USING (true)`），也就是说现在等于公开分发。
3. 内容里有寿元、死亡类断语（按 `src/core/tieban/sensitiveContent.ts` 的正则统计，至少 44 条命中；正则可能有漏网，实际数目未核实）。
4. 选项甲也用不上它：现有文件没有底本信息，即使留着也要重新按可靠底本建库。

如果用户确认拥有使用权，留在私有存储即可；没有必要留在公开 git 中。从 git 历史中彻底清除属于另一件需要用户授权的操作，本文只提出，不执行。

### 我的建议

**选丙，同时把条文数据移出仓库；在选项甲的前提（尤其是可靠底本）真正具备之前，不启动甲。** 不推荐乙：研究模式下铁板能给出的、有出处的东西只有四柱和太玄数，这些八字引擎已经覆盖了；而铁板独有的部分（条文）在研究模式里展示也同样会遇到版权问题和误导问题。乙的成本不低，收益却很小。

---

## 1. 结论摘要

- **定位**：铁板是本命类引擎（`engineClass: 'natal'`），产出依赖「起数公式 + 条文底本」。两者现在都没有可靠来源。
- **第一版范围**：建议不进入主流程（选项丙）。如果用户选甲，第一版只交付考刻和按岁的流年条文，以及来自已标注条文的信号。
- **六亲校时（考刻）**：在新设计里是铁板内部的可选子步骤。它的输入（父母生肖、兄弟人数等）是用户提供的事实，**在契约上作为引擎输入**而不是坍缩阶段的现实情境（理由见 2.4）。
- **主要风险**：底本不可得；现有公式是自造的；条文版权不明；条文里有大量寿元、刑克类内容。
- **建议的初始状态**：`needs_source_validation`；如果走选项乙，研究模式下为 `experimental`。
- **旧代码里最严重的问题**：校时之后，所有宫位的条文号只取决于用户选中的那条条文，出生时刻完全不起作用（8.4 第 1 条）；数据文件的编号区间是 1001–13000，代码却假设 1–12000，考刻所用的 1–1000 区间在数据里一条都没有（8.3）。

## 2. 声明的流派和范围

### 2.1 流派

- 声明：`school: '铁板神数·底本待定'`。传统上铁板托名北宋邵雍，这个托名本身就存疑；不同传本的条文数、编号方式、起数法互不相同，没有一个公认的「标准本」。**本文不指定任何具体版本**，因为我无法确认哪一个版本可靠且可用。选项甲的第一步就是确定底本，并把 `school` 改写为该底本的名称和版本。
- 旧代码登记的来源是「《铁板神数》(待校验)」（`src/core/shared/algorithmSourceRegistry.ts`）、「classical: 铁板神数 (邵雍传) — 待文献交叉校验」（`src/core/tieban/toEngineOutput.ts`）和「铁板神数原典PDF、《邵子神数》」（`src/utils/tiebanAlgorithm.ts` 的文件头注释）。这些都没有版本信息，也没有说明哪个公式出自哪里，不能作为来源。

### 2.2 输入

| 字段 | 必需 | 用途 | 说明 |
|---|---|---|---|
| 出生日期时间（到分钟） | 是 | 四柱、所在时辰、所在刻 | 刻长 15 分钟，所以分钟精度是硬要求；只知道时辰时，刻为歧义输入 |
| 出生地经纬度、IANA 时区 | 是 | 由 astro-time 换算 UTC，以及（如采用）真太阳时 | |
| 性别 | 是 | 旧公式里有「女命 +500」；是否需要取决于底本 | 旧的 +500 没有出处（见第 8 节） |
| 考刻事实（可选） | 否 | 考刻子步骤 | 见 2.4 |
| 姓名 | 否 | 不使用 | |

### 2.3 口径决策点（都列为待决）

1. **刻的时间口径（待决，影响最大）**：刻长 15 分钟，而真太阳时和当地民用时之间可以差几十分钟（经度差加上均时差，均时差全年在约 ±16 分钟内变化）。用民用时还是真太阳时分刻，结果会差好几刻。目前共享历法层在取时柱时用的是出生地民用时（`src/core/calendar/fourPillars.ts` 的注释：「时辰按出生地民用时（local civil hour）取，与铁板/lunar-typescript 一致」）。这个「与铁板一致」没有出处。必须由底本决定。
2. **时辰内分钟数的算法**：子时从 23:00 开始，时辰内分钟数应为 `((hour + 1) % 2) * 60 + minute`。旧代码写成了 `(hour % 2) * 60 + minute`（见 8.4 第 2 条），把每个时辰的前后两半对调了。
3. **一时辰几刻**：旧代码按一时辰八刻、每刻 15 分（即一日九十六刻）。九十六刻制据我所知是清代时宪历采用的制度，此前长期使用的是一日百刻；具体文献卷章待查。铁板底本用的是哪种刻制，取决于底本的年代，**待决**。
4. **年界**：流年按立春、农历正月初一，还是按生日周岁换年，待决（由底本决定）。
5. **子时日界、闰月**：四柱部分沿用八字引擎（`docs/rebuild/03-引擎设计/bazi.md`）的决策，铁板不另定口径。
6. **四柱用节气历还是农历月**：旧代码通过 lunar-typescript 的 `getMonthInGanZhi` 取节气月柱（`src/utils/tiebanAlgorithm.ts` 的 `extractPillars`）。铁板底本是否也这样，待查。

### 2.4 考刻（六亲校时）在新契约下的表达

**它是什么**：铁板认为同一时辰内不同的刻对应不同的条文，而人的出生时间往往记录不准，所以先列出几个候选刻各自对应的「考刻条文」（据流传说法，内容是父母生肖、兄弟人数、父母先后等家庭事实），让当事人对照自己的家庭情况选出相符的那一条，以此锁定出生的刻。这一说法在坊间资料中很普遍，但具体是哪几项事实、条文如何编号，取决于底本，**我无法给出出处**，标 `cited_unverified`。

**它的输入属于引擎输入，不属于现实情境**。理由：

1. **作用的位置不同**。坍缩阶段的现实情境用来在已经生成的世界中挑选路径；考刻事实则在世界生成之前就改变了铁板的盘面（锁定哪一刻、命中哪些条文）。它实质上是在修正出生时刻，和出生时间属于同一类输入。
2. **避免循环和重复计分**。如果把这些事实放在坍缩阶段，铁板的世界就会用「父属牛」去匹配同样由「父属牛」选出的条文，得到的必然是完全吻合，结果被重复加分。放在引擎输入，可以明确规定：**被考刻用过的事实，坍缩阶段不得再拿来给铁板的世界计分**（坍缩层可以用来给其他引擎计分，因为对其他引擎是独立证据）。
3. **可复现**。引擎输入要进入 `inputDigest`；同一组事实必然得到同一个刻。现实情境则可能随时间更新，不适合锁定盘面。

但它和普通的出生信息也有区别：它是**用户对他人的陈述**，可能出错，并且可能涉及敏感信息（父母存亡）。因此建议单独建一个输入块，而不是混在出生信息里：

```ts
// 示意，非定稿代码
interface TiebanKaokeInput {
  schema: 'tieban.kaoke-input/1';
  method: 'fact_match' | 'recorded_minute' | 'skipped';
  // fact_match：用户按考刻条文所列项目提供的事实；键名由底本的考刻条文决定，不预先固定
  facts?: { key: string; value: string; providedBy: 'self' }[];
  // fact_match：用户从候选刻中确认的那一个（由用户选择，引擎不替用户打分）
  selectedKeIndex?: number;
}
```

- 输入是 `EngineInput.tieban.kaoke`，属于铁板私有输入，进入 `inputDigest`。
- **流程分两步**：第一步 `prepareKaoke(birth) → KaokeRequest`，列出候选刻（每个刻附 astro-time 算出的绝对时间区间）和每个候选刻对应的考刻条文号；第二步由用户确认后再调用主引擎。在 `EngineDelivery` 层面，没有考刻输入时引擎仍可返回，只是凡依赖刻的内容都进入 `omissions`（`reason: 'ambiguous_input'`，`detail` 写明候选刻的数目和时间区间）。
- **引擎不替用户打分**。旧代码给每个刻打 0–100 分（父 35、母 35、存亡 20、兄弟 10），这套权重没有出处（`src/core/tieban/familyVerification.ts`）。新设计只做两件事：展示候选刻对应的考刻条文要点，由用户选；或者在事实与条文要点能逐字比对时，列出「哪几个候选刻与用户事实逐项一致」。如果有多个一致或没有一致，按歧义处理，不硬选。
- **父母存亡**：这是涉及死亡的事实。用户可以把它作为输入提供，但引擎**不得输出**任何「预测某位亲属存亡」的内容。如果底本的考刻条文包含存亡，比对在引擎内部进行，界面上只显示「该候选与您提供的事实一致 / 不一致」，不展示条文中关于存亡的原文。
- **recorded_minute**：如果用户有准确到分钟的出生记录，可以直接按 2.3 第 1 条确定的时间口径得出刻，不需要考刻。这时候考刻事实仍可选填，用作一致性检查；如果两者冲突，输出 `omissions`（`reason: 'ambiguous_input'`），不默默选一个。
- **跳过**：`method: 'skipped'` 时，不像旧代码那样把 `systemOffset` 设成 0 继续往下算（`src/hooks/usePredictionFlow.ts` 的 `handleSkipVerification`），而是不输出任何依赖条文的内容。
- **是否把八个候选刻当作世界分岔**：理论上可以把考刻前的不确定性表达成「8 个预先分出的世界」，但这会让铁板的世界数量乘以 8，而且每支所依据的条文本身就没有核实。第一版不这样做，列入未决问题。

## 3. 计划实现的规则清单

下表是**选项甲**下的规则清单。选项乙只实现标 ★ 的三条；选项丙不实现任何一条。凡是写「依底本」的，在底本确定前没有内容，不得用旧公式代替。

| ruleId | 规则内容（一句话） | 来源 | 来源可靠性 | 产出 |
|---|---|---|---|---|
| `tieban.input.pillars-shared-calendar` ★ | 四柱由共享历法层（astro-time + 八字引擎的四柱规则）给出，铁板不自己排 | 沿用八字引擎文档中的出处；铁板是否用节气四柱依底本 | cited_unverified | chart |
| `tieban.time.ke-of-shichen` ★ | 按 2.3 中决定的口径，求出生时刻落在所在时辰的第几刻 | 九十六刻制：清代时宪历（卷章待查）；铁板用何刻制依底本 | cited_unverified | chart |
| `tieban.number.taixuan` ★ | 干支的太玄数：甲己子午九、乙庚丑未八、丙辛寅申七、丁壬卯酉六、戊癸辰戌五、巳亥四 | 扬雄《太玄经》（相关篇章卷章待查）；铁板起数是否使用太玄数及如何使用，依底本 | cited_unverified（表本身）/ unverified（用于铁板） | chart |
| `tieban.number.base` | 由四柱、刻（及性别等）求起数基数 | 依底本 | unverified | chart |
| `tieban.kaoke.candidates` | 由基数列出各候选刻对应的考刻条文号 | 依底本 | unverified | chart |
| `tieban.kaoke.user-confirm` | 由用户事实确认候选刻（见 2.4），不打分 | 考刻做法：坊间通行说法，出处卷章待查；确认流程本身是项目设计 | cited_unverified / project_assumption | chart |
| `tieban.clause.topic-mapping` | 条文号到人生领域（命、婚、子、财……）的对应 | 依底本 | unverified | chart |
| `tieban.liunian.period` | 按岁划分流年，年界按 2.3 第 4 条 | 依底本 | unverified | period |
| `tieban.liunian.clause` | 每个流年对应一条流年条文 | 依底本 | unverified | chart |
| `tieban.signal.annotated-tendency` | 条文经人工标注为某领域、某当事人的倾向 → `tendency` | 条文：底本；标注：项目人工标注，双人复核 | project_assumption | signal(tendency) |
| `tieban.signal.annotated-yingqi` | 条文明确写出某岁、某年在某领域有变动（应期）→ `key_node` | 同上 | project_assumption | signal(key_node) |
| `tieban.relation.kaoke-facts` | 考刻确认后，父、母、兄弟的属性就是用户提供的事实，原样放进 relationSlot 并标为用户事实 | 用户输入 | project_assumption | relationSlot |
| `tieban.relation.annotated-clause` | 条文中关于配偶、子女的非死亡类描述（如属相、人数），标注后作为 relationSlot 属性 | 同 `annotated-tendency` | project_assumption | relationSlot |
| `tieban.safety.exclude-mortality` | 寿元、死期、亲属存亡类条文不输出，命中即记一条 omission | H-Pulse 产品约束（非命理规则） | project_assumption | （omission） |

说明：
- 标注规则（`annotated-*`）是把铁板接入契约的唯一可行办法：条文是自然语言断语，「某条文说的是事业还是财富、吉还是凶、是否有应期」必须由人判断。这一步是**解释**，不是典籍规则，所以来源可靠性只能是 `project_assumption`，并且 `intensity` 一律为 `null`（条文本身不分等级）。
- `signal.evidence` 指向 `chart.data.clauses[<n>]`，同时记录底本条文号和标注版本号。

## 4. 明确不做的部分及理由

| 不做的内容 | 理由 |
|---|---|
| 旧公式 `baseNumber`、`theoreticalBase`、`quarterKe`、`systemOffset` 和宫位偏移 | 项目自造，没有出处（第 8 节）；按约束 2，没有规则依据的数值宁可不输出 |
| 「每刻得分」（父 35 / 母 35 / 存亡 20 / 兄弟 10，近一属相 +15 等） | 权重没有出处；考刻改为由用户确认 |
| 寿元、死期、「克父母/克妻」等亲属存亡类断语 | 契约约束 5；类型层面不存在。属于这一类的条文整条过滤，只记 omission |
| 洛书、河图、先天卦「和谐度」、十二宫「强度」「大吉/大凶」评级 | 旧代码中全部是自造分数（8.4） |
| 大运 | 旧铁板的大运直接借用八字的起运（`src/utils/tiebanAlgorithm.ts` 的 `calculateDaYun` 调用 lunar-typescript 的 `getYun`）。这属于八字引擎；铁板再输出一遍会让同一个证据被重复计入 |
| 0–100 分、`FateVector`、`confidence` | 契约已废除 |
| 流月、流日条文 | 旧代码有「流月宫」偏移（`src/core/tieban/constants.ts`），没有出处；底本若有，第二版再考虑 |
| 条文的近邻替代（找不到条文号时向两边找 ±25 条） | `src/core/tieban/clauseMapping.ts` 的 `findClause`。虽然旧代码如实记录了回退，但用相邻条文代替本身没有规则依据；新设计里找不到就记 omission |
| 「增删神数」「邵子神数」交叉验证 | 我无法确认这些体系的底本与铁板的关系，不做 |

## 5. 黄金用例需求

**铁板的黄金用例必须同时给出：出生时刻、所用底本、考刻结果、命中的条文号。** 没有底本的条文号，用例就不成立。下面列出需求；期望值全部要从外部获取，不允许由代码生成。

| 类别 | 需要什么 | 从哪里获取 | 格式要点 |
|---|---|---|---|
| 正常 | 3–5 个底本或其配套文献中自带的命例：出生年月日时刻、性别、考刻条文号、若干流年条文号 | 选定底本的书中成例；没有的话，由底本持有人或可信的铁板从业者提供有署名的推算记录 | 每个用例写明底本版本、页码（拿到书以后再填，现在不填）、时间口径 |
| 边界 | 刻的边界（如某时辰第 4/5 刻交界前后 1 分钟）；子时 23:00 前后；立春交节当天；夏令时切换日 | 四柱部分：香港天文台节气时刻、八字引擎已有的外部用例；刻和条文号：底本 | 同一用例分别给出民用时和真太阳时下的结果，用来锁定 2.3 第 1 条 |
| 非法 | 缺分钟、缺性别（若底本需要）、时区缺失、考刻事实与所有候选刻都不一致 | 不需要外部数据，期望行为由本文档规定 | 期望：拒收或 omission，`reason` 精确匹配 |
| 歧义 | 只知道时辰；多个候选刻与事实一致；`recorded_minute` 与考刻冲突 | 同上 | 期望：`ambiguous_input`，不得自动选刻 |

### 需要用户提供或外部获取的数据清单

1. 选定的铁板底本：版本、刊印或抄本信息、全部条文与编号的对应关系、使用授权（用户或法务提供）。
2. 与底本配套的起数法、考刻法文献原文（用于逐步核对 `tieban.number.base`、`tieban.kaoke.candidates`）。
3. 底本中的成例，或者有署名的从业者推算记录，不少于 5 例。
4. 刻制、时间口径（民用时或真太阳时）的文献依据。
5. 《太玄经》中太玄数相关段落的可靠版本（用于把 `tieban.number.taixuan` 从 cited_unverified 升为 verified）。
6. 条文人工标注的规范和两名标注者（项目内部资源）。
7. 关于 `src/data/tieban-clauses.json` 来源和权利状态的说明（用户提供）。

## 6. 向一级世界层交付的内容

（仅适用于选项甲。选项乙交付的 `timeline`、`signals`、`relationSlots` 都为空；选项丙不交付。）

### 6.1 timeline

- 单位：`tieban.liunian`（流年，一岁一段）。`periodId` 形如 `tieban.liunian.<周岁>`，`label` 形如「流年 31 岁（丙午）」。
- 绝对日期：由 astro-time 计算。年界依 2.3 第 4 条：如果是立春，`start` 为该年立春交节时刻（来自 astro-time 的节气），`end` 为次年立春（开区间）；如果是生日周岁，则为出生时刻在各年的同一公历时刻。不得像旧代码那样用「当年 6 月 15 日中午」来代表一年（`src/utils/tiebanAlgorithm.ts` 的 `calculateFlowYearClauses`）。
- `parentPeriodId: null`（铁板不另设大运）。`ruleId: 'tieban.liunian.period'`。
- 时间范围：到底本给出的流年条文为止；不延伸到底本没有的年份。

### 6.2 哪些规则产生 key_node，哪些产生 tendency

- `key_node`：只有 `tieban.signal.annotated-yingqi`，即条文原文明确写出了某岁、某年或某段时间「有某事」。旧数据中带有年龄表述的条文约占 1.2%（12,001 条中 144 条含「×岁」类字样，按正则粗略统计），可见这种条文是少数。
- `tendency`：`tieban.signal.annotated-tendency`，即只描述性情、境遇、吉凶的条文。考刻条文不产生任何信号（它描述的是用户已提供的事实）。
- 产出 `key_node` 的条文如果带有吉凶方向，`polarity` 照标注填写；没有方向就填 `neutral`。

### 6.3 relationSlots

| role | 来源规则 | 内容 | 可靠性 |
|---|---|---|---|
| father / mother / sibling | `tieban.relation.kaoke-facts` | 用户提供的事实（生肖、兄弟人数），原样转存，并注明来源是用户输入，不是推算 | 用户事实 |
| spouse / child | `tieban.relation.annotated-clause` | 底本条文中关于配偶属相、子女人数等的非死亡类描述 | project_assumption（标注），底本可靠性取决于底本 |
| 其他（mentor、superior 等） | — | 铁板体系里没有对应结构 | 不输出 |

注意：父母兄弟这几个槽位不是铁板推算出来的，世界层不能把它们当作铁板的「预测命中」。

### 6.4 典型 omissions

- `{ what: '考刻', reason: 'input_missing' | 'ambiguous_input', detail: '未提供考刻事实 / 候选刻 3、4 均一致' }`
- `{ what: '条文 <号>', reason: 'out_of_scope', detail: '寿元/存亡类条文按产品约束不输出' }`
- `{ what: '条文 <号>', reason: 'no_rule', detail: '底本缺此条' }`
- `{ what: '大运', reason: 'out_of_scope', detail: '由八字引擎提供' }`
- 选项乙下：`{ what: '全部条文', reason: 'no_rule', detail: '起数公式与条文编号未获可靠来源' }`

## 7. 它的一套世界如何展开

- **分岔点**：只来自 `annotated-yingqi` 产生的 `key_node`。每个 key_node 分成「应验 / 未应验」两支，应验支带条文标注的极性。考刻在世界展开之前就已完成，不形成分岔（2.4 最后一条）。
- **数量级**：一个人的流年条文大约等于底本覆盖的岁数，量级是几十条；按旧数据中「含明确年龄表述」约 1% 的比例推算，加上非年龄型的应期表述（如「某年交某运」），每人 key_node 的量级估计在 **0 到 10 个左右**，也就是 10^0–10^1，最多 2^10 量级的世界。这个估计依据的是来源不明的旧数据，只能说明数量级，选定底本后必须重算。
- **时间映射**：信号挂在 `tieban.liunian.<岁>` 上，世界层通过 `NativePeriod.start/end` 映射到绝对时间。如果条文写的是「某岁」，就落在该流年；如果写的是跨若干年的时段，`periodId` 取起始流年，在 `evidence` 中注明跨度，不自行拆分。

## 8. 从旧代码里可以借鉴什么

### 8.1 可以作为参考（仍需按来源要求重新核对）

- 太玄数表 `TAI_XUAN_MAP`（`src/utils/tiebanAlgorithm.ts`）：与《太玄经》中通行的太玄数一致（我核对的是通行说法，原书篇章未核实）。可以重新登记为 `tieban.number.taixuan`。
- 一时辰八刻的表 `KE_SHIFT_TABLE`（`src/core/tieban/calculateQuarterKe.ts`、`src/utils/tiebanAlgorithm.ts`）：结构可用，但时辰内分钟数的算法有 bug（8.4 第 2 条）。
- 条文查找结果的透明记录（`ClauseMatch` 的 `requestedClauseNumber / matchedClauseNumber / exactMatch / fallbackReason`，见 `src/core/tieban/types.ts`、`src/core/tieban/clauseMapping.ts`）：「不把回退冒充精确命中」这个思路要保留；但新设计里不做近邻替代。
- 寿元、死亡类条文的过滤（`src/core/tieban/sensitiveContent.ts` 的 `containsHighRiskPersonalOutcome`，以及 `src/services/SupabaseService.ts` 中 `sanitizePublicClause` 的接入）：思路可以保留，但正则只是一层兜底，不能代替逐条人工标注；「克」「刑」一类隐含亲属存亡的表述它没有覆盖。
- 管理员导入的权限检查（`supabase/functions/import-clauses/index.ts` 要求 `is_super_admin`）：可以保留。但这个函数会把 `id` 当整数直接 upsert，不校验编号区间，也不记录底本版本。新表需要加上 `source_edition`、`source_locator` 两列，并改成仅限服务端读取。

### 8.2 项目自造、没有出处的部分（新设计一律不用）

| 内容 | 位置 | 说明 |
|---|---|---|
| `theoreticalBase = ((四柱太玄和×100 + 时支爻数 + 刻×30 + 余分×2 + 女命500 − 1) mod 12000) + 1` | `src/core/tieban/calculateTiebanBase.ts`、`src/utils/tiebanAlgorithm.ts` 的 `calculateTheoreticalBase` | 乘数 100、30、2、500、模 12000 都没有出处 |
| `baseNumber = 四柱太玄和×100 + 刻×25 + 余分 + 女命500` | `src/utils/tiebanAlgorithm.ts` 的 `calculateBaseNumber` | 与上一条是两个不同的公式，却同时在用（8.4 第 3 条） |
| 时支「爻数」表 `BRANCH_YAO_VALUES`（子丑 30、寅卯 60 …… 戌亥 180） | `src/utils/tiebanAlgorithm.ts` | 我找不到出处，标 unverified |
| 每 1000 号为一「宫」（父母 1–1000、命 1001–2000……流月 10001–11000） | `src/core/tieban/constants.ts`、`src/utils/tiebanAlgorithm.ts` 的 `PALACE_OFFSETS` | 与数据文件的实际内容不符（8.3） |
| 迁移、仆役、福德宫 modifier 137 / 251 / 389 | `src/utils/tiebanAlgorithm.ts` 的 `TWELVE_PALACES` | 常数 |
| 考刻预测：父生肖 = (seed+3) mod 12，母 = (seed+9) mod 12，兄弟数 = seed mod 8 + 1，父母存亡 = 各位数字和 mod 4，配偶 = (seed+6) mod 12 | `src/utils/tiebanAlgorithm.ts` 的 `calculateSixRelationsMatch`，`src/core/tieban/familyVerification.ts` | 典型的取模捏造；并且把父母存亡作为预测对象 |
| `systemOffset = 选中条文号 − 预期条文号` | `src/core/tieban/systemOffset.ts`、`src/utils/tiebanAlgorithm.ts` 的 `calculateSystemOffset` | 机制本身没有出处，并且会抹掉出生信息（8.4 第 1 条） |
| 流年条文号 = 基数 + 偏移 + 岁×12 + 年支序号 | `src/utils/tiebanAlgorithm.ts` 的 `calculateFlowYearClauses` | 「太玄乘数」只计算出来，没有用到 |
| 洛书、河图、先天卦「和谐度」，十二宫强度 `(clauseId*7+3) % 5`，总评「上上……下下」 | `src/utils/tiebanAlgorithm.ts` 的 `calculateLuoShuHarmony`、`calculateHeTuHarmony`、`calculateXianTianGua`、`analyzeTwelvePalaces`、`calculateOverallGrade` | 全部是自造分数 |
| 喜忌：日主与月令五行相同就算「得令」，据此定喜忌 | `src/utils/tiebanAlgorithm.ts` 的 `calculateBaZiProfile` | 这是对八字的过度简化，也不属于铁板 |
| 事件：婚龄 23/28/33，事业高峰 30/38/45，财运 28/38/48，健康风险 55/65 岁，子女 28/30 岁；固定概率 0.7、0.65、0.6、0.4、0.55；「重要年龄」列表 1、6、12…80 | `src/utils/eventSeedExtractors.ts` 的 `extractTiebanEvents` | 固定年龄、固定概率，按条文号除以 1000 的余数分档 |
| `FateVector` 加权（如 spirit = … + 20「福德常数」） | `src/core/tieban/toEngineOutput.ts` 的 `buildFateVector` | 契约已废除 |
| 章节置信度 80 / 55，回退每差一号扣 2 分 | `src/core/tieban/generateTiebanReport.ts` 的 `confidenceFor` | 常数 |

### 8.3 条文数据的结构和规模（不含正文）

`src/data/tieban-clauses.json`：
- 一个 JSON 数组，共 12,001 条记录，每条只有 `id`（数字字符串，4–5 位）和 `text` 两个字段，没有底本、卷次、分类信息。
- `id` 范围是 **1001–13000**，去重后 12,000 个；`7000` 重复一次（两条正文相同）。每 1000 号恰好 1000 条（6001–7000 段因为重复而记为 1001 条）。
- 正文很短：最短 3 个字符，中位数 14，最长 28。
- 内容分布（正则粗略统计，只计条数）：含「父/母 + 生肖」字样的条文 172 条，其中 117 条在 9001–10000、47 条在 10001–11000，而 **1–1000 区间根本没有数据**；含干支字样 659 条；含「运/流年」类字样 380 条；含年龄表述 144 条；命中现有寿元死亡类正则 44 条。
- 它通过 `src/pages/AdminImport.tsx` 引入（`import clausesData from '@/data/tieban-clauses.json'`）。我用 grep 没有找到这个页面被路由引用，它是否会被打进前端产物，未核实。
- 数据库表 `tieban_clauses`（`supabase/migrations/20251224082344_0edd01fd-8b3a-42fb-bc22-7a758e9c4f2b.sql`）：`id SERIAL`、`clause_number INTEGER UNIQUE`、`content TEXT`、`category TEXT`（导入函数从不写这一列）、`created_at`；RLS 策略是任何人都可以读取。

**结论**：代码假设考刻在 1–1000、各宫各占 1000 号，而数据在 1–1000 没有任何条文，12001–13000 这一段代码永远查不到，含父母生肖的条文集中在代码称为「流年」「流月」的区间。代码的宫位划分和数据的组织方式显然不是同一套体系，二者至少有一个是凭空设定的。

### 8.4 已知 bug 和要带入新设计的教训

1. **校时后出生信息被完全抹掉**。`projectPalaceClauseId` 计算的是 `(theoreticalBase + systemOffset) mod 1000`，而 `systemOffset = confirmed − (theoreticalBase mod 1000 + 1)`，代入后各宫条文号 ≡ `confirmed − 1 (mod 1000)`，和出生时刻、性别都没有关系（`src/core/tieban/systemOffset.ts`、`src/utils/tiebanAlgorithm.ts` 的 `projectDestinyWithOffset`）。也就是说，校时之后整份报告只取决于用户选中的那一条条文。教训：校准机制必须证明它保留了出生信息。
2. **时辰内分钟数算错**：`(hour % 2) * 60 + minute`（`src/core/tieban/calculateTiebanBase.ts` 第 36 行，`src/utils/tiebanAlgorithm.ts` 第 644、722 行）。子时从 23:00 开始，23:10 应该是时辰内第 10 分钟，代码算成第 70 分钟；00:10 应该是第 70 分钟，代码算成第 10 分钟。所有刻的序号都偏了 4。
3. **两个公式混用**：新 core 用 `legacyBaseNumber`（刻×25）生成候选刻（`src/core/tieban/runTieban.ts` → `calculateQuarterKe(baseFull.legacyBaseNumber)`），却用 `theoreticalBase`（刻×30 + 爻数）计算预期条文号和 `systemOffset`（`src/core/tieban/familyVerification.ts`）。
4. **界面上的考刻并没有用到八个刻**：`SixRelationsVerification` 直接对数据库做全文搜索，找含「父X母Y」的条文（`src/services/SupabaseService.ts` 的 `findDetailedFamilyMatches`），把搜索结果的名次当作 `keIndex`，分数写死为 `95 − 名次×8`；手动选择时则固定为 `keIndex: 2`、`matchScore: 100`（`src/components/SixRelationsVerification.tsx` 第 232、237、313 行）。所谓「锁定第几刻」与出生时刻无关。
5. **旧引擎不处理时区**：`src/utils/tiebanAlgorithm.ts` 用 `Solar.fromYmdHms` 直接处理出生地墙上时间，`TiebanInput` 里的 `timezoneOffsetMinutes` 和经纬度都没有用到。
6. **跳过校时时，用 `systemOffset = 0` 继续出完整报告**（`src/hooks/usePredictionFlow.ts` 的 `handleSkipVerification`）；而 `dispatchTieban` 在有校时结果时仍然写 `confirmedClauseId: null`（`src/hpulse/engines/dispatch.ts` 第 54 行），导致下游误判为未校时。
7. **铁板曾是整个流程的必经入口**（`src/hooks/usePredictionFlow.ts`），并且在所有粒度下都被设为激活（`src/config/engineActivation.ts`，理由写的是「铁板神数为本命推算核心」）。教训：一个 `needs_source_validation` 的引擎不能成为其他引擎的前置步骤。
8. **测试**：`src/core/tieban/__tests__/` 下有 9 个测试文件，`src/utils/tiebanAlgorithm.spec.ts` 也存在。我尝试运行 `npx vitest run`，因为依赖缺失（`ERR_MODULE_NOT_FOUND`）没有跑起来，所以测试是否通过未核实。这些测试的期望值都由代码自身的公式得出，按约束 3 不能作为黄金用例。

## 9. 未决问题与风险

1. **底本能不能拿到、是否合法**：这决定选项甲是否可行。没有底本，第 3 节的大部分规则都是空的。
2. **条文数据的权利状态**：在查明之前，建议移出公开仓库，并关闭数据库表的公开读取（需要用户授权再动手）。
3. **刻的时间口径**（民用时还是真太阳时、九十六刻还是百刻）：15 分钟的粒度下，这个决定比任何公式细节都更影响结果。
4. **考刻事实的可信度和隐私**：用户可能记错父母生肖；父母存亡属于敏感信息。设计上应允许只提供部分事实，并让用户可以撤回。
5. **考刻前的不确定性要不要表达成世界分岔**（2.4）：第一版建议不做。
6. **人工标注的成本和一致性**：选项甲下，每一条用到的条文都需要双人标注，标注规范要在实现之前定稿。
7. **与八字引擎的证据重复**：铁板的四柱和八字完全相同；如果世界层对不同引擎做独立性加权，要把这一点考虑进去。
