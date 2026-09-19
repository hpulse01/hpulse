> **Completed in P3 (2026-05).** The current authoritative plan is
> [`docs/MASTER_PLAN_ALIGN_HPULSE.md`](docs/MASTER_PLAN_ALIGN_HPULSE.md).
> This file is retained because Lovable reads `.lovable/plan.md`.

# H-Pulse P3-UI 全面重构计划

将 H-Pulse 从「普通命理表单页」重构为「量子生命轨迹预测操作系统」，**不动核心算法、13 引擎、Supabase 结构、AI 解读、六亲校时、命运树、唯一路径、量子坍缩、管理员权限**。

---

## 1. 设计系统升级（基础层）

**`src/index.css` + `tailwind.config.ts`**
- 扩展现有 Digital Temple 调色板：新增 `--quantum-blue`、`--quantum-violet`、`--quantum-cyan`、`--jade-success`、`--danger-muted`
- 新增 token：`--surface-glass-1/2/3`、`--inner-glow-gold`、`--border-luminous`
- 新增动画：`engine-pulse`、`quantum-collapse`、`scroll-unlock`、`status-blink`
- 新增字体层级 utility：`.text-display`（金色稀疏字距）、`.text-mono-id`（monospace 签名/ID）、`.text-system`（冷静正文）
- **保留** 既有 `.glass`、`.glass-elevated`、`.text-gradient-gold`，仅扩展不删除

---

## 2. 新增通用组件（`src/components/hpulse/`）

全部 TypeScript、可复用、不破坏既有 imports：

| 组件 | 作用 |
|------|------|
| `SystemStatusBar.tsx` | 顶部状态条：SYSTEM ONLINE / 13 ENGINES READY / CLAUSE DB / ORCHESTRATION |
| `HeroMission.tsx` | 输入前的使命陈述 + 三枚徽章 + 系统声明 |
| `EngineStatusGrid.tsx` | 13 引擎状态网格：名称 / Ready·Syncing·Locked·Skipped / 能量条 |
| `HolographicPanel.tsx` | 玻璃态卡片基座：subtle border + inner glow，替代普通 Card |
| `MetricCard.tsx` | 指标卡：label / value / confidence / trend |
| `SectionHeader.tsx` | 统一标题：中文主标 + 英文小字 + 装饰线 |
| `QuantumLoadingScreen.tsx` | calculating 步骤：中央量子核心 + 13 引擎逐个点亮 |
| `CollapseLoadingScreen.tsx` | projecting 步骤：Theoretical Base / Offset / Quarter / Engines Collapsing |
| `ResultShell.tsx` | 结果页外壳：Quantum Signature Banner + Life Summary Card + Tabs 容器 |
| `LifeTimeline.tsx` | 唯一路径纵向时间线：age / year / event / probability / engines |

---

## 3. 页面重构

### `src/pages/Index.tsx` — 重构为 Prediction Console
- Header：左 H-Pulse 标识、中 SystemStatusBar、右 LanguageToggle + UserMenu + 「预测档案」+ 管理员入口（条件渲染）
- 输入前：HeroMission
- 桌面 40/60 双栏：左 BirthDataForm（视觉升级，逻辑不动）、右 EngineStatusGrid + 6 步流程说明
- 移动端：单列堆叠
- 提交按钮文案：「启动生命轨迹推演 / Initialize Destiny Projection」

### `src/components/BirthDataForm.tsx`
- 仅视觉升级（HolographicPanel 包裹、字段更像仪表盘）
- **不改**输入字段、submit 逻辑、TiebanInput 类型

### 流程态
- `calculating` 步骤 → 替换为 `QuantumLoadingScreen`，**保留现有 setTimeout 编排**
- `verification` → `SixRelationsVerification` 视觉升级（标题改「六亲校时 / Temporal Lock Verification」、卡片选中态金色发光、按钮「确认事实并锁定时轨」），**逻辑不动**
- `projecting` → 替换为 `CollapseLoadingScreen`

