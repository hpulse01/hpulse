# H-Pulse 总规划：对照唯一目的的架构收敛、去重与路线图（MASTER_PLAN_ALIGN_HPULSE）

> 文档性质：可执行的总规划，**取代并升级** [`NEXT_PLAN_20260919.md`](./NEXT_PLAN_20260919.md)（后者保留为任务明细与追问清单的附件，本文引用其编号 T1–T12）。
> 事实依据：分支 `cursor/next-plan-20260919-bb68`（`a20d895`，其代码内容与 `main` `b9b80da` 完全一致，仅多两份文档）；`gh pr list` / `gh run list` 于 2026-09-19 的结果；用户提供的 Lovable 快照、白皮书七层与 iCloud 备忘录导出摘要（本机不可挂载，按「已核验摘要」处理，凡未能在仓库核实的一律标为假设）。
> 硬约束（全文有效）：确定性（禁 `Math.random`；禁 `Date.now` 进入哈希/轨迹）；每条输出携带 `explanationTrace`；引擎 `implementationStatus` 封顶置信度；未经验证不得标「科学正确」；先修核后扩面；商业门禁 fail-closed；当前 `complete = 0`。本文不建议在门禁未过时发布任何渠道。

---

## 0. 一页结论

1. **「双核」的真相不是两套引擎，而是两套编排/融合路径。** `src/core/`（16.9k 行）是唯一的引擎计算层；`src/hpulse/`（2.4k 行）通过 `p4CoreOverlay.runCoreEngine` 调用同一批 `src/core` 适配器。真正重复的是：`src/utils/quantumPredictionEngine.ts` 系（legacy 融合，约 6.9k 行；`src/utils` 下 27 个 spec 中约 7 个覆盖它）与 `src/hpulse/{weights,worldtree,fusion,projection}`（HPU 融合，**除输入归一化外零测试**）；以及仍在被执行的 legacy 引擎运行器（`src/utils/*Algorithm.ts` + `worldSystems/*`，约 8.8k 行，只为产出 `legacyNormalizedOutput` 展示数据）。
2. **主流程被最弱引擎锁死。** 用户路径是 `input → TiebanEngine.calculateBaseNumber → 六亲校时 → projecting → result`（`src/hooks/usePredictionFlow.ts`），即每一次分析都必须先通过唯一 `needs_source_validation` 引擎的校时。这是产品架构问题，不是文案问题；无论铁板 ADR 选甲/乙/丙，六亲校时都应改为可选步骤。
3. **收敛方向：单一融合路径 = HPU 管线 + 从 legacy 迁入的事件层 + 新的 `LifeTimeline` 派生器。** 但 HPU 现在没有测试、没有事件层、没有 Kao Ke 接入，因此**不允许直接切换**；先补测试与「同输入双跑 diff = 0」证据，再迁事件层，再降级 legacy 为超管研究面板，最后删除。
4. **清理不是目标，证据链才是。** 所有删除/合并都以「不降低任何门禁证据、不改变任何 `EngineOutput` 字节」为前提；P0 仍是 CI 绿灯（今日 run 依旧 `startup_failure`）、凭据轮换与 PR #20/#21。
5. **诚实预期：本规划全部完成后 `complete` 仍可能为 0。** 产出物是：证据链可运转、融合路径唯一且有测试、轨迹有数据契约并能回溯到规则 ID、每个引擎「距离 complete 的剩余条件」可数、Lovable 与 GitHub 只有一个事实源。

---

## 1. 唯一目的与对齐声明

### 1.1 两种表述的调和

| 来源 | 表述 |
|---|---|
| 本任务 / 白皮书 | 「尽可能完整、细粒度的个体未来生命轨迹推演系统（事业/财富/情感/健康/家庭/学业/迁移/重大转折等）」 |
| 仓库宪法 HPU-1（`docs/hpulse/01-constitution.md` §1） | 「工程化、可追溯、可复现地呈现多种传统文化规则对同一输入的计算结果、分歧和证据边界」 |

二者不冲突，但必须显式绑定，否则「轨迹」会滑向「预言」：

> **对齐声明**：H-Pulse 的「生命轨迹」是**多体系传统规则输出在时间轴上的结构化展开**（阶段 → 节点 → 支撑引擎 → 规则 ID → 来源）。每个节点回答的是「哪些规则、依据什么来源、以多大的（已封顶的）置信度、指向哪个领域与时段」，而不是「将发生什么」。只有经过账本校准（P8）且样本量达标的量才可称为概率；寿命/死亡永不进入轨迹。

建议以 ADR-000 的形式把这段话写入宪法 §1（constitution.v3），并在 `AGENT_MISSION.md`（见 §8 MP-03）中作为 Agent 的第一条约束。

### 1.2 八个领域 ↔ 现有数据维度映射

轨迹要求的领域：事业 / 财富 / 情感 / 健康 / 家庭 / 学业 / 迁移 / 重大转折。仓库现状：

| 领域 | `FateVector`（10 维，`src/types/prediction.ts`） | HPU-3 `EventType` | legacy `EventCategory`（`src/types/destinyTree.ts`） |
|---|---|---|---|
| 事业 | `life`（命运·事业）/ `socialStatus` | `career` | `career` |
| 财富 | `wealth` | `wealth` | `wealth` |
| 情感 | `relation` | `love` | `relationship` |
| 健康 | `health` | `health` | `health` |
| 家庭 | `homeStability` | —（缺） | `family` |
| 学业 | `wisdom`（近似） | —（缺） | `education` |
| 迁移 | — | `migration` | `migration` |
| 重大转折 | — | `crisis` / `decision` | `turning_point` |

结论：**不新增 `FateVector` 维度**（保护 0..100 十维契约与账本兼容），而是在 `LifeTimeline.eventClass` 上做显式映射（MP-10），并给 HPU-3 `EventType` 补 `family` / `study`（矩阵版本升到 `wmat-1.2.0`，MP-12）。

---

## 2. 仓库现实快照（已核实）

### 2.1 事实表

