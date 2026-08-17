/**
 * HPU-6 — Final fusion entrypoint.
 *
 *   WorldTree (HPU-5) + EngineRunResult[] (HPU-4)
 *     ──► fuseDestiny() ──► DestinyFusionResult
 *
 * Deterministic: identical inputs always produce identical output (no
 * Math.random / Date.now / iteration over non-deterministic structures).
 */
import {
  ALL_FATE_DIMENSIONS,
  type FateDimension,
  type FateVector,
} from "@/types/prediction";
import type { EngineRunResult } from "@/hpulse/engines/runner";
import {
  ALL_ENGINES,
  type EngineId,
  type LifeStage,
} from "@/hpulse/weights/types";
import type { StageNode, WorldTree } from "@/hpulse/worldtree/types";
import { summarizeEvidenceQuality } from './evidence';
import {
  FUSION_VERSION,
  type DestinyFusionResult,
  type DestinyVerdict,
  type StageEvidenceQuality,
} from "./types";

/** Dimension importance weights — sum to 1, deterministic. */
const DIM_IMPORTANCE: Record<FateDimension, number> = {
  life: 0.16,
  health: 0.16,
  wealth: 0.12,
  relation: 0.10,
  wisdom: 0.10,
  spirit: 0.06,
  socialStatus: 0.08,
  creativity: 0.08,
  luck: 0.08,
  homeStability: 0.06,
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

function stageEvidenceQuality(
  stage: StageNode,
  resultsById: Map<EngineId, EngineRunResult>,
): StageEvidenceQuality {
  let wSum = 0;
  let confSum = 0;
  for (const id of ALL_ENGINES) {
    const w = stage.weights[id] ?? 0;
    if (w <= 0) continue;
    const r = resultsById.get(id);
    if (!r || r.ok !== true) continue;
    const c = Math.max(0, Math.min(1, r.output.confidence ?? 0));
    confSum += w * c;
    wSum += w;
  }
  const coverage = round4(
    ALL_ENGINES.reduce(
      (s, id) =>
        s +
        ((stage.weights[id] ?? 0) > 0 && resultsById.get(id)?.ok === true
          ? stage.weights[id]
          : 0),
      0,
    ),
  );
  const observations = stage.domains.flatMap((domain) => domain.observations);
  const agreement = observations.length >= 2
    ? (() => {
        const mean = observations.reduce((sum, observation) => sum + observation.score, 0) / observations.length;
        const variance = observations.reduce((sum, observation) => sum + (observation.score - mean) ** 2, 0) / observations.length;
        return round4(Math.max(0, Math.min(1, 1 - Math.sqrt(variance) / 50)));
      })()
    : 0;
  const weightedConfidence = wSum > 0 ? confSum / wSum : 0;
  const reliability = round4(Math.max(0, Math.min(1, coverage * 0.4 + agreement * 0.3 + weightedConfidence * 0.3)));
  return {
    stage: stage.window.stage,
    reliability,
    coverage,
    agreement,
    transitionMagnitude: stage.transitionToNext?.magnitude ?? 0,
  };
}

function pickDominantStage(stages: StageNode[]): LifeStage {
  let best: StageNode = stages[0];
  let bestScore = -Infinity;
  for (const s of stages) {
    const score = ALL_FATE_DIMENSIONS.reduce(
      (sum, d) => sum + (s.fateVector[d] ?? 0) * DIM_IMPORTANCE[d],
      0,
    );
    if (score > bestScore) {
      bestScore = score;
      best = s;
    }
  }
  return best.window.stage;
}

function pickPivotalTransition(stages: StageNode[]) {
  let best:
    | { from: LifeStage; to: LifeStage; magnitude: number }
    | null = null;
  for (const s of stages) {
    const t = s.transitionToNext;
    if (!t) continue;
    if (!best || t.magnitude > best.magnitude) {
      best = { from: t.from, to: t.to, magnitude: t.magnitude };
    }
  }
  return best;
}

function rankDimensions(fv: FateVector) {
  const entries = ALL_FATE_DIMENSIONS.map((d) => ({
    dimension: d,
    score: round2(fv[d] ?? 0),
  }));
  // Deterministic tie-break: ALL_FATE_DIMENSIONS index.
  const idx = new Map(ALL_FATE_DIMENSIONS.map((d, i) => [d, i]));
  entries.sort(
    (a, b) =>
      b.score - a.score || idx.get(a.dimension)! - idx.get(b.dimension)!,
  );
  const top = entries.slice(0, 3);
  const bottom = [...entries]
    .sort(
      (a, b) =>
        a.score - b.score || idx.get(a.dimension)! - idx.get(b.dimension)!,
    )
    .slice(0, 3);
  return { top, bottom };
}

function buildVerdict(
  tree: WorldTree,
  stageEvidence: StageEvidenceQuality[],
): DestinyVerdict {
  const fv = tree.lifetimeFateVector;
  const overallScore = round2(
    ALL_FATE_DIMENSIONS.reduce(
      (s, d) => s + (fv[d] ?? 0) * DIM_IMPORTANCE[d],
      0,
    ),
  );
  // Reliability = coverage-weighted mean of descriptive stage reliability.
  let confNum = 0;
  let confDen = 0;
  for (const sc of stageEvidence) {
    confNum += sc.coverage * sc.reliability;
    confDen += sc.coverage;
  }
  const overallReliability = confDen > 0 ? round4(confNum / confDen) : 0;
  const { top, bottom } = rankDimensions(fv);
  return {
    lifetimeFateVector: fv,
    overallScore,
    overallReliability,
    dominantStage: pickDominantStage(tree.stages),
    pivotalTransition: pickPivotalTransition(tree.stages),
    topDimensions: top,
    bottomDimensions: bottom,
  };
}

export interface FuseDestinyOptions {
  /** Reserved for versioned fusion policies. */
  policyVersion?: string;
}

/**
 * Final fusion: WorldTree + raw engine results ⇒ evidence-aware result.
 */
export function fuseDestiny(
  tree: WorldTree,
  results: EngineRunResult[],
  opts: FuseDestinyOptions = {},
): DestinyFusionResult {
  const resultsById = new Map<EngineId, EngineRunResult>();
  for (const r of results) resultsById.set(r.id, r);

  const stageEvidence = tree.stages.map((s) => stageEvidenceQuality(s, resultsById));
  const verdict = buildVerdict(tree, stageEvidence);
  const evidenceQuality = summarizeEvidenceQuality(tree, results);

  const degradedEngines = Object.keys(tree.permanentlyDegraded) as EngineId[];

  const trace: string[] = [
    `[HPU-6] version=${FUSION_VERSION}`,
    `[HPU-6] enginesConsidered=${tree.meta.enginesConsidered} succeeded=${tree.meta.enginesSucceeded}`,
    `[HPU-6] evidence coverage=${evidenceQuality.ruleCoverage} agreement=${evidenceQuality.engineAgreement} sourceQuality=${evidenceQuality.sourceQuality} observations=${evidenceQuality.observationCount}`,
    `[HPU-6] dominantStage=${verdict.dominantStage} overallScore=${verdict.overallScore} reliability=${verdict.overallReliability}`,
    ...(verdict.pivotalTransition
      ? [
          `[HPU-6] pivotalTransition=${verdict.pivotalTransition.from}→${verdict.pivotalTransition.to} magnitude=${verdict.pivotalTransition.magnitude}`,
        ]
      : []),
    `[HPU-6] degradedEngines=${degradedEngines.length > 0 ? degradedEngines.join(",") : "(none)"}`,
  ];

  return {
    version: FUSION_VERSION,
    seedMaterial: tree.meta.seedMaterial,
    evidenceQuality,
    verdict,
    stageEvidence,
    degradedEngines,
    explanationTrace: trace,
  };
}
