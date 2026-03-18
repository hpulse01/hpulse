import type { FateVector, QueryType, StandardizedInput, EngineName } from '@/types/prediction';
import type {
  CollapseResult as BaseCollapseResult,
  RecursiveWorldTree as BaseRecursiveWorldTree,
  UnifiedEventCandidate as BaseUnifiedEventCandidate,
} from '@/types/destinyTree';
import type { UnifiedPredictionResult } from '@/types/prediction';

export type UnifiedPredictionInput = StandardizedInput;

export interface NormalizedBirthContext {
  localDateTime: UnifiedPredictionInput['birthLocalDateTime'];
  birthUtcDateTime: string;
  timezoneIana: string;
  timezoneOffsetMinutesAtBirth: number;
  normalizedLocationName: string;
  geoLatitude: number;
  geoLongitude: number;
  gender: UnifiedPredictionInput['gender'];
  queryType: QueryType;
  queryTimeUtc: string;
}

export interface SystemEngineResult {
  engineId: EngineName;
  engineVersion: string;
  normalizedInputSnapshot: Record<string, unknown>;
  rawComputedChart: Record<string, unknown>;
  featureVector: FateVector;
  timeWindows: string[];
  aspectScores: FateVector;
  eventCandidates: BaseUnifiedEventCandidate[];
  confidence: number;
  explanationTrace: string[];
  warnings: string[];
  completenessScore: number;
  validationFlags: string[];
}

export type UnifiedEventCandidate = BaseUnifiedEventCandidate;
export type RecursiveWorldNode = BaseRecursiveWorldTree['root'];
export type RecursiveWorldTree = BaseRecursiveWorldTree;
export type CollapseResult = BaseCollapseResult;

export interface DestinyTimelineEvent {
  age: number;
  year: number;
  category: string;
  description: string;
  confidence: number;
  engineSupports: string[];
  isTerminal: boolean;
}

export interface DestinyPhase {
  phaseId: string;
  title: string;
  ageRange: [number, number];
  dominantThemes: string[];
  keyEvents: DestinyTimelineEvent[];
  stabilityScore: number;
}

export interface AdminOrchestrationSnapshot {
  engineCoverageMatrix: Array<{
    engineId: EngineName;
    status: '未接入' | '部分接入' | '完整接入';
    realExecution: boolean;
    orchestrated: boolean;
    structuredEvents: boolean;
    explanationTrace: boolean;
    tested: boolean;
    pseudoImplementationRisk: 'low' | 'medium' | 'high';
    completenessScore: number;
    eventCandidateCount: number;
    contributionWeight: number;
    warnings: string[];
    nextGap: string;
  }>;
  engineWeights: Record<string, number>;
  engineFailures: UnifiedPredictionResult['failedEngines'];
  executionSummary: UnifiedPredictionResult['executionTrace'];
  pruningThreshold: number;
  totalEventCandidates: number;
  totalWorldNodes: number;
  totalPaths: number;
  collapse: Pick<BaseCollapseResult, 'deathAge' | 'deathCause' | 'collapseConfidence' | 'selectedReason'> | null;
  userAccessPolicy: {
    public: string[];
    member: string[];
    admin: string[];
    superAdmin: string[];
  };
}

export interface FullPredictionReport {
  input: UnifiedPredictionInput;
  normalizedBirthContext: NormalizedBirthContext;
  engineResults: SystemEngineResult[];
  eventCandidates: UnifiedEventCandidate[];
  worldTree: RecursiveWorldTree | null;
  collapseResult: CollapseResult | null;
  destinyTimeline: DestinyTimelineEvent[];
  destinyPhases: DestinyPhase[];
  confidence: number;
  coherence: number;
  convergence: number;
  explanationTrace: string[];
  dashboardPayload: UnifiedPredictionResult;
  adminSnapshot: AdminOrchestrationSnapshot;
}
