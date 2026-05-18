/**
 * HPU-5 — WorldTree builder.
 *
 * Maps every engine's standardized EngineOutput into a single causal/stage
 * tree. Uses HPU-3 dynamic weights per stage; degraded engines are excluded
 * from the denominator and contribute 0.
 *
 * Determinism:
 *  - Iteration order follows `STAGE_WINDOWS` and `ALL_FATE_DIMENSIONS`.
 *  - Engine order inside a domain is sorted by contribution desc, then by
 *    `ALL_ENGINES` index (HPU-3 namespace order) for tie-breaking.
 *  - No Math.random / Date.now in output.
 */
import type {
  EngineOutput,
  FateVector,
  FateDimension,
} from "@/types/prediction";
import { ALL_FATE_DIMENSIONS } from "@/types/prediction";
import type { EngineRunResult } from "@/hpulse/engines/runner";
import { ALL_ENGINES, type EngineId, type EventType, type Granularity } from "@/hpulse/weights/types";
import { computeDynamicWeights } from "@/hpulse/weights/calculator";
import type { NormalizeOutcome } from "@/hpulse/input/types";
import {
  STAGE_WINDOWS,
  WORLD_TREE_VERSION,
  type DomainNode,
  type ObservationNode,
  type StageNode,
  type StageTransition,
  type WorldTree,
} from "./types";

export interface BuildWorldTreeOptions {
  /** Event type used to query HPU-3 weights for every stage. Default `general`. */
  event?: EventType;
  /** Granularity for HPU-3 weights. Default `year`. */
  granularity?: Granularity;
  /** Optional reasons for degraded engines (passthrough audit). */
  degradedReason?: Partial<Record<EngineId, string>>;
  /** Optional seed material from HPU-2 NormalizationOutcome.seedMaterial. */
  seedMaterial?: string | null;
}

const ZERO_VECTOR: FateVector = ALL_FATE_DIMENSIONS.reduce((acc, d) => {
  (acc as Record<FateDimension, number>)[d] = 0;
  return acc;
}, {} as FateVector);

const ENGINE_INDEX = new Map<EngineId, number>(
  ALL_ENGINES.map((id, i) => [id, i]),
);

function pickEvidence(out: EngineOutput, dim: FateDimension): string | null {
  // Prefer a stable, deterministic source: first eventCandidate, otherwise the
  // top aspectScore key that mentions the dimension, otherwise null.
  if (out.eventCandidates && out.eventCandidates.length > 0) {
    return out.eventCandidates[0];
  }
  const aspect = Object.entries(out.aspectScores ?? {})
    .filter(([k]) => k.toLowerCase().includes(dim.toLowerCase()))
    .sort((a, b) => b[1] - a[1])[0];
  return aspect ? `${aspect[0]}=${aspect[1].toFixed(2)}` : null;
}

function buildDomain(
  dim: FateDimension,
  stageId: string,
  successByEngine: Map<EngineId, EngineOutput>,
  weights: Record<EngineId, number>,
): DomainNode {
  const observations: ObservationNode[] = [];
  let weightedScore = 0;
  let coverage = 0;

  for (const id of ALL_ENGINES) {
    const w = weights[id];
    if (w <= 0) continue;
    const out = successByEngine.get(id);
    if (!out) continue;
    const score = clampScore(out.fateVector[dim]);
    const contribution = w * score;
    weightedScore += contribution;
    coverage += w;
    observations.push({
      kind: "observation",
      id: `${stageId}.${dim}.${id}`,
      engineId: id,
      engineName: out.engineName,
      score,
      weight: w,
      contribution,
      evidence: pickEvidence(out, dim),
      sourceGrade: out.sourceGrade,
    });
  }

  observations.sort((a, b) =>
    b.contribution - a.contribution ||
    (ENGINE_INDEX.get(a.engineId)! - ENGINE_INDEX.get(b.engineId)!),
  );

  const finalScore = coverage > 0 ? weightedScore / coverage : 0;
  const dominantEngine: EngineId = observations[0]?.engineId ?? ALL_ENGINES[0];

  return {
    kind: "domain",
    id: `${stageId}.${dim}`,
    dimension: dim,
    score: round2(finalScore),
    coverage: round4(coverage),
    observations,
    dominantEngine,
  };
}

function clampScore(n: number): number {
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 100) return 100;
  return n;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

function aggregateStageVector(domains: DomainNode[]): FateVector {
  const fv: FateVector = { ...ZERO_VECTOR };
  for (const d of domains) {
    (fv as Record<FateDimension, number>)[d.dimension] = d.score;
  }
  return fv;
}

