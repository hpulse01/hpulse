# 西方占星引擎设计（engineId `western`）

> 状态：设计稿。本文只做设计，不含业务代码。所有关于旧代码的陈述都附了文件路径；本环境没有安装 `node_modules`（`/home/user/hpulse/node_modules` 不存在），所以**没有运行任何现有测试或第三方库**，凡依赖库实际行为的判断都标为「未核实」。

## 1. 结论摘要

- **定位**：本命类（`engineClass: 'natal'`）引擎。它的盘面分两层：一层是**天文计算层**，包括行星黄经、上升点（Asc，出生时刻东方地平线与黄道的交点）、天顶（MC，子午圈与黄道的交点）和宫位，它们有权威技术参考（JPL Horizons、Swiss Ephemeris 文档），能用数值黄金用例验证到角分级；另一层是**解释层**，包括落宫含义、相位吉凶和行运触发，各流派差异很大，来源可靠性多为 `cited_unverified` 或 `unverified`。
- **第一版范围**：采用热带黄道（以春分点为 0°），盘面含 10 颗行星、Asc/MC 和 Placidus 宫制（整宫制作为声明的备选），相位只用托勒密的五种主要相位。时间结构建议采用「太阳回归年（`western.solar-year`）作为周期容器 + 外行星**行运**（transit，即实际天空中的行星与本命点成相位）作为关键节点」。二次推运、太阳弧、太阳回归盘的解读都推迟到第二版。
- **主要风险**：（1）解释层没有可逐条核对的单一权威典籍；（2）旧核心代码的行星坐标系还没有和 JPL Horizons 对比过，见第 8 节，其中有一个可能达 0.5° 级的坐标框架风险未核实；（3）出生时间未知时，宫位和 Asc/MC 全部失效，月亮位置也可能跨星座。
- **建议初始状态**：`needs_source_validation`。天文层补齐黄金用例后，可以单独认定为「可验证」；但引擎整体的 `signals` 依赖未核验的解释规则，第一版不应升到 `partial` 以上。

## 2. 声明的流派和范围

### 2.1 流派选择

| 选项 | 内容 | 来源情况 | 结论 |
|---|---|---|---|
| A. 现代热带占星 | Placidus 宫制、10 行星、托勒密相位、行运/推运 | 宫位算法有技术参考（Swiss Ephemeris 文档）；解释依据是 20 世纪以来的著作（例如 Robert Hand《Planets in Transit》），卷章待查 | **第一版采用** |
| B. 古典/希腊化占星 | 整宫制、7 颗古典行星、尊贵、小限（profection） | 依据 Ptolemy《Tetrabiblos》、Vettius Valens《Anthologies》、William Lilly《Christian Astrology》（1647），卷章待查 | 作为可选流派保留；整宫制和尊贵表在第一版的 chart 中输出 |

选 A 的理由：主流排盘软件（如 Astrodienst / Swiss Ephemeris 的 `swetest`）默认使用 Placidus，盘面层最容易拿到独立的黄金用例；行运是现代各派共用最广的时间技术。

声明的 `school` 字符串：`现代热带占星·Placidus 宫制·托勒密五相位·行运定应期（解释层未逐条核验）`。

### 2.2 输入

| 字段 | 是否必需 | 说明 |
|---|---|---|
| 出生时刻（本地时间 + IANA 时区） | 必需 | 由 `astro-time` 转成 UTC（UT1≈UTC）。TT（地球时）= UT + ΔT，ΔT 由星历层统一提供，引擎不自算 |
| 出生地经纬度 | 计算 Asc/MC/宫位时必需 | 缺失时只输出行星黄经、星座和行星间相位，宫位相关规则全部记为 `omissions` |
| 出生时间精度 | 必需（枚举） | `exact`（到分钟）/ `range`（给出区间）/ `unknown`。决定宫位、Asc/MC 是否输出 |
| 性别 | 不需要 | 本流派的规则不依赖性别 |
| 姓名 | 不需要 | — |
| 宫制 | 可选，默认 `placidus` | 属于流派参数，必须写入 `inputDigest` |
| 分析截止日 `analysisHorizon` | 由系统提供 | 只用来限定行运搜索的范围，**不是寿命估计** |

### 2.3 口径决策点

