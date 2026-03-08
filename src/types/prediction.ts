/**
 * P1 Unified Prediction Types
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
// 3. EngineOutput
// ═══════════════════════════════════════════════

export type SourceGrade = 'A' | 'B' | 'C' | 'D';

export interface EngineOutput {
  /** Engine identifier (e.g. 'tieban', 'bazi', 'western') */
  engineName: string;
  /** Display name in Chinese */
  engineNameCN: string;
  /** Semantic version */
  engineVersion: string;
  /** Academic/technical source URLs */
  sourceUrls: string[];
  /** Source reliability grade */
  sourceGrade: SourceGrade;
  /** School/tradition (e.g. 'Parashari', 'Tropical Zodiac') */
  ruleSchool: string;
  /** Engine self-reported confidence 0-1 */
  confidence: number;
  /** Wall-clock computation time in ms */
  computationTimeMs: number;
  /** Snapshot of the input as seen by this engine */
  rawInputSnapshot: Record<string, unknown>;
  /** The 6-dimensional fate vector produced by this engine */
  fateVector: FateVector;
  /** Free-form display metadata (star names, signs, etc.) */
  normalizedOutput: Record<string, string>;
  /** Warnings generated during computation */
  warnings: string[];
  /** Uncertainty notes */
  uncertaintyNotes: string[];
}

// ═══════════════════════════════════════════════
// 4. PredictionConflict
// ═══════════════════════════════════════════════

export type ConflictResolutionStrategy =
  | 'weighted_average'     // 按权重加权
  | 'confidence_priority'  // 置信度优先
  | 'domain_expert'        // 领域专家优先（如健康维度以吠陀为主）
  | 'conservative';        // 取保守值（较低值）

export interface PredictionConflict {
  /** Which FateVector dimension has the conflict */
  dimension: FateDimension;
  /** First conflicting engine */
  engineA: string;
  /** Second conflicting engine */
  engineB: string;
  /** Engine A's value for this dimension */
  valueA: number;
  /** Engine B's value for this dimension */
  valueB: number;
  /** Absolute difference */
  delta: number;
  /** How the conflict was resolved */
  resolutionStrategy: ConflictResolutionStrategy;
  /** Human-readable explanation */
  explanation: string;
}

// ═══════════════════════════════════════════════
// 5. UnifiedPredictionResult
// ═══════════════════════════════════════════════

export interface WeightEntry {
  engineName: string;
  weight: number;
  reason: string;
}

export interface UnifiedPredictionResult {
  /** Unique prediction ID */
  predictionId: string;
  /** The standardized input used */
  input: StandardizedInput;
  /** Per-engine outputs */
  engineOutputs: EngineOutput[];
  /** Weights used for fusion */
  weightsUsed: WeightEntry[];
  /** Fused 6-dimensional fate vector */
  fusedFateVector: FateVector;
  /** Detected conflicts */
  conflicts: PredictionConflict[];
  /** Overall confidence after fusion (0-1) */
  finalConfidence: number;
  /** Human-readable causal summary */
  causalSummary: string;
  /** ISO timestamp */
  generatedAt: string;
  /** Orchestrator version */
  algorithmVersion: string;
}
