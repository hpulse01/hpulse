/**
 * Quantum Collapse Core — Type System
 *
 * Pure deterministic types. Produced from EngineOutput[]. Never depend on
 * Math.random or Date.now for the actual collapse decision.
 */

import type {
  EngineOutput,
  FateVector,
  PredictionConflict,
  QueryType,
  StandardizedInput,
  Gender,
} from '@/types/prediction';

export type CanonicalCategory =
  | 'career' | 'wealth' | 'relationship' | 'marriage' | 'family'
  | 'children' | 'parents' | 'health' | 'illness' | 'accident'
  | 'death' | 'migration' | 'education' | 'creativity' | 'reputation'
  | 'legal' | 'conflict' | 'spiritual' | 'property' | 'turning_point'
  | 'unknown';

export type EventPolarity = 'positive' | 'negative' | 'neutral' | 'mixed';

export type SensitiveFlag =
  | 'death' | 'illness' | 'accident' | 'crime' | 'violence'
  | 'self_harm' | 'relationship_breakdown' | 'financial_loss'
  | 'legal_dispute' | 'family_loss';

export type DisplayGuidance =
  | 'neutral' | 'cautious' | 'collapsed' | 'admin_only_detail';

export type ImplementationStatusKind =
  | 'complete' | 'partial' | 'needs_source_validation' | 'placeholder_removed' | 'unknown';

export type SeverityLevel = 'minor' | 'moderate' | 'major' | 'critical' | 'life_defining';

export interface AgeWindow { earliestAge: number; latestAge: number; precision: 'exact' | 'narrow' | 'wide' | 'unknown' }
export interface YearWindow { earliestYear: number; latestYear: number }

export interface QuantumCollapseInput {
  standardizedInput: StandardizedInput;
  engineOutputs: EngineOutput[];
  fateVector: FateVector;
  weightsUsed: Array<{ engineName: string; weight: number }>;
  conflicts: PredictionConflict[];
  queryType: QueryType;
  queryTimeUtc: string;
  birthYear: number;
  gender: Gender;
  targetYear?: number;
  userContext?: Record<string, unknown>;
  algorithmVersion: string;
}

export interface EventSeed {
  id: string;
  sourceEngine: string;
  sourceEngineCN: string;
  sourceGrade: string;
  implementationStatus: ImplementationStatusKind;
  category: CanonicalCategory;
  subcategory: string;
  ageWindow: AgeWindow;
  yearWindow?: YearWindow;
  description: string;
  evidence: string;
  engineConfidence: number;
  engineWeight: number;
  eventConfidence: number;
  severity: SeverityLevel;
  polarity: EventPolarity;
  sensitiveFlags: SensitiveFlag[];
  affectedDimensions: string[];
  supportingSignals: string[];
  opposingSignals: string[];
  rawSource: string;
  explanationTrace: string[];
  warnings: string[];
}

export interface NormalizedEventSeed {
  seedId: string;
  canonicalCategory: CanonicalCategory;
  canonicalDescription: string;
  normalizedAgeWindow: AgeWindow;
  normalizedYearWindow?: YearWindow;
  normalizedConfidence: number;
  normalizedSeverity: SeverityLevel;
  sensitiveFlags: SensitiveFlag[];
  dimensionVector: Record<string, number>;
  trace: string[];
}

export interface FusedEvent {
  id: string;
  canonicalCategory: CanonicalCategory;
  title: string;
  description: string;
  ageWindow: AgeWindow;
  yearWindow?: YearWindow;
  probability: number;
  confidence: number;
  severity: SeverityLevel;
  polarity: EventPolarity;
  engineSupports: string[];
  engineOppositions: string[];
  supportingWeight: number;
  opposingWeight: number;
  conflictScore: number;
  coherenceScore: number;
  sensitiveFlags: SensitiveFlag[];
  displayGuidance: DisplayGuidance;
  explanationTrace: string[];
  warnings: string[];
  /** Reference seed ids for audit */
  seedIds: string[];
}

export interface WorldTreeNode {
  id: string;
  depth: number;
  age: number;
  year: number;
  event: FusedEvent | null; // null only for root
  parentId: string | null;
  childIds: string[];
  branchProbability: number;
  cumulativeProbability: number;
  coherence: number;
  contradictionPenalty: number;
  sensitiveFlags: SensitiveFlag[];
  isTerminal: boolean;
  terminalReason?: string;
  explanationTrace: string[];
}

export interface RecursiveWorldTree {
  root: WorldTreeNode;
  nodes: WorldTreeNode[];
  edges: Array<{ from: string; to: string }>;
  totalNodes: number;
  totalPaths: number;
  maxDepth: number;
  pruningThreshold: number;
  generationTrace: string[];
  warnings: string[];
}

export interface RejectedBranchSummary {
  nodeId: string;
  age: number;
  year: number;
  category: CanonicalCategory;
  title: string;
  probability: number;
  reason: string;
}

export type TerminalEvidenceLevel = 'none' | 'weak' | 'moderate' | 'strong';

export interface CollapseResult {
  collapsedPath: WorldTreeNode[];
  selectedEvents: FusedEvent[];
  rejectedBranches: RejectedBranchSummary[];
  deathAge?: number;
  deathCause?: string;
  terminalEvent?: FusedEvent;
  terminalEvidenceLevel: TerminalEvidenceLevel;
  collapseConfidence: number;
  overallCoherence: number;
  selectedReason: string;
  contradictionSummary: string[];
  engineContributionSummary: Array<{ engineName: string; contribution: number }>;
  sensitiveEventSummary: Array<{ category: CanonicalCategory; count: number; flags: SensitiveFlag[] }>;
  collapseTrace: string[];
  warnings: string[];
}

export interface QuantumCollapseSnapshot {
  algorithmVersion: string;
  input: {
    birthYear: number;
    gender: Gender;
    queryType: QueryType;
    queryTimeUtc: string;
    engineCount: number;
  };
  eventSeeds: EventSeed[];
  normalizedEvents: NormalizedEventSeed[];
  fusedEvents: FusedEvent[];
  worldTree: RecursiveWorldTree;
  collapse: CollapseResult;
  conflicts: PredictionConflict[];
  trace: string[];
  warnings: string[];
}

export interface QuantumCollapseAdminMetrics {
  eventSeedCount: number;
  normalizedEventCount: number;
  fusedEventCount: number;
  conflictCount: number;
  worldTreeNodeCount: number;
  totalPaths: number;
  prunedBranchCount: number;
  collapseConfidence: number;
  overallCoherence: number;
  sensitiveEventCount: number;
  terminalEvidenceLevel: TerminalEvidenceLevel;
}