| 项目 | 现状 | 证据 |
|---|---|---|
| 引擎状态 | `complete = 0`；12 个 `partial`；`tieban = needs_source_validation`；13 条 `missingRules` 全部非空 | `src/core/shared/algorithmSourceRegistry.ts` |
| 商业门禁 | fail-closed，`ready === false`；`requiredEngines` 默认全部 13 个 → 铁板必然阻断 | `src/core/shared/commercialReadiness.ts` L97 |
| CI | 2026-09-19 当日两条 run 仍为 `startup_failure`（0 job）；历史上无任何绿灯 | `gh run list` |
| 未合并 PR | #20 特权 RPC 绑定 `auth.uid()`（draft，含凭据泄露说明）；#21 Numerology/Kabbalah 修正（draft）；#22 NEXT_PLAN（draft） | `gh pr list` |
| 确定性 | `src/` 非注释处无 `Math.random`；legacy 与 HPU 共用同一 `queryTimeUtc`（由 UI 在提交瞬间注入一次） | `rg`；`usePredictionFlow.ts` L91 |
| 测试 | 76 个测试文件；`src/hpulse/` 仅 `input/__tests__/normalize.test.ts` 一个 | `find` |
| 引擎计算层 | 唯一：`src/core/`；legacy 与 HPU 都经 `p4CoreOverlay.runCoreEngine` 调用它 | `src/utils/p4CoreOverlay.ts`、`src/hpulse/engines/dispatch.ts` |
| 铁板计算 | legacy 编排使用 `src/utils/tiebanAlgorithm.TiebanEngine`（自评 `sourceGrade 'B'`、`confidence 0.78`、`completeness 85`，靠注册表策略事后封顶）；HPU 使用 `src/core/tieban/runTieban`（自评 `needs_source_validation`、0.2/0.35） | `quantumPredictionEngine.ts` L361–427；`dispatch.ts` L28–95 |
| 权重矩阵 | 两套：`src/config/engineWeights.ts`（W(t,e,d) v5.1，579 行）与 `src/hpulse/weights/matrix-v1.ts`（`wmat-1.1.0`，133 行） | 文件头注释 |
| 引擎激活表 | `src/config/engineActivation.ts` 5 种 queryType × 13 引擎全部 `active: true`（无信息量的死配置） | 文件全文 |
| 结果页 | 公开 2 个 Tab（overview / engines）；超管 23 个 Tab（公开 2 + 审计/引擎 20 + 编排 1），其中「全息命盘 / 情景树 / 逐年详批 / 铁板命盘 / 量子 / 情景融合」六个面板互相重叠 | `ResultTabsView.tsx` |
| 紫微外部语料 | `src/core/ziwei/external/` 含 4,678 行 `.ts.txt` 语料 + `patterns.ts`（1,118 行，运行时使用）及其**完全相同**的 `patterns.ts.txt` 副本；`types.ts` 同样双份 | `wc`、`externalAdapter.ts` |
| 铁板条文 | `src/data/tieban-clauses.json`（986 KB）被 `pages/AdminImport.tsx` 静态 import（进入 admin 懒加载 chunk） | `rg` |
| 锁文件 | `package-lock.json`、`bun.lock`、`bun.lockb` 三份并存；CI 用 `npm ci` | 根目录 |
| 文档漂移 | README 声称使用 Recharts / Framer Motion（`package.json` 无）；`docs/hpulse/03/04` 写「10 个体系」（代码为 13）；`docs/hpulse/` 缺 `02`；`ARCHITECTURE.md` 未描述 HPU 管线；根目录 `ANALYSIS.md` 称系统「production-ready」「high fidelity to traditional texts」，与门禁文档直接矛盾 | 对应文件 |
| 简报缺失资产 | `AGENT_MISSION.md`、`docs/LIFE_TIMELINE.md`、任何名为 `LifeTimeline` 的源码文件在**全部 19 个远程分支**中均不存在 | `git ls-tree` 全分支扫描 |

### 2.2 与材料包的差异（假设，待用户确认）

| 材料包陈述 | 仓库核实 | 处理 |
|---|---|---|
| Lovable 显示名 Iron Plate Oracle | 仓库 `index.html` / SEO 已为 H-Pulse；「Iron Plate」仅作为铁板引擎英文名出现在 `useI18n.tsx` | 假设 A1：显示名仅存在于 Lovable 项目设置；MP-31 改名 |
| Lovable「unpublished changes available」 | 无法核实内容；`origin/main` 最后一次 Lovable 提交为 6 月「同步仓库代码并发布」 | 假设 A2：要么是 Lovable 侧未同步到 git 的编辑，要么是 git 已有但未 Publish 的构建。两种情况处置不同（§7.3） |
| P6.1 LifeTimeline MVP 已完成 | 不存在 | 视为未开始；MP-10 从 schema 起步 |
| 白皮书 Legacy / Nexus / Destiny IDE 模块 | 无对应代码；超管 orchestration/audit Tab 是 Destiny IDE 的雏形 | §3 标远期/部分 |
| 备忘录 PPO / DRL / DDPG / GA / PSO / entropy / `import random` 代码 | 仓库无任何强化学习或 pandas 依赖；`src/` 无 `Math.random` | §6 归为历史实验草稿，禁入生产（ADR-006） |

---

## 3. 七层 / Core 流水线 ↔ 仓库现实映射

图例：✅ 已实现（有代码 + 有测试）· 🟡 部分（有代码，测试或来源不足）· ⬜ 缺失 · ⛔ 明确不做（beta 期）· 🔭 远期（需先满足门禁）

### 3.1 白皮书七层

| 层 | 白皮书含义（按材料包） | 仓库对应 | 状态 | 缺口 / 处置 |
|---|---|---|---|---|
| **Core** | 输入规范、DestinyMatrix、引擎计算 | `crates/hpulse-input`（Rust/WASM 输入归一化）+ `src/hpulse/input/normalize.ts`（HPU-2）+ `src/core/*` 13 引擎 + `algorithmSourceRegistry` | 🟡 | 引擎有测试无黄金语料；`complete = 0`；铁板未校验。处置：MP-06/07/13 |
| **Causality** | 事件因果链、阶段迁移 | legacy：`eventSeedExtractors.ts`（2,476 行）、`eventFusion.ts`、`conflictResolver.ts`、`EventCascade` 类型；HPU：`worldtree/build.ts` 的 `transitionToNext`（ΔFateVector） | 🟡 | 事件层只在 legacy，无 `ruleId`，不可回溯到来源；HPU 无事件层。处置：MP-12 迁移为 `src/hpulse/events/` 纯函数 |
| **Mirage** | 多情景模拟（备忘录中大量 PPO/DRL/Mirage 部署草稿） | legacy：`worldTreeGenerator.ts` + `quantumMath.ts`（种子 PRNG、退火、蒙特卡洛路径积分——已被文档重分类为「经典确定性情景评分」） | 🟡（生产）/ ⛔（RL 版本） | 生产版只能是确定性情景树；PPO/DRL 版**不得**进入生产路径，只能在研究模式门禁下存在（ADR-006）。处置：MP-08/22 |
| **Synapse** | 融合、权重、学习 | HPU-3 `weights`（`wmat-1.1.0`）+ HPU-6 `fusion/evidence`；legacy `engineWeights.ts` + `computeQualityMultiplier` | 🟡 | 权重矩阵双份；P8 校准未开始。处置：MP-08（保留 HPU 矩阵）、MP-32 |
| **DestinyGPT** | AI 解读 | `supabase/functions/ziwei-rag-explain`（RAG + Lovable AI Gateway）+ `ziwei_corpus` 表 | 🟡 | 仅紫微；响应未携带 `deterministicInputsHash`；UI 未标「AI 解读不进入轨迹与账本」。处置：ADR-004（§4.3） |
| **RealityGraph** | 现实校验、反馈图谱 | P6 `prediction_runs` / `prediction_actuals` + `ledgerScoring.ts` + `PredictionHistory.tsx` | 🟡 | 无最小样本量门槛、无去重反作弊、无漂移检测。处置：MP-32 |
| **Output Engine** | 投影、报告、UI | HPU-8 `projection/project.ts` + HPU-9 hook + P5 审计组件 + 13 引擎面板 | ✅（结构）/ 🟡（重复） | 六个重叠情景面板、`quantum-*` 可视化命名与宪法冲突、`deriveMonth` 哈希派生月份。处置：MP-22/24 |

