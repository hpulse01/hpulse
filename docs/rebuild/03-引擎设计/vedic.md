# 吠陀占星引擎设计（engineId `vedic`）

> 状态：设计稿，不含业务代码。所有关于旧代码的陈述都附了文件路径。本环境没有安装 `node_modules`，**没有运行任何现有测试或第三方库**；凡依赖库实际行为的判断都标为「未核实」。天文计算部分与 `western` 共用同一天文层，精度目标和坐标口径以 `docs/rebuild/03-引擎设计/western.md` 第 2.3 节和第 5.1 节为准，本文只写差异。

## 1. 结论摘要

- **定位**：本命类（`engineClass: 'natal'`）引擎。它的时间主轴 **Vimshottari Dasha** 是纯算术规则：以出生时月亮所在的 nakshatra（月宿）为起点，按固定次序和年数排出各行星的主周期，一个周期总长 120 年。大运期（Mahadasha）和子运期（Antardasha）的边界因此可以精确算出，并且能和公认的排盘软件逐日核对。这是本引擎最可靠的部分。
- **第一版范围**：
  - 恒星黄道，ayanamsa（岁差修正量）用 Lahiri / Chitrapaksha；
  - 9 曜：日、月、火、水、木、金、土，加上罗睺 Rahu 与计都 Ketu（月交点）；
  - Lagna（上升点）、Rashi（星座）、Nakshatra 与 Pada（月宿和四分之一宿）、D9 Navamsa（九分盘）；
  - 整宫 bhava（宫位），即一个星座就是一宫；
  - Vimshottari 的 Mahadasha 与 Antardasha 两层。
- **解释层**：大运和子运的吉凶，以及「哪个运期主婚姻、事业」，依据 BPHS（《Brihat Parashara Hora Shastra》）的 dasha 果报章节和 Jaimini 体系。卷章还没核对，可靠性是 `cited_unverified`，多数极性只能给 `mixed`。
- **主要风险**：
  - Dasha 边界对月亮黄经极其敏感，月亮或 ayanamsa 差 1′，边界就偏 3–9 天；
  - 出生时间误差 1 小时，可以使整条时间轴平移数月到一年；
  - 旧代码中 ayanamsa 模型、节点口径和 dasha 年长都没有定版。
- **建议初始状态**：`needs_source_validation`。

## 2. 声明的流派和范围

### 2.1 流派

`school`：`Parashari（BPHS 体系）·Lahiri/Chitrapaksha ayanamsa·整宫 bhava·Vimshottari Mahadasha/Antardasha；Jaimini chara karaka 仅作关系属性`。

- 选 Parashari 的理由：它是印度占星的主流体系，主流软件（如 Jagannatha Hora，下称 JHora）默认就是它，能拿到独立的对盘数据。
- Jaimini 体系（chara karaka、Chara Dasha）只借用 karaka 作为他人属性，不用它的时间系统。
- KP（Krishnamurti Paddhati，一种以子宿主星为核心的现代体系）、Nadi 等派别不在范围内。

### 2.2 输入

| 字段 | 是否必需 | 说明 |
|---|---|---|
| 出生时刻（本地时间 + IANA 时区） | 必需 | 由 astro-time 转成 UTC。**不使用真太阳时**；印度传统「日出为一日之始」只影响 panchanga（印度历书），而本引擎不计算 panchanga |
| 出生地经纬度 | 计算 Lagna 和 bhava 时必需 | 缺失时：只输出行星和 nakshatra，Dasha 照常计算（Dasha 只依赖月亮），bhava 相关规则全部记为 omission |
| 出生时间精度 | 必需（`exact` / `range` / `unknown`） | 见第 6.5 节和第 9 节 |
| 性别 | 可选 | 少数 karaka 规则依赖性别，例如部分文本以木星为女命的丈夫星。性别缺失时，这些规则记为 omission，**不得默认为男** |
| 分析截止日 | 由系统提供 | 只截断时间轴，**不是寿命** |

### 2.3 口径决策点

