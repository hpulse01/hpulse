/**
 * P4.4 — Ziwei Doushu (紫微斗数) core types.
 *
 * Pure data structures. No randomness, no Date.now, no I/O.
 */

import type { ExplanationStep, AstroWarning, SourceGrade } from '../astro-time/types';
import type { Gender } from '../../types/prediction';

export type Branch =
  | '子' | '丑' | '寅' | '卯' | '辰' | '巳'
  | '午' | '未' | '申' | '酉' | '戌' | '亥';

export type Stem =
  | '甲' | '乙' | '丙' | '丁' | '戊'
  | '己' | '庚' | '辛' | '壬' | '癸';

export type SihuaTransform = '禄' | '权' | '科' | '忌';
export type StarBrightness = '庙' | '旺' | '得' | '利' | '平' | '闲' | '陷';
export type StarType = 'major' | 'minor' | 'auxiliary' | 'sha';
export type StarGroup = 'ziwei' | 'tianfu' | 'auxiliary' | 'sha' | 'minor';

export const PALACE_NAMES = [
  '命宫', '兄弟', '夫妻', '子女', '财帛', '疾厄',
  '迁移', '仆役', '官禄', '田宅', '福德', '父母',
] as const;
export type PalaceName = (typeof PALACE_NAMES)[number];

export type ImplementationStatus = 'complete' | 'partial' | 'experimental';

export type DayBoundaryPolicy = 'midnight' | 'zi_hour';

export interface ValidationFlags {
  passed: string[];
  failed: string[];
  warnings: string[];
}

// ───────── Input ─────────

export interface ZiweiCoreInput {
  birthLocalDateTime: {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
  };
  gender: Gender;
  /** Optional UTC instant of the query — used as fallback for liunian when targetYear is missing. */
  queryTimeUtc?: string;
  /** Year used for liunian focus. Must be deterministic; never derived from system clock inside core. */
  targetYear?: number;
  dayBoundaryPolicy?: DayBoundaryPolicy;
  timezoneIana?: string;
  geoLatitude?: number;
  geoLongitude?: number;
  /** How many years before/after target to enumerate in liunian (defaults [-2, +10]). */
  liunianRangeBefore?: number;
  liunianRangeAfter?: number;
}

// ───────── Star + Palace ─────────

export interface ZiweiStar {
  name: string;
  type: StarType;
  brightness: StarBrightness;
  group: StarGroup;
  sihua?: SihuaTransform;
  /** Stable id of the placement rule that produced this star, e.g. "ziwei.group.tianji". */
  placementRule: string;
  explanationTrace: ExplanationStep[];
}

export interface PalaceStrength {
  score: number;
  brightFactor: number;
  sihuaDelta: number;
  shaDelta: number;
}

export interface SelfSihuaMark {
  transform: SihuaTransform;
  star: string;
}

export interface ZiweiPalace {
  name: PalaceName;
  branch: Branch;
  /** Index 0..11 over the canonical 寅→丑 ring. */
  index: number;
  isMing: boolean;
  isShen: boolean;
  stars: ZiweiStar[];
  majorStars: ZiweiStar[];
  minorStars: ZiweiStar[];
  auxiliaryStars: ZiweiStar[];
  shaStars: ZiweiStar[];
  /** Names of the 2 三方 palaces (excluding self). */
  sanFang: PalaceName[];
  /** Name of the 对宫. */
  duiGong: PalaceName;
  strengthScore: number;
  evaluation: string;
  /** Stable structured keys describing what's in this palace, for downstream UI/AI. */
  interpretationKeys: string[];
  /** ── Structural extensions (P4.4b) ── */
  /** 宫干 — derived via 五虎遁 from the year-stem. */
  stem?: Stem;
  /** 对宫地支 (always the 6-th apart on the 12-branch ring). */
  oppositeBranch?: Branch;
  /** True when this palace contains no major (主星) star. */
  isEmpty?: boolean;
  /** When isEmpty, branch of the 对宫 from which stars are borrowed. */
  borrowedFromBranch?: Branch;
  /** When isEmpty, palace-name of the 对宫. */
  borrowedFromName?: PalaceName;
  /** When isEmpty, list of major-star names borrowed from the 对宫. */
  borrowedStars?: string[];
  /** 宫干自化 — sihua emitted by this palace's own stem, where the target star is in this palace. */
  selfSihua?: SelfSihuaMark[];
}

