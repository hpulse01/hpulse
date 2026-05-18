/**
 * HPU-6 — Death Fusion types.
 *
 * Final terminal synthesis: consume a WorldTree (HPU-5) plus the raw engine
 * results (HPU-4) and emit a single unified destiny verdict including a
 * Death Window, lifespan estimate, lifetime FateVector, stage-level
 * confidence curve, and a deterministic causal chain.
 *
 * Pure data, deterministic — no Math.random, no Date.now in output.
 */
import type { FateVector } from "@/types/prediction";
import type { EngineId, LifeStage } from "@/hpulse/weights/types";

export const DEATH_FUSION_VERSION = "dfusion-1.0.0";

/** Strength of multi-engine death consensus. */
export type DeathStrength = "strong" | "weak" | "illness_only" | "default";

export type DeathCause =
  | "natural_aging"
  | "illness"
  | "accident"
  | "unknown";

export interface DeathSignal {
  engineId: EngineId;
  /** 0..100 normalized risk score derived from EngineOutput. */
  risk: number;
  /** Hint at which life stage death is most likely. */
  peakStage: LifeStage;
  /** Estimated age band derived from the engine. */
  ageBand: [number, number];
  cause: DeathCause;
  evidence: string | null;
}

export interface DeathWindow {
  startAge: number;
  endAge: number;
  peakAge: number;
  strength: DeathStrength;
  fusedProbability: number;
  cause: DeathCause;
  /** Engines that contributed non-zero signal. */
  contributingEngines: EngineId[];
  /** Causal chain — deterministic, sorted by engine order. */
  causalChain: string[];
}

export interface StageConfidence {
  stage: LifeStage;
  /** Average engine confidence weighted by HPU-3 weights, 0..1. */
  confidence: number;
  /** Coverage = Σ weights of non-degraded engines at this stage. */
  coverage: number;
  /** L2 transition magnitude to the next stage (0 for elder). */
  transitionMagnitude: number;
}

export interface DestinyVerdict {
  /** Final fused 10-dim lifetime FateVector, 0..100. */
  lifetimeFateVector: FateVector;
  /** Headline score 0..100 — weighted aggregate across dimensions. */
  overallScore: number;
  /** Global confidence 0..1 — coverage × per-stage confidence. */
  overallConfidence: number;
  /** Dominant life stage (highest aggregate score). */
  dominantStage: LifeStage;
  /** Most volatile transition (largest L2 magnitude). */
  pivotalTransition: { from: LifeStage; to: LifeStage; magnitude: number } | null;
  /** Top 3 dimensions by final score, deterministic tie-break by FateVector key order. */
  topDimensions: Array<{ dimension: keyof FateVector; score: number }>;
  /** Bottom 3 dimensions — risk areas. */
  bottomDimensions: Array<{ dimension: keyof FateVector; score: number }>;
}

export interface DeathFusionResult {
  version: string;
  /** Seed material from HPU-2 — proof of deterministic derivation. */
  seedMaterial: string | null;
  /** Per-engine death signals harvested from EngineOutputs. */
  signals: DeathSignal[];
  /** Final death window after consensus fusion. */
  deathWindow: DeathWindow;
  /** Final destiny verdict (lifetime synthesis). */
  verdict: DestinyVerdict;
  /** Stage-level confidence curve. */
  stageConfidence: StageConfidence[];
  /** Engines that were degraded in the source WorldTree. */
  degradedEngines: EngineId[];
  /** Human-readable explanation trace. */
  explanationTrace: string[];
}