| 决策点 | 选项 | 建议 | 状态 |
|---|---|---|---|
| Ayanamsa 定义 | Lahiri（印度历法改革委员会 1955 年采用的 Chitrapaksha 口径）/ Raman / Krishnamurti 等 | Lahiri，数值以 Swiss Ephemeris 的 `SE_SIDM_LAHIRI` 和《Indian Astronomical Ephemeris》为准 | 建议已决 |
| Ayanamsa 相对平春分点还是真春分点 | 恒星黄经 = 视黄经 −（ayanamsa ± 黄经章动） | 必须和黄金数据源（JHora / `swetest`）的设置一致，取数时一并记录 | **待决** |
| 月交点 | 平交点（mean node）或真交点（true node，相对平交点摆动约 ±1.5°） | 两派都常见；第一版选一个，写入 `inputDigest` | **待决**（旧注册表与旧代码在这一点上互相矛盾，见第 8 节） |
| Dasha 年长 | 365.25 天（儒略年）/ 365.2422 天（回归年）/ 365.2564 天（恒星年）/ 360 天（savana 年） | 第一版必须选定一种，并和对盘软件设置一致；记为 `project_assumption` | **待决** |
| Bhava 划分 | 整宫（rashi = bhava）或 Sripati / bhava chalit（以 Lagna 度数分宫） | 整宫 | 建议已决 |
| 父亲宫 | 9 宫（Parashari 主流）/ 10 宫（部分传统） | 9 宫，并注明分歧 | 待决 |
| Chara karaka 数量 | 7 个（不含 Rahu）/ 8 个（含 Rahu，多出 Pitri karaka 表示父亲） | 7 个，并注明分歧 | 待决 |

## 3. 计划实现的规则清单

### 3.1 天文与盘面层（chart）

| ruleId | 规则内容 | 来源 | 可靠性 | 产出 |
|---|---|---|---|---|
| `vedic.ephem.geocentric-apparent-lon` | 与 `western.ephem.geocentric-apparent-lon` 相同，只取日、月、水、金、火、木、土 7 颗行星 | JPL Horizons；astronomy-engine | cited_unverified（技术参考；待 JPL 黄金用例后升 verified） | chart |
| `vedic.ayanamsa.lahiri` | 恒星黄经 = 热带黄经 − Lahiri ayanamsa(t) | 《Indian Astronomical Ephemeris》（印度气象局 Positional Astronomy Centre 逐年出版，年份待取）；Swiss Ephemeris 文档中的 ayanamsa 部分（节号待查） | cited_unverified（技术参考；数值待取得） | chart |
| `vedic.node.mean` 或 `vedic.node.true` | Rahu = 月球升交点，Ketu = Rahu + 180° | 平交点公式见 Meeus《Astronomical Algorithms》2nd ed.（章号待查）；真交点以 Swiss Ephemeris 输出为准 | cited_unverified | chart |
| `vedic.lagna.sidereal` | Lagna = 热带 Asc − ayanamsa | 天文部分同 `western.angle.asc` | cited_unverified | chart |
| `vedic.rashi.sign` | rashi = floor(恒星 λ / 30°) | BPHS（卷章待查） | cited_unverified | chart |
| `vedic.nakshatra.index-pada` | 27 宿，每宿 13°20′，每 pada 3°20′；宿主星按 Ketu→金→日→月→火→Rahu→木→土→水 循环 3 次 | BPHS（卷章待查） | cited_unverified | chart |
| `vedic.varga.d9-navamsa` | 每个 rashi 分成 9 段，每段 3°20′；起始星座按动/固/变宫规则（等价于连续计数） | BPHS「分盘」章（卷章待查） | cited_unverified | chart |
| `vedic.bhava.whole-sign` | Lagna 所在 rashi 为第 1 宫，依次排 12 宫 | BPHS（卷章待查） | cited_unverified | chart |
| `vedic.bhava.lordship` | 宫主 = 该 rashi 的守护星（日主狮子、月主巨蟹……土主摩羯和水瓶）；Rahu、Ketu 不作宫主 | BPHS（卷章待查） | cited_unverified | chart / relationSlot |
| `vedic.graha.dignity` | 入旺（uchcha）、入弱（neecha）、自宫（swakshetra）、moolatrikona | BPHS（卷章待查） | cited_unverified | chart |
| `vedic.graha.natural-nature` | 自然吉星（木、金，以及条件性的水、月）与自然凶星（日、火、土、Rahu、Ketu） | BPHS（卷章待查） | cited_unverified | chart |
| `vedic.graha.functional-nature` | 按 Lagna 判定功能吉凶：三方宫（trikona）主为吉，6/8/12 宫主为凶等 | BPHS（卷章待查）；各家细则不同 | cited_unverified | chart |
| `vedic.boundary.ambiguity` | 月亮、Lagna 或行星落在宿、星座、pada、navamsa 边界的容差带内时，标记为歧义 | 本项目口径 | project_assumption | chart + omission |

