/**
 * HPU-6 — Evidence-aware deterministic fusion types.
 *
 * Final terminal synthesis: consume a WorldTree (HPU-5) plus the raw engine
 * results (HPU-4) and emit a unified cultural-analysis result including a
 * lifetime FateVector, stage-level evidence metrics, and deterministic trace.
 *
 * Pure data, deterministic — no Math.random, no Date.now in output.
 */
import type { FateVector } from "@/types/prediction";
import type { EngineId, LifeStage } from "@/hpulse/weights/types";

export const FUSION_VERSION = 'fusion-2.0.0';

export interface StageEvidenceQuality {
  stage: LifeStage;
  /** Descriptive reliability from coverage, source quality and agreement. */
  reliability: number;
  /** Coverage = Σ weights of non-degraded engines at this stage. */
  coverage: number;
  /** 1 - normalized weighted dispersion between engine scores. */
  agreement: number;
  /** L2 transition magnitude to the next stage (0 for elder). */
  transitionMagnitude: number;
}

export interface DestinyVerdict {
  /** Final fused 10-dim lifetime FateVector, 0..100. */
  lifetimeFateVector: FateVector;
  /** Headline score 0..100 — weighted aggregate across dimensions. */
  overallScore: number;
  /** Descriptive audit reliability 0..1; not a predictive probability. */
  overallReliability: number;
  /** Dominant life stage (highest aggregate score). */
  dominantStage: LifeStage;
  /** Most volatile transition (largest L2 magnitude). */
  pivotalTransition: { from: LifeStage; to: LifeStage; magnitude: number } | null;
  /** Top 3 dimensions by final score, deterministic tie-break by FateVector key order. */
  topDimensions: Array<{ dimension: keyof FateVector; score: number }>;
  /** Bottom 3 dimensions — risk areas. */
  bottomDimensions: Array<{ dimension: keyof FateVector; score: number }>;
}

export interface EvidenceQualitySummary {
  ruleCoverage: number;
  engineAgreement: number;
  sourceQuality: number;
  observationCount: number;
  contributingEngines: EngineId[];
  degradedEngines: EngineId[];
  notes: string[];
}

export interface DestinyFusionResult {
  version: string;
  /** Seed material from HPU-2 — proof of deterministic derivation. */
  seedMaterial: string | null;
  /** Measurable evidence-quality summary; never a fate probability. */
  evidenceQuality: EvidenceQualitySummary;
  /** Final destiny verdict (lifetime synthesis). */
  verdict: DestinyVerdict;
  /** Stage-level confidence curve. */
  stageEvidence: StageEvidenceQuality[];
  /** Engines that were degraded in the source WorldTree. */
  degradedEngines: EngineId[];
  /** Human-readable explanation trace. */
  explanationTrace: string[];
}
