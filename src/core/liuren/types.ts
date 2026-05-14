/**
 * P4.8 — Da Liu Ren (大六壬) types.
 */
import type { StandardizedInput } from '../../types/prediction';

export type StemCN = '甲'|'乙'|'丙'|'丁'|'戊'|'己'|'庚'|'辛'|'壬'|'癸';
export type BranchCN = '子'|'丑'|'寅'|'卯'|'辰'|'巳'|'午'|'未'|'申'|'酉'|'戌'|'亥';
export type FiveElement = '金'|'木'|'水'|'火'|'土';

/** 12 月将 (太阳过宫). */
export type MonthGeneral = '神后'|'大吉'|'功曹'|'太冲'|'天罡'|'太乙'|'胜光'|'小吉'|'传送'|'从魁'|'河魁'|'登明';

/** 12 天将. */
export type TwelveDeity =
  | '贵人'|'腾蛇'|'朱雀'|'六合'|'勾陈'|'青龙'
  | '天空'|'白虎'|'太常'|'玄武'|'太阴'|'天后';

export interface PlateCell {
  earthBranch: BranchCN;     // 地盘支 (固定)
  heavenBranch: BranchCN;    // 天盘支 (随月将加时)
  deity: TwelveDeity | null; // 十二天将 (随贵人起)
}

export interface FourClasses {
  ke1: { earth: BranchCN; heaven: BranchCN }; // 干上神
  ke2: { earth: BranchCN; heaven: BranchCN }; // 干阴
  ke3: { earth: BranchCN; heaven: BranchCN }; // 支上神
  ke4: { earth: BranchCN; heaven: BranchCN }; // 支阴
}

export interface ThreeTransmissions {
  chu: BranchCN;   // 初传 (发用)
  zhong: BranchCN; // 中传
  mo: BranchCN;    // 末传
  method: '贼克' | '比用' | '涉害' | '遥克' | '昴星' | '别责' | '八专' | '伏吟' | '反吟' | 'fallback';
}

export interface LiurenWarning {
  code: string; message: string; level: 'info'|'warn'|'error';
}

export interface ExplanationStep {
  rule: string; detail: string; data?: Record<string, unknown>;
}

export interface LiurenInput extends Partial<StandardizedInput> {
  queryTimeUtc: string;
  timezoneIana: string;
  geoLatitude?: number;
  geoLongitude?: number;
  questionText?: string;
  /** Optional: night-divination flag (夜占 picks 夜贵人). Defaults to auto by hour. */
  nightDivination?: boolean;
}

export interface LiurenChart {
  input: LiurenInput;
  yearGanzhi: string;
  monthGanzhi: string;
  dayGanzhi: string;
  hourGanzhi: string;
  solarTerm: string;
  monthGeneral: MonthGeneral;
  monthGeneralBranch: BranchCN;
  hourBranch: BranchCN;
  dayStem: StemCN;
  dayBranch: BranchCN;
  dayStemPalace: BranchCN;     // 干寄宫
  isNight: boolean;
  noblePerson: BranchCN;       // 贵人 所在地盘支
  /** 12 plate cells, ordered by earth branch 子→亥. */
  plates: PlateCell[];
  fourClasses: FourClasses;
  threeTransmissions: ThreeTransmissions;
  confidence: number;
  completenessScore: number;
  sourceGrade: 'A'|'B'|'C'|'D';
  implementationStatus: 'complete'|'partial'|'needs_source_validation';
  warnings: LiurenWarning[];
  explanationTrace: ExplanationStep[];
}