### 3.2 时间结构（period）

| ruleId | 规则内容 | 来源 | 可靠性 | 产出 |
|---|---|---|---|---|
| `vedic.dasha.vimshottari-sequence` | 次序 Ketu 7、金 20、日 6、月 10、火 7、Rahu 18、木 16、土 19、水 17（年），合计 120 年 | BPHS Vimshottari 章（卷章待查） | cited_unverified（内容在各译本中一致，属于广为引用的规则） | period |
| `vedic.dasha.birth-balance` | 出生时所在大运的主星 = 月亮所在宿的宿主；剩余年数 = 该星年数 ×（1 − 月亮在宿内已走度数 / 13°20′） | 同上 | cited_unverified | period |
| `vedic.dasha.antardasha` | 子运从大运主星本身开始，顺序与大运相同；时长 = 大运年数 × 子运主星年数 / 120 | 同上 | cited_unverified | period |
| `vedic.dasha.year-length` | 1 个 dasha 年 = N 天（见 2.3 节） | 待定 | project_assumption | period |

### 3.3 解释层（signal）

| ruleId | 规则内容 | 来源 | 可靠性 | 产出 |
|---|---|---|---|---|
| `vedic.bhava.domain-map` | bhava → Domain：2→wealth，4→family（含居所和基础教育），5→study（并见 child），6→health（只表示需关注的倾向），7→relationship，9→study/migration（远行），10→career，11→wealth（收益），12→migration（异国）。**8 宫不映射** | BPHS 宫位含义（卷章待查）；映射到 Domain 枚举属于本项目口径 | cited_unverified + project_assumption | 支撑其他规则 |
| `vedic.dasha.lord-activates-bhava` | 在某行星的大运或子运期内，它所主和所落的 bhava 对应的领域会被激活 | BPHS dasha 果报诸章（卷章待查） | cited_unverified | signal(key_node)，默认极性 `mixed` |
| `vedic.dasha.lord-strength-polarity` | 运期主星入旺或自宫时倾向吉，入弱时倾向凶；功能吉凶修正方向 | BPHS（卷章待查） | cited_unverified | signal(tendency)，给出极性 |
| `vedic.dasha.marriage-indicators` | 7 宫主、7 宫内行星、金星的大运或子运 → relationship 应期 | BPHS（卷章待查）；B. V. Raman 著述（书名卷章待查） | cited_unverified | signal(key_node) |
| `vedic.dasha.mahadasha-change` | 大运主星更替本身记一个 turning 节点 | 业内普遍做法，原文依据未找到 | unverified | signal(key_node)，`neutral` |
| `vedic.yoga.pancha-mahapurusha` | 火、水、木、金、土之一在 kendra（1/4/7/10 宫）且入旺或自宫 → 本命倾向 | BPHS（卷章待查） | cited_unverified | signal(tendency)，挂 `vedic.life` |
| `vedic.yoga.gajakesari` | 木星位于月亮起算的 kendra → 本命倾向 | BPHS（卷章待查）；细则（是否要求木星不入弱等）各家不同 | cited_unverified | signal(tendency) |
| `vedic.transit.sade-sati` | 行运土星经过月亮起算的第 12、1、2 宫，前后约 7.5 年 → 倾向 `unfavorable` | 出处说法很多，没有找到可确认的经典原文 | unverified | 第一版只作为 tendency，并且默认关闭 |

