# 梅花易数引擎设计（engineId `meihua`）

> 引擎类别：`divinatory`（占问类）。本文只做设计，不含业务代码。凡涉及现有代码的陈述都附有文件路径；出处写不出卷章的，标「卷章待查」。

## 1. 结论摘要

- **定位**：梅花易数（托名北宋邵雍，通行本成书年代和作者有争议）是「感物起卦」的占法。它以起卦时刻、数字、文字或外物取数成卦，再以体用生克为核心来断事。
- **第一版**：不进入「由出生信息推演一生」的主流程，不交付 `EngineDelivery`。编排层记一条 `omission(out_of_scope)`。这一版只完成起卦内核（时间、数字、手动三种方式）、本互变卦、体用关系，以及黄金用例。
- **第二版**：采用「问事模式」。用户针对一个重大选择起卦，起卦输入固化保存，产出的信号挂到该选择节点上，作为附加信号。
- **以出生时刻起卦**：机械上可以做到，但我所知的通行本没有据此论一生的成体系规则（见 §2.4），不采用。
- **主要风险**：
  - 数字起卦算动爻时是否要加时数，现有代码与典籍说法可能不一致；
  - 日界、年界、闰月这几个口径会直接改变卦象；
  - 外应（起卦当下观察到的外界征兆）无法自动获取。
- **建议初始状态**：`needs_source_validation`。起卦和体用规则逐条对照原文核实之后，可以升到 `partial`。外应不做，所以达不到 `complete`。

## 2. 声明的流派和范围

### 2.1 流派与依据

本引擎采用通行本《梅花易数》的先天起卦法：
- 先天八卦数：乾一、兑二、离三、震四、巽五、坎六、艮七、坤八；
- 卦数「以八除之」取上下卦，「以六除之」取动爻；
- 以体用为核心断事，以互卦看过程，以变卦看结局。

八卦五行和八卦人物类象（乾为父、坤为母等）取自《周易·说卦传》。

后天起卦法（以物象定上卦、方位定下卦）第二版也不做。理由是它需要对外物和方位做主观判定，无法确定性地固化为输入。

### 2.2 输入（问事模式）

`castRecord` 记录起卦的全部输入，按起卦方式分为四种：

| 方式 | 需要的输入 |
|---|---|
| `time` | `castInstantUtc`、`timezoneIana`；如果启用真太阳时，还需要经纬度 |
| `numbers` | 两个数；若动爻要加时数，还需要起卦时刻 |
| `manual` | 上卦、下卦、动爻 |
| `text` | 原文和取数口径；第二版再考虑 |

另外三项输入：
- `decisionNodeId`：所绑定的重大选择节点；
- `questionCategory`：从选择节点的 `Domain` 映射过来，决定读取哪一类占断；
- 出生信息：不使用。

**一律不由引擎生成随机数，也不读取系统时钟。** 用户报出的数字、所写的文字，都原样存入 `castRecord`。

### 2.3 口径决策点（均为待决，需用户拍板后写入 `chart.data.calendarPolicy`）

| 口径 | 选项 | 现状 |
|---|---|---|
| 年数 | 取农历年的年支序数（子1…亥12）。年界按正月初一还是按立春，需要决定 | 现有代码按农历正月初一换年（`src/core/meihua/calculateMeihua.ts` `deriveTimeNumbers`） |
| 月数、日数 | 农历月序、农历日序 | 同上 |
| 闰月 | 闰月按本月数取，还是另有处理 | 现有代码按本月数取，并发出 warning |
| 日界 | 子初（23:00）换日，还是民用 00:00 换日 | 现有代码用 00:00。这样 23:00–24:00 取的是子时数，日数却仍是当天，**属于混合口径**，需要明示 |
| 时数 | 按当地民用时，还是按真太阳时 | 现有代码按当地民用时 |

### 2.4 本命类 vs 占问类：梅花易数如何参与「由出生信息推演一生」

**(a) 有没有以出生时刻起卦论一生的说法？**

- 就我所知，通行本《梅花易数》的起卦例和占例全部针对当下的事或物，例如观梅占、牡丹占、邻夜扣门借物占，以及按家宅、婚姻、疾病、求财等分类的占法。我**没有**见到以出生年月日时起卦、推断一生的成体系规则。不过我没有逐卷通读原文，所以「通行本中完全不存在相关说法」这一点标为**不确定**。
- 坊间有用生辰按梅花取数法起「本命卦」的做法，我找不到可靠的典籍依据，标 `unverified`。
- 真正以出生时刻起卦、并且带一生时间划分（按爻分配大运）的体系是《河洛理数》（托名陈抟、邵雍），但它不是梅花易数，规则可靠性也未核实。如果将来需要，应当作为独立的本命类引擎另行立项。
- 铁板神数同样托名邵雍，但它是另一个引擎，不在本文范围内。

