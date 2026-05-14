/**
 * P4.4 — Ziwei Doushu (紫微斗数) core types.
 *
 * Pure data structures. No randomness. No I/O.
 */

import type { ExplanationStep, AstroWarning, SourceGrade } from '../astro-time/types';

export type Branch =
  | '子' | '丑' | '寅' | '卯' | '辰' | '巳'
  | '午' | '未' | '申' | '酉' | '戌' | '亥';

export type Stem =
  | '甲' | '乙' | '丙' | '丁' | '戊'
  | '己' | '庚' | '辛' | '壬' | '癸';

export type SihuaTransform = '禄' | '权' | '科' | '忌';
export type StarBrightness = '庙' | '旺' | '得' | '利' | '平' | '闲' | '陷';
export type StarType = 'major' | 'auxiliary' | 'sha';

export const PALACE_NAMES = [
  '命宫', '兄弟', '夫妻', '子女', '财帛', '疾厄',
  '迁移', '仆役', '官禄', '田宅', '福德', '父母',
] as const;
export type PalaceName = (typeof PALACE_NAMES)[number];

export const BRANCH_ORDER: readonly Branch[] = [
  '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑',
];

export const STEMS: readonly Stem[] = [
  '甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸',
];

export interface ZiweiStar {
  name: string;
  type: StarType;
  brightness: StarBrightness;
  group: 'ziwei' | 'tianfu' | 'auxiliary' | 'sha';
  sihua?: SihuaTransform;
}

export interface PalaceStrength {
  score: number;     // 0-100
  brightFactor: number;
  sihuaDelta: number;
}

export interface Palace {
  name: PalaceName;
  /** Index 0..11 over the fixed 寅→丑 branch ring. */
  branchIndex: number;
  branch: Branch;
  isMing: boolean;
  isShen: boolean;
  stars: ZiweiStar[];
  /** Names of the 3 san-fang-si-zheng palaces (the 2 sanfang + duigong). */
  sanFang: PalaceName[];
  duiGong: PalaceName;
  strength: PalaceStrength;
}

export interface SihuaInfo {
  yearStem: Stem;
  star: string;
  transform: SihuaTransform;
  /** Resolved palace name once stars are placed. */
  palace?: PalaceName;
  /** Branch where the transformed star ended up. */
  branch?: Branch;
}

export interface DaXian {
  index: number;
  startAge: number;
  endAge: number;
  branchIndex: number;
  branch: Branch;
  palaceName: PalaceName;
}

export interface WuxingJu {
  name: '水二局' | '木三局' | '金四局' | '土五局' | '火六局';
  number: 2 | 3 | 4 | 5 | 6;
  element: '水' | '木' | '金' | '土' | '火';
}

export interface ZiweiChart {
  /** Solar input echo. */
  solarDate: { year: number; month: number; day: number };
  /** Lunar reference used for all calculations. */
  lunar: {
    year: number;
    month: number;     // 1..12, leap noted separately
    day: number;
    isLeapMonth: boolean;
  };
  yearStem: Stem;
  yearBranch: Branch;
  hourBranchIndex: number;     // 0=子 .. 11=亥
  hourBranch: Branch;
  /** Branch of 命宫. */
  mingBranchIndex: number;
  mingBranch: Branch;
  /** Branch of 身宫. */
  shenBranchIndex: number;
  shenBranch: Branch;
  /** 命宫天干 derived via 五虎遁. */
  mingStem: Stem;
  wuxingJu: WuxingJu;
  /** branchIndex (0..11) where 紫微 is anchored. */
  ziweiBranchIndex: number;
  /** branchIndex (0..11) where 天府 is anchored. */
  tianfuBranchIndex: number;
  palaces: Palace[];
  sihua: SihuaInfo[];
  daxian: DaXian[];
  startDaxianAge: number;
  daxianDirection: 'clockwise' | 'counterclockwise';
  warnings: AstroWarning[];
  explanationTrace: ExplanationStep[];
  sourceGrade: SourceGrade;
}