### 3.4 关系结构（relationSlot）

三套结构并存，每个槽位都标明流派：

| ruleId | 角色 | Parashari bhava | Naisargika karaka（自然表征星，Parashari） | Jaimini chara karaka（按度数排序） | 可靠性 |
|---|---|---|---|---|---|
| `vedic.relation.father` | father | 9 宫（亦有 10 宫说） | 太阳 | 8-karaka 体系的 Pitri karaka；7-karaka 体系无专门的父亲星 | cited_unverified（流派分歧） |
| `vedic.relation.mother` | mother | 4 宫 | 月亮 | Matri karaka | cited_unverified |
| `vedic.relation.sibling` | sibling | 3 宫（弟妹）、11 宫（兄姊） | 火星 | Bhratri karaka | cited_unverified |
| `vedic.relation.spouse` | spouse | 7 宫 | 金星（部分文本以木星为女命的丈夫星，需性别） | Dara karaka | cited_unverified |
| `vedic.relation.child` | child | 5 宫 | 木星 | Putra karaka | cited_unverified |
| `vedic.relation.friend` | friend | 11 宫 | — | — | cited_unverified |
| `vedic.relation.mentor` | mentor | 9 宫（guru） | 木星 | — | cited_unverified |
| `vedic.relation.superior` | superior | 10 宫 | — | Amatya karaka（「大臣」，常被引申为事业上的辅佐者，与上级的对应属于引申） | unverified |
| `vedic.relation.subordinate` | subordinate | 6 宫（仆役） | 土星（仆役义） | — | cited_unverified |
| `vedic.relation.rival` | rival | 6 宫（敌人） | — | Gnati karaka | cited_unverified |
| `vedic.relation.business-partner` | business_partner | 7 宫 | — | — | cited_unverified |

Chara karaka 的排序规则（`vedic.karaka.chara-order`）：按行星在所在 rashi 内的度数从高到低排列，依次为 Atma、Amatya、Bhratri、Matri、Putra、Gnati、Dara（7 个）。若取 8 个，则把 Rahu 计入，Rahu 的度数按 30° 减去其在星座内的度数计算，并加入 Pitri。来源为 Jaimini《Upadesa Sutras》（卷章待查），可靠性 cited_unverified。两颗行星度数相同时，结果为 `ambiguous_input`。

`attributes` 只输出结构事实，每条带 ruleId：宫主星、宫主的 dignity、宫内行星、karaka 落在第几宫。

**明确排除**：
- 土星 naisargika 意义中的「寿命（ayus）」；
- 8 宫的寿命含义；
- 2 宫和 7 宫主作为「maraka（致死星）」的含义。

这些都属于类型层面禁止的类别，不作为任何槽位或信号的依据。

## 4. 明确不做的部分

| 不做 | 理由 |
|---|---|
| Maraka、Ayurdaya（寿命推算）、Balarishta 等 | 硬约束 5 |
| Pratyantardasha（第三层运期）及更细的层级 | 第一版两层已有约 80 个周期；第三层的边界只有几天到几周，对出生时间误差极其敏感，没有意义 |
| Yogini、Chara、Narayana 等其他 dasha 体系 | 流派爆炸；第一版只保留 Vimshottari |
| Shadbala、Ashtakavarga（两种行星力量评分体系） | 需要大量表格，来源核对成本高；放到第二版 |
| D10 等其他分盘 | 同上；D9 只作为盘面数据，第一版不进入 signal |
| Kuja Dosha（火星凶位） | 判定宫位和化解条件各家不一，且主要用于合婚；第一版不做 |
| Raja/Dhana yoga 的宽泛判定 | 定义繁多，而旧实现是错的（见第 8 节） |
| 天王星、海王星、冥王星 | 不属于 Parashari 体系 |
| 0–100 分数、FateVector、固定的「吉/凶运」标签 | 契约已废弃；旧代码给每个运期主星贴的固定吉凶标签无依据 |
| 疾病诊断 | 6 宫只输出「需关注的时段」 |