### 3.2 Core 流水线（DestinyMatrix → Core → Causality → Mirage → Synapse → Legacy → Nexus → Destiny IDE）

| 环节 | 仓库对应 | 状态 | 说明 |
|---|---|---|---|
| DestinyMatrix | `StandardizedInput`（`src/types/prediction.ts`）+ HPU-2 `NormalizedInput` + Rust struct | 🟡 | 备忘录「用户输入命格变量」需与 HPU-2 契约做逐字段差异表（MP-23 产出） |
| Core / Causality / Mirage / Synapse | 同 §3.1 | 🟡 | — |
| Legacy（白皮书模块） | 无 | 🔭 | 材料包未给出定义（家族/跨代？数字遗产？）。**不做假设**；归入 §6 C 级「定义待补」 |
| Nexus | 无 | ⛔ / 🔭 | 若指生态/Web3/NFT/数字人格：免费 beta 禁止付费与代币；即便远期也必须服从宪法（AI 解读 ≠ 裁定唯一命运；不得把 NFT 化的结果当作「命运凭证」） |
| Destiny IDE | 超管 `orchestration` + `audit` Tab、`AdminOrchestrationConsole` | 🟡 | 建议正名为「研究模式（Research Mode）」面板，并成为所有非生产实验（情景树、PPO 类）的唯一容器（MP-22） |

---

## 4. 架构收敛方案

### 4.1 目标架构（收敛后）

```
raw form ──► HPU-2 normalizeInput (Zod + Rust/WASM, TS fallback dev-only)
          ──► StandardizedInput (唯一输入契约, seedMaterial, queryTimeUtc 显式注入)
          ──► HPU-4 runAll ──► src/core/* 13 引擎 ──► applySourceRegistryPolicy (封顶)
          ──► HPU-3 weights (wmat-1.2.0: +family/+study)
          ──► HPU-5 WorldTree (5 stages × 10 dims)
          ──► NEW  events (从 legacy 迁入: seeds → fusion → conflicts, 带 ruleId)
          ──► HPU-6 fuseDestiny (evidenceQuality)
          ──► NEW  buildLifeTimeline (纯函数, lt-1.0.0)  ──► 用户视图（唯一）
          ──► HPU-8 projectReport ──► 审计视图 / 引擎面板
          ──► P6 ledger (algorithmVersion 复合对象)  ──► P8 校准（只展示不回写，直到样本门槛）
研究模式（超管）: legacy 情景树/坍缩/全息 —— 标 research, 不入账本, 不入用户视图, 最终删除
AI 解读（Edge Fn）: 携带 deterministicInputsHash; 标「非确定性辅助文本」; 不入轨迹与账本
```

### 4.2 决策记录（ADR）清单

每条 ADR 放在 `docs/decisions/ADR-xxx-*.md`，含选项、决策、理由、影响的门禁与测试。**在 ADR 合并前，对应代码不得删除。**

| ADR | 主题 | 建议决策 | 关联工作项 |
|---|---|---|---|
| ADR-000 | 宪法 §1 增补「生命轨迹 = 规则输出的时间展开」对齐声明；constitution.v3 | 采纳 §1.1 声明 | MP-03 |
| ADR-001 | 铁板神数范围（甲：取得底本进入 P7 / 乙：研究模式引擎 / 丙：移出 `requiredEngines`） | 由用户决策；**无论选哪项**，六亲校时改为可选 | MP-05、MP-11 |
| ADR-002 | 融合路径收敛：HPU 成为唯一正式路径；legacy `quantumPredictionEngine` 降为研究面板 → 删除 | 采纳，但设三道闸：HPU 测试 ≥ legacy 等价覆盖；双跑 `EngineOutput` 核心权威字段字节一致（差异白名单显式列出并逐步清空）；事件层迁移完成 | MP-08、MP-09、MP-12 |
| ADR-003 | Rust 边界：`hpulse-input` 只做输入契约，不扩展到引擎 | 采纳（避免两语言维护 13 套规则） | — |
| ADR-004 | AI 解读边界：只解释，不排序、不进轨迹、不进账本；响应必须携带 `deterministicInputsHash` 与 `model`；UI 标注 | 采纳 | MP-24 |
| ADR-005 | Lovable ↔ GitHub 单一事实源与发布门禁 | GitHub `main` 唯一事实源；Lovable 连接非 `main` 分支；Publish 需门禁 | MP-31 |
| ADR-006 | 研究模式门禁：任何 seeded/RL/启发式实验代码进入仓库的条件 | 必须：独立目录 `src/research/`；显式 seed 且写入输出；`research: true` 标记；不进入 `LifeTimeline`、账本、用户视图；不计入门禁证据；CI 静态扫描禁止 `src/hpulse`/`src/core` import `src/research` | MP-23 |

### 4.3 契约级完善

1. **结构化 `explanationTrace`**：在不破坏 `string[]` 的前提下新增 `explanationSteps: Array<{ ruleId; inputs; output; reference }>`，`explanationTrace` 由其渲染生成（MP-06）。
2. **`algorithmVersion` 复合对象**：`{ input: 'si-x', engines: {bazi:'P4.2-core',...}, matrix:'wmat-1.2.0', tree:'wtree-1.0.0', events:'ev-1.0.0', timeline:'lt-1.0.0', projection:'projection-1.0.0' }` 写入 `PipelineReport` 顶层与 `prediction_runs.algorithm_version`（MP-10）。
3. **`LifeTimeline` 契约**（沿用 NEXT_PLAN T4 草案，补充）：`eventClass` 枚举 = `career | wealth | love | health | family | study | migration | turning_point | general`；每节点 `supports[]` 非空、`confidence ≤ min(cappedConfidence)`；`month` 字段可为 `null`（禁止哈希派生）；`boundaryNote` 固定文案「分析边界，不是寿命估计」。
4. **可执行晋级门 `promotionGate.ts`**：读取注册表 + golden 覆盖率 + 账本样本量 → 每引擎「距离 complete 的剩余条件列表」，超管研究面板展示，人工不得绕过（MP-13）。

---

## 5. 清除多余 / 重复清单

原则：① 每项都有「处置 / 理由 / 前置条件 / 风险」；② 删除前必须有测试证明输出字节不变或该代码不在任何输出路径上；③ 涉及 ADR 的项在 ADR 合并前只做「隔离」不做「删除」。

