/**
 * P4.2 — BaZi expanded types.
 *
 * `BaziCoreInput` is the canonical input. `BaziChart` is the rich chart
 * produced by `calculateBaziChart`. Existing `calculateBazi(astro)` keeps
 * its smaller `BaziChart` (now aliased as `BaziCoreChart` for clarity).
 *
 * Pure data. No React. No I/O.
 */

import type {
  AstroWarning,
  ExplanationStep,
  SourceGrade,
} from '../astro-time/types';
import type { Stem, Branch, Element, YinYang, Pillar } from '../calendar/ganzhi';
import type { TenGod } from '../calendar/tenGods';
import type { Gender } from '../../types/prediction';

export type DayBoundaryMode = 'midnight' | 'zi_hour';

export interface BaziCoreInput {
  birthLocalDateTime: {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second?: number;
  };
  gender: Gender;
  /** IANA timezone (e.g. 'Asia/Shanghai'). Strongly recommended. */
  timezoneIana?: string;
  /** Fixed offset minutes (used only when IANA missing). */
  timezoneOffsetMinutes?: number;
  geoLatitude?: number;
  geoLongitude?: number;
  /** Optional ISO string of an externally-resolved true solar local time. */
  trueSolarTime?: string;
  /** When true and coords present, true solar time will drive the hour pillar. */
  useTrueSolarTime?: boolean;
  /** 子时 day boundary policy. Default 'zi_hour'. */
  dayBoundaryPolicy?: DayBoundaryMode;
  /** For flow-year/month — must be explicit. NEVER use system clock. */
  targetYear?: number;
  targetMonth?: number;
  /** ISO instant for "now" if needed by analyses. NEVER read system clock. */
  queryTimeUtc?: string;
}

export interface HiddenStemInfo {
  stem: Stem;
  /** primary | secondary | tertiary */
  position: 'primary' | 'secondary' | 'tertiary';
  weight: number;
  tenGod: TenGod;
}

export type TwelveStage =
  | '长生' | '沐浴' | '冠带' | '临官' | '帝旺' | '衰'
  | '病' | '死' | '墓' | '绝' | '胎' | '养';

export interface BaziPillar {
  position: 'year' | 'month' | 'day' | 'hour';
  stem: Stem;
  branch: Branch;
  ganZhi: string;
  stemElement: Element;
  branchElement: Element;
  stemYinYang: YinYang;
  branchYinYang: YinYang;
  hiddenStems: HiddenStemInfo[];
  /** Ten god of the stem relative to day master. Day stem = '日主'. */
  tenGod: TenGod | '日主';
  nayin: string;
  twelveStage: TwelveStage;
  /** True if this pillar's branch is in 旬空. */
  kongWang: boolean;
}

export interface ElementWeight {
  element: Element;
  weight: number;
  count: number;
  /** Score on 0..100 normalized to total. */
  score: number;
}

export interface YinYangBalance {
  yang: number;
  yin: number;
  /** Yang share 0..1 */
  yangRatio: number;
}

export type StrengthLevel = 'veryStrong' | 'strong' | 'balanced' | 'weak' | 'veryWeak';

export interface SupportDrainCounter {
  support: number;
  drain: number;
  ratio: number;
}

export interface UsefulGodCandidate {
  element: Element;
  reason: string;
  score: number;
}

export interface TiaohouInfo {
  stems: Stem[];
  elements: Element[];
  primary: Stem;
  presentInStems: boolean;
  description: string;
}

export interface PatternCandidate {
  name: string;
  type:
    | '正官格' | '七杀格' | '正印格' | '偏印格'
    | '正财格' | '偏财格' | '食神格' | '伤官格'
    | '建禄格' | '羊刃格'
    | '从强格' | '从弱格'
    | '化气格' | '杂气格' | '未定格';
  /** 0..100 */
  confidence: number;
  evidence: string[];
  warnings: string[];
}

