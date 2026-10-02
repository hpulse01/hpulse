# 引擎设计：玛雅历（engineId `mayan`）

## 1. 结论摘要

- **定位**：本命类（`natal`）。本引擎在技术上是一个**历法换算器**：把出生当地的民用日期换算成以下几种玛雅历法表示：
  - Long Count（长纪年）
  - Tzolk'in（260 日卜历，由 13 个数字和 20 个日符组合而成）
  - Haab'（365 日太阳历）
  - Calendar Round（历轮，约 52 年）
  - 夜之主（Lords of the Night，G1–G9）

  这些换算有明确的天文和考古学依据，可以做黄金用例。
- **解释层几乎为空**：古典玛雅文献中没有「按个人生命时段 × 领域」推运的规则。
  - 现代高地基切（K'iche'）占日师的传统见 Barbara Tedlock《Time and the Highland Maya》，卷章待查。这一传统把出生日符与性格、天职联系起来，是**终生性的描述**，没有时段推进。
  - 卡吞（Katun）预言（《契伦巴伦之书》）是**集体和时代**层面的预言。
  - 流行的 Dreamspell（José Argüelles）用的是另一套与 GMT 不对齐的计数，不属于玛雅历。
- **结论**：本引擎**产出不了 key_node**，也几乎产出不了有依据的 tendency。建议第一版**不进入世界生成**，只交付 chart，供展示和他人比对。`timeline` 与 `signals` 为空，`relationSlots` 为空。
- **主要风险**：
  - 相关常数的选择（584283 与 584285 等）。
  - 日界取当地日期还是 UTC 日期。旧 core 代码在这里有真实的 bug，见第 8 节。
  - 把 Dreamspell 概念混进 GMT 计数。
- **建议初始状态**：`partial`。如果声明范围收窄为「仅历法换算」，补齐黄金用例后可以升到 `complete`，因为这个范围内没有缺失的规则。

## 2. 声明的流派和范围

**流派**：`school: '古典玛雅历法换算·GMT 相关常数 584283（与高地现存 260 日计数一致）'`。不含任何 Dreamspell 或 13 Moon 体系的概念。

**相关常数（显式决策）**：
- 采用 **584283**（Goodman–Martínez–Thompson，即 GMT）。规定 Long Count 0.0.0.0.0（4 Ahau 8 Cumku）对应的儒略日数（JDN）为 584283。
- 采用理由：这是学界最常用的值，并且据文献记载，与危地马拉高地至今未中断的 260 日计数一致（Tedlock 书中有讨论，卷章待查）。
- 备选值：584285（常称 Lounsbury 或「天文」相关），以及 584286 等。它们会让 Tzolk'in 和 Haab' 平移 2–3 天，Long Count 平移 2–3 天，日符也会随之变化。
- 常数必须写进 `chart.data.correlation`，并参与 `inputDigest`。换常数就等于换流派版本，不允许运行时静默切换。

**输入**：出生地当地的**民用日期**，由 `astro-time` 根据出生时刻和 IANA 时区给出当地日期，再换成 JDN。不需要姓名、性别和出生地经纬度。

**口径决策点**：
1. **日界**：玛雅日从午夜、日出还是日落开始，文献说法不一，基切传统的说法我不确定。第一版采用**当地民用日期的午夜**作为日界，标为 `project_assumption`，写入 `school`。出生时刻在当地午夜附近时不另作处理，但这个假设必须在 UI 中说明。**待决**：是否对出生在日落之后的人额外给出「次日」备选值，作为 omission 说明。
2. **Haab' 日序**：采用古典铭文惯例 0–19（第 0 日称为「入座」，seating）。殖民时期尤卡坦文献用 1–20，对外显示时要注明。
3. **历法范围**：产品范围为 1900–2100 年，全部采用格里历。更早的日期（例如 1582 年以前的儒略历日期）不属于产品范围，拒绝处理。
4. **日符名称拼写**：内部使用索引 0–19，显示名采用旧正字法（Imix…Ahau）还是新正字法（Imix'…Ajaw），只是展示层的选择。

## 3. 计划实现的规则清单

主要技术参考：Reingold & Dershowitz《Calendrical Calculations》的玛雅历章节（版次与章节待查），以及其中的样例数据附录（是否包含玛雅历样例待核）。

