# H-Pulse 量子预测系统｜产品宪法 (HPU-1)

> 本文件是 H-Pulse 一切代码、算法、引擎、UI 与文档的最高约束。
> 任何 PR / 重构 / 模块新增，必须先满足本宪法。违反此处条款的设计应在 Code Review 中无条件拒绝。

---

## 1. 唯一目的 (Single Purpose)

H-Pulse 量子预测系统的唯一目的是：

> **工程化地、可追溯地、尽可能完整地预测一个人从当下到死亡的生命轨迹。**

也即"死亡视角假说"：把"死亡瞬间回望一生时的清明"提前到当下，把它表达为
节点、路径、概率、置信度、因果链与可审计字段。

任何不服务这个目的的功能（炫技动画、占卜话术、玄学结论、单一体系结论）
都不应进入主分支。

---

## 2. 六条不可违反的开发原则

1. **先定义数据结构，再写算法。** 任何引擎落地前必须先有 Schema (TS 类型 + Rust struct + Zod/serde 校验)。
2. **先跑通最小端到端闭环，再追求复杂精度。** 输入 → 引擎 → 融合 → 世界树 → 坍缩 → 图谱 → 审计 必须先全链路打通。
3. **所有预测结果必须结构化、可追溯、可复现。** 不允许只输出自然语言结论。
4. **所有算法、权重、规则、引擎、矩阵必须版本化。** 通过 `algorithm_version` 字段绑定到每条输出。
5. **不允许只输出文本结论。** 必须输出节点、路径、概率、置信度、因果链和审计字段。
6. **不允许跳过错误处理、验证、降级和审计。** 每一次失败必须可定位、可复现。

---

## 3. 确定性契约 (Determinism Contract)

任意一次预测，给定完全相同的 `StandardizedInput`、`algorithm_version`、`seed`，
所有引擎与坍缩算法必须产出**字节级一致**的结果。

派生规则：

- ❌ 禁止 `Math.random()`、`rand::random()` 出现在 `src/hpulse/`、`crates/hpulse-*`、`src/core/` 的最终输出路径。
- ❌ 禁止 `Date.now()` 进入算法输出 —— 时间应由 `queryTimeUtc` 显式注入。
- ✅ 任何"随机分支"必须使用 seeded RNG（如 `ChaCha8Rng::seed_from_u64`），seed 来自 `StandardizedInput.seedMaterial`。
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
本改动如何让系统更接近"完整生命轨迹的可追溯预测"。
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

- `hpulse001@gmail.com` 是受保护的 Level 4 Super Admin。
- 用户必须在执行任何预测前接受免责声明（Mandatory Disclaimer）。
- 预测结果不是医学、法律、金融建议；系统不得在 UI 上以确定性口吻表达"必然发生"。

---

_版本：constitution.v1 (HPU-1, 2026-05)._
