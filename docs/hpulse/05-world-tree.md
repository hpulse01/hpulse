# HPU-5 — WorldTree

统一把所有 13 个引擎（HPU-4 `runAll()`）的 `EngineOutput` 映射到同一棵 **因果/阶段树**：

```
Root (subject, seedMaterial)
└─ Stage[0..4]  childhood → youth → prime → middle → elder
     ├─ Domain[0..9]  10 维 FateVector (life/wealth/relation/...)
     │    └─ Observation[*]  engine 级叶节点 (score, weight, evidence)
     └─ transitionToNext  ΔFateVector + L2 magnitude
```

## 接入点

```ts
import { normalizeInput } from "@/hpulse";        // HPU-2
import { runAll, buildWorldTree } from "@/hpulse"; // HPU-4 + HPU-5

const outcome = await normalizeInput(raw);
if (!outcome.ok || !outcome.input) throw ...;
const results = runAll(outcome.input);            // 13 engines
const tree    = buildWorldTree(results, outcome); // WorldTree
```

## 权重策略

每个 Stage 用 `STAGE_WINDOWS[i].pivotAge`（8/22/37/52/70）调用 HPU-3
`computeDynamicWeights({ageYears, event:'general', granularity:'year', degradedEngines})`。
失败引擎全程进入 `degradedEngines`，对应权重 = 0，不进入分母。

## 融合公式

- Domain 节点：`score = Σ_e (w_e * fv_e[dim]) / Σ_e w_e` （只统计 ok 且 w>0）
- Stage `fateVector[dim] = Domain[dim].score`
- `lifetimeFateVector[dim] = mean over 5 stages`
- Transition：`delta = next - current`, `magnitude = ||delta||₂`

## 确定性

- 维度遍历顺序固定（`ALL_FATE_DIMENSIONS`）
- 同分位 Observation 用 `ALL_ENGINES` 顺序破并列
- 分数 `round2`，权重覆盖率 `round4`
- 输出不含 `Math.random` / `Date.now`
- `meta.seedMaterial` 直接来自 HPU-2 → 同输入字节级相同

## 版本

- `WORLD_TREE_VERSION = "wtree-1.0.0"`
- 依赖 `MATRIX_VERSION = "wmat-1.1.0"`