- **不使用真太阳时**。占星的时间口径是 UT 加上地理经度换算出的地方恒星时，真太阳时是八字等体系的口径。`astro-time` 必须向本引擎交付 UTC 瞬时，不能交付经真太阳时修正后的时刻。（已决）
- **日界、闰月**：与本引擎无关。（已决）
- **地心还是站心（topocentric）**：采用地心。月亮的视差可达约 1°，选站心会显著改变月亮位置。（建议已决，黄金用例必须用地心参数取数）
- **视位置还是几何位置**：采用「视位置、真春分点与真黄道 of date」，即含光行时、光行差和章动。（建议，待与黄金数据源的参数对齐）
- **黄赤交角**：Asc、MC 和宫位使用真黄赤交角（平黄赤交角 + 章动），不使用 J2000 常数。（建议，见第 8 节旧代码问题）
- **相位容许度（orb）**：各派差异大，第一版用一张版本化的 orb 表，标为 `project_assumption`。（待决：采纳哪一派的数值）
- **父母宫口径**：4 宫主父、10 宫主母（古典），还是 4 宫主母（部分现代心理占星）。（待决，第一版按古典口径，并在 relationSlot 中注明）

## 3. 计划实现的规则清单

可靠性说明：`verified` 只表示**来源**是权威技术参考，实现仍需靠黄金用例证明。章节号凭记忆、没有翻书核对的，一律标 `cited_unverified`。

### 3.1 天文计算层（chart）

| ruleId | 规则内容 | 来源 | 可靠性 | 产出 |
|---|---|---|---|---|
| `western.time.ut-tt` | 出生 UTC 瞬时由 astro-time 给出；星历计算使用 TT = UT + ΔT | Meeus《Astronomical Algorithms》2nd ed.（ΔT 章，章号待查）；JPL Horizons 时间尺度说明 | cited_unverified | chart |
| `western.ephem.geocentric-apparent-lon` | 10 颗行星的地心视黄经、黄纬（of date） | JPL Horizons（DE 系列星历）；实现库 astronomy-engine | cited_unverified（技术参考；待 JPL 黄金用例后升 verified） | chart |
| `western.ephem.retrograde` | 用黄经速度的符号判断逆行，速度用星历差分得到 | 同上 | cited_unverified（技术参考；待 JPL 黄金用例后升 verified） | chart |
| `western.obliquity.true-of-date` | 真黄赤交角 = 平黄赤交角 + 交角章动 | Meeus 2nd ed.（章动与黄赤交角章，章号待查，记忆中为第 22 章） | cited_unverified | chart |
| `western.sidereal.local-apparent` | 地方视恒星时 = 格林尼治视恒星时 + 东经；由它得到 RAMC（天顶赤经） | Meeus 2nd ed.（恒星时章，章号待查） | cited_unverified | chart |
| `western.angle.mc` | 由 RAMC 和真黄赤交角求 MC 黄经，并做象限修正 | Swiss Ephemeris 文档（房宫部分，节号待查）；Meeus 坐标变换章 | cited_unverified | chart |
| `western.angle.asc` | 由 RAMC、真黄赤交角和地理纬度求 Asc，并保证 Asc 位于东半天 | 同上 | cited_unverified | chart |
| `western.zodiac.tropical-sign` | 星座 = floor(λ/30°)，以春分点为白羊 0° | Ptolemy《Tetrabiblos》卷一（章待查） | cited_unverified | chart |
| `western.zodiac.cusp-ambiguity` | λ 距星座边界小于容差时标记为边界歧义 | 本项目口径 | project_assumption | chart + omission |
| `western.house.placidus` | 按半弧三等分迭代求 Placidus 宫头 | Swiss Ephemeris 文档（房宫部分）；Placidus de Titis《Primum Mobile》（卷章待查） | cited_unverified | chart |
| `western.house.placidus-polar-undefined` | \|φ\| ≥ 90° − ε 时 Placidus 无定义，不静默回退，记为 omission | Swiss Ephemeris 文档（极圈房宫说明，节号待查） | cited_unverified | omission |
| `western.house.whole-sign` | 整宫制：Asc 所在星座为第 1 宫 | Valens《Anthologies》（卷章待查）；现代学者对希腊化占星的重建 | cited_unverified | chart |
| `western.house.assign` | 行星落宫：按宫头区间 [cusp_i, cusp_{i+1}) 判定 | 由宫制定义推出 | project_assumption | chart |
| `western.aspect.ptolemaic` | 合 0°、六合 60°、刑 90°、拱 120°、冲 180° | Ptolemy《Tetrabiblos》卷一（章待查） | cited_unverified | chart |
| `western.aspect.orb-table-v1` | 每种相位的容许度（版本化） | 各派不一 | project_assumption | chart |
| `western.dignity.essential` | 庙（domicile）、旺（exaltation）、陷（detriment）、落（fall），只用于 7 颗古典行星 | Ptolemy《Tetrabiblos》卷一；Lilly《Christian Astrology》（卷章待查） | cited_unverified | chart |
| `western.rulership.traditional` | 宫主星按古典守护（不用天王/海王/冥王作守护） | 同上 | cited_unverified | chart / relationSlot |