**(b) 两种参与方式的依据与风险**

| 方式 | 规则依据 | 风险 |
|---|---|---|
| 以出生时刻起卦 | 年月日时取数法本身有依据，但用它推断一生没有依据。体用断法需要一个具体的「所占之事」，梅花也没有一生尺度的时间划分规则。 | 会产生一个固定不变、没有规则支撑的「本命卦」，冒充本命信号，并且和八字等引擎重复使用同一份出生信息，造成重复计权。**不建议采用。** |
| 问事模式，绑定到重大选择 | 这是梅花易数的本来用法：一事一占，按所占的类别读取体用。 | (1) 时间起卦的结果完全由起卦时刻决定，同一时辰内所问的任何事情都得到同一卦，必须靠 `decisionNodeId` 和问题类别来区分语义；(2) 用户可能反复起卦，直到得到想要的结果，产品上应规定一个选择节点只认第一次起卦（参照《周易·蒙》卦辞「初筮告，再三渎，渎则不告」，`verified`）；(3) 外应缺失会使断法不完整。 |

**(c) 两种方式分别交付什么**

- 出生起卦：不交付，只记 `omission(out_of_scope)`。
- 第一版：不交付。
- 第二版问事模式：每个 (人, 选择节点) 交付一份 `EngineDelivery`，`engineClass: 'divinatory'`，内容见 §6。

## 3. 计划实现的规则清单

| ruleId | 规则内容 | 来源 | 可靠性 | 产出 |
|---|---|---|---|---|
| `meihua.trigram.xiantian-number` | 先天数：乾1、兑2、离3、震4、巽5、坎6、艮7、坤8 | 《梅花易数》卷一，具体位置待查 | cited_unverified | chart |
| `meihua.trigram.element` | 八卦五行：乾兑金、离火、震巽木、坎水、艮坤土 | 《周易·说卦传》，以及八卦五行的通行配属 | cited_unverified | chart |
| `meihua.cast.time` | 上卦 = 年支数 + 月数 + 日数，除以 8 取余；下卦 = 上述和再加时支数，除以 8 取余；动爻 = 总数除以 6 取余；余数为 0 时取 8 或 6 | 《梅花易数》卷一「年月日时起卦」，具体位置待查 | cited_unverified | chart |
| `meihua.cast.numbers` | 第一个数定上卦，第二个数定下卦；动爻 = 两数之和**加时数**后除以 6 取余 | 《梅花易数》卷一，具体位置待查。是否加时数**需对照原文** | cited_unverified | chart |
| `meihua.cast.manual` | 用户直接给出上卦、下卦和动爻 | 项目约定 | project_assumption | chart |
| `meihua.cast.text` | 按字数或笔画取数（一字、二字、三字以上各有分法） | 《梅花易数》卷一「字占」诸条，具体位置待查 | cited_unverified | chart（第二版） |
| `meihua.gua.hu` | 互卦：本卦 2、3、4 爻为下卦，3、4、5 爻为上卦 | 卷章待查 | cited_unverified | chart |
| `meihua.gua.bian` | 变卦：动爻阴阳互换 | 卷章待查 | cited_unverified | chart |
| `meihua.tiyong.assign` | 动爻所在的卦为用卦，另一卦为体卦 | 《梅花易数》「体用总诀」，具体位置待查 | cited_unverified | chart |
| `meihua.tiyong.relation` | 用生体、比和、体克用为吉；体生用为泄、耗；用克体为凶 | 同上 | cited_unverified | signal(tendency) |
| `meihua.tiyong.hu-bian` | 用互卦、变卦与体卦之间的生克，看事情的过程和结局 | 同上 | cited_unverified | signal(tendency) |
| `meihua.qi.seasonal` | 体卦在当令季节中的旺衰（卦气），以月令和节气来定 | 卷章待查 | cited_unverified | chart, signal(tendency) |
| `meihua.category.reading` | 按占断类别（求名、求财、婚姻、疾病、出行、家宅等）读取体用 | 《梅花易数》分类占诸条，卷章待查 | cited_unverified | signal(tendency) |
| `meihua.yingqi.*` | 应期规则（以卦数定、以卦气旺衰定等） | 原文中有应期之说，但具体规则我不能确认 | unverified | 暂不产出 |
| `meihua.person.shuogua` | 八卦人物类象：乾父、坤母、震长男、巽长女、坎中男、离中女、艮少男、兑少女 | 《周易·说卦传》 | cited_unverified（典籍明确，版本待定） | relationSlot |

**不进入清单的内容**：
- 错卦、综卦，以及「多层体用」的打分（旧版 `src/utils/meihuaAlgorithm.ts` 中的 `computeCuoGua`、`computeZongGua`、`analyzeMultiLayerTiYong`）：在梅花易数的断法中，这些东西的作用出处未核实；
- 各类分数和 `trendScore`。

