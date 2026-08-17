/**
 * HPU-9 — React hook bridging the HPulse pipeline + projection to UI.
 *
 * Usage:
 *   const { state, run, view, report } = useHPulsePipeline();
 *   await run(rawInput, { event: "career" });
 *
 * Pure presentation glue — no business logic. All determinism guarantees
 * come from the underlying pipeline (HPU-2..7) and projection (HPU-8).
 */
import { useCallback, useMemo, useRef, useState } from "react";
import type { PipelineOptions, PipelineReport } from "@/hpulse/orchestrator";
import type { ProjectionView } from "@/hpulse/projection";

export type HPulseStatus = "idle" | "running" | "ready" | "error";

export interface HPulseHookState {
  status: HPulseStatus;
  error: string | null;
  report: PipelineReport | null;
  view: ProjectionView | null;
}

const INITIAL: HPulseHookState = {
  status: "idle",
  error: null,
  report: null,
  view: null,
};

export function useHPulsePipeline() {
  const [state, setState] = useState<HPulseHookState>(INITIAL);
  // Monotonic run id to drop stale async results.
  const runIdRef = useRef(0);

  const run = useCallback(async (rawInput: unknown, opts: PipelineOptions = {}) => {
    const myId = ++runIdRef.current;
    setState((s) => ({ ...s, status: "running", error: null }));
    try {
      const [{ runPipeline }, { projectReport }] = await Promise.all([
        import("@/hpulse/orchestrator"),
        import("@/hpulse/projection"),
      ]);
      const report = await runPipeline(rawInput, opts);
      if (myId !== runIdRef.current) return null;
      if (!report.ok) {
        const failed = report as Extract<PipelineReport, { ok: false }>;
        setState({ status: "error", error: failed.reason, report, view: null });
        return report;
      }
      const view = projectReport(report);
      setState({ status: "ready", error: null, report, view });
      return report;
    } catch (e) {
      if (myId !== runIdRef.current) return null;
      const msg = e instanceof Error ? e.message : String(e);
      setState({ status: "error", error: msg, report: null, view: null });
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    runIdRef.current++;
    setState(INITIAL);
  }, []);

  return useMemo(
    () => ({
      ...state,
      run,
      reset,
    }),
    [state, run, reset],
  );
}