### 3.2 时间结构（period）

| ruleId | 规则内容 | 来源 | 可靠性 | 产出 |
|---|---|---|---|---|
| `western.period.life` | 根周期：从出生到 `analysisHorizon`，挂载本命倾向 | 本项目口径（不是寿命） | project_assumption | period |
| `western.period.solar-year` | 太阳回归年：从太阳回到本命黄经的瞬时，到下一次回到本命黄经的瞬时 | 太阳回归技术的通行定义（具体典籍待查）；瞬时可由星历精确求出 | unverified（作为「年」单位的命理依据）/ verified（天文求解） | period |
| `western.period.transit-window` | 行运窗口：行运星进入 orb 到离开 orb（逆行造成的多次过境合并为一个窗口），挂在首次精确相位所在的 solar-year 下 | 天文求解可验证；把它当作命理时间单位的依据见 Hand《Planets in Transit》（卷章待查） | cited_unverified | period |

### 3.3 解释层（signal）

| ruleId | 规则内容 | 来源 | 可靠性 | 产出 |
|---|---|---|---|---|
| `western.natal.house-domain-map` | 宫位与 Domain 的映射：2→wealth，4→family，6→health（仅指需关注的倾向），7→relationship，9→study/migration，10→career，1→turning。8 宫不映射 | Lilly《Christian Astrology》宫位含义（卷章待查）；映射到 Domain 枚举属于本项目口径 | cited_unverified + project_assumption | 支撑其他规则 |
| `western.natal.dignity-tendency` | 本命宫主星的庙旺或陷落，给出该宫对应领域一生的倾向 | Lilly（卷章待查） | cited_unverified | signal(tendency)，挂 `western.life` |
| `western.transit.saturn-hard-to-point` | 土星行运与本命 Asc、MC、日、月成合/刑/冲 → 被触及点所主的领域有变动 | Hand《Planets in Transit》（卷章待查） | cited_unverified | signal(key_node)，极性 `mixed` |
| `western.transit.saturn-return` | 土星行运合本命土星 → turning | 同上；流行说法多，原始出处待查 | cited_unverified | signal(key_node)，`mixed` |
| `western.transit.jupiter-conj-point` | 木星行运合本命 Asc/MC/日/月 → 相应领域有扩展 | Hand（卷章待查） | cited_unverified | signal(key_node)，`favorable` |
| `western.transit.outer-hard-to-point` | 天王/海王/冥王行运与本命四点成合/刑/冲 → 变动 | Hand（卷章待查） | cited_unverified | signal(key_node)，`mixed` |
| `western.transit.slow-planet-through-house` | 土星或木星行运经过本命某宫 → 该宫领域的倾向 | Hand（卷章待查） | cited_unverified | signal(tendency) |

本命点所主领域的映射（`western.transit.point-domain-map`，project_assumption）：MC→career，Asc→turning，太阳→career/turning，月亮→family。该映射本身没有可核对的典籍条目，只能在文档中如实标注。

### 3.4 关系结构（relationSlot）