## 5. 黄金用例需求

### 5.1 精度目标

| 量 | 外部来源 | 目标 |
|---|---|---|
| Lahiri ayanamsa | `swetest` 恒星模式 Lahiri；《Indian Astronomical Ephemeris》年表 | 与 SE 定义一致时 ≤ 1″ 量级；与 IAE 的差异单独登记 |
| 恒星黄经、nakshatra、pada | JHora（记录版本、ayanamsa 和节点设置）；`swetest` | 黄经 ≤ 1′；宿和 pada 全部一致，边界容差带内的除外 |
| Lagna | `swetest` + JHora | ≤ 0.02° |
| Rahu/Ketu | `swetest`（mean / true 分别取数） | ≤ 1′ |
| Mahadasha / Antardasha 起止日 | JHora（**与本引擎的年长、ayanamsa 和节点设置完全一致**） | ≤ 1 天。设置不一致时无法对比 |

**敏感度**：dasha 边界的误差 = 月亮恒星黄经误差 × 出生宿主星的年数 / 800′。也就是说，月亮或 ayanamsa 每差 1′：
- 出生宿主为金星（20 年）时，边界偏约 9.1 天；
- 出生宿主为 Ketu 或火星（7 年）时，偏约 3.2 天。

月亮每小时约移动 30′–40′，所以出生时间误差 1 小时，可以使**整条时间轴**平移约 3–10 个月。这个数字决定了「出生时间精度」必须作为输入的一部分。

### 5.2 四类用例

| 类别 | 需要什么 | 来源 |
|---|---|---|
| 正常 | 约 30 个出生盘，覆盖 1900–2100 年、印度和非印度地点、南北半球：9 曜的恒星黄经、rashi、nakshatra、pada、navamsa、Lagna，以及完整的 Mahadasha 和其中 2 个大运的全部 Antardasha 日期 | JHora + `swetest`；可补充 B. V. Raman《How to Judge a Horoscope》等书中的示例盘（是否含足够的出生数据未核实） |
| 边界 | 月亮距宿边界 < 1′（出生大运主星会翻转）；行星距 rashi 或 navamsa 边界 < 1′；Lagna 在星座边界；出生时刻恰好在某个 Antardasha 边界；120 年循环的回绕 | JHora + `swetest` |
| 非法 | 坐标越界、DST 跳过的时刻、日期超出星历范围、缺少时区 | 期望引擎拒绝 |
| 歧义 | 出生时间未知或只给区间（区间两端的出生大运主星或宿不同）；DST 重叠；性别缺失时依赖性别的 karaka；两颗行星度数相同导致的 chara karaka 并列 | 区间两端分别用 JHora 取数，期望输出是 `ambiguous_input` |

### 5.3 需要外部获取的数据清单

1. `swetest` 的 Lahiri ayanamsa 值：1900–2100 年每 10 年一个点，并记录 SE 版本。
2. 《Indian Astronomical Ephemeris》中至少 3 个年份的 ayanamsa 年表，用于登记 SE 与 IAE 的定义差异。
3. JHora 导出的约 30 个盘：盘面加两层 dasha。导出时记录 ayanamsa、节点（mean/true）和 dasha 年长设置。**JHora 默认设置未核实，需截图存档。**
4. `swetest` 的 mean / true 节点：同一批时刻各取一套。
5. 待用户拍板：dasha 年长、节点口径、父亲宫（9 或 10）、karaka 数量（7 或 8）、Sade Sati 是否进入第一版。

## 6. 向一级世界层交付的内容

### 6.1 timeline

三层结构：

- `vedic.life`：根周期，从出生到分析截止日。
- `vedic.mahadasha.<n>-<lord>`：例如 `vedic.mahadasha.3-jupiter`，label 为「Mahadasha 木星」。
- `vedic.antardasha.<n>.<m>-<lord>`：`parentPeriodId` 指向它所在的 Mahadasha。