### 5.1 代码：融合/编排层（ADR-002 范围）

| # | 对象（行数） | 处置 | 理由 | 前置条件 | 风险 |
|---|---|---|---|---|---|
| C1 | `src/config/engineWeights.ts`（579） | **合并入** `src/hpulse/weights/matrix-v1.ts`，保留后者 | 同一 W(t,e,d) 公式两份实现；HPU 版已版本化 | 差异表 + 决定保留哪组数值（写入 `wmat-1.2.0` 变更说明） | 数值变化改变 legacy 融合结果 → 在 legacy 降级为研究面板后再切 |
| C2 | `src/config/engineActivation.ts`（124） | **删除**，激活由 HPU-3 权重（degraded → 0）与 `EngineRunner.meta.requires` 表达 | 65 个条目全部 `active: true`，无信息 | `quantumPredictionEngine.orchestrate` 不再依赖 | 低 |
| C3 | `src/utils/quantumPredictionEngine.ts`（1,446）、`quantumMath.ts`（866）、`worldTreeGenerator.ts`（789）、`holisticFateMapGenerator.ts`（298）、`conflictResolver.ts`（580）、`predictionOrchestrator.ts`（233） | 三阶段：**隔离**（移到 `src/research/legacy-scenario/`，UI 只在研究面板引用）→ **冻结**（不再修改）→ **删除** | 与 HPU 重复的第二条融合路径；「量子」隐喻已被文档否认 | MP-09 双跑 diff = 0；MP-12 事件层迁出；MP-10 `LifeTimeline` 上线 | 账本 `prediction_runs` 目前由 legacy `UnifiedPredictionResult` 写入 → 需先把 `savePredictionRun` 切到 HPU 报告（MP-10） |
| C4 | `src/utils/eventSeedExtractors.ts`（2,476）、`eventFusion.ts`（164） | **迁移**为 `src/hpulse/events/`：去掉量子命名，每个 seed 带 `ruleId` + `traceRef`，输入改为 `EngineOutput[]` | 是 Causality 层唯一实现，必须保留知识，但需可回溯 | 为每个抽取器补测试；`death`/`accident` 类别按 §5.2 E6 处理 | 体量大，按引擎逐个迁移 |
| C5 | `src/utils/baziDeepAnalysis.ts`（1,279）、`ziweiAlgorithm.ts`（768）、`liuYaoAlgorithm.ts`（872）、`meihuaAlgorithm.ts`（912）、`qimenAlgorithm.ts`（798）、`liurenAlgorithm.ts`（703）、`taiyiAlgorithm.ts`（579）、`worldSystems/*`（1,849） | **停止执行 → 删除**。先在 legacy 编排中不再调用（core 已是唯一权威，legacy 只贡献 `legacyNormalizedOutput` 展示键）；确认面板只读 `coreNormalizedOutput`/中文键的 core 来源后删除 | 约 8.8k 行「只为展示」而重复计算；`liuYaoAlgorithm.calculateLiuYaoHexagram(timestamp = new Date())` 默认参数是确定性隐患 | 面板回归测试（P5-FIX 曾出现「引擎跑了 UI 空白」）；`BaziCorePanel` 读中文键需确认由 core `toEngineOutput` 提供 | 中 |
| C6 | `src/utils/tiebanAlgorithm.ts`（1,010） | **收窄为适配器**：六亲校时 UI 与 legacy 编排改用 `src/core/tieban/{runTieban,familyVerification,systemOffset,generateTiebanReport}`；`utils` 版只保留类型再删除 | 两套铁板实现；`utils` 版自评 B/0.78/85 与 `norm(v % 1000 / 10)` 映射违反 P4 规则 3/4（哈希取模冒充推演、固定分数） | ADR-001；`SixRelationsVerification.tsx`（743 行）依赖其 fuzzy 匹配与 `KeywordParser` | 高（主流程）→ 与 MP-11 同步 |
| C7 | `src/utils/KeywordParser.ts`（241） | 随 C6 迁入 `src/core/tieban/` 或删除 | 只被 `SixRelationsVerification` 用于手动搜索条文 | C6 | 低 |

### 5.2 代码：引擎层与数据

| # | 对象 | 处置 | 理由 | 前置条件 |
|---|---|---|---|---|
| E1 | `src/core/ziwei/external/ziwei/patterns.ts.txt`、`types.ts.txt` | **立即删除** | 与同目录 `patterns.ts`（1,118 行）、`types.ts`（90 行）逐字节相同 | 无（已用 `cmp` 核实字节一致） |
| E2 | `src/core/ziwei/external/**/*.ts.txt`（其余 3,470 行语料）+ `external/README.md` | **移出 `src/core`** 到 `corpus/ziwei/`（保留 provenance 说明） | `src/core` 应只含纯算法；语料属于 RAG/交叉验证资产 | `scripts/build-ziwei-corpus.ts` 改为参数化输入/输出目录、Node 运行（MP-25） |
| E3 | `src/core/ziwei/external/ziwei/patterns.ts`（运行时使用的外部 100+ 格局检测） | **保留但登记**：在注册表 `ziwei.sourceUrls` 加上游仓库 commit 引用；`externalAdapter.ts` 中 `gender: 'male'` 硬编码需加注释与测试证明格局检测不读性别 | 外部代码进入确定性核心必须可追溯 | — |
| E4 | `src/data/tieban-clauses.json`（986 KB） | **移出 `src/`** 到 `supabase/seed/tieban-clauses.json`，由后端导入函数消费；`AdminImport.tsx` 改为上传/后端触发 | 静态 import 进入 admin chunk；条文版权状态待 ADR-001 | ADR-001（若底本无法授权，仓库内是否保留需法务意见） |
| E5 | `src/lib/wasm/hpulse-input/hpulse_input.js` / `.d.ts`（wasm-bindgen 生成胶水） | CI 生成后安装（`install-wasm-artifact.mjs` 已存在）；加入 `.gitignore`，开发态用 TS fallback | 生成物入库会与 `wasm-pack 0.13.1` 产物漂移 | 确认 `verify-runtime-assets` 对缺失胶水的开发态提示 |
| E6 | `EventCategory` 中的 `'death'`（`src/types/destinyTree.ts` L17） | **类型层删除**；`accident` 保留但输出文案必须通过 `UNSAFE_MORTALITY_PATTERNS` 扫描 | 运行时靠 `filter(seed.category !== 'death')` 兜底，不如类型层禁止 | 为 `eventSeedExtractors` 补编译期检查 |

### 5.3 代码：UI 重复面板（超管 23 Tab → 目标 6 Tab）

