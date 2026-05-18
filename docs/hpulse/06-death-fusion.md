# HPU-6 — Death Fusion (终局合成)

```
WorldTree (HPU-5) ─┐
                   ├──► fuseDestiny() ──► DeathFusionResult
EngineRunResult[] ─┘                       ├─ deathWindow  { startAge..endAge, peakAge, strength, cause, p }
                                           ├─ verdict      { lifetimeFateVector, overallScore, overallConfidence,
                                           │                  dominantStage, pivotalTransition, top/bottom dims }
                                           ├─ stageConfidence[5]
                                           ├─ signals[]   (per-engine death seeds)
                                           ├─ degradedEngines[]
                                           └─ explanationTrace[]
```

## 保证

- **确定性**：无 `Math.random` / `Date.now`，输入相同 → 输出字节级一致。
- **降级安全**：缺信号 → 默认寿限 78y（`weak`, `natural_aging`）。
- **优先级**：显式数值年龄（`aspectScores.寿/lifespan/deathAge/大限`） >
  事件关键字加权 > `fateVector.health/life` 推断。
- **树校正**：`attenuateByTree` 用 elder 阶段 `health` 微调 peakAge（±0..3y）。

## 死亡共识强度

| 条件 | strength |
|---|---|
| ≥3 引擎 且 avgRisk≥55 | `strong` |
| ≥2 引擎 或 avgRisk≥45 | `weak` |
| 其他 | `illness_only` |
| 无 signal | `default` |

## DIM_IMPORTANCE（headline 聚合权重）

`life 0.16, health 0.16, wealth 0.12, relation 0.10, wisdom 0.10, socialStatus 0.08,
creativity 0.08, luck 0.08, spirit 0.06, homeStability 0.06`（Σ=1.0）