| ruleId | 角色 | 指示 | 来源 | 可靠性 |
|---|---|---|---|---|
| `western.relation.father-4th` | father | 4 宫、4 宫主；托勒密的自然象征星为日、土 | Lilly（卷章待查）；Ptolemy《Tetrabiblos》卷三「论父母」（章待查） | cited_unverified；4 宫/10 宫归属有流派分歧 |
| `western.relation.mother-10th` | mother | 10 宫、10 宫主；托勒密的自然象征星为月、金 | 同上 | cited_unverified；现代派有「4 宫为母」的说法 |
| `western.relation.sibling-3rd` | sibling | 3 宫 | Lilly；Ptolemy 卷三「论兄弟姊妹」（章待查） | cited_unverified |
| `western.relation.spouse-7th` | spouse | 7 宫、7 宫主；托勒密用男命看月、女命看日（需性别） | Lilly；Ptolemy 卷四「论婚姻」（章待查） | cited_unverified |
| `western.relation.child-5th` | child | 5 宫 | Lilly；Ptolemy 卷四「论子女」（章待查） | cited_unverified |
| `western.relation.friend-11th` | friend | 11 宫 | Lilly；Ptolemy 卷四「论朋友与敌人」（章待查） | cited_unverified |
| `western.relation.partner-7th` | business_partner | 7 宫（契约伙伴） | Lilly（卷章待查） | cited_unverified |
| `western.relation.rival-7th-12th` | rival | 7 宫（公开的对手）、12 宫（暗敌） | Lilly（卷章待查） | cited_unverified |
| `western.relation.superior-10th` | superior | 10 宫（权威、上位者） | 常见现代用法，出处不确定 | unverified |
| `western.relation.subordinate-6th` | subordinate | 6 宫（仆役） | Lilly（卷章待查） | cited_unverified |
| `western.relation.mentor-9th` | mentor | 9 宫 | 出处不确定 | unverified |

每个槽位的 `attributes` 只输出可以算出来的结构事实：宫头星座、宫主星、宫主星的尊贵状态（`western.dignity.essential`）、宫内行星，以及宫主星与本命日月的相位。**不输出**「父亲性格强势」这类解释文字，这类内容没有可核来源。

## 4. 明确不做的部分

| 不做 | 理由 |
|---|---|
| 8 宫的死亡含义、Hyleg/Alcocoden（古典寿命推算）、任何寿命或死亡结论 | 硬约束 5，类型层面不存在。8 宫只作为盘面结构输出，不映射任何 Domain |
| 疾病诊断（例如「火象主心血管」） | 硬约束 5；旧代码中这类说法也没有来源（见第 8 节） |
| 二次推运、太阳弧、太阳回归盘的解读、主限（primary directions） | 第二版。理由见第 6.1 节的比较 |
| 小行星、凯龙、阿拉伯点、恒星 | 来源和流派分歧大；凯龙不在第一版星历范围内 |
| Koch、Regiomontanus 等其他宫制 | 第一版只支持一个四分宫制 + 整宫制，避免流派爆炸 |
| 图形格局（大三角、T 三角、Yod 等）带分数的解释 | 旧代码中的强度分（70+n×5、85 等）是捏造的；格局识别可以留到以后作为纯结构输出 |
| 0–100 的分数、FateVector | 契约已废弃 |
| 合盘（synastry）与组合盘 | 他人由各自的出生信息独立运行；关系判断属于上层 |

## 5. 黄金用例需求

### 5.1 精度目标与容差

| 量 | 外部来源 | 目标精度（建议，待第一次对比后定版） |
|---|---|---|
| 行星地心视黄经 | JPL Horizons（Observer、地心 500@399、黄经量；具体量编号和参考系按 Horizons 文档核对） | ≤ 1′（0.0167°）。星座判定需要「边界歧义带」 |
| 月亮黄经 | 同上 | ≤ 1′。月亮每小时约移动 0.5°，时间精度比星历误差影响更大 |
| Asc / MC | Swiss Ephemeris `swetest`（记录版本、ΔT、交角口径） | ≤ 0.02° |
| Placidus 宫头 | `swetest` 房宫输出 | ≤ 0.05°（高纬接近 66° 时可放宽，须单独登记） |
| 太阳回归瞬时 | Horizons 太阳黄经求根，或 `swetest` | ≤ 2 分钟 |
| 行运精确日 | 由 Horizons 黄经序列求根 | 土星、木星 ≤ 1 天；外行星 ≤ 2 天 |

**设计黄金用例时的要点**：一定要包含离 J2000 至少 50 年的日期（例如 1930、1950、2080 年）。岁差约每年 50″，坐标框架如果用错（J2000 黄道 vs 黄道 of date），在 1950 年会产生约 0.7° 的误差。只用 2000 年附近的日期发现不了这类错误，旧测试就只用了 2000-01-01（见第 8 节）。