### 6.2 绝对日期算法

1. 用出生 UTC 瞬时 t₀ 求月亮的恒星黄经 λ☽，得到宿序号 k = floor(λ☽ / 13°20′)、宿主 L₀ 和已走比例 f = (λ☽ − k·13°20′) / 13°20′。
2. 出生大运的理论起点 T₀ = t₀ − f · Y(L₀) · D。其中 Y 是年数，D 是 2.3 节选定的 dasha 年天数，按天数换算，用 JD 计算，**不用**日历年月加法。第一个 NativePeriod 的 `start` 截为 t₀，`end = T₀ + Y(L₀)·D`。
3. 之后各大运首尾相接：`start_i = end_{i−1}`，`end_i = start_i + Y(L_i)·D`，直到超过分析截止日。
4. 子运期：从大运的**理论起点**开始，按比例逐段累加；结束在出生之前的子运期丢弃，横跨出生时刻的那一段，`start` 截为 t₀。
5. 所有时间先用 JD（TT 或 UT 口径须与对盘软件一致）计算，最后由 astro-time 转成 UTC ISO 字符串，`end` 为开区间。

### 6.3 key_node 与 tendency

- **产生 key_node**：
  - `vedic.dasha.lord-activates-bhava`：每个 Antardasha × 被激活的 bhava 对应的每个 Domain 产生一条；
  - `vedic.dasha.marriage-indicators`；
  - `vedic.dasha.mahadasha-change`（unverified，建议默认开启但标注清楚）。
  - `subjectRole`：被激活的 bhava 或 karaka 若对应某个关系人物（如 7 宫 → spouse，4 宫 → mother），就同时给该人物一条信号。
- **只产生 tendency**：`vedic.dasha.lord-strength-polarity`、`vedic.yoga.*`、`vedic.transit.sade-sati`。
- **`intensity` 一律为 `null`**。

### 6.4 relationSlots

见 3.4 节，共 11 个角色，每个角色都可能同时有 bhava、naisargika、chara 三种指示。没有出生时间时，bhava 不可用，chara karaka 仍然可用（它只依赖度数，而一天内大部分行星度数变化很小），但月亮的度数可能变化导致排序改变，需要检查区间两端是否一致。

### 6.5 典型 omissions

| what | reason | detail |
|---|---|---|
| `lagna`、`bhava.*` | `input_missing` | 缺出生时间或坐标 |
| `dasha.*` | `ambiguous_input` | 出生时间未知或为区间，两端的宿主不同，或边界差异超过容差 |
| `nakshatra.moon` | `ambiguous_input` | 月亮在宿边界的容差带内 |
| `karaka.spouse.jupiter-for-female` | `input_missing` | 性别未提供 |
| `karaka.chara.*` | `ambiguous_input` | 度数并列 |
| `pratyantardasha`、`shadbala`、`ashtakavarga`、`d10` | `not_implemented` | 第二版 |
| `maraka`、`ayurdaya`、`bhava8.longevity` | `out_of_scope` | 类型层面禁止 |

## 7. 它的一套世界如何展开

- **分岔点来源**：Antardasha 级别的 `vedic.dasha.lord-activates-bhava` 和 `marriage-indicators`，以及 Mahadasha 更替。
- **数量级估计**（80 年分析区间）：
  - 120 年共有 81 个 Antardasha，80 年约 54 个；
  - 每个子运主星一般主 1–2 宫、落 1 宫，去掉不映射的 8 宫后，约对应 2 个 Domain，得到约 100 个；
  - 再加上 Mahadasha 更替约 6 个，以及婚姻指示若干；
  - 合计约 **10² 个 key_node**。如果只取「子运主星所主的宫」，不取「所落的宫」，可以降到约 60 个。
- **出生时间未知**：bhava 不可用，绝大多数 key_node 消失，只剩 Mahadasha 更替。而且如果出生时间区间两端的宿主不同，连运期本身都有歧义，世界只能退化为「本引擎不参与该时段」。
- **时间单位保留**：每条信号都带 Antardasha 的 `periodId`，Antardasha 挂在 Mahadasha 下，边界全部是绝对瞬时；运期本身就是一个人一生的分段骨架，便于与八字大运、紫微大限对齐比较。