function buildTransition(
  from: StageNode,
  to: StageNode,
): StageTransition {
  const delta: FateVector = { ...ZERO_VECTOR };
  let sq = 0;
  for (const dim of ALL_FATE_DIMENSIONS) {
    const d = (to.fateVector[dim] ?? 0) - (from.fateVector[dim] ?? 0);
    (delta as Record<FateDimension, number>)[dim] = round2(d);
    sq += d * d;
  }
  return {
    from: from.window.stage,
    to: to.window.stage,
    delta,
    magnitude: round2(Math.sqrt(sq)),
  };
}

/** Index successful engine outputs by their EngineId (HPU-3 namespace). */
function indexSuccesses(results: EngineRunResult[]): {
  byId: Map<EngineId, EngineOutput>;
  degradedAll: Map<EngineId, string>;
} {
  const byId = new Map<EngineId, EngineOutput>();
  const degradedAll = new Map<EngineId, string>();
  for (const r of results) {
    if (r.ok === true) {
      byId.set(r.id, r.output);
    } else {
      degradedAll.set(r.id, `${r.error.code}: ${r.error.message}`);
    }
  }
  return { byId, degradedAll };
}

/**
 * Build the WorldTree from raw engine results.
 *
 * @param results — output of `runAll(si)` from HPU-4.
 * @param outcome — HPU-2 NormalizationOutcome (used for seed material).
 */
export function buildWorldTree(
  results: EngineRunResult[],
  outcome?: NormalizeOutcome,
  opts: BuildWorldTreeOptions = {},
): WorldTree {
  const event: EventType = opts.event ?? "general";
  const granularity: Granularity = opts.granularity ?? "year";

  const { byId: successById, degradedAll } = indexSuccesses(results);

  const stages: StageNode[] = STAGE_WINDOWS.map((win) => {
    // Per-stage HPU-3 weights — degraded list = engines that failed entirely.
    const degradedEngines = [...degradedAll.keys()];
    const dyn = computeDynamicWeights({
      ageYears: win.pivotAge,
      event,
      granularity,
      degradedEngines,
      degradedReason: opts.degradedReason ?? Object.fromEntries(degradedAll),
    });

    const stageId = win.stage;
    const domains: DomainNode[] = ALL_FATE_DIMENSIONS.map((dim) =>
      buildDomain(dim, stageId, successById, dyn.weights),
    );

    const fateVector = aggregateStageVector(domains);
    const activeEngines: EngineId[] = ALL_ENGINES.filter(
      (id) => dyn.weights[id] > 0 && successById.has(id),
    );

    return {
      kind: "stage" as const,
      id: stageId,
      window: win,
      fateVector,
      weights: dyn.weights,
      activeEngines,
      degradedEngines,
      domains,
    };
  });

  // Wire forward transitions (temporal causal edges).
  for (let i = 0; i < stages.length - 1; i++) {
    stages[i].transitionToNext = buildTransition(stages[i], stages[i + 1]);
  }

  // Lifetime average vector.
  const lifetime: FateVector = { ...ZERO_VECTOR };
  for (const dim of ALL_FATE_DIMENSIONS) {
    let s = 0;
    for (const st of stages) s += st.fateVector[dim] ?? 0;
    (lifetime as Record<FateDimension, number>)[dim] = round2(s / stages.length);
  }

  return {
    kind: "root",
    meta: {
      seedMaterial: opts.seedMaterial ?? outcome?.seedMaterial ?? null,
      matrixVersion: "wmat-1.1.0",
      enginesConsidered: results.length,
      enginesSucceeded: successById.size,
      defaultEvent: event,
      defaultGranularity: granularity,
      worldTreeVersion: WORLD_TREE_VERSION,
    },
    lifetimeFateVector: lifetime,
    stages,
    permanentlyDegraded: Object.fromEntries(degradedAll),
  };
}

/**
 * Compact projection helper — strips observations for a top-level overview.
 * Useful for UI summaries; preserves stage→domain shape.
 */
export function summarizeTree(tree: WorldTree) {
  return {
    lifetimeFateVector: tree.lifetimeFateVector,
    enginesSucceeded: tree.meta.enginesSucceeded,
    stages: tree.stages.map((s) => ({
      stage: s.window.stage,
      ageRange: [s.window.startAge, s.window.endAge] as const,
      activeEngines: s.activeEngines,
      fateVector: s.fateVector,
      transitionMagnitude: s.transitionToNext?.magnitude ?? 0,
      topDomain: [...s.domains].sort((a, b) => b.score - a.score)[0]?.dimension,
    })),
  };
}
