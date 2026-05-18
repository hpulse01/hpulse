/**
 * HPU-8 — UI Projection layer.
 *
 *   PipelineReport (HPU-7)  ──►  ProjectionView
 *
 * Pure transformation, deterministic. No React, no i18n.
 */
import { ALL_FATE_DIMENSIONS, type FateVector, type FateDimension } from "@/types/prediction";
import { ALL_ENGINES, type EngineId } from "@/hpulse/weights/types";
import type { PipelineReport } from "@/hpulse/orchestrator/pipeline";
import type { WorldTree } from "@/hpulse/worldtree/types";
import type { DeathFusionResult } from "@/hpulse/fusion/types";
import type { EngineRunResult } from "@/hpulse/engines/runner";
import { listEngines } from "@/hpulse/engines/registry";
import {
  PROJECTION_VERSION,
  type ProjectionView,
  type HeaderProjection,
  type FateDimensionProjection,
  type EngineCardProjection,
  type StageRowProjection,
  type DeathProjection,
} from "./types";

const ENGINE_LABEL: Record<EngineId, string> = (() => {
  const out = {} as Record<EngineId, string>;
  for (const m of listEngines()) out[m.id] = m.labelCN;
  return out;
})();

function meanFateVector(v: FateVector): number {
  let sum = 0;
  for (const d of ALL_FATE_DIMENSIONS) sum += v[d];
  return Math.round((sum / ALL_FATE_DIMENSIONS.length) * 100) / 100;
}