| # | 现状（`ResultTabsView.tsx`） | 处置 | 理由 |
|---|---|---|---|
| U1 | `holographic`（`HolographicFateMapPanel` 362）、`tree`（`DestinyTreeLayer` 243 + `UniquePathLayer` 109）、`quantum`（`UnifiedQuantumPanel` 313 + `components/quantum/*` 570）、`quantumCollapse`（148）、`yearly`（`YearByYearPanel` 593）、`destiny`（`DestinyDashboard` 580） | 合并为一个「研究模式 · 情景排序（legacy）」Tab，内部二级切换；`components/quantum/{Radar,Waveform,Coherence,Entanglement}` **删除或改名** `scenario-*` | 六个面板呈现同一 `collapseResult`/`fullReport` 的不同切片；`quantum` 命名与宪法「不声称量子机制」冲突（文档已否认，代码与 UI 仍在用） |
| U2 | Overview 同时渲染 `HPulseProjectionPanel`（HPU）+ `EventTimelinePanel`（legacy）+ `PredictionOverview`（legacy） | Overview = `LifeTimeline`（新）+ HPU 投影；legacy 两块移入 U1 | 用户视图只消费单一路径 |
| U3 | 13 个引擎 Tab | 合并为一个「引擎」Tab + 左侧引擎选择（复用 `EnginePanelShell`） | Tab 条 23 项在移动端不可用 |
| U4 | `NumerologyCorePanel` / `KabbalahCorePanel` 以 `profile?.display_name` 判定「是否提供姓名」 | 改读 `engineOutput.normalizedOutput`（core 已声明缺姓名时的降级标记） | 与验证矩阵「never infer account display name」冲突（UI 层） |
| U5 | `EventTimelinePanel.deriveMonth`（FNV 哈希从事件 ID 派生月份） | 删除；无月份时显示「月份未定」 | P4 规则 3「禁止哈希取模冒充推演」 |
| U6 | `/quantum-prediction` 路由（`QuantumPrediction.tsx` 仅重定向） | 保留一个版本周期（Lovable 路由列表含它）后删除 | 死路由 |

目标 Tab：**轨迹（LifeTimeline）｜引擎｜审计｜账本反馈（就地标记已发生/未发生）｜研究模式（超管）｜编排（超管）**。

### 5.4 文档

| # | 对象 | 处置 | 理由 |
|---|---|---|---|
| D1 | 根目录 `ANALYSIS.md` | 移至 `docs/archive/2026-03-codebase-analysis.md`，头部加「历史文档；『production-ready / 高保真』结论已被 `ALGORITHM_VERIFICATION_MATRIX.md` 取代」 | 与门禁结论矛盾，误导审计 |
| D2 | `.lovable/plan.md`（P3 UI 重构计划，已完成） | 保留文件（Lovable 项目文件夹），顶部加「已完成于 P3；现行规划见 docs/MASTER_PLAN_ALIGN_HPULSE.md」 | 避免 Lovable 侧 Agent 按旧计划改代码 |
| D3 | README 中「P5.1 / P5.2+P5.3 / P5-FIX」三段变更日志；`docs/P5_FRONTEND_SYNC.md`、`P5_3_FRONTEND_SYNC.md` | 迁入新建 `CHANGELOG.md`（按算法/审计/UI/安全/文档分类）；两份 P5 文档归档 | README 应是入口不是日志 |
| D4 | README「Recharts · Framer Motion」 | 删除（依赖不存在） | 事实错误 |
| D5 | `docs/UI_SYSTEM.md` + `RESPONSIVE_DESIGN.md` | 合并为一份 `UI_SYSTEM.md`（含响应式章节） | 同主题两份 |
| D6 | `docs/hpulse/03-dynamic-weights.md`、`04-engine-runners.md` | 「10 个体系」→ 13，与 `ALL_ENGINES` 对齐；补 `02-standardized-input.md`（HPU-2 契约，当前缺号） | 文档漂移 |
| D7 | `docs/ARCHITECTURE.md` | 按 §4.1 重写，标注「现状（双路径）」与「目标（单路径）」两张图 | 未描述 HPU |
| D8 | `docs/P4_ALGORITHM_CORE.md` 与 `ALGORITHM_STATUS.md` | 前者保留为规则页；后者的 per-engine 表与 `ALGORITHM_VERIFICATION_MATRIX.md` 重叠 → `ALGORITHM_STATUS.md` 改为由注册表**生成**（脚本输出），矩阵保留人工审阅列 | 两处手工维护必然漂移 |
| D9 | `docs/NEXT_PLAN_20260919.md` | 保留；顶部加指向本文的说明；T 编号在本文 §8 映射 | 交叉链接 |

### 5.5 仓库杂项

| # | 对象 | 处置 |
|---|---|---|
| R1 | `bun.lock` + `bun.lockb` + `package-lock.json` | 决策项：CI 与 README 用 npm → 保留 `package-lock.json`；若 Lovable 运行环境要求 bun 锁，则保留 `bun.lockb` 并在 CI 加「两锁一致性」检查，删除文本版 `bun.lock` |
| R2 | `scripts/build-ziwei-corpus.ts` | 参数化路径、Node 运行、纳入 `npm run check`（MP-25） |
| R3 | 远程 19 个分支中 `devin/*`、`codex/*`、`claude/*`、`codebase-analysis-*` 等已合并/被取代分支 | 归档标签后删除远程分支（`b9b80da` 已「consolidate superseded historical branches」，只剩清理 ref） |

---

## 6. 备忘录资产分级与处置

材料包为 iCloud 全量导出摘要（`icloud-notes-export-complete-20260919`），本机不可挂载。分级规则：**A 级进入 `docs/vision/`（愿景来源，不等于实现承诺）；B 级只留索引与设计思想摘要于 `docs/archive/notes-index.md`，代码不入库；C 级登记为缺口，视为不存在。**

### 6.1 A 级：产品权威（进入仓库，作为规划输入）

| 资产 | 处置 | 对仓库的直接作用 |
|---|---|---|
| 白皮书（含重复稿）+ 白皮书 V2 分析 | 去重合并为一份 `docs/vision/WHITEPAPER.md`（标版本与日期；重复稿只保留差异注记） | §3 七层映射的权威来源 |
| H-Pulse 系统七层 | 并入 WHITEPAPER 附录 | 同上 |
| Core / DestinyMatrix（含重复） | 去重后 `docs/vision/CORE_PIPELINE.md`；逐字段对照 HPU-2 `NormalizedInput` 与 `StandardizedInput` | 产出「DestinyMatrix ↔ StandardizedInput 差异表」（MP-23） |
| 用户输入命格变量 | 同上差异表 | 决定 HPU-2 是否需扩字段（任何新增字段都要走 Zod + Rust struct + 测试） |
| notes-hpulse-core-components | 对照 §3 列出「愿景组件 ↔ 仓库模块」 | 发现缺失模块的定义来源 |
| 前沿拓展分析、全球玄学综合报告 | `docs/vision/`；其中提到的体系/文献转为**可引用**条目（URL/ISBN/DOI）才可进入注册表 `sourceUrls` | P7 文献候选池 |
| 产品可视化 | 对照 `UI_SYSTEM.md`，只吸收不违反「克制、审计优先」原则的部分 | UI 参照 |
| 融资 Pitch | `docs/vision/`，明确标「商业叙事，不构成门禁输入；任何『准确率』表述以门禁文档为准」 | 防止营销措辞回流到 UI |

