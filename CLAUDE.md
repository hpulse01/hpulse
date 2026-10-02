# CLAUDE.md（草稿）

> 草稿状态：重建尚未开始。下文的目录与命令在第 0 阶段完成后生效；在此之前，仓库仍是旧代码，只作参考。设计文档在 `docs/rebuild/`。

## 项目唯一目的

根据一个人的出生信息，推演出他唯一的人生路径。六段式流程不可更改：
1 输入 → 2 多个独立命理引擎 → 3 每个引擎各自生成一级世界 → 4 按权重提取重大选择 → 5 博弈穷举生成二级世界（无穷多元世界）→ 6 结合现实情境做量子坍缩，得到唯一路径。
最高约束是 `docs/rebuild/宪法-v3.md`。

## 不可违反的约束

- **确定性**：同输入、同现实情境、同算法版本 → 字节级相同的输出。算法包（`packages/*`）禁止 `Math.random`、`Date.now()`、无参 `new Date()`、`Intl`、`toLocale*`，以及直接调用 `Math.exp/log/pow/sin/cos/tan/atan2/sqrt`（一律用 `@hpulse/detmath`）。遍历 Map/Set 前先按键排序。坍缩的种子只由本人出生信息派生，写入输出。
- **不编造**：每条规则有 `ruleId` 并登记在 `packages/rule-registry`。不确定出处就标 `unverified`，绝不补引用、不编卷章页码。没有规则依据的数值不输出，不用哈希、取模、常数填补。
- **黄金用例独立**：`golden/` 的期望值只来自外部来源（典籍成例、JPL Horizons、香港天文台、USNO、公认排盘），`golden/tools/` 不得 import `packages/`。代码自己生成的快照放 `snapshots/`，不计入验证。不得为了让测试通过而修改黄金期望值。
- **可追溯**：唯一路径的每个节点必须能回溯到世界地址、博弈、重大选择、引擎规则。不输出只有自然语言的结论。
- **建模诚实**：第 3–6 段的每个假设标注「典籍 / 标准数学 / 项目自定」。量子坍缩是经典计算，不写成量子硬件或物理效应。
- **安全**：类型层面不存在死亡、寿命类事件；终点叫「推演边界」。出生信息、姓名、现实情境、他人信息不进日志、不进埋点、不进错误上报、不进 AI 提示词（AI 只接收节点的结构化摘要）。管理员不能读取用户的人物与现实情境。AI 文本只做解释，不参与计算。
- **不碰线上**：未经项目负责人明确同意，不对线上 Supabase 做任何破坏性操作。不读取、打印或提交任何密钥。

## 目录约定

```
packages/detmath        确定性数学、canonicalJson、SHA-256、种子
packages/contracts      全部 Zod schema（先改契约再改算法）
packages/astro-time     时区、儒略日、真太阳时、节气、农历、干支、行星位置
packages/rule-registry  规则登记（rules/<engineId>.yaml）
packages/era-data       时代与地域数据（带出处）
packages/engines/<id>   每个引擎一个包，引擎之间不得互相依赖
packages/world-model    状态、选择目录、参数集（catalog/）
packages/{worlds,choices,multiverse,reality,collapse,pipeline}
apps/web                React 界面，只消费 pipeline 输出；计算在 Web Worker 中
supabase/               迁移与 Edge Functions
golden/  snapshots/  legacy/（旧代码，只读参考，不参与构建，逐批删除）
```

依赖只能指向下层（见 `docs/rebuild/01-架构设计.md` §1），由 pnpm 严格模式和 lint 规则强制。

## 常用命令

```
pnpm install --frozen-lockfile
pnpm check            # lint + typecheck + test + build + 安全扫描 + 确定性扫描
pnpm test             # 全部单元与性质测试
pnpm test:golden      # 只跑独立黄金用例，并输出独立用例与快照的分别计数
pnpm gate:promotion   # 引擎晋级检查
pnpm dev              # 启动 apps/web
```

## 提交规范

- 分支：在 `rebuild/main` 上通过短分支提 PR；不要直接推送 `main`。
- 提交信息：`<scope>: <动词开头的摘要>`，scope 为包名或 `docs`、`ci`、`golden`、`supabase`。
- 一个 PR 只做一件事。新增或修改黄金数据的 PR 不得同时改引擎代码。
- 改变输出字节的 PR 必须升对应的版本分量（`AlgorithmVersion`），并在描述中说明。
- 规则登记的增删改在 PR 描述中逐条列出，附来源说明。
- 每个 PR 描述包含「唯一目的对齐」一段：本改动如何服务六段式流程中的哪一段。
