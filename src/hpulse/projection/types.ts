/**
 * HPU-8 — UI Projection types.
 *
 * Display-ready view model derived from a PipelineReport (HPU-7).
 * Pure data, no React, no i18n — UI components map these to JSX.
 * Deterministic: same PipelineReport ⇒ same ProjectionView.
 */
import type { FateVector, FateDimension } from "@/types/prediction";
import type { EngineId, LifeStage } from "@/hpulse/weights/types";

export const PROJECTION_VERSION = "projection-1.0.0";

export type EngineDisplayStatus = "ok" | "degraded" | "skipped";

export interface HeaderProjection {
  /** Short signature like "HPU·a1b2c3d4". */
  quantumSignature: string;
  /** Lifetime overall score 0..100. */
  overallScore: number;
  /** 0..1 descriptive audit reliability, not predictive probability. */
  overallReliability: number;
  /** Coverage = active engines / considered. */
  coverage: number;
  enginesActive: number;
  enginesConsidered: number;
  enginesDegraded: number;
  /** Dominant life stage. */
  dominantStage: LifeStage;
  /** Single-sentence summary, deterministic. */
  summary: string;
}

export interface FateDimensionProjection {
  dimension: FateDimension;
  /** 0..100 lifetime score. */
  score: number;
  /** Rank 1..10 (1 = highest score). */
  rank: number;
  /** "top" | "bottom" | "mid" — bucket for UI styling. */
  bucket: "top" | "bottom" | "mid";
}

export interface EngineCardProjection {
  engineId: EngineId;
  engineName: string;
  status: EngineDisplayStatus;
  /** Avg weight across all stages, 0..1. */
  averageWeight: number;
  /** Sum of contributions across all stage·domains. */
  totalContribution: number;
  /** Number of observations contributed. */
  observationCount: number;
  /** Reason if degraded. */
  degradedReason?: string;
}

export interface StageRowProjection {
  stage: LifeStage;
  startAge: number;
  endAge: number;
  pivotAge: number;
  /** Stage-fused FateVector. */
  fateVector: FateVector;
  /** Stage aggregate (mean of FateVector). */
  stageScore: number;
  /** 0..1 descriptive audit reliability. */
  reliability: number;
  /** 0..1. */
  coverage: number;
  /** 0..1 cross-engine agreement. */
  agreement: number;
  /** Top 3 dimensions for this stage. */
  topDimensions: Array<{ dimension: FateDimension; score: number }>;
  /** Dominant engine across stage's domains. */
  dominantEngine: EngineId | null;
  /** L2 magnitude of transition to next stage, 0 if elder. */
  transitionMagnitude: number;
  /** Active engine count at this stage. */
  activeEngines: number;
}

export interface EvidenceProjection {
  ruleCoverage: number;
  engineAgreement: number;
  sourceQuality: number;
  observationCount: number;
  contributingEngines: EngineId[];
  notes: string[];
}

export interface ProjectionView {
  version: string;
  ok: boolean;
  /** If ok=false, reason from pipeline. */
  reason?: string;
  header: HeaderProjection;
  fateDimensions: FateDimensionProjection[];
  engines: EngineCardProjection[];
  stages: StageRowProjection[];
  evidence: EvidenceProjection;
  /** Flattened explanation trace (pipeline + worldtree + fusion). */
  explanationTrace: string[];
  /** Warnings collected from engine results. */
  warnings: string[];
}
