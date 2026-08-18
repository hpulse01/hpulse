# HPU-6 — Evidence Quality Fusion（证据质量融合）

```
WorldTree (HPU-5) ─┐
                   ├──► fuseDestiny() ──► DestinyFusionResult
EngineRunResult[] ─┘                       ├─ verdict
                                           ├─ evidenceQuality
                                           ├─ stageEvidenceQuality[5]
                                           ├─ degradedEngines[]
                                           └─ explanationTrace[]
```

## 输出边界

- 仅汇总可观测的工程指标：规则覆盖、引擎分数一致度、来源质量、观察数量和降级引擎。
- 不推断寿命、死亡、医疗结局或事件发生概率。
- `overallReliability` 表示当前规则与证据的描述性可靠度，不表示预测准确率。
- 同输入、同算法版本产生相同输出；无 `Math.random` / `Date.now` 进入结果。

## 审计维度

| Field | Meaning |
|---|---|
| `ruleCoverage` | 已实现且产生观察的规则比例 |
| `engineScoreAgreement` | 引擎分数的描述性一致度 |
| `sourceQuality` | 来源等级的加权质量 |
| `observationCount` | 进入融合的可审计观察数量 |
| `contributingEngines` | 实际贡献引擎 |
| `degradedEngines` | 失败、缺失或被降级引擎 |

这些字段用于质量控制和发布门禁，不得在营销或 UI 中解释为科学预测概率。
