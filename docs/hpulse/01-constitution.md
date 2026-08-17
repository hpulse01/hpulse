# H-Pulse 多体系文化规则分析｜产品宪法 (HPU-1)

> 本文件是 H-Pulse 一切代码、算法、引擎、UI 与文档的最高约束。
> 任何 PR / 重构 / 模块新增，必须先满足本宪法。违反此处条款的设计应在 Code Review 中无条件拒绝。

---

## 1. 唯一目的 (Single Purpose)

H-Pulse 的唯一目的是：

> **工程化、可追溯、可复现地呈现多种传统文化规则对同一输入的计算结果、分歧和证据边界。**

系统输出候选情景、规则分数、来源、版本、解释链和审计字段。它不声称量子物理机制，
不推断寿命/死亡，不把未校准分数称为事件概率，也不宣称存在唯一确定未来。

任何不服务这个目的的功能（炫技动画、绝对化话术、无来源结论、单一体系冒充共识）
都不应进入主分支。

---

## 2. 六条不可违反的开发原则

1. **先定义数据结构，再写算法。** 任何引擎落地前必须先有 Schema (TS 类型 + Rust struct + Zod/serde 校验)。
2. **先跑通最小端到端闭环，再追求复杂精度。** 输入 → 引擎 → 融合 → 情景树 → 排序 → 图谱 → 审计 必须先全链路打通。
3. **所有分析结果必须结构化、可追溯、可复现。** 不允许只输出自然语言结论。
4. **所有算法、权重、规则、引擎、矩阵必须版本化。** 通过 `algorithm_version` 字段绑定到每条输出。
5. **不允许只输出文本结论。** 必须输出节点、路径、规则分数、来源质量、解释链和审计字段；只有经过结果校准的量才可称为概率。
6. **不允许跳过错误处理、验证、降级和审计。** 每一次失败必须可定位、可复现。

---

## 3. 确定性契约 (Determinism Contract)

任意一次分析，给定完全相同的 `StandardizedInput` 与 `algorithm_version`，
所有引擎与排序算法必须产出**字节级一致**的结果。

派生规则：

- ❌ 禁止 `Math.random()`、`rand::random()` 出现在 `src/hpulse/`、`crates/hpulse-*`、`src/core/` 的最终输出路径。
- ❌ 禁止 `Date.now()` 进入算法输出 —— 时间应由 `queryTimeUtc` 显式注入。
- ✅ 商业输出路径默认不得含随机分支；若研究模式引入 seeded RNG，必须显式记录 seed 且不得混入正式确定性结果。
- ✅ 每条输出都必须携带 `explanationTrace`、`warnings[]`、`sourceGrade`、`algorithm_version`。

---

## 4. 唯一输入契约 (StandardizedInput Contract)

`StandardizedInput` 是所有引擎、融合、世界树、坍缩、图谱模块的**唯一**数据入口。

最小必需字段：

- `schemaVersion`：输入 Schema 版本
- `birth`: { 公历日期、HH:MM 分钟级时间、历法、IANA 时区、经纬度（高精度）、性别 }
- `query`: { queryTimeUtc、queryType (natal / instant / forecast)、granularity }
- `identity`: { userId? locale }
- `seedMaterial`：用于派生确定性 seed 的稳定字符串
- `raw`：保留原始用户输入，供审计与复现

任何引擎都**不得**绕过 `StandardizedInput` 直接读取表单值、浏览器时区、`Date.now()`、URL 参数等。

---

## 5. 唯一目的对齐机制

每一个一级大项 (HPU-1 .. HPU-12) 与每一份关键 PR 都必须在描述里包含
**"唯一目的对齐"** 段落，回答：
本改动如何让系统更接近“可追溯、可复现、边界透明的文化规则分析”。
无法回答者，不应进入主分支。

---

## 6. 与现有 P4 Core 的关系

- `src/core/` (P4) 保留为既有引擎层，继续服务现有 UI 与 Kao Ke 工作流。
- `src/hpulse/` 与 `crates/hpulse-*` 为新一代核心，按 HPU-1..12 顺序并行建设。
- 引擎切换通过 **adapter** 完成：每个旧引擎在新核心稳定后单独切换，不做大爆炸式重写。
- Memory 中的 `algorithm-correctness-critical`、`engine-output-standardization`、
  `timing-basis-and-determinism` 等约束对新核心同等生效。

---

## 7. 安全与免责

- Level 4 Super Admin 由服务端角色/RLS 识别，文档与客户端不得硬编码账号标识或凭据。
- 用户必须在执行任何分析前接受免责声明（Mandatory Disclaimer）。
- 结果不是科学预测或医学、法律、金融建议；系统不得在 UI 上以确定性口吻表达“必然发生”。

---

_版本：constitution.v2 (HPU-1, 2026-08)._
