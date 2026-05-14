/**
 * P4.8 — Taiyi Shenshu (太乙神数) types.
 */
import type { StandardizedInput } from '../../types/prediction';

export type DunDirection = 'yang' | 'yin';
export type PalaceNumber = 1|2|3|4|5|6|7|8|9;
export type FiveElement = '金'|'木'|'水'|'火'|'土';

export interface TaiyiInput extends Partial<StandardizedInput> {
  queryTimeUtc: string;
  timezoneIana: string;
  /** Optional: which scale to compute. Default 'year'. Higher scales (month/day/hour) marked partial. */
  scale?: 'year' | 'month' | 'day' | 'hour';
  /** Optional epoch override (太乙积年 base year, default 公元前 10153937 / 黄帝纪元 alt). */
  epochYear?: number;
  questionText?: string;
}

export interface TaiyiWarning {
  code: string; message: string; level: 'info'|'warn'|'error';
}

export interface ExplanationStep {
  rule: string; detail: string; data?: Record<string, unknown>;
}

export interface TaiyiChart {
  input: TaiyiInput;
  scale: 'year' | 'month' | 'day' | 'hour';

  /** 太乙积年 (years since epoch). */
  jiNian: number;
  /** Cycle position within 360-year 元数大周期 (basic). */
  yuanIndex: number;

  /** 局数 1..72. 阳遁 1..36, 阴遁 37..72. */
  juNumber: number;
  dunDirection: DunDirection;

  /** 太乙 所在宫 (1..9, skipping 5 in some schools — here we keep 1..9 with 中宫 寄). */
  taiyiPalace: PalaceNumber;

  /** 文昌 所在宫. */
  wenChangPalace: PalaceNumber;

  /** 始击 所在宫. */
  shiJiPalace: PalaceNumber;

  /** 主算 / 客算 (基础). */
  zhuSuan: number;
  keSuan: number;

  /** 主客判断 (主胜 / 客胜 / 平). */
  zhuKeJudgment: '主胜' | '客胜' | '平';

  confidence: number;
  completenessScore: number;
  sourceGrade: 'A'|'B'|'C'|'D';
  implementationStatus: 'complete'|'partial'|'needs_source_validation';
  warnings: TaiyiWarning[];
  explanationTrace: ExplanationStep[];
}