## 8. 从旧代码里可以借鉴什么

### 8.1 可参考（必须按第 3 节重新核对）

- `src/core/vedic/constants.ts`：`VIMSHOTTARI_SEQUENCE`、`VIMSHOTTARI_YEARS`、`NAKSHATRAS`、`NAKSHATRA_LORDS`，与通行规则一致（需对照 BPHS 译本复核）。
- `src/core/vedic/dasha.ts` 的 `computeVimshottariMahadasha` 与 `computeAntardasha`：子运期从**理论起点**开始计算并丢弃出生前的部分，思路正确，可以直接作为算法骨架。年长 `TROPICAL_YEAR_DAYS = 365.2422`（`src/core/vedic/constants.ts`）是未声明来源的选择，新设计改为显式参数。
- `src/core/vedic/nakshatra.ts` 的 `nakshatraOf`、`src/core/vedic/navamsa.ts` 的 `navamsaRashiOf`：连续计数公式与动/固/变宫起始规则等价，可复用。
- `src/core/vedic/nodes.ts` 的 `meanLunarNodeTropicalDeg`：注释说出自 Meeus。其系数（125.04452、−1934.136261、0.0020708、1/450000）与 Meeus 书中章动章的 Ω 表达式一致（凭记忆，需翻书核对）；该书月球位置章另有一组更精细的系数。
- `src/utils/worldSystems/vedicAstrology.ts` 中 Pancha Mahapurusha 用的自宫和入旺表（`OWN_SIGNS`、`EXALTATION_SIGNS`）与通行表一致，需复核。

### 8.2 无依据的捏造（必须删除）

- `src/core/vedic/toEngineOutput.ts`：整个 FateVector 是 `base + (jupiter ? 6 : 0)` 一类的写法，而行星恒存在，所以全是常数；`spirit: base + 4` 是写死的。
- `src/core/vedic/calculateChart.ts`：`confidence 78/60`、`completenessScore 88/65` 是固定常数；只要 Lagna 算出来就标 `implementationStatus: 'complete'`，没有任何外部对盘。
- `src/utils/worldSystems/vedicAstrology.ts`：
  - `DASHA_YEARS` 给每个运期主星贴了固定的 `quality`（金星 benefic、Rahu malefic……），这是无依据的；BPHS 体系中运期吉凶取决于该星在本盘的状态；
  - `lifeVectors` 中所有加减分（如 `ruler === 'Venus' ? 15`）无依据；
  - yoga 的 `strength` 数值无依据；
  - 自称 `source_grade: 'A'`。
- `src/utils/eventSeedExtractors.ts` 的 `extractVedicEvents`：
  - 按上面的固定吉凶标签直接决定「吉运 → career/wealth、凶运 → health/accident」；
  - 全是固定概率（0.65、0.5、0.3、0.25）；
  - 「月亮星座 → 30 岁前后迁移」「月宿 → 26 岁情感缘分」是固定年龄；
  - 「Ketu 大运起于 25 岁之后 → 财务危机」对满足条件的所有人一律触发。

### 8.3 已知 bug 与教训

