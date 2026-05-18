/**
 * HPU-5 — WorldTree types.
 *
 * Unified causal/stage tree that fuses every engine's standardized
 * observation into one shape:
 *
 *   Root (subject)
 *    └─ Stage[0..4]               (childhood→elder, temporal causal layer)
 *         ├─ Domain[0..9]         (10 fate dimensions)
 *         │    └─ Observation[*]  (engine-leaf evidence)
 *         └─ transitionToNext     (delta vs next stage)
 *
 * Pure data, deterministic — no Math.random, no Date.now in the output.
 */
import type { FateVector, FateDimension } from "@/types/prediction";
import type { EngineId, LifeStage } from "@/hpulse/weights/types";

export type NodeKind = "root" | "stage" | "domain" | "observation";

/** Stage age window (inclusive start, inclusive end). */
export interface StageWindow {
  stage: LifeStage;
  startAge: number;
  endAge: number;
  /** Deterministic representative age used to query HPU-3 weights. */
  pivotAge: number;
}

export interface ObservationNode {
  kind: "observation";
  id: string;                     // `${stage}.${domain}.${engine}.${idx}`
  engineId: EngineId;
  engineName: string;             // engine.engineName (display)
  /** Single-dimension score 0..100, taken from engine.fateVector[dim]. */
  score: number;
  /** Engine's weight at this stage (already normalized, 0 if degraded). */
  weight: number;
  /** Contribution = weight * score (pre-aggregation term). */
  contribution: number;
  /** Short evidence string sourced from eventCandidates / aspectScores. */
  evidence: string | null;
  sourceGrade: "A" | "B" | "C" | "D";
}

export interface DomainNode {
  kind: "domain";
  id: string;                     // `${stage}.${domain}`
  dimension: FateDimension;
  /** Weighted average score 0..100. */
  score: number;
  /** Sum of weights of contributing (non-degraded) engines, ∈ (0,1]. */
  coverage: number;
  /** Engine-level breakdown, sorted desc by contribution. */
  observations: ObservationNode[];
  /** Top engine id (deterministic, tie-broken by ALL_ENGINES order). */
  dominantEngine: EngineId;
}

export interface StageTransition {
  from: LifeStage;
  to: LifeStage;
  /** Per-dimension delta = next.score - current.score. */
  delta: FateVector;
  /** L2 magnitude of delta — bigger = bigger life turning point. */
  magnitude: number;
}

export interface StageNode {
  kind: "stage";
  id: string;                     // `${stage}`
  window: StageWindow;
  /** Stage-fused FateVector (10 dims, 0..100). */
  fateVector: FateVector;
  /** Normalized HPU-3 weights used at this stage. */
  weights: Record<EngineId, number>;
  /** Engines successful at this stage. */
  activeEngines: EngineId[];
  /** Engines degraded (failed / missing). */
  degradedEngines: EngineId[];
  domains: DomainNode[];
  /** Forward edge to the next stage, undefined for `elder`. */
  transitionToNext?: StageTransition;
}

export interface WorldTreeMeta {
  /** Seed material from HPU-2 — proves identical input ⇒ identical tree. */
  seedMaterial: string | null;
  matrixVersion: string;
  /** Sum of all engines run (regardless of success). */
  enginesConsidered: number;
  /** Engines that returned ok at least once. */
  enginesSucceeded: number;
  /** Default event/granularity used to query HPU-3 per stage. */
  defaultEvent: string;
  defaultGranularity: string;
  /** Build version of the WorldTree spec. */
  worldTreeVersion: string;
}

export interface WorldTree {
  kind: "root";
  meta: WorldTreeMeta;
  /** Lifetime FateVector = average of stage vectors. */
  lifetimeFateVector: FateVector;
  /** Stage nodes, deterministic order: childhood→elder. */
  stages: StageNode[];
  /** Engines that failed in *every* stage, with first reason. */
  permanentlyDegraded: Partial<Record<EngineId, string>>;
}

export const WORLD_TREE_VERSION = "wtree-1.0.0";

/** Fixed, deterministic life-stage windows used by the tree builder. */
export const STAGE_WINDOWS: readonly StageWindow[] = [
  { stage: "childhood", startAge:  0, endAge: 12, pivotAge:  8 },
  { stage: "youth",     startAge: 13, endAge: 29, pivotAge: 22 },
  { stage: "prime",     startAge: 30, endAge: 44, pivotAge: 37 },
  { stage: "middle",    startAge: 45, endAge: 59, pivotAge: 52 },
  { stage: "elder",     startAge: 60, endAge: 99, pivotAge: 70 },
] as const;