### 6.2 B 级：历史实验草稿（默认非生产）

| 系列 | 数量特征 | 处置 | 禁令 |
|---|---|---|---|
| 人生唯一系统 1–7 | 迭代互相覆盖 | 仅保留第 7 版设计思想摘要 | 「唯一路径」概念在仓库已降级为「排序路径 + 分析边界」；不得恢复「唯一命运」措辞 |
| 宏观世界 1–5、macro*-complete（大量 incomplete）、macro2-main 双份 | 大量残缺 | 索引 + 一段摘要；代码不入库 | — |
| Mirage 多阶段部署与完整代码 | 多版本 | 摘要其「多情景」思想；实现以 HPU-5 WorldTree 为准 | 不得引入外部服务部署假设 |
| backend-ppo 双份、DRL / DDPG / GA / PSO 多份后端 | 重复 | 归档索引；若未来要做，只能进入 `src/research/`，走 ADR-006 | **不得**作为生产必做；不得进入 `LifeTimeline`、账本、门禁 |
| entropy-service 双份、entropy 模型多份 | 重复 | 同上 | 同上 |
| import-random-pandas 五份 | 重复 | 归档；标「与确定性契约直接冲突（`random`）」 | 禁止移植 |
| 因果链 / DDPG / 宏观 3.9 / 4.0 等 30+ `incomplete`（仅摘要） | 残缺 | 登记于索引，标 incomplete，不据此排期 | — |

### 6.3 C 级：锁定 / 残缺待补（登记为缺口）

| 锁定项（9 条） | 缺口编号 | 说明 |
|---|---|---|
| Destiny DID | G-01 | 若指去中心化身份：⛔ beta 期不做；远期需 ADR |
| `import random` | G-02 | 与确定性契约冲突，即便解锁也不移植 |
| `life_simulation/` | G-03 | 可能是 Mirage/Causality 的实现草稿；解锁后按 B 级评估 |
| Character / SocialNetwork / Environment / DecisionSystem 等多条 | G-04…G-09 | 可能对应白皮书 Legacy/Nexus 的定义；解锁前不做假设 |

处置：请求用户解锁导出；在解锁前，规划中一律视为「不存在」。

---

## 7. 完善方案：缺口、风险、单一事实源与发布门禁

### 7.1 缺口清单（在 NEXT_PLAN 之外新发现的，按严重度）

| 级别 | 缺口 | 证据 | 处置 |
|---|---|---|---|
| 高 | HPU-3..8 零测试，但 `docs/hpulse/04/05/07/08` 标「✓ 确定性」 | `find src/hpulse -name '*.test.*'` 仅 1 个 | MP-09 |
| 高 | 主流程强制铁板六亲校时；未校时无法得到任何引擎结果 | `usePredictionFlow.ts` 状态机 | MP-11 |
| 高 | 账本 `prediction_runs` 由 legacy 结果写入；收敛后需保证回放兼容 | `predictionLedger.savePredictionRun(qResult.unifiedResult)` | MP-10 |
| 中 | `deriveMonth` 哈希派生月份 | `EventTimelinePanel.tsx` L56–100 | MP-24 |
| 中 | legacy 铁板运行器自评 B/0.78/85 + `% 1000 / 10` 映射；legacy 六爻/数字命理/玛雅/卡巴拉运行器同样自评 `sourceGrade 'B'`（L608/737/778/821） | `quantumPredictionEngine.ts` L379、L398 | MP-24（先改自评为 D/needs_source_validation，注册表封顶不变） |
| 中 | `EventCategory` 含 `death` | `destinyTree.ts` L17 | MP-24 |
| 中 | `display_name` 用于姓名存在性判断 | `ResultTabsView.tsx` L199、L203 | MP-24 |
| 中 | 两套权重矩阵、死激活表 | §5.1 C1/C2 | MP-08 |
| 低 | `docs/hpulse` 缺 02；README 依赖漂移；`ARCHITECTURE.md` 过时；`ANALYSIS.md` 矛盾 | §5.4 | MP-20 |
| 低 | 三份锁文件；生成胶水入库；语料脚本绝对路径 | §5.5 | MP-25 |
| 待核 | `supabase/config.toml` 中 `import-clauses` / `geocode-location` / `check-registration-ip` 为 `verify_jwt = false`（`import-clauses` 内部已自行校验 super_admin；另两者需确认限流与滥用防护） | `config.toml`；函数源码 | 并入 MP-02 安全复核 |

### 7.2 风险登记（新增于 NEXT_PLAN §3 之外）

| 风险 | 影响 | 缓解 |
|---|---|---|
| 收敛时「为了删代码」而丢失事件抽取知识 | Causality 层退化 | C4 只迁不删；迁移每个抽取器都配 golden 快照 |
| HPU 切换后账本历史记录无法与新 `algorithmVersion` 对齐 | P8 校准断档 | `algorithmVersion` 复合对象 + 迁移脚本为旧行补 `legacy-qpe` 标记 |
| Lovable 侧改动直接进入 `main` | 事实源分裂；门禁被绕过 | 分支保护 + Lovable 连接非 `main` 分支（ADR-005） |
| 备忘录 B 级代码被当作「已有资产」直接移植 | 引入 `random` / RL 破坏确定性 | ADR-006 研究模式门禁 + CI 静态扫描 |
| 六亲校时可选化后，铁板输出更弱 | 用户误读 | 铁板在未校时状态显示「未校时，研究模式」徽章；置信度封顶 0.2（HPU 已如此） |

### 7.3 Lovable ↔ GitHub 单一事实源与发布门禁（ADR-005）

**原则**：GitHub `main` 是唯一事实源。Lovable 是编辑客户端与预览环境之一，不是发布源。

**结构性措施**
1. `main` 开启分支保护：仅 PR 合并、要求 `H-Pulse CI` 通过（T1 恢复后）、禁止 force push。
2. Lovable 项目连接到专用分支（如 `lovable/preview`）而非 `main`；Lovable 侧改动经 PR 回流。若 Lovable 不支持切换连接分支（待核实），则退而求其次：保留连接 `main` 但依赖分支保护 + 每次 Lovable 提交触发 CI + 人工审阅。
3. Lovable 项目显示名 Iron Plate Oracle → H-Pulse；开启 Lovable 监控仅在首次 Publish 之后。

**unpublished changes 处置（默认不发布）**
1. 先判定其性质：在 Lovable 中查看 History / 与 GitHub 的同步状态。
   - 若 git 已含这些改动（`origin/main` 有对应 commit）：unpublished 只是「未 Publish 的构建」，处置 = 走下方门禁；
   - 若 git 不含：导出 diff → 按「算法 / Supabase 结构 / UI 文案 / 其他」分类 → 算法与 Supabase 变更必须以 PR 回流并过 CI，UI 文案变更也需 PR。