1. **旧 dasha 余额被取整**：`src/utils/worldSystems/vedicAstrology.ts` 的 `calculateDashas` 中写的是 `Math.max(1, Math.round(firstDasha.years * (1 - nakshatraProgress)))`，出生大运余额被四舍五入到整年，且最少 1 年，导致后续所有运期偏移最多约半年。而且它只输出年龄，不输出日期。
2. **Dhana Yoga 永不成立**：同文件的 `detectYogas` 用 2/11 宫的**星座序号**代替「宫主」，再要求该行星落在 kendra 或 trikona；而落在 2 宫或 11 宫的星永远不在 1/4/7/10/5/9 宫，所以条件永远为假。
3. **Raja Yoga 判定错误**：同函数的 `kendraLords` 和 `trikonaLords` 实际上是星座序号，不是宫主；条件 `idx1 === idx2 && kendraLords.includes(idx1) && trikonaLords.includes(idx2)` 只在两星同落命宫时成立，与「kendra 主与 trikona 主相合」的定义不符。
4. **Sade Sati 概念错误**：同文件的 `detectSadeSati` 用**本命**土星对本命月亮判断，而 Sade Sati 是**行运**土星对本命月亮的概念。
5. **月宿中文名有误**：同文件的 `NAKSHATRAS` 中，Bharani 写作「角宿」，Hasta 写作「角宿二」，「角宿」出现了两次，Hasta 不应对应角宿。月宿与二十八宿的对应关系需要另找来源（如《宿曜经》），第一版不输出中文宿名。
6. **死分支**：`extractVedicEvents` 查找 `quality === 'malefic'` 的金星大运（`venus-malefic-divorce`），但金星在 `DASHA_YEARS` 中被写死为 benefic，所以这个分支永远不会执行。
7. **两套 Lahiri 模型并存且都只是近似**：
   - `src/core/vedic/ayanamsa.ts` 是线性模型，J2000 锚点取 23.85°，岁差率取 50.2388475″/年；
   - `src/utils/astronomy/celestialPositions.ts` 的 `getLahiriAyanamsa(year, month)` 是二次多项式，只精确到月。
   - 两者都没有和 SE 或 IAE 对比过。按我的记忆，SE 的 Lahiri 值在 J2000 约为 23°51′，即约 23.857°（**未核实，需取数**）。若属实，锚点差约 0.4′，dasha 边界会偏几天。
8. **注册表与代码矛盾**：`src/core/shared/algorithmSourceRegistry.ts` 的 vedic 条目写着「Rahu/Ketu 真交点」，但 `src/core/vedic/nodes.ts` 和 `src/core/vedic/calculateChart.ts` 实际用的是平交点，后者的 warning 也写明了 `mean_nodes`。
9. **盘面层多算了外行星**：`src/core/vedic/calculateChart.ts` 把天王星、海王星、冥王星也转成了恒星黄经，它们不属于 Parashari 体系。
10. **疑似日心黄经**：`src/utils/astronomy/celestialPositions.ts` 对太阳以外的天体调用 `EclipticLongitude`（据记忆返回的是日心黄经，未核实，见 western.md 8.3 第 4 条）。如果属实，旧 `VedicAstrologyEngine` 的月亮位置是错的，那么月宿、dasha 起点以及全部 dasha 都是错的。
11. **核心测试没有外部期望值**：`src/core/vedic/__tests__/calculateVedic.test.ts` 只断言「J2000 时 ayanamsa ≈ 23.85」，即用代码常数验证代码自己，其余都是结构性断言。

## 9. 未决问题与风险

1. **四个口径必须先拍板**：dasha 年长、节点口径（mean / true）、ayanamsa 是否含章动、父亲宫。它们都直接改变数值输出，并且决定能否和 JHora 对上。
2. **出生时间精度**：Vimshottari 的价值完全依赖月亮的精确位置。建议出生时间精度为 `unknown` 时，不输出 dasha 时间轴（记为 `ambiguous_input`），而**不是**采用「中午盘」。精度为 `range` 时，区间两端的边界差超过 30 天，就把时间轴整体标为歧义。这个阈值是 project_assumption，需要用户确认。
3. **解释层**：「运期主星激活其所主宫」是 BPHS 体系的通行原则，但逐条卷章还没核对；运期吉凶的极性规则在各家之间差异很大，第一版多数只能给 `mixed`。
4. **Sade Sati 等通俗规则**：在网上流传很广，但没有找到可确认的经典原文。建议第一版关闭，只保留接口。
5. **key_node 约 10²**：与 western 量级相同，需要上层筛选。
6. **与 western 共用天文层**：western.md 第 8.3 节列出的坐标框架风险同样影响本引擎。必须先完成天文层的黄金用例，再做 dasha 对盘。
