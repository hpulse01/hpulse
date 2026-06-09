/**
 * P4.5 — Liu Yao (六爻) core types.
 *
 * Pure deterministic. No Math.random in module body. No clock reads.
 * Random mode REQUIRES an explicit numeric seed which is recorded in the trace.
 */

import type { ExplanationStep, AstroWarning, SourceGrade } from '../astro-time/types';

export type CastingMode = 'time' | 'manual' | 'random';

/** Line value 6 老阴 (yin changing), 7 少阳 (yang static), 8 少阴 (yin static), 9 老阳 (yang changing). */
export type LineValue = 6 | 7 | 8 | 9;

export type YinYang = 'yin' | 'yang';

export type FiveElement = '金' | '木' | '水' | '火' | '土';

export type SixRelative = '父母' | '兄弟' | '子孙' | '妻财' | '官鬼';

export type SixSpirit = '青龙' | '朱雀' | '勾陈' | '螣蛇' | '白虎' | '玄武';

export type WangShuai = '旺' | '相' | '休' | '囚' | '死';

export interface LiuyaoCoreInput {
  mode: CastingMode;
  /** Required for `time` and `random` modes; recorded in trace for `manual` if provided. */
  queryTimeUtc?: string;
  timezoneIana?: string;
  geoLatitude?: number;
  geoLongitude?: number;
  /** `manual` mode: exactly 6 LineValues, bottom (爻 1) → top (爻 6). */
  manualLines?: LineValue[];
  /** `random` mode: REQUIRED. Seed for the deterministic LCG. */
  seed?: number;
  /** Optional question text — drives 用神 selection in instant-decision mode. */
  questionText?: string;
  /** Optional explicit 用神 category override. */
  yongShenCategory?: YongShenCategory;
}

export type YongShenCategory =
  | '财运' | '事业' | '学业' | '婚姻' | '健康' | '子女' | '出行' | '诉讼' | '综合';

export interface RawLine {
  position: number;          // 1..6 from bottom
  value: LineValue;
  yinYang: YinYang;
  isChanging: boolean;
}

export interface NajiaLine {
  position: number;
  branch: string;            // 地支
  stem: string;              // 纳甲天干
  element: FiveElement;
}

export interface HexagramLine {
  position: number;
  value: LineValue;
  yinYang: YinYang;
  isChanging: boolean;
  branch: string;
  stem: string;
  element: FiveElement;
  relative: SixRelative;
  spirit: SixSpirit;
  isShiYao: boolean;
  isYingYao: boolean;
  isVoid: boolean;           // 空亡
  /** 月建旺衰 */
  monthStrength: WangShuai;
  /** 日辰生克描述 */
  dayRelation: string;
  changedBranch?: string;
  changedElement?: FiveElement;
  changedRelative?: SixRelative;
}

export interface Trigram {
  index: number;             // 0..7
  name: string;              // 乾兑离震巽坎艮坤
  element: FiveElement;
  bits: [0|1, 0|1, 0|1];     // bottom..top
}

export interface Hexagram {
  name: string;              // 64-name e.g. 火天大有
  description: string;
  upperTrigram: Trigram;
  lowerTrigram: Trigram;
  palace: string;            // 八宫
  palaceElement: FiveElement;
  shiYao: number;            // 1..6
  yingYao: number;
  lines: HexagramLine[];
  changingLines: number[];
}

export interface ChangedHexagram {
  name: string;
  description: string;
  upperTrigram: Trigram;
  lowerTrigram: Trigram;
  palace: string;
  palaceElement: FiveElement;
  /** Lines after mutation (bottom→top). Najia recomputed; relatives recomputed against ORIGINAL palace per 京房 convention. */
  lines: HexagramLine[];
}

export interface YongShenAnalysis {
  category: YongShenCategory;
  yongShen: SixRelative;
  yuanShen: SixRelative;     // 生用神
  jiShen: SixRelative;       // 克用神
  chouShen: SixRelative;     // 生忌神
  positions: number[];       // 用神在卦中爻位
  hidden: boolean;           // 用神不现 → 需寻伏神
  strength: '旺相' | '休囚' | '受克' | '发动' | '空亡' | '不现';
  judgment: string;
  trace: ExplanationStep[];
}

export interface FuShenInfo {
  yongShen: SixRelative;
  /** 伏于本卦第几爻之下 (1..6)。 */
  position: number;
  branch: string;
  element: FiveElement;
  flyingBranch: string;
  flyingElement: FiveElement;
  relation: '飞来生伏' | '伏去生飞' | '飞来克伏' | '伏去克飞' | '比和';
  judgment: string;
}

export interface JinTuiEntry {
  position: number;
  type: '进神' | '退神';
  from: string;
  to: string;
  description: string;
}

export interface FanFuYinInfo {
  fuYinPositions: number[];
  fanYinPositions: number[];
  /** 负向调整应用于置信度。 */
  scoreAdjustment: number;
  notes: string[];
}

export interface YingQiCandidate {
  branch: string;
  basis: string;
  description: string;
}

export interface ClashCombineEntry {
  type: '六冲' | '六合' | '三刑' | '相害' | '合卦' | '冲卦';
  scope: '爻' | '卦';
  positions: number[];
  description: string;
}

export interface CalendarContext {
  yearGanzhi: string;
  monthGanzhi: string;
  dayGanzhi: string;
  hourGanzhi: string;
  dayStem: string;
  monthBranch: string;
  dayBranch: string;
  voidBranches: string[];    // 旬空
  monthElement: FiveElement;
  dayElement: FiveElement;
}

export interface LiuyaoChart {
  input: LiuyaoCoreInput;
  castingMode: CastingMode;
  castingSource: string;     // human-readable origin: "time:2026-05-14T...", "manual:[7,8,...]", "random:seed=12345"
  calendar: CalendarContext | null;
  mainHexagram: Hexagram;
  changedHexagram?: ChangedHexagram;
  yongShen: YongShenAnalysis;
  fuShen: FuShenInfo | null;
  jinTuiShen: JinTuiEntry[];
  fanFuYin: FanFuYinInfo;
  yingQi: YingQiCandidate[];
  clashCombine: ClashCombineEntry[];
  warnings: AstroWarning[];
  explanationTrace: ExplanationStep[];
  sourceGrade: SourceGrade;
  confidence: number;
  completenessScore: number;
  implementationStatus: 'complete' | 'partial' | 'needs_source_validation';
}
