# HPU-4 · 多体系算法库 · 统一 EngineRunner

> Linear HPU-4 · Phase 2 · v1.0.0 已落地

## 唯一目的
让每一个命理/预测体系都成为命运场的一个**独立观测器**：统一接口、独立失败、可融合输出。系统永不依赖任何单一体系；任一引擎失败 → HPU-3 自动重分配权重，全链路不中断。

## 统一接口
```ts
interface EngineRunner {
  meta: EngineMeta;                // id, labelCN/EN, timingBasis, requires
  run(si: StandardizedInput, opts?: EngineRunOptions): EngineRunResult;
}

type EngineRunResult =
  | { ok: true;  id; output: EngineOutput; durationMs }
  | { ok: false; id; error: { code; message }; durationMs };
```

**约定**：`run()` 永不抛错。失败封装在 `{ ok:false, error }`。`durationMs` 仅做 trace，不进入融合哈希。

## 已注册十大体系

| HPU-3 id | 体系 | timingBasis | 适配源 |
|---|---|---|---|
| `bazi`       | 八字命理     | birth   | `src/core/bazi` |
| `ziwei`      | 紫微斗数     | birth   | `src/core/ziwei` |
| `liuyao`     | 六爻预测     | query   | `src/core/liuyao` |
| `qimen`      | 奇门遁甲     | query   | `src/core/qimen` |
| `daliuren`   | 大六壬       | query   | `src/core/liuren` |
| `taiyi`      | 太乙神数     | query   | `src/core/taiyi` |
| `tieban`     | 铁板神数     | hybrid  | `src/core/tieban`（best-effort，无家庭事实降级） |
| `meihua`     | 梅花易数     | query   | `src/core/meihua` |
| `astrology`  | 西方占星     | birth   | `src/core/western` |
| `numerology` | 数字命理     | birth   | `src/core/numerology` |

> 复用 `src/utils/p4CoreOverlay.ts` 的成熟 dispatcher。新增 `dispatchTieban()` 用 `normalizeBirthTime + runTieban + tiebanReportToEngineOutput` 装配最小报告，无 clauseProvider/家庭事实时 sourceGrade 降级、写入 `KAOKE_NOT_RUN`。

## 用法
```ts
import { runAll, degradedFrom, computeDynamicWeights } from "@/hpulse";

const results = runAll(standardizedInput, { familyFacts });
const { degradedEngines, degradedReason } = degradedFrom(results);

const weights = computeDynamicWeights({
  ageYears: 35,
  event: "career",
  granularity: "year",
  degradedEngines,
  degradedReason,
});
// → weights.weights[engineId] ready to fuse results[i].output.fateVector
```

## 验收
- 八大核心体系都返回 `EngineOutput`（fateVector + confidence + warnings + grade + trace）✓
- 单体失败不中断：`ok:false` 封装，全链路继续 ✓
- `degradedFrom()` → 直通 HPU-3 `degradedEngines` 接口 ✓
- HPU-3 可读这些输出并加权融合 ✓
- 确定性：相同 SI → 相同 EngineOutput（继承 `src/core` 既有契约）✓