function shortSignature(seedMaterial: string | null): string {
  if (!seedMaterial) return "HPU·unknown";
  // FNV-1a 32-bit — deterministic, no crypto dependency.
  let h = 0x811c9dc5;
  for (let i = 0; i < seedMaterial.length; i++) {
    h ^= seedMaterial.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return `HPU·${h.toString(16).padStart(8, "0")}`;
}

function buildHeader(
  tree: WorldTree,
  fusion: DeathFusionResult,
): HeaderProjection {
  const enginesConsidered = tree.meta.enginesConsidered;
  const enginesDegraded = Object.keys(tree.permanentlyDegraded).length;
  const enginesActive = enginesConsidered - enginesDegraded;
  const coverage =
    enginesConsidered > 0 ? enginesActive / enginesConsidered : 0;
  const death = fusion.deathWindow;
  const summary =
    `生命主轨：${fusion.verdict.dominantStage} 主导，` +
    `综合评分 ${Math.round(fusion.verdict.overallScore)}，` +
    `置信度 ${Math.round(fusion.verdict.overallConfidence * 100)}%，` +
    `寿限窗口 ${death.startAge}–${death.endAge}（峰值 ${death.peakAge}）。`;
  return {
    quantumSignature: shortSignature(fusion.seedMaterial),
    overallScore: fusion.verdict.overallScore,
    overallConfidence: fusion.verdict.overallConfidence,
    coverage: Math.round(coverage * 1000) / 1000,
    enginesActive,
    enginesConsidered,
    enginesDegraded,
    deathAge: death.peakAge ?? null,
    dominantStage: fusion.verdict.dominantStage,
    summary,
  };
}

function buildFateDimensions(
  fv: FateVector,
): FateDimensionProjection[] {
  const dimIdx = new Map(ALL_FATE_DIMENSIONS.map((d, i) => [d, i]));
  const ranked = ALL_FATE_DIMENSIONS.map((d) => ({
    dimension: d as FateDimension,
    score: Math.round(fv[d] * 100) / 100,
  })).sort((a, b) =>
    b.score !== a.score
      ? b.score - a.score
      : (dimIdx.get(a.dimension) ?? 0) - (dimIdx.get(b.dimension) ?? 0),
  );
  return ranked.map((entry, i) => ({
    ...entry,
    rank: i + 1,
    bucket: i < 3 ? "top" : i >= ranked.length - 3 ? "bottom" : "mid",
  }));
}

function buildEngines(
  tree: WorldTree,
  results: EngineRunResult[],
): EngineCardProjection[] {
  const resultById = new Map(results.map((r) => [r.id, r]));
  const out: EngineCardProjection[] = [];
  for (const id of ALL_ENGINES) {
    const degradedReason = tree.permanentlyDegraded[id];
    const r = resultById.get(id);
    let status: EngineCardProjection["status"] = "skipped";
    if (r) status = r.ok ? "ok" : "degraded";
    if (degradedReason) status = "degraded";

    // Average weight across stages.
    let weightSum = 0;
    let totalContribution = 0;
    let observationCount = 0;
    for (const s of tree.stages) {
      weightSum += s.weights[id] ?? 0;
      for (const dom of s.domains) {
        for (const obs of dom.observations) {
          if (obs.engineId !== id) continue;
          totalContribution += obs.contribution;
          observationCount += 1;
        }
      }
    }
    const averageWeight =
      tree.stages.length > 0
        ? Math.round((weightSum / tree.stages.length) * 10000) / 10000
        : 0;
    out.push({
      engineId: id,
      engineName: ENGINE_LABEL[id],
      status,
      averageWeight,
      totalContribution: Math.round(totalContribution * 100) / 100,
      observationCount,
      degradedReason:
        degradedReason ??
        (r && r.ok === false
          ? `${r.error.code}: ${r.error.message}`
          : undefined),
    });
  }
  return out;
}

function topDims(fv: FateVector, n: number) {
  const idx = new Map(ALL_FATE_DIMENSIONS.map((d, i) => [d, i]));
  return ALL_FATE_DIMENSIONS.map((d) => ({
    dimension: d as FateDimension,
    score: Math.round(fv[d] * 100) / 100,
  }))
    .sort((a, b) =>
      b.score !== a.score
        ? b.score - a.score
        : (idx.get(a.dimension) ?? 0) - (idx.get(b.dimension) ?? 0),
    )
    .slice(0, n);
}

function buildStages(
  tree: WorldTree,
  fusion: DeathFusionResult,
): StageRowProjection[] {
  const confById = new Map(fusion.stageConfidence.map((s) => [s.stage, s]));
  return tree.stages.map((s) => {
    const conf = confById.get(s.window.stage);
    const dominantEngine =
      s.domains.length > 0
        ? (s.domains
            .slice()
            .sort((a, b) => {
              const ai = ALL_ENGINES.indexOf(a.dominantEngine);
              const bi = ALL_ENGINES.indexOf(b.dominantEngine);
              return ai - bi;
            })[0]?.dominantEngine ?? null)
        : null;
    return {
      stage: s.window.stage,
      startAge: s.window.startAge,
      endAge: s.window.endAge,
      pivotAge: s.window.pivotAge,
      fateVector: s.fateVector,
      stageScore: meanFateVector(s.fateVector),
      confidence: conf?.confidence ?? 0,
      coverage: conf?.coverage ?? 0,
      topDimensions: topDims(s.fateVector, 3),
      dominantEngine,
      transitionMagnitude: s.transitionToNext?.magnitude ?? 0,
      activeEngines: s.activeEngines.length,
    };
  });
}

function buildDeath(fusion: DeathFusionResult): DeathProjection {
  const dw = fusion.deathWindow;
  return {
    startAge: dw.startAge,
    endAge: dw.endAge,
    peakAge: dw.peakAge,
    strength: dw.strength,
    cause: dw.cause,
    fusedProbability: dw.fusedProbability,
    contributingEngines: [...dw.contributingEngines],
    causalChain: [...dw.causalChain],
  };
}

function collectWarnings(results: EngineRunResult[]): string[] {
  const out: string[] = [];
  for (const r of results) {
    if (r.ok === true) {
      for (const w of r.output.warnings ?? []) {
        out.push(`[${r.id}] ${w}`);
      }
    } else {
      out.push(`[${r.id}] ${r.error.code}: ${r.error.message}`);
    }
  }
  return out;
}

/** Public entry: PipelineReport → ProjectionView. Pure & deterministic. */
export function projectReport(report: PipelineReport): ProjectionView {
  if (report.ok === false) {
    const reason = report.reason;
    // Minimal degraded view.
    const empty: FateVector = ALL_FATE_DIMENSIONS.reduce((acc, d) => {
      acc[d] = 0;
      return acc;
    }, {} as FateVector);
    return {
      version: PROJECTION_VERSION,
      ok: false,
      reason,
      header: {
        quantumSignature: "HPU·invalid",
        overallScore: 0,
        overallConfidence: 0,
        coverage: 0,
        enginesActive: 0,
        enginesConsidered: 0,
        enginesDegraded: 0,
        deathAge: null,
        dominantStage: "prime",
        summary: `输入未通过校验：${reason}`,
      },
      fateDimensions: buildFateDimensions(empty),
      engines: ALL_ENGINES.map((id) => ({
        engineId: id,
        engineName: ENGINE_LABEL[id],
        status: "skipped",
        averageWeight: 0,
        totalContribution: 0,
        observationCount: 0,
      })),
      stages: [],
      death: {
        startAge: 0,
        endAge: 0,
        peakAge: 0,
        strength: "default",
        cause: "unknown",
        fusedProbability: 0,
        contributingEngines: [],
        causalChain: [],
      },
      explanationTrace: [],
      warnings: report.normalize.issues.map(
        (i) => `[input] ${i.field}: ${i.code}`,
      ),
    };
  }

  const { worldTree, fusion, engineResults } = report;
  return {
    version: PROJECTION_VERSION,
    ok: true,
    header: buildHeader(worldTree, fusion),
    fateDimensions: buildFateDimensions(fusion.verdict.lifetimeFateVector),
    engines: buildEngines(worldTree, engineResults),
    stages: buildStages(worldTree, fusion),
    death: buildDeath(fusion),
    explanationTrace: [...fusion.explanationTrace],
    warnings: collectWarnings(engineResults),
  };
}