2. **发布到 `hpulse.lovable.app` 的前置条件（全部满足）**：CI 绿灯（MP-01）；PR #20 合并且凭据已轮换（MP-02）；diff 审查结论记录在 `docs/RELEASE_CHANNELS.md`；页面文案与仓库免责/「非量子计算」表述一致；显示名已改为 H-Pulse。
3. 在上述条件满足前，Lovable 仅用于预览；本文**不建议**立即发布。

**四通道门禁**：Lovable preview（无门禁）→ Lovable published（上述条件）→ Supabase staging（迁移可重放 + 删户 e2e，MP-30）→ 商店内测（`COMMERCIAL_BETA_READINESS.md` 全部「内测前」项）→ 公开商业发布（`COMMERCIAL_RELEASE_GATES.md` 十条 + `ready === true`）。

---

## 8. 优先级路线图

### 8.1 相对 NEXT_PLAN T1–T12 的处置

| NEXT_PLAN | 处置 | 新编号 | 优先级变化 | 说明 |
|---|---|---|---|---|
| T1 CI 绿灯 | 保留 | MP-01 | P0 → P0 | 今日 run 仍 `startup_failure`，仍是一切证据的前提 |
| T2 凭据轮换 + PR #20 | 保留，扩展 | MP-02 | P0 → P0 | 并入 `verify_jwt=false` 三函数复核 |
| T3 简报/仓库对齐 | 拆分 | MP-03 + MP-20 | P0 → P0 / P2 | `AGENT_MISSION.md` 以重建稿新建（全分支不存在）；文档漂移修正合并进文档去重 |
| T4 LifeTimeline 契约 | 保留，升级 | MP-10 | P1 → P1 | 明确消费 HPU 报告 + 迁入的事件层；账本写入同步切换 |
| T5 P7 规则 ID 化 + 黄金用例 | 拆分 | MP-06 + MP-07 | P1 → P1 | 结构化 trace 与 golden 目录分开验收 |
| T6 合并 PR #21 | 保留 | MP-04 | P1 → P0 | 已完成的规则修正应尽早入库；仅依赖本地 `npm run check` 证据 |
| T7 铁板 ADR | 保留，**提级** | MP-05 + MP-11 | P2 → P0/P1 | 卡住主流程与门禁 `requiredEngines`，不能等到第二阶段 |
| T8 staging + 删户 | 保留 | MP-30 | P2 → P2 | — |
| T9 Lovable 门禁 | 保留，扩展 | MP-31 | P2 → P2 | 加分支保护与连接分支策略 |
| T10 P8 校准设计 | 保留 | MP-32 | P3 → P3 | — |
| T11 原生 QA | 保留 | MP-33 | P3 → P3 | — |
| T12 可观测性 | 保留 | MP-34 | P3 → P3 | — |
| — | 新增 | MP-08 融合收敛 ADR-002 + 双跑 diff | P1 | 收敛闸门 |
| — | 新增 | MP-09 HPU 测试补齐 | P1 | 无测试不得切换 |
| — | 新增 | MP-12 事件层迁移 | P1 | Causality 可回溯 |
| — | 新增 | MP-13 可执行晋级门 | P1 | 「距离 complete」可数 |
| — | 新增 | MP-20 文档去重 / MP-21 低风险代码去重 / MP-22 UI 合并 / MP-23 备忘录归档与 ADR-006 / MP-24 诚实标注修正批 / MP-25 仓库卫生 | P2（MP-21/24 中的零风险项可提前） | 清理 |

### 8.2 里程碑（按依赖排序，不给日历承诺）

**M0 · 证据链与安全底线（P0）**
- MP-01 CI 首绿：`rust → web → android/ios` 四 job 至少在 `main` 跑通一次；artifact 可下载；门禁文档删除 Actions 阻断项并记录 run URL。
- MP-02 凭据轮换 + PR #20 合并：staging 从零重放迁移；五类调用用例通过；`docs/SECURITY_LOG.md`（不含密钥）；复核三函数滥用防护。
- MP-03 `AGENT_MISSION.md`（重建稿，标注来源为本文 §1 与宪法）+ ADR-000。
- MP-04 合并 PR #21：Numerology 不再含 Pinnacles/Challenges 缺口、Kabbalah 不再含 Mispar Gadol；两者仍 `partial`。
- MP-05 ADR-001 铁板决策（用户拍板）。
- 零风险清理可并行：E1（删除两份 `.ts.txt` 副本）、D1（归档 `ANALYSIS.md`）、D4（README 依赖漂移）、D2（`.lovable/plan.md` 标注）。
- **退出标准**：CI 绿；PR #20/#21 合并；ADR-000/001 合并。

**M1 · 修核基础与收敛闸门（P1）**
- MP-06 规则 ID 化：注册表 `implementedRules` 每条带 `ruleId` + 稳定引用；`explanationSteps` 契约落地并在 Numerology / Mayan / Western 三引擎先行。
- MP-07 golden fixtures：`fixtures/golden/<engine>/{normal,boundary,invalid,ambiguous}.json` + `scripts/verify-golden.mjs` 纳入 `npm run check`；Numerology ≥ 30、Mayan ≥ 30、Western 行星黄经 ≥ 20 时刻 × 10 行星 vs JPL Horizons ≤ 0.01°。
- MP-08 ADR-002 + 双跑 diff 测试：同一 `StandardizedInput` 下 legacy 与 HPU 经 `applySourceRegistryPolicy` 后的 13 个 `EngineOutput`，其核心权威字段（`fateVector` / `confidence` / `sourceGrade` / `completenessScore` / `timeWindows` / `eventCandidates` / `aspectScores` / `validationFlags`）必须字节一致（二者共用 `runCoreEngine`，预期可通过；不一致即为缺陷）；legacy 经 `mergeCoreOverlay` 额外合并的 `warnings` / `sourceUrls` / `legacyNormalizedOutput` 列入显式差异白名单，白名单随 C5 清空。铁板例外：legacy 走 `utils/tiebanAlgorithm`、HPU 走 `core/tieban`，二者差异本身就是 C6 的验收输入。同时 C1/C2 权重与激活表收敛。
- MP-09 HPU 测试：weights（归一化、降级重分配、并列破序）、worldtree（阶段/维度/迁移）、fusion（evidenceQuality 边界）、projection（FNV 签名、失败态）、pipeline（never throws、字节稳定）。目标：覆盖 legacy `worldTree.spec` / `orchestrate.spec` / `architectureDecentralization.spec` 所断言的同类性质。
- MP-11 六亲校时可选化：状态机加「跳过校时」；跳过时 tieban 走 `dispatchTieban(si, undefined)`（0.2 封顶 + `KAOKE_NOT_RUN`），其余 12 引擎照常；UI 显示铁板「未校时」徽章。
- MP-13 `promotionGate.ts` + 研究面板展示。
- **退出标准**：双跑 diff = 0 测试入库；HPU 测试文件 ≥ 6；三引擎 golden 入库；未校时也能得到完整结果。