## 4. 明确不做的部分

- **外应（三要、十应）**：外应要求起卦者当下观察外界征兆（声音、颜色、来人方位等），无法从数据中自动获取。如果让用户填写，也难以规范化。所以列为 `omission(out_of_scope)`。
- **后天起卦法、声音起卦、尺寸起卦、物数起卦**：需要主观判定，第二版也不做。
- **应期**：规则未核实，第一、二版都不输出 `key_node`，只记 `omission(no_rule)`。
- **出生起卦和一生时间线**：没有依据，见 §2.4。
- **寿命、死亡、疾病诊断，0–100 分数**：在契约层面就不存在这类输出。

## 5. 黄金用例需求

| 类别 | 需要什么 | 外部来源 | 格式要点 |
|---|---|---|---|
| 正常 | 典籍成例：观梅占、牡丹占等。我记忆中观梅占为「辰年十二月十七日申时，得革之咸」，**必须对照原文核实后才能入库** | 《梅花易数》卷一的可靠点校本或维基文库原文 | 用 `numbers` 方式直接输入年支数、月、日、时支数，与日历换算解耦；期望值包括本卦、互卦、变卦、动爻、体用 |
| 正常 | 8×8 卦乘以 6 个动爻，共 384 种组合的本、互、变、体用全表 | 可以对照公认排盘软件；结构部分（卦画）可以机械复核 | — |
| 边界 | 农历正月初一前后、立春前后（两种年界各一组）；闰月；23:00–24:00；余数为 0 时取坤或取第 6 爻 | 农历和节气数据取自香港天文台历表 | 期望值同时注明所用口径 |
| 非法 | 数字为负数、0 或非整数；动爻不在 1–6 之间；缺少时区；时刻非法 | 规范本身 | 期望报错或输出 omission |
| 歧义 | 时刻正好落在换日或换年的边界上；问题类别对应不到原文的任何一类 | 需要用户裁定 | 输出 `ambiguous_input` |

**需要外部获取的数据清单**：
1. 《梅花易数》可靠点校本，或维基文库原文（我这次访问维基文库被网络拦截，没有核对到原文）；重点是卷一的起卦法、字占、观梅占和牡丹占原文，以及体用总诀；
2. 农历与公历的对照数据和节气交接时刻（香港天文台）；
3. 用户对年界、日界、闰月、真太阳时口径的决定；
4. 数字起卦时动爻是否加时数的原文依据。

## 6. 向一级世界层交付的内容（仅第二版问事模式）

- **`chart`**：`kind: 'meihua.chart/1'`。内容包括：`castRecord`（含 `decisionNodeId` 和 `calendarPolicy`）、上下卦取数过程、本卦、互卦、变卦、体卦与用卦、卦气旺衰。
- **`timeline`**：只有一个时段，`periodId: 'meihua.query.<castId>'`，`unit: 'meihua.query'`，`start` 为起卦时刻，`end` 取选择节点的时间窗。梅花易数自身没有关于时间跨度的规则，所以没有子时段。
- **`key_node`**：没有。应期规则未核实，不能输出。
- **`tendency`**：由 `meihua.tiyong.relation`、`meihua.tiyong.hu-bian`、`meihua.qi.seasonal`、`meihua.category.reading` 产出。`domain` 取选择节点的领域，`subjectRole` 默认为 `self`，`intensity` 为 `null`。体用五种关系对应到极性：
  - 用生体、比和、体克用 → `favorable`
  - 用克体 → `unfavorable`
  - 体生用 → `unfavorable`；原文说它是「泄、耗」，并不等于凶，所以这一对应先标为 `project_assumption`
- **`relationSlots`**：只有 `meihua.person.shuogua` 一条依据。当所占之事涉及他人时，按用卦或互卦的卦象对应人物：乾对应 `father`，坤对应 `mother`，震、坎、艮对应 `sibling` 或 `child`（男）。用这种卦象类比去确定「事中是谁」，是项目的推断，标 `project_assumption`。
- **典型 `omissions`**：外应（`out_of_scope`）、应期（`no_rule`）、出生起卦（`out_of_scope`）、问题类别对应不上（`ambiguous_input`）。

## 7. 它的一套世界如何展开

- **分岔点**：0 个。在应期规则核实之前，梅花易数不产生 `key_node`，所以不会让世界分岔，只会通过倾向信号影响该选择节点的博弈收益。
- **数量级**：
  - 每次起卦，在一个时段上产生 1–4 条倾向信号（体用、互卦、变卦、卦气）。
  - 一生的信号量由用户请教的选择次数决定，按 5–30 个选择估算，大约在 10¹–10² 量级。
  - 出生起卦和第一版不产生信号。
