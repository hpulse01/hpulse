/**
 * P2.5 Unified Prediction Types
 *
 * All types for the standardized orchestration layer:
 * StandardizedInput → EngineOutput[] → FateVector fusion → UnifiedPredictionResult
 */

// ═══════════════════════════════════════════════
// 1. StandardizedInput
// ═══════════════════════════════════════════════

export type QueryType =
  | 'natalAnalysis'     // 本命分析
  | 'annualForecast'    // 流年预测
  | 'monthlyForecast'   // 流月预测
  | 'dailyForecast'     // 流日预测
  | 'instantDecision';  // 即时决策（六爻等）

export type Gender = 'male' | 'female';

export interface SourceMetadata {
  provider: string;          // e.g. 'user_input', 'geocode-location'
  confidence: number;        // 0-1
  normalizedLocationName: string;
  timezoneIana: string;
  standardOffsetMinutes?: number;
  timezoneResolutionNotes?: string;
  rawInput?: Record<string, unknown>;
}

export interface StandardizedInput {
  /** Local birth date-time components */
  birthLocalDateTime: {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
  };
  /** Pre-computed UTC birth date-time (ISO string) */
  birthUtcDateTime: string;
  /** Geographic coordinates */
  geoLatitude: number;
  geoLongitude: number;
  /** IANA timezone (e.g. 'Asia/Shanghai') */
  timezoneIana: string;
  /** Actual UTC offset in minutes at birth moment (handles DST) */
  timezoneOffsetMinutesAtBirth: number;
  /** Gender */
  gender: Gender;
  /** Resolved location name */
  normalizedLocationName: string;
  /** What kind of prediction is requested */
  queryType: QueryType;
  /** UTC timestamp of when the query was made */
  queryTimeUtc: string;
  /** Optional free-text question (for instantDecision / 六爻) */
  questionText?: string;
  /** Provenance of input data */
  sourceMetadata: SourceMetadata;
}

// ═══════════════════════════════════════════════
// 2. FateVector (10 dimensions — v2.0 expanded)
// ═══════════════════════════════════════════════

export interface FateVector {
  /** 命运/事业 */
  life: number;           // 0-100
  /** 财富 */
  wealth: number;         // 0-100
  /** 人际/感情/家庭 */
  relation: number;       // 0-100
  /** 健康 */
  health: number;         // 0-100
  /** 智慧/创造 */
  wisdom: number;         // 0-100
  /** 灵性 */
  spirit: number;         // 0-100
  /** 社会地位·声望 (v2.0) */
  socialStatus: number;   // 0-100
  /** 创造力·艺术表达 (v2.0) */
  creativity: number;     // 0-100
  /** 运势·同步性 (v2.0) */
  luck: number;           // 0-100
  /** 家庭和谐·家运 (v2.0) */
  homeStability: number;  // 0-100
}

export type FateDimension = keyof FateVector;

export const ALL_FATE_DIMENSIONS: FateDimension[] = [
  'life', 'wealth', 'relation', 'health', 'wisdom', 'spirit',
  'socialStatus', 'creativity', 'luck', 'homeStability',
];

export const FATE_DIMENSION_LABELS: Record<FateDimension, string> = {
  life: '命运·事业',
  wealth: '财富',
  relation: '人际·情感',
  health: '健康',
  wisdom: '智慧·创造',
  spirit: '灵性',
  socialStatus: '社会地位',
  creativity: '创造力',
  luck: '运势',
  homeStability: '家庭和谐',
};

export const FATE_DIMENSION_LABELS_EN: Record<FateDimension, string> = {
  life: 'Life & Career',
  wealth: 'Wealth',
  relation: 'Relationships',
  health: 'Health',
  wisdom: 'Wisdom & Creativity',
  spirit: 'Spirituality',
  socialStatus: 'Social Status',
  creativity: 'Creativity',
  luck: 'Fortune & Luck',
  homeStability: 'Home Stability',
};

export const FATE_DIMENSION_LABELS_BI: Record<FateDimension, { zh: string; en: string }> = {
  life: { zh: '命运·事业', en: 'Life & Career' },
  wealth: { zh: '财富', en: 'Wealth' },
  relation: { zh: '人际·情感', en: 'Relationships' },
  health: { zh: '健康', en: 'Health' },
  wisdom: { zh: '智慧·创造', en: 'Wisdom & Creativity' },
  spirit: { zh: '灵性', en: 'Spirituality' },
  socialStatus: { zh: '社会地位', en: 'Social Status' },
  creativity: { zh: '创造力', en: 'Creativity' },
  luck: { zh: '运势', en: 'Fortune & Luck' },
  homeStability: { zh: '家庭和谐', en: 'Home Stability' },
};

// ═══════════════════════════════════════════════
// 3. EngineOutput (with timingBasis)
// ═══════════════════════════════════════════════

export type SourceGrade = 'A' | 'B' | 'C' | 'D';

/** Indicates what time basis the engine used */
export type TimingBasis = 'birth' | 'query' | 'hybrid';

/** Temporal confidence window for a fate dimension */
export interface TimeWindow {
  dimension: FateDimension;
  /** Start age of this window */
  startAge: number;
  /** End age of this window */
  endAge: number;
  /** Confidence in this window's prediction */
  confidence: number;
  /** Trend direction within window */
  trend: 'rising' | 'stable' | 'declining';
  /** Supporting evidence from the engine */
  evidence: string;
}

/** Validation result for an engine's output */
export interface ValidationFlags {
  /** Checks that passed */
  passed: string[];
  /** Checks that failed */
  failed: string[];
  /** Non-critical warnings */
  warnings: string[];
}