### 结果页（`UnifiedResultsPanel.tsx`）
- 套 `ResultShell`：顶部 Quantum Signature Banner（quantumSignature / coherence / world count / engine count / dominant element / death age）+ Life Summary Card
- Tabs 横向可滚动，active 金色下划线 + 微光
- 各 Tab 内部：
  - **Overview** (`PredictionOverview`)：Fate Vector 雷达 + 10 维度 MetricCard 矩阵（life/wealth/relation/health/wisdom/spirit/socialStatus/creativity/luck/homeStability）
  - **Engines** (`EngineContributionPanel`)：13 引擎卡片矩阵 + 冲突与融合说明
  - **Tree** (`DestinyTreeLayer`)：世界树摘要 + 节点像分叉
  - **Path** (`UniquePathLayer`)：用 `LifeTimeline` 渲染，死亡节点暗红审慎
  - **Destiny** (`DestinyDashboard`)：卷轴 + 仪表混合，左命盘右条文，AI 解读按钮升级
  - **Quantum** (`UnifiedQuantumPanel`)：科学仪表盘风
  - **Orchestration** (`AdminOrchestrationConsole`)：内部监控台风
- 底部：「返回控制台」「重新启动推演」按钮

### `DisclaimerDialog.tsx`
- 视觉升级为「系统使用声明」，文案严肃化，按钮：「我理解并进入系统」
- **不改**接受逻辑与 localStorage 存储

### 新增 `src/pages/PredictionHistory.tsx`
- 占位页：「预测档案将在验证账本模块中启用」+ 「返回控制台」按钮
- 路由 `/prediction-history` 注册到 `App.tsx`，避免 Header 按钮 404

---

## 4. 移动端

- Header 折叠次要按钮
- Tabs `overflow-x-auto`
- 输入表单单列
- MetricCard 自适应 1-2 列
- 时间线纵向、字号下调
- 减少粒子动画密度

---

## 5. 严格不动清单

- 所有 `src/utils/*Algorithm*.ts` 引擎核心
- `predictionOrchestrator.ts`、`quantumPredictionEngine.ts`、`worldTreeGenerator.ts`、`holisticFateMapGenerator.ts`、`conflictResolver.ts`、`eventFusion.ts`
- Supabase 表结构、RLS、edge functions
- 管理员账号、`useSuperAdmin`、`useAdminAccess` 权限逻辑
- AI 解读 (`AIInterpretation.tsx` + `ai-interpret` function) 仅按钮视觉升级
- StandardizedInput 输入流、TiebanInput 类型
- 死亡/疾病/犯罪等敏感字段：保留输出，只改展示色调（暗红审慎、不删）

---

## 6. 验收

- `npm run build` 通过
- 不引入新依赖（复用 lucide-react / recharts / tailwind / shadcn / framer-motion 若已存在）
- 既有 165 测试不受影响（仅 UI 改动）

---

## 技术细节

- 新组件全部 default export + named type export
- 颜色一律走 HSL token，不写 hardcode
- 动画走 Tailwind `animate-*` + CSS keyframes，不引入 canvas
- `EngineStatusGrid` 数据先用静态 13 引擎清单（name + i18n key），状态由 step 驱动
- `QuantumLoadingScreen` / `CollapseLoadingScreen` 接受 `progress?: number` 与 `messages: string[]`，由 Index.tsx 现有 step 状态驱动，不引入新 state machine
- `LifeTimeline` 接受现有 `UniquePathNode[]` 类型，零 schema 变更
- i18n：所有新增文案走 `useI18n().t(...)`，新增 key 加到 `useI18n.tsx`

实施顺序：设计系统 token → hpulse 组件库 → Index.tsx 重构 → 流程态屏 → ResultShell + 各 Tab 升级 → DisclaimerDialog → PredictionHistory 占位 → 移动端打磨 → build 验证。
