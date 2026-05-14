/**
 * P4.7 — Qi Men Dun Jia (奇门遁甲) types.
 */
import type { StandardizedInput } from '../../types/prediction';

export type DunDirection = 'yang' | 'yin'; // 阳遁 / 阴遁
export type ThreeYuan = '上元' | '中元' | '下元';

export type StemCN = '甲' | '乙' | '丙' | '丁' | '戊' | '己' | '庚' | '辛' | '壬' | '癸';
export type BranchCN = '子' | '丑' | '寅' | '卯' | '辰' | '巳' | '午' | '未' | '申' | '酉' | '戌' | '亥';
export type FiveElement = '金' | '木' | '水' | '火' | '土';

/** 三奇 = 乙丙丁; 六仪 = 戊己庚辛壬癸. */
export type SanQiLiuYi = '戊' | '己' | '庚' | '辛' | '壬' | '癸' | '丁' | '丙' | '乙';

/** 九星. */
export type StarName = '天蓬' | '天芮' | '天冲' | '天辅' | '天禽' | '天心' | '天柱' | '天任' | '天英';

/** 八门. */
export type GateName = '休门' | '死门' | '伤门' | '杜门' | '景门' | '开门' | '惊门' | '生门';

/** 八神 (no deity at central palace 5). */
export type DeityName = '值符' | '腾蛇' | '太阴' | '六合' | '白虎' | '玄武' | '九地' | '九天';

/** 九宫编号 1..9 (洛书). 5 = 中宫. */
export type PalaceNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface PalaceCell {
  palace: PalaceNumber;
  trigram: string;          // 坎/坤/震/巽/中/乾/兑/艮/离
  direction: string;        // 北/西南/东/东南/中/西北/西/东北/南
  element: FiveElement;
  earthStem: SanQiLiuYi | null;  // 三奇六仪（地盘）
  heavenStem: SanQiLiuYi | null; // 三奇六仪（天盘）— after 值符 rotation
  star: StarName | null;         // 转盘后的九星
  gate: GateName | null;         // 转盘后的八门
  deity: DeityName | null;       // 八神
}

export interface QimenInput extends Partial<StandardizedInput> {
  /** Required: query time in UTC (instant divination). */
  queryTimeUtc: string;
  timezoneIana: string;
  /** Optional geo for accurate hour pillar; defaults Beijing. */
  geoLatitude?: number;
  geoLongitude?: number;
  /** Optional question category for 用神 selection. */
  yongShenCategory?:
    | '事业' | '财运' | '婚姻' | '官司' | '健康' | '出行'
    | '考试' | '寻人' | '求财' | '决策' | '其他';
  questionText?: string;
}

export interface QimenWarning {
  code: string;
  message: string;
  level: 'info' | 'warn' | 'error';
}

export interface ExplanationStep {
  rule: string;
  detail: string;
  data?: Record<string, unknown>;
}

export interface YongShenAssignment {
  category: string;
  primaryPalace: PalaceNumber | null;
  primaryTarget: 'star' | 'gate' | 'deity' | 'stem';
  primarySymbol: string;
  rationale: string;
}

export interface QimenChart {
  input: QimenInput;
  /** 时间柱 */
  yearGanzhi: string;
  monthGanzhi: string;
  dayGanzhi: string;
  hourGanzhi: string;

  /** 节气 + 三元 + 局 */
  solarTerm: string;
  dunDirection: DunDirection;
  threeYuan: ThreeYuan;
  fuTouDay: string;        // 符头日干支
  fuTouBranchGroup: '子午卯酉' | '寅申巳亥' | '辰戌丑未';
  juNumber: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

  /** 旬首 + 值符 + 值使 */
  hourXunShou: string;          // e.g. '甲子'
  hourXunShouYi: SanQiLiuYi;    // 戊/己/庚/辛/壬/癸
  zhiFuStar: StarName;          // 值符星
  zhiShiGate: GateName;         // 值使门
  zhiFuOriginPalace: PalaceNumber;
  zhiShiOriginPalace: PalaceNumber;

  /** 九宫盘 */
  palaces: PalaceCell[];        // length 9, palace 1..9 in order

  /** 用神 */
  yongShen: YongShenAssignment;

  confidence: number;
  completenessScore: number;
  sourceGrade: 'A' | 'B' | 'C' | 'D';
  implementationStatus: 'complete' | 'partial' | 'needs_source_validation';
  warnings: QimenWarning[];
  explanationTrace: ExplanationStep[];
}
