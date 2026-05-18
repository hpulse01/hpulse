/**
 * HPU-4 — Unified EngineRunner contract.
 *
 *   StandardizedInput ──► EngineRunner.run(si) ──► EngineRunResult
 *
 * All ten registered engines (HPU-3 namespace) implement this interface.
 * Runners NEVER throw — failure is captured in `{ ok: false, error }`
 * so the orchestrator can degrade weights via HPU-3 instead of aborting.
 *
 * Determinism contract (HPU-1):
 *   - No Math.random / Date.now() inside engine OUTPUT.
 *   - `computationTimeMs` is wall-clock trace only and excluded from
 *     hashing / fusion. Use `EngineRunResult.output` for downstream fusion.
 */
import type { StandardizedInput, EngineOutput } from "@/types/prediction";
import type { EngineId } from "@/hpulse/weights/types";

export interface EngineMeta {
  /** HPU namespace id (HPU-3 EngineId). */
  id: EngineId;
  /** Human label, CN. */
  labelCN: string;
  /** Human label, EN. */
  labelEN: string;
  /** What time basis this engine uses. Matches EngineOutput.timingBasis. */
  timingBasis: "birth" | "query" | "hybrid";
  /** Optional capabilities — e.g. ["kaoke","clauseProvider"]. */
  requires?: readonly string[];
}

export type EngineRunResult =
  | {
      ok: true;
      id: EngineId;
      output: EngineOutput;
      durationMs: number;
    }
  | {
      ok: false;
      id: EngineId;
      error: { code: string; message: string };
      durationMs: number;
    };

export interface EngineRunOptions {
  /** Optional family facts for engines that perform Kao Ke (tieban). */
  familyFacts?: Record<string, unknown>;
  /** Engines explicitly excluded by the caller. */
  exclude?: EngineId[];
  /** Restrict to a subset. If provided, only these run. */
  only?: EngineId[];
}

export interface EngineRunner {
  meta: EngineMeta;
  run(si: StandardizedInput, opts?: EngineRunOptions): EngineRunResult;
}