- **时间单位映射**：只保留一个「起卦时段」。绝对时间直接用起卦时刻和选择节点的时间窗。

## 8. 从旧代码里可以借鉴什么

### 可以参考（需按 §3 重新核对来源）

- `src/core/meihua/constants.ts` 中的 `TRIGRAMS`（先天数、五行、卦画）和 `HEXAGRAM_NAMES`。卦名表我只抽查过，没有逐项核对。
- `src/core/meihua/calculateMeihua.ts` 中的 `deriveTimeNumbers`。它用农历年支、农历月日和时支取数，上卦取「年+月+日」，下卦和动爻取「年+月+日+时」，与通行说法一致。它还把口径写进了 trace，这一点可以保留。
- `src/core/meihua/trigrams.ts` 中的 `deriveHuGua` 和 `deriveBianGua`。
- `src/core/meihua/bodyUse.ts` 判定体用的方法：下卦动则下卦为用。

### 无依据的内容和已知问题

1. **数字起卦的动爻不加时数**：`src/core/meihua/calculateMeihua.ts`（`numbers` 分支）和旧版 `src/utils/meihuaAlgorithm.ts` 的 `divineByNumber`，都用「两数之和」直接除以 6 取动爻。但同一仓库 `src/core/meihua/numberToTrigram.ts` 的文件头注释写的是「动爻 = (上+下+时) mod 6」，代码与注释自相矛盾，需要对照原文裁定。
2. **捏造的分数**：
   - `src/core/meihua/bodyUse.ts` 中的 `trendScore`（85、70、65、45、25）；
   - `src/core/meihua/calculateMeihua.ts` 中的 `confidence`（75、70、60，以及加减 5）、`completenessScore`；
   - `implementationStatus` 硬编码为 `'complete'`，与 `src/core/shared/algorithmSourceRegistry.ts` 中登记的 `partial` 矛盾；
   - `src/core/meihua/toEngineOutput.ts` 中 `buildFateVector` 的五行加成表。
3. **旧版的时间起卦取数错误**：`src/utils/meihuaAlgorithm.ts` 的 `divineByTime`，由 `runMeihua` 传入的是**公历**年份（例如 2026）和公历月日，而不是农历年支序数和农历月日。
4. **旧版用问题文本的字符编码起卦**：`src/utils/meihuaAlgorithm.ts` 的 `runMeihua`，在有 `questionText` 时，把前后两半文字的 Unicode 编码值分别求和，作为两个数起卦。这不是字占的字数或笔画法，属于捏造。
5. **旧版季节旺衰的月份划分没有依据**：`src/utils/meihuaAlgorithm.ts` 的 `getSeason` 和 `getSeasonalStrength`，把公历 1–3 月定为春，又把公历 3、6、9、12 月定为「四季土旺」。另外，`determineTiYong` 把比和判为「中」，而核心版判为吉，两版口径不一致。
6. **`extractInstantEvents` 的问题**（`src/utils/eventSeedExtractors.ts:2367`）：
   - 固定概率 0.65、0.55、0.45，固定年龄兜底（28–33 岁）；
   - 凶则归入 `accident`，并另外追加一条健康警示种子。
   
   另外，我按代码推断（未运行验证）：经过 `src/utils/p4CoreOverlay.ts` 的 `mergeCoreOverlay` 之后，顶层的 `normalizedOutput` 是核心版的键（`trend`、`bodyUseRelation`），没有 `'吉凶'` 这个键，所以梅花这一支很可能始终被当作「中平」。
7. **主流程的起卦时刻取自 `new Date()`**：`src/hooks/usePredictionFlow.ts:98` 和 `:159`，经由 `src/utils/p4CoreOverlay.ts` 的 `runCoreMeihuaWrapper` 传入。结果是同一份出生信息每次运行都得到不同的卦。

### 未核实

- 我运行 `npx vitest run src/core/meihua` 时依赖解析失败（`ERR_MODULE_NOT_FOUND`），所以现有测试能否通过未核实。
- `src/core/shared/algorithmSourceRegistry.ts` 中登记的来源是维基文库「梅花易數/卷一」，我这次没能访问，所以内容未核实。

## 9. 未决问题与风险

1. 数字起卦时动爻是否加时数，需要原文核实。
2. 年界、日界、闰月、真太阳时的口径，需要用户拍板。
3. 体生用对应到 `unfavorable` 还是 `mixed`，需要裁定。
4. 应期规则核实之后，才能考虑产出 `key_node`。
5. `decisionNodeId` 在契约中没有位置，与六爻的问题相同，需要主设计者决定。
6. 一个选择节点只认第一次起卦，这条产品规则需要用户确认。
7. 如果用户坚持要「生辰起卦论一生」，应另立《河洛理数》引擎做来源评估，不放进梅花易数。