### 5.2 四类用例

| 类别 | 需要什么 | 来源 |
|---|---|---|
| 正常 | 约 50 个 (UTC, 纬度, 经度) 组合，覆盖 1900–2100 年、纬度 0°/±23°/±40°/±55°/±65°、东西经；每组给 10 颗行星黄经、Asc、MC、12 宫头 | Horizons（行星）；`swetest`（角点、宫头）；Astro-Databank 中 Rodden 评级为 AA 的公开出生数据，配合 Astrodienst 盘面作整盘交叉 |
| 边界 | 行星距星座边界 < 1′；Asc 在 0° 白羊附近；纬度 66.0°/66.5°/66.6°/67°（Placidus 有定义与无定义的分界）；行星留（station）日；行运三次过境；出生时刻落在闰秒附近 | Horizons + `swetest` |
| 非法 | 纬度 > 90°、经度 > 180°、DST 跳过的本地时间、日期超出声明的星历范围、缺少时区 | 不需要外部数据；期望引擎拒绝并给出具体错误码 |
| 歧义 | DST 重叠时刻；出生时间未知或只给区间；只到城市级的出生地（Asc 误差约 0.1°）；行星恰好压在宫头或星座边界的容差带内 | 期望值通过区间两端分别取 Horizons/`swetest` 数据得到；期望输出是 `omissions` 或 `ambiguous_input`，而不是一个确定值 |

### 5.3 需要外部获取的数据清单

1. JPL Horizons 导出：上述约 50 个时刻 × 10 颗行星的地心视黄经、黄纬（导出时记录 Horizons 版本、星历号和参考系设置）。
2. `swetest` 输出：同一批时刻和地点的 Asc、MC、Placidus 与整宫宫头（记录 Swiss Ephemeris 版本和 ΔT）。注意 Swiss Ephemeris 是 AGPL 或商业双许可，**只取它的输出作为测试夹具，不要嵌入库本身**，除非另作许可决定。
3. 至少 10 个公开人物盘，取自 Astro-Databank（AA 级），用于整盘交叉核对。只核对天文量，不核对任何解释。
4. 太阳回归瞬时：选 5 个出生盘，各取 3 个年份，用 `swetest` 或 Horizons 求出。
5. 行运精确日：选 2 个出生盘，取土星合/刑/冲本命日月的全部日期，包括逆行造成的三次过境。
6. 待用户拍板：相位 orb 表采用哪一派；父母宫口径；默认宫制。

## 6. 向一级世界层交付的内容

### 6.1 时间单位的比较与建议

| 技术 | 做法 | 绝对日期怎么得到 | 对出生时间的敏感度 | 额外的流派分叉 | 能否自然划出「时段」 | 第一版 |
|---|---|---|---|---|---|---|
| 行运（transit） | 实际天空中的行星与本命点成相位 | 直接对星历求根，日期就是天文事件日 | 对日月行星不敏感；对 Asc/MC 敏感（4 分钟约 1°） | 只有 orb，以及「用哪些点」 | 不能，它是事件窗口，需要外加容器 | **采用（作为 key_node 来源）** |
| 二次推运（secondary progression） | 出生后第 n 天的天象对应第 n 岁 | 换算后再映射回日历，精确 | 推运月亮每年约 13°；出生时间误差 2 小时约导致月亮偏 1°，对应时间偏约 1 个月 | 推运 MC 有多种算法（太阳弧、Naibod、真推运），年长换算有分歧 | 推运月亮换座约每 2.5 年一次，可以作时段 | 第二版 |
| 太阳弧（solar arc） | 所有本命点前移「推运太阳走过的弧」 | 换算后得到，精确 | 与推运类似 | 弧的算法有分歧 | 不能 | 第二版 |
| 太阳回归（solar return） | 每年太阳回到本命黄经时起一张新盘 | 求根，精确到分钟 | 回归瞬时不依赖出生时间精度之外的东西；但解读回归盘**需要当年的居住地** | 用出生地还是居住地起盘，派别不一 | 能，自然形成「年」 | **采用其瞬时作为年容器；不解读回归盘** |
| 小限（profection，古典） | 每岁移动一宫 | 按生日或回归瞬时 | 只依赖 Asc 星座 | 小 | 能 | 作为第二版的古典流派选项 |