export interface DaYunStepInfo {
  index: number;
  startAge: number;
  endAge: number;
  startDate: string;             // ISO
  ganZhi: string;
  stem: Stem;
  branch: Branch;
  tenGod: TenGod | '日主';
  hiddenStems: HiddenStemInfo[];
  nayin: string;
  direction: 'forward' | 'backward';
  explanationTrace: ExplanationStep[];
}

export interface FlowYearInfo {
  year: number;
  age: number;
  ganZhi: string;
  stem: Stem;
  branch: Branch;
  tenGod: TenGod | '日主';
  /** Relations vs natal pillars. */
  relationToNatal: string[];
  clashes: string[];          // 冲
  combinations: string[];     // 合
  affectedPillars: ('year' | 'month' | 'day' | 'hour')[];
  riskFlags: string[];
  opportunityFlags: string[];
  explanationTrace: ExplanationStep[];
}

export interface FlowMonthInfo {
  year: number;
  month: number;
  ganZhi: string;
  stem: Stem;
  branch: Branch;
  tenGod: TenGod | '日主';
  relationToNatal: string[];
  clashes: string[];
  combinations: string[];
  affectedPillars: ('year' | 'month' | 'day' | 'hour')[];
  riskFlags: string[];
  opportunityFlags: string[];
  explanationTrace: ExplanationStep[];
}

export interface DomainAnalysis {
  /** 0..100 generic outlook. */
  score: number;
  signals: string[];
  warnings: string[];
  sensitive?: boolean;
}

export type ImplementationStatus =
  | 'complete'
  | 'partial_rules'
  | 'experimental'
  | 'needs_source_validation';

export interface ValidationFlagsBlock {
  passed: string[];
  failed: string[];
  warnings: string[];
}

export interface BaziChart {
  /** Snapshot of the input that produced this chart (for provenance). */
  inputSnapshot: BaziCoreInput;

  fourPillars: {
    year: BaziPillar;
    month: BaziPillar;
    day: BaziPillar;
    hour: BaziPillar;
  };

  dayMaster: Stem;
  dayMasterElement: Element;
  dayMasterYinYang: YinYang;

  tenGods: { position: BaziPillar['position']; god: TenGod | '日主' }[];
  hiddenStems: { branch: Branch; hidden: HiddenStemInfo[] }[];
  nayin: { position: BaziPillar['position']; pillar: string; nayin: string }[];

  wuxingBalance: ElementWeight[];
  yinyangBalance: YinYangBalance;
  seasonStrength: 'with-season' | 'neutral' | 'against-season';
  rootStrength: number;             // 0..100
  supportDrainCounter: SupportDrainCounter;
  dayMasterStrength: StrengthLevel;
  strengthScore: number;            // 0..100

  favorableElements: Element[];
  unfavorableElements: Element[];
  usefulGodCandidates: UsefulGodCandidate[];
  selectedUsefulGod: Element | null;

  patternCandidates: PatternCandidate[];
  selectedPattern: PatternCandidate | null;

  /** 调候用神（穷通宝鉴表） */
  tiaohou: TiaohouInfo | null;

  daYun: DaYunStepInfo[];
  currentDaYun: DaYunStepInfo | null;

  flowYear: FlowYearInfo | null;
  flowMonth: FlowMonthInfo | null;

  relationshipAnalysis: DomainAnalysis;
  careerAnalysis: DomainAnalysis;
  wealthAnalysis: DomainAnalysis;
  healthAnalysis: DomainAnalysis;
  familyAnalysis: DomainAnalysis;

  riskFlags: string[];
  sensitiveFlags: string[];

  implementationStatus: ImplementationStatus;
  sourceGrade: SourceGrade;
  confidence: number;          // 0..100
  completenessScore: number;   // 0..100
  warnings: AstroWarning[];
  uncertaintyNotes: string[];
  explanationTrace: ExplanationStep[];
  validationFlags: ValidationFlagsBlock;
}

export type { Pillar };
