/**
 * HPU-7 — End-to-end pipeline orchestrator.
 *
 *   normalizeInput (HPU-2)
 *     → toLegacyInput (HPU-7 adapter)
 *       → runAll (HPU-4)
 *         → buildWorldTree (HPU-5)
 *           → fuseDestiny (HPU-6)
 *             ⇒ PipelineReport
 *
 * Pure, deterministic, no Math.random / Date.now in output.
 */
import { normalizeInput } from "@/hpulse/input/normalize";
import type { NormalizeOutcome } from "@/hpulse/input/types";
import { runAll } from "@/hpulse/engines/registry";
import type { EngineRunResult } from "@/hpulse/engines/runner";
import { buildWorldTree, type WorldTree } from "@/hpulse/worldtree";
import { fuseDestiny, type DeathFusionResult } from "@/hpulse/fusion";
import type { EventType, Granularity } from "@/hpulse/weights/types";
import type { FamilyFacts } from "@/core/tieban/types";
import { toLegacyInput } from "./adapter";

export const PIPELINE_VERSION = "pipeline-1.0.0";

export interface PipelineOptions {
  event?: EventType;
  granularity?: Granularity;
  familyFacts?: FamilyFacts;
}

export type PipelineReport =
  | {
      ok: true;
      version: string;
      normalize: NormalizeOutcome;
      engineResults: EngineRunResult[];
      worldTree: WorldTree;
      fusion: DeathFusionResult;
    }
  | {
      ok: false;
      version: string;
      normalize: NormalizeOutcome;
      reason: string;
    };

/** End-to-end orchestrator. Never throws. */
export async function runPipeline(
  rawInput: unknown,
  opts: PipelineOptions = {},
): Promise<PipelineReport> {
  const normalize = await normalizeInput(rawInput);
  if (!normalize.ok || !normalize.input) {
    return {
      ok: false,
      version: PIPELINE_VERSION,
      normalize,
      reason: `input_validation_failed: ${normalize.issues
        .map((i) => `${i.field}:${i.code}`)
        .join("; ")}`,
    };
  }

  const legacy = toLegacyInput(normalize.input);
  const engineResults = runAll(legacy, {
    familyFacts: opts.familyFacts as Record<string, unknown> | undefined,
  });

  const worldTree = buildWorldTree(engineResults, normalize, {
    event: opts.event,
    granularity: opts.granularity,
  });

  const fusion = fuseDestiny(worldTree, engineResults);

  return {
    ok: true,
    version: PIPELINE_VERSION,
    normalize,
    engineResults,
    worldTree,
    fusion,
  };
}