| ruleId | 规则内容 | 来源 | 可靠性 | 产出 |
|---|---|---|---|---|
| `mayan.correlation.gmt-584283` | Long Count 0.0.0.0.0 = JDN 584283 | 《Calendrical Calculations》玛雅章（卷章待查）；GMT 相关常数文献 | cited_unverified | chart |
| `mayan.day.civil-date-jdn` | 用出生地当地民用日期的 JDN 作为玛雅日 | 项目决策 | project_assumption | chart |
| `mayan.longcount.place-values` | 1 kin = 1 日，uinal = 20 kin，tun = 18 uinal，katun = 20 tun，baktun = 20 katun | 《Calendrical Calculations》（卷章待查） | cited_unverified | chart |
| `mayan.tzolkin.tone-sign` | 数字 1–13 与日符 20 个各自逐日递进，组合周期 260 日 | 同上 | cited_unverified | chart |
| `mayan.tzolkin.epoch-4-ahau` | 历元日为 4 Ahau | 同上 | cited_unverified | chart |
| `mayan.haab.month-day` | 18 个月 × 20 日 + Wayeb 5 日，日序从 0 开始 | 同上 | cited_unverified | chart |
| `mayan.haab.epoch-8-cumku` | 历元日为 8 Cumku | 同上 | cited_unverified | chart |
| `mayan.calendar-round.designation` | Tzolk'in 与 Haab' 组合，周期 18980 日 | 同上 | cited_unverified | chart |
| `mayan.lords-of-night.g9-epoch` | 夜之主 9 日一循环，历元日为 G9（Thompson 的命名） | 文献中常见（具体出处卷章待查） | cited_unverified | chart |
| `mayan.trait.birth-day-sign` | 出生日符对应的性格和天职描述（仅用于展示） | Tedlock《Time and the Highland Maya》（卷章待查）；各社区之间差异大 | unverified | chart（不产出 signal） |

**不产出 signal 的原因**：上表中没有任何一条规则是「某时段 × 某领域有变动」这种形式。最接近的 `trait.birth-day-sign` 是终生性格描述。即便把它当作 lifetime tendency，日符到八个领域的映射也需要项目自造，依据不足，所以不做。

## 4. 明确不做的部分

| 项目 | 理由 |
|---|---|
| Dreamspell / 13 Moon：Kin 编号、波符神谕（guide/analog/antipode/occult）、GAP 银河激活门户、城堡、颜色家族、「银河签名」 | 这是 José Argüelles 的现代体系，计数不跳过 2 月 29 日，与 GMT 计数不对齐，不属于玛雅历。旧代码把它们与 GMT 计数混用，见第 8 节。 |
| 819 日周期、金星表、月亮系列（Lunar Series） | 有考古依据，但只是铭文天文内容，与个人生命推演无关。第一版可以作为 chart 扩展的候选项，暂不做。 |
| Katun 预言（《契伦巴伦之书》） | 属于集体和时代层面，而且文本解释分歧大。将来**也许**可以作为「时代」层的背景材料，但不作为本引擎对个人的 signal。 |
| 年担当（Year Bearer） | 古典、后古典、高地各有不同惯例，而且属于集体性质。 |
| 260 日「生日回归」作为时段 | 是否有个人意义的规则依据，我无法确认（unverified）。 |
| 出生日落在 Wayeb 时的凶兆 | Landa《尤卡坦风物志》有关于 Wayeb 不吉的记载，但是否适用于「出生在这几天的人一生」，我无法确认，因此不产出 signal，只在 chart 中保留 `isWayeb` 标记。 |
| 0–100 分数、旧 FateVector | 契约已作废。 |
| 寿命、死亡 | 类型层面不存在。 |

## 5. 黄金用例需求