**建议**：`timeline` 使用三层结构：`western.life`（根）→ `western.solar-year`（太阳回归年）→ `western.transit-window`（行运窗口）。理由如下：
- 回归年的边界是纯天文量，可以验证，并且和其他引擎的「年」粒度对齐；
- 行运是现代各派共用最广的定应期手段，日期由星历直接给出，不需要额外的流派参数；
- 推运和太阳弧会引入额外的未决口径，回归盘解读需要用户逐年的居住地（目前没有这个输入），所以都推迟。

### 6.2 绝对日期算法

- **`western.solar-year.<YYYY>`**：令 λ☉₀ 为本命太阳视黄经。对每个公历年 Y，在本命生日 ±3 天内求 f(t) = wrap180(λ☉(t) − λ☉₀) 的零点（先按日采样找到变号，再二分到 1 秒），得到 SR_Y。`start = SR_Y`，`end = SR_{Y+1}`（开区间）。第一个周期从出生瞬时开始，到 SR_{出生年+1} 结束。全部用 UTC ISO 表示，由 astro-time 格式化。
- **`western.transit-window.<planet>-<aspect>-<point>-<n>`**：对每个组合（行运星 P、本命点 N、相位角 A），令 g(t) = wrap180(λ_P(t) − λ_N − A)。按天采样（土星每天最多移动约 0.13°，木星约 0.25°，外行星更慢，日采样不会漏掉零点），找到全部零点后二分细化。相邻零点如果属于同一次「顺行—逆行—顺行」，就合并成一个窗口。窗口范围 = [首次进入 orb, 最后离开 orb]，`parentPeriodId` = 首次精确相位所在的 solar-year。
- 本命点 Asc/MC 只有在出生时间精度为 `exact` 时才参与。

### 6.3 key_node 与 tendency

- **产生 key_node**：`western.transit.saturn-hard-to-point`、`western.transit.saturn-return`、`western.transit.jupiter-conj-point`、`western.transit.outer-hard-to-point`。每个窗口按被触及点映射的 Domain 各产生一条信号，`subjectRole: 'self'`。如果被触及的是某个关系宫的宫主星（第二版），`subjectRole` 改为对应人物。
- **只产生 tendency**：`western.natal.dignity-tendency`（挂 `western.life`）、`western.transit.slow-planet-through-house`（挂 solar-year）。
- **`intensity` 一律为 `null`**：没有可核来源给出强度分级，不能自造。
- **极性**：只有规则文本给了方向时才填 `favorable`/`unfavorable`，其余填 `mixed`。

### 6.4 relationSlots

见 3.4 节，共 11 个槽位，覆盖 father、mother、sibling、spouse、child、friend、business_partner、rival、superior、subordinate、mentor。没有出生时间时，全部槽位不可用（它们都依赖宫位），只剩托勒密的自然象征星（日、月、金、土），作为降级属性输出，并在 omissions 中写明原因。

### 6.5 典型 omissions

| what | reason | detail |
|---|---|---|
| `houses`、`asc`、`mc` | `input_missing` | 没有出生时间或经纬度 |
| `houses.placidus` | `no_rule` | \|φ\| ≥ 90° − ε，Placidus 无定义；如果流派声明允许，则改用整宫制并写明 |
| `sign.<planet>` | `ambiguous_input` | 位于星座边界的容差带内，或出生时间区间两端落在不同星座 |
| `moon.sign` | `ambiguous_input` | 出生时间未知，且当日月亮跨了星座 |
| `transit.*.asc/mc` | `input_missing` | 出生时间不精确 |
| `progressions`、`solar-return-chart` | `not_implemented` | 第二版 |
| `house8.mortality` | `out_of_scope` | 类型层面禁止 |

## 7. 它的一套世界如何展开

