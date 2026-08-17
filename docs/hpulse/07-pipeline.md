# HPU-7 — Pipeline Orchestrator

```
rawInput (any)
  ├─ HPU-2  normalizeInput()        ──► NormalizeOutcome (Zod + Rust/WASM)
  ├─ HPU-7  toLegacyInput()         ──► legacy StandardizedInput (@/types/prediction)
  ├─ HPU-4  runAll()                ──► EngineRunResult[]  (13 engines, never throws)
  ├─ HPU-5  buildWorldTree()        ──► WorldTree          (5 stages × 10 domains)
  └─ HPU-6  fuseDestiny()           ──► DestinyFusionResult (verdict + evidenceQuality)
                                       ⇒ PipelineReport
```

## API

```ts
import { runPipeline } from "@/hpulse";

const report = await runPipeline(rawForm, { event: "general", granularity: "year" });
if (!report.ok) console.error(report.reason);
else {
  report.fusion.verdict.overallScore;
  report.fusion.evidenceQuality.ruleCoverage;
  report.worldTree.stages;
}
```

## 保证

- **Never throws** — 输入校验失败时 `ok:false` + reason；引擎失败由 HPU-4 降级。
- **Deterministic** — 全链路无 `Math.random` / `Date.now` 写入输出。
- **Adapter only** — HPU-7 不做业务计算，只做 HPU-2 ↔ legacy shape 桥接。

## 字段映射 (HPU-2 → legacy)

| HPU-2 birth.\* | legacy |
|---|---|
| `date_iso` + `time_iso` | `birthLocalDateTime{year,month,day,hour,minute}` |
| `birth_utc` | `birthUtcDateTime` |
| `latitude` / `longitude` | `geoLatitude` / `geoLongitude` |
| `timezone` | `timezoneIana` |
| `tz_offset_minutes` | `timezoneOffsetMinutesAtBirth` |
| `gender` (male/female) | `gender` (unsupported values rejected) |
| `location_label` | `normalizedLocationName` |
| query.`query_type` | `queryType` (natal→natalAnalysis, instant→instantDecision, forecast→annualForecast) |
