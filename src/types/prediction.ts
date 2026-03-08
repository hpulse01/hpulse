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
// 2. FateVector (6 fixed dimensions)
// ═══════════════════════════════════════════════

export interface FateVector {
  /** 命运/事业 */
  life: number;       // 0-100
  /** 财富 */
  wealth: number;     // 0-100
  /** 人际/感情/家庭 */
  relation: number;   // 0-100
  /** 健康 */
  health: number;     // 0-100
  /** 智慧/创造 */
  wisdom: number;     // 0-100
  /** 灵性 */
  spirit: number;     // 0-100
}

export type FateDimension = keyof FateVector;

export const ALL_FATE_DIMENSIONS: FateDimension[] = [
  'life', 'wealth', 'relation', 'health', 'wisdom', 'spirit',
];

export const FATE_DIMENSION_LABELS: Record<FateDimension, string> = {
  life: '命运·事业',
  wealth: '财富',
  relation: '人际·情感',
  health: '健康',
  wisdom: '智慧·创造',
  spirit: '灵性',
};

// ═══════════════════════════════════════════════
// 3. EngineOutput (with timingBasis)
// ═══════════════════════════════════════════════

export type SourceGrade = 'A' | 'B' | 'C' | 'D';

/** Indicates what time basis the engine used */
export type TimingBasis = 'birth' | 'query' | 'hybrid';

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
