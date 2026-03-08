/**
 * H-Pulse Destiny Tree Type System
 *
 * Core types for the recursive destiny tree architecture:
 * DestinyEventSeed → UnifiedEventCandidate → WorldNode → RecursiveWorldTree → CollapseResult
 */

import type { FateVector, FateDimension, EngineName, TimingBasis } from './prediction';

// ═══════════════════════════════════════════════
// 1. Destiny Event Seed — output from each engine
// ═══════════════════════════════════════════════

export type EventCategory =
  | 'career' | 'wealth' | 'relationship' | 'health'
  | 'migration' | 'spiritual' | 'education' | 'accident'
  | 'legal' | 'family' | 'death' | 'turning_point';

export type EventIntensity = 'minor' | 'moderate' | 'major' | 'critical' | 'life_defining';

export interface DestinyEventSeed {
  id: string;
  engineName: string;
  engineVersion: string;
  timingBasis: TimingBasis;
  category: EventCategory;
  subcategory: string;
  description: string;
  /** Age range when this event is likely */
  earliestAge: number;
  latestAge: number;
  /** Calendar year range (computed from birth year) */
  earliestYear?: number;
  latestYear?: number;
  /** 0-1 probability from this engine */
  probability: number;
  intensity: EventIntensity;
  /** What caused this prediction */
  causalFactors: string[];
  /** Conditions that must be met for this event to trigger */
  triggerConditions: string[];
  /** Is this event death-related? */
  deathRelated: boolean;
  /** Key for merging similar events across engines */
  mergeKey: string;
  /** Impact on each fate dimension (-50 to +50 delta) */
  fateImpact: Partial<Record<FateDimension, number>>;
  /** Raw source data for traceability */
  sourceDetail: string;
}

// ═══════════════════════════════════════════════
// 2. Unified Event Candidate — after cross-engine fusion
// ═══════════════════════════════════════════════

export interface UnifiedEventCandidate {
  id: string;
  mergeKey: string;
  category: EventCategory;
  subcategory: string;
  description: string;
  /** Narrowed age window after fusion */
  peakAge: number;
  ageWindow: [number, number];
  /** Fused probability (multi-engine weighted) */
  fusedProbability: number;
  intensity: EventIntensity;
  /** Which engines contributed */
  engineSupports: Array<{ engineName: string; seedId: string; probability: number; causalFactors: string[] }>;
  /** Number of engines that agree */
  consensusCount: number;
  /** Is this a mainline event or sidequest */
  isMainline: boolean;
  deathRelated: boolean;
  /** Cumulative fate impact */
  fateImpact: Partial<Record<FateDimension, number>>;
  /** Events this depends on (must happen first) */
  prerequisiteEventIds: string[];
  /** Events that conflict with this one */
  conflictingEventIds: string[];
}

// ═══════════════════════════════════════════════
// 3. World Node — single node in the destiny tree
// ═══════════════════════════════════════════════

export type DeathCause =
  | 'natural_aging' | 'illness' | 'accident'
  | 'violence' | 'sudden' | 'lifespan_limit';

export interface WorldNode {
  id: string;
  parentId: string | null;
  depth: number;
  age: number;
  year: number;
  alive: boolean;
  isDeath: boolean;
  deathCause?: DeathCause;
  /** The dominant event at this node */
  dominantEvent: UnifiedEventCandidate;
  /** Contributing side events */
  contributingEvents: UnifiedEventCandidate[];
  /** Engine support summary */
  engineSupports: string[];
  /** Probability of reaching this node from parent */
  transitionProbability: number;
  /** Cumulative probability from root */
  cumulativeProbability: number;
  /** Causal chain leading here */
  causalChain: string[];
  /** Local fate vector at this node */
  localFateVector: FateVector;
  /** Collapse weight for path selection */
  collapseWeight: number;
  /** Why this branch exists */
  branchReason: string;
  /** Children nodes */
  children: WorldNode[];
}

// ═══════════════════════════════════════════════
// 4. Recursive World Tree
// ═══════════════════════════════════════════════

export interface RecursiveWorldTree {
  root: WorldNode;
  totalNodes: number;
  totalPaths: number;
  maxDepth: number;
  /** All leaf (death/terminal) nodes */
  terminalNodes: WorldNode[];
  /** Generation metadata */
  generatedAt: string;
  birthYear: number;
  gender: string;
}

// ═══════════════════════════════════════════════
// 5. Collapse Result
// ═══════════════════════════════════════════════

export interface CollapsedPathNode {
  age: number;
  year: number;
  event: UnifiedEventCandidate;
  fateVector: FateVector;
  cumulativeProbability: number;
  engineSupports: string[];
  isDeath: boolean;
  deathCause?: DeathCause;
}

export interface RejectedBranchSummary {
  branchAge: number;
  branchEvent: string;
  reason: string;
  probability: number;
}

export interface CollapseResult {
  /** The unique collapsed fate path */
  collapsedPath: CollapsedPathNode[];
  /** Death node details */
  deathAge: number;
  deathCause: DeathCause;
  deathDescription: string;
  /** Major rejected branches */
  rejectedBranches: RejectedBranchSummary[];
  /** Collapse reasoning */
  collapseReasoning: string;
  /** 0-1 confidence */
  collapseConfidence: number;
  /** Final life summary */
  finalLifeSummary: string;
  /** How many total paths were considered */
  totalPathsConsidered: number;
}

// ═══════════════════════════════════════════════
// 6. Engine Event Extractor interface
// ═══════════════════════════════════════════════

export interface EngineEventExtraction {
  engineName: string;
  eventSeeds: DestinyEventSeed[];
  deathSignals: DestinyEventSeed[];
  confidence: number;
}

// ═══════════════════════════════════════════════
// 7. Event Fusion Result
// ═══════════════════════════════════════════════

export interface EventFusionResult {
  candidates: UnifiedEventCandidate[];
  mainlineEvents: UnifiedEventCandidate[];
  sidelineEvents: UnifiedEventCandidate[];
  deathEvents: UnifiedEventCandidate[];
  mergeLog: Array<{ mergeKey: string; mergedCount: number; engines: string[] }>;
  conflictLog: Array<{ eventA: string; eventB: string; resolution: string }>;
}
