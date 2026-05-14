/**
 * P4.6 — Meihua Yishu (梅花易数) types.
 */
import type { StandardizedInput } from '../../types/prediction';

export type FiveElement = '金' | '木' | '水' | '火' | '土';
export type TrigramName = '乾' | '兑' | '离' | '震' | '巽' | '坎' | '艮' | '坤';

export interface Trigram {
  index: number;            // 0..7 in 先天 order (乾1兑2离3震4巽5坎6艮7坤8 → here 0-based)
  preHeavenNumber: number;  // 1..8 (邵雍先天数)
  name: TrigramName;
  element: FiveElement;
  bits: [0|1, 0|1, 0|1];    // bottom, middle, top
  attribute: string;        // 天/泽/火/雷/风/水/山/地
}

export type CastingMode =
  | 'time'      // 年月日时起卦
  | 'numbers'   // 数字起卦（两组数）
  | 'manual';   // 手工指定上下卦 + 动爻

export interface MeihuaInput extends Partial<StandardizedInput> {
  mode: CastingMode;
  /** numbers mode */
  upperNumber?: number;
  lowerNumber?: number;
  /** manual mode */
  manualUpper?: TrigramName;
  manualLower?: TrigramName;
  manualMovingLine?: number; // 1..6
  /** time mode requires queryTimeUtc + timezoneIana inherited from StandardizedInput. */
  questionText?: string;
}

export interface Hexagram {
  name: string;            // 64-卦 名（若表中存在则填，否则 '上下'拼名）
  upper: Trigram;
  lower: Trigram;
  bits: (0|1)[];           // bottom→top, length 6
}

export interface BodyUseAnalysis {
  bodyTrigram: Trigram;     // 体卦（不含动爻的那一卦）
  useTrigram: Trigram;      // 用卦（含动爻的那一卦）
  bodyElement: FiveElement;
  useElement: FiveElement;
  /** body↔use 五行关系（站在体卦视角） */
  relation:
    | '用生体'  // 大吉
    | '体克用'  // 小吉
    | '比和'    // 吉
    | '体生用'  // 耗
    | '用克体'; // 凶
  trend: 'auspicious' | 'mixed' | 'caution' | 'inauspicious';
  trendScore: number;       // 0..100
}

export interface MeihuaWarning {
  code: string;
  message: string;
  level: 'info' | 'warn' | 'error';
}

export interface ExplanationStep {
  rule: string;
  detail: string;
  data?: Record<string, unknown>;
}

export interface MeihuaChart {
  input: MeihuaInput;
  castingMode: CastingMode;
  castingSource: string;
  upperRaw: number;       // raw upper sum
  lowerRaw: number;       // raw lower sum
  movingLineRaw: number;  // raw moving sum
  upperTrigram: Trigram;
  lowerTrigram: Trigram;
  movingLine: number;     // 1..6 (bottom=1)
  benGua: Hexagram;       // 本卦
  huGua: Hexagram;        // 互卦
  bianGua: Hexagram;      // 变卦
  bodyUse: BodyUseAnalysis;
  confidence: number;     // 0..100
  completenessScore: number; // 0..1
  sourceGrade: 'A' | 'B' | 'C' | 'D';
  implementationStatus: 'complete' | 'partial' | 'needs_source_validation';
  warnings: MeihuaWarning[];
  explanationTrace: ExplanationStep[];
}
