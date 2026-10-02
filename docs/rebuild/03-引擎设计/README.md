# 03 · 引擎设计：索引与统一审阅意见

13 份引擎设计由子代理分别阅读各自的旧实现后起草，主设计者统一审阅。本页记录审阅时做出的统一裁定；各引擎文档中与本页冲突之处，以本页为准。

## 1. 总表

| 引擎 | 类别 | 体系族 | 建议初始状态 | 第一版进入世界生成 | 一生 key_node 数量级（文档估计） | 文档 |
|---|---|---|---|---|---|---|
| 八字 | 本命 | chinese_calendar | `partial` | 是 | 40–45 个分岔点 | [bazi.md](bazi.md) |
| 紫微斗数 | 本命 | chinese_calendar | `needs_source_validation` | 是 | 40–55 | [ziwei.md](ziwei.md) |
| 西方占星 | 本命 | astronomical | `needs_source_validation` | 是（第 6 阶段起） | 约 10² | [western.md](western.md) |
| 吠陀占星 | 本命 | astronomical | `needs_source_validation` | 是（第 6 阶段起） | 约 10² | [vedic.md](vedic.md) |
| 数字命理 | 本命 | name_number | `needs_source_validation` | 是（第 6 阶段起），低权重 | 3 | [numerology.md](numerology.md) |
| 玛雅历 | 本命 | mesoamerican | `partial`（仅历法换算） | 否，只展示盘面 | 0 | [mayan.md](mayan.md) |
| 卡巴拉 | 本命 | name_number | `experimental` | 否，只展示 Gematria 数值 | 0 | [kabbalah.md](kabbalah.md) |
| 铁板神数 | 本命 | chinese_calendar | `needs_source_validation` | 否（D7 建议这次不做） | — | [tieban.md](tieban.md) |
| 六爻 | 占问 | chinese_calendar | `needs_source_validation` | 否（D5：第二版问事模式） | 0 | [liuyao.md](liuyao.md) |
| 梅花易数 | 占问 | chinese_calendar | `needs_source_validation` | 否（同上） | 0 | [meihua.md](meihua.md) |
| 奇门遁甲 | 占问 | chinese_calendar | `needs_source_validation` | 否（同上） | 0 | [qimen.md](qimen.md) |
| 大六壬 | 占问 | chinese_calendar | `needs_source_validation` | 否（同上） | 0 | [liuren.md](liuren.md) |
| 太乙神数 | 占问（论国运） | chinese_calendar | `experimental` | 否 | 0 | [taiyi.md](taiyi.md) |

## 2. 统一裁定

1. **`unverified` 规则可以产生分岔点。**（八字文档 §9 第 2 条、紫微文档 §9 的未决问题）规则可靠性通过 `verifFactor` 进入权重（04 文档 §3.2），而不是一刀切地禁止。理由：「应期」类规则几乎都是 unverified，禁止它们分岔会使中国体系引擎几乎没有分岔点；而把可靠性如实写进权重，下游和界面都能看到它的分量很轻。
2. **一个分岔点 = 同一 `(ruleId, periodId, subjectRole)` 下的一组信号。**（八字文档 §7 的未决问题）同一规则在同一时段对同一当事人触发、涉及多个领域时，共同应验或共同不应验。八字一生因此约 2^40–2^45 套一级世界。
3. **`turning` 领域的关键节点不生成重大选择**，只作为一级世界的时间结构标记（04 文档 §2.3）。
4. **`verified` 标签的使用以 02 文档 §4 为准**：必须有典籍或技术文献名、版本、卷章或节号，并被至少一个独立黄金用例引用。审阅时把各文档中「verified（待用例确认）」之类的写法统一改为 `cited_unverified`，并注明升级条件。目前 13 份文档中没有任何一条规则达到 `verified`。
5. **以国运或时代为对象的输出**（太乙）不属于个人，第一版契约不承载；预留 `EraSignal`，见 02 文档 §4。
6. **健康领域**：各引擎只能输出 `healthAttention` 类的倾向，不产生分岔点，不生成选择；任何引擎都不得输出疾病诊断、寿命或死亡类内容。八字文档把原文含凶死之意的「岁运并临」改写为「重大转折」，这一改写本身标为 `project_assumption`，审阅同意。
7. **姓名输入**（数字命理、卡巴拉）：只用 `BirthInput.calculationName` 中用户显式提供的拼写；超长或含不支持字符时拒绝并进入 `omissions`，不截断、不推断。
8. **占问类引擎**：五份文档对「以出生时刻起局论一生」的典籍依据的调查结论一致：没有可靠依据（六爻终身卦是问时起卦；《河洛理数》是另一个体系；命理奇门见于近现代著作；六壬年命是占课的参与因素；太乙人道命法出处未能确认）。因此采用 10 文档 D5 的建议。

## 3. 各文档中需要你拍板的口径问题

汇总在 10 文档 D14。它们在第 2 阶段（八字、紫微）和第 6 阶段（其余引擎）开始前需要确定，不阻塞第 0、1 阶段。

## 4. 审阅中复核过的旧代码问题

我亲自复核了以下三处，其余各文档第 8 节列出的问题来自子代理的阅读，没有逐一复核：

- 紫微命宫公式错误（`src/core/ziwei/palaceLayout.ts:28`）：已复核。
- 紫微五行局测试断言错误（`src/core/ziwei/__tests__/wuxingJu.test.ts`）：已复核。
- 旧天文层使用日心黄经（`src/utils/astronomy/celestialPositions.ts:85`）：已在隔离副本中实际运行复核（00 文档 §7.2）。