| 类别 | 需要什么 | 外部来源 | 格式要点 |
|---|---|---|---|
| 正常 | 20 组以上的「格里历日期 → Long Count / Tzolk'in / Haab' / G」 | 《Calendrical Calculations》样例数据（待核实是否包含）；独立的玛雅历换算工具（例如学术机构网站上的转换器，具体待选并记录版本和相关常数） | 每条记录 JDN、相关常数和来源 |
| 边界 | 历元日；2012-12-21（广泛记载为 13.0.0.0.0 4 Ahau 3 Kankin，需取得出处后入库，现有测试 `src/core/mayan/__tests__/calculate.test.ts` 用了这个值但没有标来源）；Wayeb 首末日；baktun、katun 进位日；**出生在当地清晨、UTC 日期仍为前一天**的样本（例如 UTC+8 时区 07:00 出生） | 同上；时区样本的期望值按「当地日期」查表 | 断言结果只取决于当地日期，与 UTC 日期无关 |
| 非法 | 1582 年以前或产品范围外的日期、非法日期 | 不需要外部数据 | 拒绝处理 |
| 歧义 | 同一日期在 584283、584285、584286 下的三组结果；出生在当地午夜前后的样本 | 文献中各相关常数的定义 | 断言 chart 记录了所用常数，并且只用这一个常数 |

另有一类**与相关常数无关**的自洽性用例：铭文中同时给出 Long Count 和 Calendar Round 的日期，可以直接检验 Long Count 与 Calendar Round 的内部换算，不涉及换成公历。候选是帕伦克 K'inich Janaab' Pakal 的出生日期，具体数值必须从 Schele & Mathews 等出版物中摘录，此处不预先写出。

**需要外部获取的数据清单**：
1. 《Calendrical Calculations》的具体版次及玛雅历章节和样例页。
2. 一个可引用的独立换算工具及其版本。
3. 3–5 个铭文日期（Long Count + Calendar Round）及其出版物出处。
4. 关于「高地现存计数与 584283 一致」的文献出处（Tedlock 或其他）。
5. 日界口径（午夜、日出或日落）的民族志出处。如果拿不到，就维持 project_assumption。

## 6. 向一级世界层交付的内容

- **chart**：`kind: 'mayan.chart/1'`。内容包括 correlation、jdn、longCount{baktun…kin}、tzolkin{tone, signIndex, position}、haab{monthIndex, day, isWayeb}、calendarRound、lordOfNight。
- **timeline**：`[]`。体系内没有个人时段单位。如果主设计者希望引擎至少返回一个时段，可以提供 `mayan.katun.<n>` 作为「时代」对齐用的时段（katun = 7200 日，起止日期由 JDN 精确换算）。但它**不能挂任何个人 signal**，只供时代层引用。是否这样做由主设计者决定。
- **key_node**：无。
- **tendency**：无（第一版）。
- **relationSlots**：`[]`。玛雅历法没有描述父母、配偶、子女等他人的结构。Dreamspell 的「神谕十字」讲的是日符之间的关系，不是人物，而且不在本流派范围内。他人只能通过录入其出生日期后单独运行。
- **典型 omissions**：
  - `{what:'signals', reason:'no_rule', detail:'古典与高地传统均无个人时段×领域推运规则'}`
  - `{what:'relation-slots', reason:'no_rule'}`
  - `{what:'dreamspell', reason:'out_of_scope'}`
  - `{what:'819-day-count', reason:'not_implemented'}`

## 7. 一套世界如何展开

- **分岔点**：0 个。一级世界只有 1 支，而且没有倾向序列。
- **建议在六段式流程中的角色**：第一版**不进入世界生成和博弈**，只作为展示型 chart，并作为「他人比对」时的附加信息（同一日符等，仅作展示）。如果将来要参与，前提是找到有出处的、带时段的个人规则。目前我不知道有这样的规则。
- **时间映射**：如果启用 katun 时段，periodId 采用 `mayan.katun.<baktun>.<katun>`，起止由 `JDN = 584283 + 天数` 换算成格里历日期。

## 8. 从旧代码里可以借鉴什么

**可以参考的部分**：
- `src/core/mayan/longCount.ts` `longCountFromJulianDay`：位值换算正确（tun = 18 uinal），历元之前的日期如实给出负值，不编造 piktun。
- `src/core/mayan/tzolkin.ts` `tzolkinFromJulianDay`：`SIGN_OFFSET = 16`、`TONE_OFFSET = 5`，使 JDN 584283 对应 4 Ahau。260 日位置用中国剩余定理公式 `40*(tone-1) + 221*signIndex (mod 260)` 计算，我已核对这个公式在 mod 13 和 mod 20 下成立。
- `src/core/mayan/haab.ts`：历元对应 8 Cumku（`EPOCH_HAAB_DAY_OF_YEAR = 348`），历元对应 G9，`CALENDAR_ROUND_DAYS = 18980`。
- `src/core/mayan/toEngineOutput.ts` 的 `uncertaintyNotes` 已经注明了 584285 的差异。