export interface EngineOutput {
  engineName: string;
  engineNameCN: string;
  engineVersion: string;
  sourceUrls: string[];
  sourceGrade: SourceGrade;
  ruleSchool: string;
  confidence: number;
  computationTimeMs: number;
  rawInputSnapshot: Record<string, unknown>;
  fateVector: FateVector;
  normalizedOutput: Record<string, string>;
  warnings: string[];
  uncertaintyNotes: string[];
  /** What time basis does this engine use: birth time, query time, or hybrid */
  timingBasis: TimingBasis;
  /** Step-by-step explanation of how this engine arrived at its conclusions */
  explanationTrace: string[];
  /** 0-100 score indicating how complete this engine's output is */
  completenessScore: number;
  /** Validation results for this engine's output */
  validationFlags: ValidationFlags;
  /** Temporal windows where predictions are most confident */
  timeWindows: TimeWindow[];
  /** Per-aspect scores (engine-specific breakdown beyond FateVector) */
  aspectScores: Record<string, number>;
  /** Event candidates generated by this engine */
  eventCandidates: string[];
}

// ═══════════════════════════════════════════════
// 4. PredictionConflict
// ═══════════════════════════════════════════════

export type ConflictResolutionStrategy =
  | 'weighted_average'
  | 'confidence_priority'
  | 'domain_expert'
  | 'conservative';

export interface PredictionConflict {
  dimension: FateDimension;
  engineA: string;
  engineB: string;
  valueA: number;
  valueB: number;
  delta: number;
  resolutionStrategy: ConflictResolutionStrategy;
  explanation: string;
}

// ═══════════════════════════════════════════════
// 5. Engine Activation
// ═══════════════════════════════════════════════

export type EngineName =
  | 'tieban' | 'bazi' | 'ziwei' | 'liuyao'
  | 'western' | 'vedic' | 'numerology' | 'mayan' | 'kabbalah'
  | 'meihua' | 'qimen' | 'liuren' | 'taiyi';

export const ALL_ENGINE_NAMES: EngineName[] = [
  'tieban', 'bazi', 'ziwei', 'liuyao',
  'western', 'vedic', 'numerology', 'mayan', 'kabbalah',
  'meihua', 'qimen', 'liuren', 'taiyi',
];

export interface EngineActivationRule {
  engine: EngineName;
  active: boolean;
  reason: string;
}

// ═══════════════════════════════════════════════
// 6. ExecutionTrace
// ═══════════════════════════════════════════════

export interface ExecutionTraceEntry {
  engineName: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  timingBasis: TimingBasis;
  inputHash: string;
  outputHash: string;
  dependenciesUsed: string[];
  success: boolean;
  errorMessage?: string;
}

// ═══════════════════════════════════════════════
// 7. UnifiedPredictionResult (upgraded)
// ═══════════════════════════════════════════════

export interface WeightEntry {
  engineName: string;
  weight: number;
  reason: string;
}

export interface UnifiedPredictionResult {
  predictionId: string;
  input: StandardizedInput;
  engineOutputs: EngineOutput[];
  weightsUsed: WeightEntry[];
  fusedFateVector: FateVector;
  conflicts: PredictionConflict[];
  finalConfidence: number;
  causalSummary: string;
  generatedAt: string;
  algorithmVersion: string;
  /** Which engines were activated for this query */
  activeEngines: string[];
  /** Which engines were actually executed and produced output */
  executedEngines: string[];
  /** Which engines were skipped and why */
  skippedEngines: Array<{ engineName: string; reason: string }>;
  /** Which engines failed during execution */
  failedEngines: Array<{ engineName: string; error: string }>;
  /** Summary of why engines were activated/skipped */
  activationReasonSummary: string;
  /** Detailed execution trace for each engine */
  executionTrace: ExecutionTraceEntry[];
  /** Engine dependency graph (which engines depend on which) */
  engineDependencyGraph: Record<string, string[]>;
  /** Per-engine completeness scores */
  engineCompletenessScores: Record<string, number>;
  /** Per-engine event candidate counts */
  engineEventCandidateCounts: Record<string, number>;
  /** Per-engine contribution weights to final fused result */
  engineContributionWeights: Record<string, number>;
}

// ═══════════════════════════════════════════════
// 8. Engine Three-Layer Report Standard
// ═══════════════════════════════════════════════

/**
 * Universal three-layer output standard for all engines:
 * Layer 1 — rawParams: original input parameters used by the engine
 * Layer 2 — chartResult: charting/排盘 output (structured data)
 * Layer 3 — analysisConclusion: pattern/strength/evaluation results
 */
export interface EngineThreeLayerReport<
  TRawParams = Record<string, unknown>,
  TChartResult = Record<string, unknown>,
  TConclusion = Record<string, unknown>,
> {
  engineName: EngineName;
  engineNameCN: string;
  engineVersion: string;
  /** Layer 1: Raw input parameters */
  rawParams: TRawParams;
  /** Layer 2: Charting / 排盘 result */
  chartResult: TChartResult;
  /** Layer 3: Analysis conclusion */
  analysisConclusion: TConclusion;
  /** Computed FateVector */
  fateVector: FateVector;
  /** Metadata */
  meta: {
    ruleSchool: string;
    sourceGrade: SourceGrade;
    confidence: number;
    computationTimeMs: number;
    timingBasis: TimingBasis;
    warnings: string[];
    uncertaintyNotes: string[];
  };
}
