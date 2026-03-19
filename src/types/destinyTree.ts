/**
 * H-Pulse Destiny Tree Type System v3.0
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
  /** Path in the engine's raw output that produced this seed */
  sourceFieldPath: string;
  /** Verbatim evidence from the engine output */
  sourceEvidence: string;
  /** Why this seed was extracted (mapping reasoning) */
  reasoning: string;
  /** 0-1 confidence in this specific extraction */
  confidence: number;
  /** Tags for conflict detection with other seeds */
  conflictTags: string[];
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
  /** Events that enhance this one (boost probability) */
  enhancedByEventIds: string[];
  /** Events this transforms into under certain conditions */
  transformsToEventId: string | null;
}

// ═══════════════════════════════════════════════
// 3. Death Candidate types
// ═══════════════════════════════════════════════

export type DeathStrength = 'strong' | 'weak' | 'illness_only';

export interface DeathCandidate {
  eventId: string;
  mergeKey: string;
  strength: DeathStrength;
  estimatedAge: number;
  ageWindow: [number, number];
  fusedProbability: number;
  engines: string[];
  consensusCount: number;
  cause: DeathCause;
  causalChain: string[];
  description: string;
}

export interface DeathFusionResult {
  candidates: DeathCandidate[];
  strongCandidates: DeathCandidate[];
  weakCandidates: DeathCandidate[];
  illnessOnly: DeathCandidate[];
  primaryDeath: DeathCandidate;
  fusionReasoning: string;
}

// ═══════════════════════════════════════════════
// 4. World Node — single node in the destiny tree
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
  /** Parent causal chain (inherited + local) */
  parentCausalChain: string[];
  /** Event relationship metadata */
  eventRelationships: {
    dependenciesMet: string[];
    exclusionsApplied: string[];
    enhancementsReceived: string[];
    transformationsTriggered: string[];
  };
  /** Children nodes */
  children: WorldNode[];
}

// ═══════════════════════════════════════════════
// 5. Recursive World Tree
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
  /** Death fusion result used for tree generation */
  deathFusion: DeathFusionResult;
}

// ═══════════════════════════════════════════════
// 6. Collapse Result
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
  /** Why this branch was rejected */
  rejectedReason: string;
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
  /** Why this specific path was selected */
  selectedReason: string;
  /** Which engines dominated the selection */
  dominantEngines: string[];
  /** How conflicts were resolved during collapse */
  conflictResolutionNotes: string[];
  /** Why the death boundary was placed here */
  deathBoundaryReason: string;
}

// ═══════════════════════════════════════════════
// 7. Engine Event Extractor interface
// ═══════════════════════════════════════════════

export interface EngineEventExtraction {
  engineName: string;
  eventSeeds: DestinyEventSeed[];
  deathSignals: DestinyEventSeed[];
  confidence: number;
}

// ═══════════════════════════════════════════════
// 8. Event Duration & Cascade Model
// ═══════════════════════════════════════════════

export type EventDurationType = 'instant' | 'short' | 'medium' | 'long' | 'permanent';

/** How long an event's effects persist */
export interface EventDuration {
  type: EventDurationType;
  /** Duration in years (0 for instant, Infinity for permanent) */
  durationYears: number;
  /** Decay function: how quickly the impact fades */
  decayRate: number;
  /** Whether the event can recur */
  recurring: boolean;
  /** Recurrence interval in years (if recurring) */
  recurrenceInterval?: number;
}

/** Causal cascade: one event triggers another */
export interface EventCascade {
  /** The triggering event's mergeKey */
  triggerEventKey: string;
  /** The triggered event's mergeKey */
  resultEventKey: string;
  /** Delay in years before cascade fires */
  delayYears: number;
  /** Probability of cascade firing (0-1) */
  cascadeProbability: number;
  /** How the trigger modifies the result event */
  modifier: CascadeModifier;
  /** Reasoning for why this cascade exists */
  reasoning: string;
}

export interface CascadeModifier {
  /** Multiply the result event's probability */
  probabilityMultiplier: number;
  /** Shift the result event's age window */
  ageShift: number;
  /** Modify the result event's intensity */
  intensityChange: number;
  /** Additional fate impact from the cascade */
  additionalFateImpact: Partial<Record<FateDimension, number>>;
}

/** Life phase with associated event patterns */
export interface LifePhaseDescriptor {
  name: string;
  nameCN: string;
  ageRange: [number, number];
  /** Expected event density (events per year) */
  eventDensity: number;
  /** Which categories are most likely in this phase */
  dominantCategories: EventCategory[];
  /** Base fate vector tendency for this phase */
  baseTendency: Partial<Record<FateDimension, number>>;
}

export const LIFE_PHASES: LifePhaseDescriptor[] = [
  { name: 'Infancy', nameCN: '婴幼期', ageRange: [0, 5], eventDensity: 0.3,
    dominantCategories: ['health', 'family'], baseTendency: { health: 70, homeStability: 80 } },
  { name: 'Childhood', nameCN: '童年期', ageRange: [6, 12], eventDensity: 0.5,
    dominantCategories: ['education', 'family', 'health'], baseTendency: { wisdom: 60, homeStability: 75 } },
  { name: 'Adolescence', nameCN: '少年期', ageRange: [13, 17], eventDensity: 0.8,
    dominantCategories: ['education', 'relationship', 'spiritual'], baseTendency: { wisdom: 65, relation: 55 } },
  { name: 'Youth', nameCN: '青年期', ageRange: [18, 29], eventDensity: 1.2,
    dominantCategories: ['career', 'relationship', 'education', 'migration'], baseTendency: { life: 65, relation: 60 } },
  { name: 'Prime', nameCN: '壮年期', ageRange: [30, 44], eventDensity: 1.0,
    dominantCategories: ['career', 'wealth', 'family', 'relationship'], baseTendency: { wealth: 65, life: 70 } },
  { name: 'Midlife', nameCN: '中年期', ageRange: [45, 59], eventDensity: 0.8,
    dominantCategories: ['career', 'health', 'family', 'wealth'], baseTendency: { life: 60, health: 55 } },
  { name: 'Senior', nameCN: '壮暮期', ageRange: [60, 74], eventDensity: 0.6,
    dominantCategories: ['health', 'family', 'spiritual'], baseTendency: { spirit: 70, health: 45 } },
  { name: 'Elderly', nameCN: '晚年期', ageRange: [75, 89], eventDensity: 0.4,
    dominantCategories: ['health', 'family', 'death'], baseTendency: { spirit: 75, health: 35 } },
  { name: 'Longevity', nameCN: '长寿期', ageRange: [90, 120], eventDensity: 0.2,
    dominantCategories: ['health', 'death', 'spiritual'], baseTendency: { spirit: 80, wisdom: 75, health: 25 } },
];

// ═══════════════════════════════════════════════
// 9. Event Fusion Result
// ═══════════════════════════════════════════════

export interface EventFusionResult {
  candidates: UnifiedEventCandidate[];
  mainlineEvents: UnifiedEventCandidate[];
  sidelineEvents: UnifiedEventCandidate[];
  deathEvents: UnifiedEventCandidate[];
  mergeLog: Array<{ mergeKey: string; mergedCount: number; engines: string[] }>;
  conflictLog: Array<{ eventA: string; eventB: string; resolution: string }>;
  /** Death candidate fusion result */
  deathFusion: DeathFusionResult;
}
