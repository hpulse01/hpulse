# HPU-9 — React Hook (`useHPulsePipeline`)

Thin presentation-layer bridge between the deterministic HPulse pipeline
(HPU-2..7) + projection layer (HPU-8) and React components.

## API

```ts
const { status, error, report, view, run, reset } = useHPulsePipeline();
await run(rawInput, { event: "career" });
```

- `status`: `"idle" | "running" | "ready" | "error"`
- `report`: `PipelineReport | null` — full deterministic report
- `view`: `ProjectionView | null` — UI-ready projection (HPU-8)
- `run(rawInput, opts)`: runs pipeline; stale results from previous runs are dropped
- `reset()`: clears state and invalidates in-flight runs

## Determinism

The hook adds **no** randomness. Same `rawInput + opts` ⇒ same `report` ⇒
same `view`. Stale-run protection uses a local monotonic id (not exposed in
output), so output remains deterministic across re-renders.

## Wiring

Components consume `view: ProjectionView` directly — no need to traverse
`report.worldTree` or `report.fusion`. See `docs/hpulse/08-projection.md`
for the projection schema.