**M2 · 轨迹数据层（P1）**
- MP-12 事件层迁移到 `src/hpulse/events/`（带 `ruleId`、`traceRef`；HPU-3 `EventType` 增 `family`/`study` → `wmat-1.2.0`）。
- MP-10 `LifeTimeline`：`src/types/lifeTimeline.ts` + `docs/LIFE_TIMELINE.md` + `buildLifeTimeline(PipelineReport)` 纯函数 + 确定性/封顶/敏感词测试；Overview 改为轨迹优先；账本 `savePredictionRun` 切到 HPU 报告并写复合 `algorithmVersion`；轨迹节点就地反馈写入 `prediction_actuals`。
- **退出标准**：非超管用户看到轨迹（每节点有状态徽章与置信度）；命运树/唯一路径仍限超管；账本新行带复合版本。

**M3 · 收敛清理与发布前置（P2）**
- MP-21 C5（停止执行 legacy 引擎运行器 → 删除）、C6/C7（铁板适配器化）、E2/E4/E5/E6。
- MP-22 UI 合并至 6 Tab；`quantum-*` 组件删除或改名；U4/U5/U6。
- MP-08 后续：C3 legacy 融合迁入 `src/research/legacy-scenario/` 并冻结。
- MP-20 文档去重 D3/D5/D6/D7/D8；`CHANGELOG.md`。
- MP-23 备忘录归档：`docs/vision/*`、`docs/archive/notes-index.md`、DestinyMatrix 差异表、ADR-006 + CI 静态扫描（禁止 `src/hpulse|src/core` import `src/research`）。
- MP-24 诚实标注修正批（可在 M0 后随时做）：`deriveMonth` 删除、legacy 铁板自评改 D/needs_source_validation、`death` 类型删除、`display_name` 判定改读引擎输出、AI 解读响应加 `deterministicInputsHash` 与 UI 标注（ADR-004）。
- MP-25 仓库卫生：锁文件决策、生成胶水 gitignore、语料脚本参数化、远程分支清理。
- MP-30 staging + 删户 e2e + `docs/DATA_INVENTORY.md`；MP-31 `docs/RELEASE_CHANNELS.md` + 分支保护 + Lovable 连接分支 + 显示名。
- **退出标准**：`src/utils` 中不再有 legacy 引擎运行器；用户视图只依赖 HPU + LifeTimeline；Lovable Publish 门禁文档化且未发布。

**M4 · 校准与交付前置（P3）**
- MP-32 `docs/P8_CALIBRATION_DESIGN.md` + `ledgerDrift.ts` 纯函数 + 最小样本量/去重规则（只展示不回写）。
- MP-33 `docs/NATIVE_QA_MATRIX.md` + `docs/STORE_ASSETS_CHECKLIST.md`。
- MP-34 `docs/OBSERVABILITY.md`（不采集出生数据/姓名；事件白名单）。
- 最后删除 `src/research/legacy-scenario/`（若研究面板无人使用且 LifeTimeline 已覆盖其信息）。

### 8.3 每个里程碑不变的门禁

- `npm run check` 通过（security:static → typecheck → lint 0 warning → vitest → build）。
- `determinismGuard.full.test.ts` 与全结果字节稳定测试通过。
- `commercialReadiness` 报告结构不变、`ready` 仍为 `false` 直到真实满足十条。
- 任何 PR 描述含「唯一目的对齐」段落（宪法 §5）。

---

## 9. 度量与诚实预期

| 指标 | 现状 | M1 后 | M3 后 |
|---|---|---|---|
| `complete` 引擎数 | 0 | 0 | 0（除非 golden + 引用 + 校准全部满足；本规划不承诺） |
| 融合路径数 | 2 | 2（但双跑 diff = 0 有测试） | 1（legacy 冻结于 research） |
| `src/hpulse` 测试文件 | 1 | ≥ 6 | ≥ 10（含 events / timeline） |
| 仍在执行的 legacy 引擎运行器行数 | ≈ 8,800 | ≈ 8,800 | 0 |
| 超管结果 Tab 数 | 23 | 23 | 6 |
| 带 `ruleId` 的引擎 | 0 | 3 | ≥ 6 |
| golden fixture 引擎 | 0 | 3 | ≥ 6 |
| CI 绿灯 | 0 | ≥ 1 | 持续 |
| 用户可见轨迹 | 无（仅 legacy 事件面板） | 无 | 有（`lt-1.0.0`） |

---

## 10. 需要用户决策的事项（阻断项）

1. ADR-001 铁板范围：甲 / 乙 / 丙（影响 MP-05/11、E4、`requiredEngines`）。
2. Lovable 连接分支是否可从 `main` 切换；unpublished changes 的性质（git 已含 / 未含）。
3. 锁文件保留策略（R1）。
4. 备忘录 C 级 9 条锁定项是否解锁导出；B 级是否同意「只留索引、代码不入库」。
5. 白皮书 Legacy / Nexus 的定义，以及是否接受「beta 期明确不做 NFT / Web3 / 数字人格」。

其余追问沿用 [`NEXT_PLAN_20260919.md`](./NEXT_PLAN_20260919.md) §4（Q1–Q26）。

---

## 11. 交叉链接

- 任务明细与追问清单：[`NEXT_PLAN_20260919.md`](./NEXT_PLAN_20260919.md)
- 宪法：[`hpulse/01-constitution.md`](./hpulse/01-constitution.md)
- 门禁：[`COMMERCIAL_RELEASE_GATES.md`](./COMMERCIAL_RELEASE_GATES.md)、[`COMMERCIAL_BETA_READINESS.md`](./COMMERCIAL_BETA_READINESS.md)
- 引擎证据：[`ALGORITHM_VERIFICATION_MATRIX.md`](./ALGORITHM_VERIFICATION_MATRIX.md)、[`ALGORITHM_STATUS.md`](./ALGORITHM_STATUS.md)
- 架构与路线：[`ARCHITECTURE.md`](./ARCHITECTURE.md)、[`ROADMAP.md`](./ROADMAP.md)
- HPU 管线文档：[`hpulse/03`](./hpulse/03-dynamic-weights.md) … [`hpulse/09`](./hpulse/09-react-hook.md)

## 12. 唯一目的对齐段

本规划的每一项都服务于「可审计、可复现、诚实标注局限的个体生命轨迹推演」：M0 恢复证据链与安全底线；M1 让「修核」有规则 ID、黄金用例与可数的晋级条件，并为融合路径收敛设置不可绕过的测试闸门；M2 让轨迹成为可回溯到引擎与规则的数据契约而非 UI 效果；M3 删除重复路径与与宪法冲突的「量子」表述，把实验代码隔离在研究模式门禁之后，并让 GitHub 成为唯一事实源；M4 在样本门槛之前只展示不回写校准。任何与本段冲突的改动不应进入主分支。