**已知 bug（必须带入新设计）**：
1. **日界 bug（严重）**：`src/core/mayan/calculate.ts` 用 `julianDayFromUtc(new Date(input.utcDateTime))` 得到天文儒略日。`tzolkin.ts` 和 `longCount.ts` 再用 `Math.floor(jd)` 取整。天文 JD 在 **UTC 中午**切换，所以：
   - 一天的边界落在 UTC 12:00，不是当地午夜；
   - 用的是 UTC 日期，不是当地日期。

   `src/utils/p4CoreOverlay.ts` 的 `runCoreMayanEngine` 传入的正是 `si.birthUtcDateTime`。我用相同的公式验算过：`2012-12-21T00:00:00Z` 得到 JDN 2456282，结果为 3 Cauac，而不是 4 Ahau。UTC+8 地区当地上午出生的人会被算成前一天。现有测试只用了 `T12:00:00Z`，恰好掩盖了这个问题。新设计规定输入必须是 `astro-time` 给出的**当地民用日期的 JDN**（整数）。
2. **状态自相矛盾**：`src/core/mayan/calculate.ts` 写的是 `implementationStatus: 'complete'`，而 `src/core/shared/algorithmSourceRegistry.ts` 的 `mayan` 条目写的是 `'partial'`。
3. **旧 worldSystems 版本的数值错误**：`src/utils/worldSystems/mayanCalendar.ts` 中：
   - 数字 `((longCountDays - 1) % 13 + 13) % 13 + 1` 在历元日（天数 0）得 13，正确值是 4。
   - `kin = longCountDays % 260 + 1` 在历元日得 Kin 1，正确值是 4 Ahau，即 Kin 160。

   我验算过：2012-12-21 在该实现下得到「13 Ahau、kin 1」。另外，Long Count 对负数一律截为 0（`rem = longCountDays >= 0 ? longCountDays : 0`）。
4. **捏造的部分**：
   - `src/utils/worldSystems/mayanCalendar.ts`：`GAP_KINS` 注释自称「Simplified set; full list has 52 kins」，实际列表不完整而且是 Dreamspell 概念；`analyzeToneSignSynergy` 是自造规则；日符的 `energy` 加分和 `lifeVectors` 也是自造。
   - `src/core/mayan/toEngineOutput.ts`：`TONE_BASE` 分数表，以及十个维度全部同值、只给 spirit 加 5 的 FateVector。
   - `src/utils/eventSeedExtractors.ts` 的 `extractMayanEvents`：
     - `toneAge = 20 + report.galacticTone * 3`
     - `wsAge = 26 + (report.kin % 13)`
     - `kinRelAge = 22 + (report.kin % 8)`
     - `healthAge = 45 + report.galacticTone * 2`
     - `wealthAge = 30 + (report.kin % 10)`
     - 固定的「52 岁历轮转折」

     这些全部是取模或线性推年龄，配上固定概率 0.35–0.5，没有任何来源，**全部删除**。另外，这里用的 `report.kin` 本身就是上面那个错误的 kin。
5. 两套实现并存：`src/utils/quantumPredictionEngine.ts`（第 769 行、第 1098 行）使用旧 worldSystems 版本，`src/utils/p4CoreOverlay.ts` 使用 core 版本。两者对同一天给出不同的日符和数字。
6. 未核实：现有测试能否通过（本地缺少 vite，没能运行）。

## 9. 未决问题与风险

1. 日界：午夜、日出还是日落。目前是项目假设，影响所有出生在夜间的样本。
2. 相关常数：584283 有充分理由，但仍是流派选择。UI 必须显示所用常数。
3. 是否让本引擎完全退出世界生成（我的建议），还是只以 katun 时段的形式向「时代」层提供背景。后者还需要时代层的设计者确认 katun 预言是否值得引用。
4. 用户可能期待看到 Dreamspell 的「银河签名」，因为这是最常见的商业产品。如果产品要提供，必须作为**另一个独立引擎或流派**，单独声明计数规则，不能冒用「玛雅历」的名义。
5. 文化敏感性：基切占日传统是活着的宗教实践，展示性格释义时要注明出处和社区差异，避免把它当作普适结论。