- **分岔点来源**：只有 6.3 节列出的四类行运 key_node。每个窗口 × Domain 构成一个分岔：「应验 / 未应验」，应验支带规则给出的极性（多数为 `mixed`）。
- **数量级估计**（以 80 年分析区间、4 个本命点 Asc/MC/日/月为例）：
  - 土星合/刑/冲：每个约 29.5 年的周期有 4 个相位 → 80/29.5 × 4 × 4 ≈ 43 个；土星回归约 2–3 个；
  - 木星合：80/11.86 × 4 ≈ 27 个；
  - 天王星刑/冲/刑（约 21、42、63 岁）≈ 3 × 4 = 12 个；海王星和冥王星合计约 15 个（冥王星速度随年代变化很大，所以只是粗估）。
  - 合计约 **10² 个窗口**。有些窗口映射到两个 Domain，key_node 总数约为 100–150 个。出生时间未知时只剩日月（月亮还可能有歧义），约减半。
  - 这意味着 2^100 级别的世界只能惰性定义。建议在提取「重大选择」时只取窗口内 orb 最紧、且多个引擎在同一时段同领域共振的节点，筛选由上层负责，本引擎不预筛。
- **时间单位的保留与映射**：每条信号都保留 `periodId`（窗口），窗口通过 `parentPeriodId` 挂到回归年，回归年再挂到 `western.life`。所有边界都是绝对 UTC 瞬时，不存在「约 29 岁」这种年龄近似。

## 8. 从旧代码里可以借鉴什么

### 8.1 可参考（但必须按第 3 节重新核对）

- `src/core/western/houses.ts` 的 `computePlacidusCusps`：半弧三等分加不动点迭代的结构是对的（11/12 宫用昼半弧，2/3 宫用夜半弧，tan δ = tan ε · sin α），极圈判定也有。可以作为实现骨架。
- `src/core/western/aspects.ts` 的 `detectAspects`：取最紧的 orb，排序确定。
- `src/core/western/planets.ts` 的 `planetLongitude`：调用 `GeoVector(body, date, true)` 再调用 `Ecliptic(v)`。**它返回的是黄道 of date 还是 J2000 黄道，取决于所装 astronomy-engine 版本中 `Ecliptic()` 的定义，本环境未安装依赖，未核实。** 如果是 J2000 黄道，1950 年出生的盘会有约 0.7° 的系统误差。必须用 5.1 节「远离 J2000」的黄金用例来判定。
- `src/utils/worldSystems/westernAstrology.ts` 中的 `DOMICILE`/`EXALTATION`/`DETRIMENT`/`FALL` 表：与通行的古典尊贵表一致（凭记忆判断，需对照《Tetrabiblos》或 Lilly 原文复核）。
- `src/core/astro-time/julianDay.ts` 的 `julianDayFromUtc`：Meeus 算法，可复用。

### 8.2 无依据的捏造（新设计中必须删除）

- `src/core/western/toEngineOutput.ts`：`ASPECT_WEIGHT`（拱 +6、刑 −5 等），以及 `base + (jupiter ? 6 : 0)` 这类加分。行星总是存在，所以这些加分实际上是常数。整个 FateVector 都无依据。
- `src/core/western/calculateChart.ts`：`completenessScore = 92/80/60`、`confidence = 84/75/60` 是固定常数；只要 Placidus 算出来就标 `implementationStatus: 'complete'`，没有任何外部验证。
- `src/utils/worldSystems/westernAstrology.ts`：`lifeVectors` 按元素计数加权；格局 `strength`（70 + n×5、85、75…）；`harmony` 系数；元数据中自称 `source_grade: 'A'`。
- `src/utils/eventSeedExtractors.ts` 的 `extractWesternEvents`：
  - 全部是**固定年龄**：土星回归 28–31、58；天王星冲 42；木星回归 24/36/48；金星 25；火星 32；凯龙 50；海王星 21；等等。所有人都一样，而不是按星历求真实日期。
  - 全部是**固定概率**（0.8、0.75、0.6、0.3…）。
  - 「海王星第一次四分相约 21 岁」与它自己的 `sourceEvidence`「约 41 年」自相矛盾。
  - 「火星位于 Aries/Scorpio/Capricorn（凶相位）→ 35 岁防意外」把火星的庙旺星座当成「凶相位」，概念错误。
  - 「太阳元素决定体质：火象主心血管」属于疾病归因，违反硬约束 5。
  - 凯龙星根本没有计算，却输出了「凯龙回归」。
  - 旧天文层 `src/utils/astronomy/celestialPositions.ts` 的 `BODY_MAP` 只有 7 颗行星，所以 `extractWesternEvents` 中依赖天王星、冥王星的分支（`saturn-pluto-legal`、`saturn-uranus-divorce`、`jupiter-uranus-migration`）永远不会触发，是死代码；而 `mercury-jupiter-education` 对所有人都触发。