// ───────── Sihua / Daxian / Liunian / Patterns ─────────

export interface SihuaInfo {
  yearStem: Stem;
  star: string;
  transform: SihuaTransform;
  meaning: string;
  palace?: PalaceName;
  branch?: Branch;
  explanationTrace: ExplanationStep[];
}

export interface DaXianStep {
  index: number;
  startAge: number;
  endAge: number;
  branchIndex: number;
  branch: Branch;
  palaceName: PalaceName;
  stars: ZiweiStar[];
  direction: 'clockwise' | 'counterclockwise';
  explanationTrace: ExplanationStep[];
}

export interface LiunianStep {
  year: number;
  age: number;
  yearStem: Stem;
  yearBranch: Branch;
  palaceName: PalaceName;
  branch: Branch;
  stars: ZiweiStar[];
  sihua: SihuaInfo[];
  explanationTrace: ExplanationStep[];
}

export interface ZiweiPattern {
  name: string;
  type: '吉格' | '凶格' | '特殊格';
  description: string;
  palaces: string[];
  impact: number; // -10..+10
  evidence: string[];
  explanationTrace: ExplanationStep[];
}

export interface ZiweiStrengthAnalysis {
  mingScore: number;
  grade: '上上' | '上' | '中上' | '中' | '中下' | '下' | '下下';
  findings: string[];
  favorableElements: string[];
  palaceScores: Record<string, number>;
  riskFactors: string[];
  opportunityFactors: string[];
  explanationTrace: ExplanationStep[];
}

export interface WuxingJu {
  name: '水二局' | '木三局' | '金四局' | '土五局' | '火六局';
  number: 2 | 3 | 4 | 5 | 6;
  element: '水' | '木' | '金' | '土' | '火';
  ruleKey: string;
  fallbackUsed: boolean;
  explanationTrace: ExplanationStep[];
  warnings: AstroWarning[];
}

// ───────── Final chart ─────────

export interface ZiweiChart {
  solarDate: { year: number; month: number; day: number };
  lunarDate: { year: number; month: number; day: number; isLeapMonth: boolean };
  lunarYear: number;
  lunarMonth: number;
  lunarDay: number;
  isLeapMonth: boolean;
  yearGan: Stem;
  yearZhi: Branch;
  yearGanZhi: string;
  monthGanZhi: string;
  dayGanZhi: string;
  hourBranch: Branch;
  hourBranchIndex: number;
  mingGong: PalaceName; // Always '命宫'
  shenGong: PalaceName; // Resolved palace name where 身宫 sits
  mingGongBranch: Branch;
  shenGongBranch: Branch;
  mingGongStem: Stem;
  wuxingJu: WuxingJu;
  ziweiPosition: number;
  tianfuPosition: number;
  palaces: ZiweiPalace[];
  sihua: SihuaInfo[];
  daxian: DaXianStep[];
  startDaxianAge: number;
  daxianDirection: 'clockwise' | 'counterclockwise';
  liunian: LiunianStep[];
  patterns: ZiweiPattern[];
  palaceAnalysis: Record<string, string>;
  strengthAnalysis: ZiweiStrengthAnalysis;
  implementationStatus: ImplementationStatus;
  sourceGrade: SourceGrade;
  confidence: number;
  completenessScore: number;
  warnings: AstroWarning[];
  uncertaintyNotes: string[];
  explanationTrace: ExplanationStep[];
  validationFlags: ValidationFlags;
}