### 8.3 已知 bug 与教训

1. **黄赤交角口径不一致**：`src/core/western/constants.ts` 的 `OBLIQUITY_J2000_DEG` 是 J2000 平黄赤交角常数，被 `src/core/western/houses.ts` 用来计算 Asc、MC 和宫头，但同一处又用视恒星时（`SiderealTime`）、用 of-date 的行星黄经。误差量级约千分之几度，会随年代增长，高纬放大。新设计统一使用真黄赤交角。
2. **Asc 东半天判定用的是 RAMC 而不是 MC**：`src/core/western/houses.ts` 的 `computeAscendant` 要求 (Asc − RAMC) mod 360 ∈ (0,180)。在接近极圈、Asc 与 MC 夹角接近 0° 或 180° 时，有可能翻转错误。这只是理论推断，未核实，需要 60°–66° 纬度的黄金用例。
3. **静默回退宫制**：`src/core/western/calculateChart.ts` 在 Placidus 无定义时改用整宫制，只发出一条 warning。宫制一变，所有落宫和宫主映射都会变，新设计必须改为 omission，或者由流派显式声明回退。
4. **旧天文层疑似用了日心黄经**：`src/utils/astronomy/celestialPositions.ts` 的 `getBodyLongitude` 对太阳以外的天体调用 `EclipticLongitude(body, time)`。按我对 astronomy-engine 文档的记忆，这个函数返回的是**日心**黄经，对太阳会报错，这也能解释为什么代码对太阳单独调用 `SunPosition`。如果属实，旧 `WesternAstrologyEngine` 和 `VedicAstrologyEngine` 中月亮和其他行星的位置全部错误，月亮会大致落在太阳的对面。**本环境无法运行验证，状态为未核实，需优先确认。**
5. **旧测试不能区分 Asc 和下降点**：`src/utils/astronomy/celestialPositions.ts` 的 `runVerification` 第 3 个用例只检验「点在地平线上」，下降点也满足这个条件。
6. **核心测试没有任何外部期望值**：`src/core/western/__tests__/calculateWestern.test.ts` 只有结构性断言，再加上「2000-01-01 太阳在摩羯」。
7. **两套代码的 orb 表不一致**：`src/core/western/constants.ts`（六合 4°、刑 6°、拱 7°）与 `src/utils/worldSystems/westernAstrology.ts`（六合 6°、刑 7°、拱 8°）不同，说明 orb 一直没有来源，新设计将其登记为 project_assumption 并版本化。
8. **引擎 ID 不统一**：`docs/hpulse/04-engine-runners.md` 中称为 `astrology`，`src/core/shared/algorithmSourceRegistry.ts` 中是 `western`。新设计统一为 `western`。
9. **精度声明过度**：`src/utils/astronomy/celestialPositions.ts` 的 `CELESTIAL_LAYER_METADATA` 声称行星精度达「亚角秒」，与该库自身的精度声明不符（据我所知为角分量级，需核对其 README）。

## 9. 未决问题与风险

1. **解释层来源**：行运和落宫的含义只能引到现代著作，而且卷章还没核对。是否接受以 `cited_unverified` 为主的 signal 进入主流程，需要用户决定。
2. **流派参数待用户拍板**：默认宫制（Placidus 还是整宫）、orb 表、父母宫口径（4/10）、是否纳入外行星行运。
3. **astronomy-engine 的坐标框架**和旧天文层的「日心 vs 地心」问题（8.3 第 4 条）需要在装好依赖后、第一批黄金用例上优先确认。
4. **出生时间未知**：是否允许用「中午盘」之类的约定？建议**不允许静默采用**。只给日月和行星的结果，并把所有依赖时间的量列入 omissions；出生时间为区间时，取两端分别计算，结果不一致就标记歧义。
5. **key_node 数量约 10²**：需要上层的「重大选择」提取机制来筛选，本引擎不做主观预筛。
6. **他人盘**：没有出生信息的他人，只能从宫位推出结构属性，而宫位依赖出生时间。所以在本引擎中，出生时间未知的用户几乎无法提供任何 relationSlot。
7. **许可**：Swiss Ephemeris 的许可只影响「是否嵌入库本身」，取它的输出作为测试夹具不受影响。
