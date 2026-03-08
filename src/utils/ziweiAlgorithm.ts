import { Solar } from 'lunar-typescript';

// ═══════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════

export interface ZiweiInput {
  year: number;
  month: number;
  day: number;
  hour: number;
  gender: 'male' | 'female';
}

export interface ZiweiStar {
  name: string;
  type: 'major' | 'minor' | 'auxiliary' | 'sha';
  brightness: '庙' | '旺' | '得' | '利' | '平' | '闲' | '陷';
  group: 'ziwei' | 'tianfu' | 'auxiliary' | 'sha';
  sihua?: '禄' | '权' | '科' | '忌';
}

export interface SihuaInfo {
  star: string;
  transform: '禄' | '权' | '科' | '忌';
  meaning: string;
  palace?: string;
}

export interface ZiweiPalace {
  name: string;
  branch: string;
  index: number;
  isMing: boolean;
  isShen: boolean;
  stars: ZiweiStar[];
  sanFang?: string[];
  duiGong?: string;
  /** Palace strength score 0-100 */
  strengthScore?: number;
  /** Palace evaluation summary */
  evaluation?: string;
}

export interface DaxianInfo {
  startAge: number;
  endAge: number;
  palaceName: string;
  branch: string;
  stars: ZiweiStar[];
}

export interface LiunianInfo {
  year: number;
  age: number;
  palaceName: string;
  branch: string;
  stars: ZiweiStar[];
  sihua: SihuaInfo[];
}

export interface ZiweiPattern {
  name: string;
  type: '吉格' | '凶格' | '特殊格';
  description: string;
  palaces: string[];
  /** Impact score -10 to +10 */
  impact: number;
}

/** 十二长生 for Ziwei */
export type TwelveStage = '长生' | '沐浴' | '冠带' | '临官' | '帝旺' | '衰' | '病' | '死' | '墓' | '绝' | '胎' | '养';

export interface ZiweiStrengthAnalysis {
  /** Ming palace overall score 0-100 */
  mingScore: number;
  /** Strength grade */
  grade: '上上' | '上' | '中上' | '中' | '中下' | '下' | '下下';
  /** Key findings */
  findings: string[];
  /** Favorable elements */
  favorableElements: string[];
  /** Palace scores map */
  palaceScores: Record<string, number>;
}

export interface ZiweiReport {
  solarDate: string;
  lunarDate: string;
  lunarMonth: number;
  lunarDay: number;
  isLeapMonth: boolean;
  yearGanZhi: string;
  monthGanZhi: string;
  dayGanZhi: string;
  hourBranch: string;
  mingGong: string;
  shenGong: string;
  palaces: ZiweiPalace[];
  wuxingju: { name: string; number: number };
  ziweiPosition: number;
  tianfuPosition: number;
  sihua: SihuaInfo[];
  auxiliaryStars: string[];
  daxian: DaxianInfo[];
  startDaxianAge: number;
  liunian: LiunianInfo[];
  patterns: ZiweiPattern[];
  palaceAnalysis: Record<string, string>;
  /** v2.0: Independent strength analysis */
  strengthAnalysis: ZiweiStrengthAnalysis;
}

// ═══════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════

const PALACE_ORDER = [
  '命宫', '兄弟', '夫妻', '子女', '财帛', '疾厄',
  '迁移', '仆役', '官禄', '田宅', '福德', '父母',
];

const PALACE_BRANCH_ORDER = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑'];
const HOUR_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const HEAVENLY_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];

// ── 四化表 ──
const SIHUA_TABLE: Record<string, { 禄: string; 权: string; 科: string; 忌: string }> = {
  '甲': { 禄: '廉贞', 权: '破军', 科: '武曲', 忌: '太阳' },
  '乙': { 禄: '天机', 权: '天梁', 科: '紫微', 忌: '太阴' },
  '丙': { 禄: '天同', 权: '天机', 科: '文昌', 忌: '廉贞' },
  '丁': { 禄: '太阴', 权: '天同', 科: '天机', 忌: '巨门' },
  '戊': { 禄: '贪狼', 权: '太阴', 科: '右弼', 忌: '天机' },
  '己': { 禄: '武曲', 权: '贪狼', 科: '天梁', 忌: '文曲' },
  '庚': { 禄: '太阳', 权: '武曲', 科: '太阴', 忌: '天同' },
  '辛': { 禄: '巨门', 权: '太阳', 科: '文曲', 忌: '文昌' },
  '壬': { 禄: '天梁', 权: '紫微', 科: '左辅', 忌: '武曲' },
  '癸': { 禄: '破军', 权: '巨门', 科: '太阴', 忌: '贪狼' },
};

const SIHUA_MEANINGS: Record<string, string> = {
  '禄': '主财禄、机遇、顺利',
  '权': '主权力、掌控、决断',
  '科': '主声名、贵人、学业',
  '忌': '主阻碍、是非、波折',
};

// ── 五行局表 (命宫天干+地支 → 五行局) ──
const WUXING_JU_TABLE: Record<string, Record<string, { name: string; number: number }>> = {
  '甲': { '子': { name: '水二局', number: 2 }, '丑': { name: '水二局', number: 2 }, '寅': { name: '火六局', number: 6 }, '卯': { name: '火六局', number: 6 }, '辰': { name: '木三局', number: 3 }, '巳': { name: '木三局', number: 3 }, '午': { name: '金四局', number: 4 }, '未': { name: '金四局', number: 4 }, '申': { name: '土五局', number: 5 }, '酉': { name: '土五局', number: 5 }, '戌': { name: '火六局', number: 6 }, '亥': { name: '火六局', number: 6 } },
  '己': { '子': { name: '水二局', number: 2 }, '丑': { name: '水二局', number: 2 }, '寅': { name: '火六局', number: 6 }, '卯': { name: '火六局', number: 6 }, '辰': { name: '木三局', number: 3 }, '巳': { name: '木三局', number: 3 }, '午': { name: '金四局', number: 4 }, '未': { name: '金四局', number: 4 }, '申': { name: '土五局', number: 5 }, '酉': { name: '土五局', number: 5 }, '戌': { name: '火六局', number: 6 }, '亥': { name: '火六局', number: 6 } },
  '乙': { '子': { name: '火六局', number: 6 }, '丑': { name: '火六局', number: 6 }, '寅': { name: '金四局', number: 4 }, '卯': { name: '金四局', number: 4 }, '辰': { name: '水二局', number: 2 }, '巳': { name: '水二局', number: 2 }, '午': { name: '木三局', number: 3 }, '未': { name: '木三局', number: 3 }, '申': { name: '火六局', number: 6 }, '酉': { name: '火六局', number: 6 }, '戌': { name: '土五局', number: 5 }, '亥': { name: '土五局', number: 5 } },
  '庚': { '子': { name: '火六局', number: 6 }, '丑': { name: '火六局', number: 6 }, '寅': { name: '金四局', number: 4 }, '卯': { name: '金四局', number: 4 }, '辰': { name: '水二局', number: 2 }, '巳': { name: '水二局', number: 2 }, '午': { name: '木三局', number: 3 }, '未': { name: '木三局', number: 3 }, '申': { name: '火六局', number: 6 }, '酉': { name: '火六局', number: 6 }, '戌': { name: '土五局', number: 5 }, '亥': { name: '土五局', number: 5 } },
  '丙': { '子': { name: '土五局', number: 5 }, '丑': { name: '土五局', number: 5 }, '寅': { name: '水二局', number: 2 }, '卯': { name: '水二局', number: 2 }, '辰': { name: '火六局', number: 6 }, '巳': { name: '火六局', number: 6 }, '午': { name: '土五局', number: 5 }, '未': { name: '土五局', number: 5 }, '申': { name: '木三局', number: 3 }, '酉': { name: '木三局', number: 3 }, '戌': { name: '金四局', number: 4 }, '亥': { name: '金四局', number: 4 } },
  '辛': { '子': { name: '土五局', number: 5 }, '丑': { name: '土五局', number: 5 }, '寅': { name: '水二局', number: 2 }, '卯': { name: '水二局', number: 2 }, '辰': { name: '火六局', number: 6 }, '巳': { name: '火六局', number: 6 }, '午': { name: '土五局', number: 5 }, '未': { name: '土五局', number: 5 }, '申': { name: '木三局', number: 3 }, '酉': { name: '木三局', number: 3 }, '戌': { name: '金四局', number: 4 }, '亥': { name: '金四局', number: 4 } },
  '丁': { '子': { name: '木三局', number: 3 }, '丑': { name: '木三局', number: 3 }, '寅': { name: '土五局', number: 5 }, '卯': { name: '土五局', number: 5 }, '辰': { name: '金四局', number: 4 }, '巳': { name: '金四局', number: 4 }, '午': { name: '水二局', number: 2 }, '未': { name: '水二局', number: 2 }, '申': { name: '火六局', number: 6 }, '酉': { name: '火六局', number: 6 }, '戌': { name: '木三局', number: 3 }, '亥': { name: '木三局', number: 3 } },
  '壬': { '子': { name: '木三局', number: 3 }, '丑': { name: '木三局', number: 3 }, '寅': { name: '土五局', number: 5 }, '卯': { name: '土五局', number: 5 }, '辰': { name: '金四局', number: 4 }, '巳': { name: '金四局', number: 4 }, '午': { name: '水二局', number: 2 }, '未': { name: '水二局', number: 2 }, '申': { name: '火六局', number: 6 }, '酉': { name: '火六局', number: 6 }, '戌': { name: '木三局', number: 3 }, '亥': { name: '木三局', number: 3 } },
  '戊': { '子': { name: '金四局', number: 4 }, '丑': { name: '金四局', number: 4 }, '寅': { name: '木三局', number: 3 }, '卯': { name: '木三局', number: 3 }, '辰': { name: '土五局', number: 5 }, '巳': { name: '土五局', number: 5 }, '午': { name: '火六局', number: 6 }, '未': { name: '火六局', number: 6 }, '申': { name: '水二局', number: 2 }, '酉': { name: '水二局', number: 2 }, '戌': { name: '水二局', number: 2 }, '亥': { name: '水二局', number: 2 } },
  '癸': { '子': { name: '金四局', number: 4 }, '丑': { name: '金四局', number: 4 }, '寅': { name: '木三局', number: 3 }, '卯': { name: '木三局', number: 3 }, '辰': { name: '土五局', number: 5 }, '巳': { name: '土五局', number: 5 }, '午': { name: '火六局', number: 6 }, '未': { name: '火六局', number: 6 }, '申': { name: '水二局', number: 2 }, '酉': { name: '水二局', number: 2 }, '戌': { name: '水二局', number: 2 }, '亥': { name: '水二局', number: 2 } },
};

// ── 星耀亮度表 (14主星+辅星) ──
const STAR_BRIGHTNESS: Record<string, Record<string, '庙' | '旺' | '得' | '利' | '平' | '闲' | '陷'>> = {
  '紫微': { '子': '旺', '丑': '庙', '寅': '庙', '卯': '陷', '辰': '得', '巳': '旺', '午': '庙', '未': '庙', '申': '陷', '酉': '平', '戌': '旺', '亥': '庙' },
  '天机': { '子': '庙', '丑': '陷', '寅': '旺', '卯': '庙', '辰': '平', '巳': '平', '午': '庙', '未': '陷', '申': '旺', '酉': '庙', '戌': '平', '亥': '平' },
  '太阳': { '子': '陷', '丑': '陷', '寅': '平', '卯': '庙', '辰': '旺', '巳': '庙', '午': '旺', '未': '得', '申': '得', '酉': '平', '戌': '陷', '亥': '陷' },
  '武曲': { '子': '旺', '丑': '庙', '寅': '陷', '卯': '平', '辰': '庙', '巳': '陷', '午': '利', '未': '庙', '申': '陷', '酉': '平', '戌': '庙', '亥': '陷' },
  '天同': { '子': '庙', '丑': '陷', '寅': '平', '卯': '陷', '辰': '平', '巳': '庙', '午': '平', '未': '陷', '申': '平', '酉': '陷', '戌': '平', '亥': '庙' },
  '廉贞': { '子': '平', '丑': '庙', '寅': '庙', '卯': '利', '辰': '陷', '巳': '平', '午': '利', '未': '庙', '申': '庙', '酉': '利', '戌': '陷', '亥': '平' },
  '天府': { '子': '庙', '丑': '庙', '寅': '旺', '卯': '旺', '辰': '庙', '巳': '庙', '午': '庙', '未': '旺', '申': '旺', '酉': '庙', '戌': '庙', '亥': '庙' },
  '太阴': { '子': '庙', '丑': '旺', '寅': '平', '卯': '陷', '辰': '陷', '巳': '陷', '午': '陷', '未': '陷', '申': '平', '酉': '得', '戌': '旺', '亥': '庙' },
  '贪狼': { '子': '旺', '丑': '平', '寅': '庙', '卯': '陷', '辰': '庙', '巳': '陷', '午': '旺', '未': '平', '申': '庙', '酉': '陷', '戌': '庙', '亥': '陷' },
  '巨门': { '子': '庙', '丑': '陷', '寅': '庙', '卯': '庙', '辰': '平', '巳': '陷', '午': '旺', '未': '陷', '申': '庙', '酉': '庙', '戌': '平', '亥': '陷' },
  '天相': { '子': '庙', '丑': '庙', '寅': '陷', '卯': '平', '辰': '旺', '巳': '陷', '午': '庙', '未': '庙', '申': '陷', '酉': '平', '戌': '旺', '亥': '陷' },
  '天梁': { '子': '庙', '丑': '旺', '寅': '庙', '卯': '庙', '辰': '平', '巳': '陷', '午': '旺', '未': '庙', '申': '庙', '酉': '庙', '戌': '平', '亥': '陷' },
  '七杀': { '子': '旺', '丑': '庙', '寅': '庙', '卯': '平', '辰': '庙', '巳': '陷', '午': '旺', '未': '庙', '申': '庙', '酉': '平', '戌': '庙', '亥': '陷' },
  '破军': { '子': '旺', '丑': '陷', '寅': '庙', '卯': '陷', '辰': '庙', '巳': '陷', '午': '旺', '未': '陷', '申': '庙', '酉': '陷', '戌': '庙', '亥': '陷' },
  '左辅': { '子': '庙', '丑': '旺', '寅': '庙', '卯': '庙', '辰': '旺', '巳': '庙', '午': '庙', '未': '旺', '申': '庙', '酉': '庙', '戌': '旺', '亥': '庙' },
  '右弼': { '子': '庙', '丑': '旺', '寅': '庙', '卯': '庙', '辰': '旺', '巳': '庙', '午': '庙', '未': '旺', '申': '庙', '酉': '庙', '戌': '旺', '亥': '庙' },
  '文昌': { '子': '庙', '丑': '得', '寅': '庙', '卯': '平', '辰': '陷', '巳': '庙', '午': '旺', '未': '平', '申': '庙', '酉': '平', '戌': '陷', '亥': '庙' },
  '文曲': { '子': '庙', '丑': '平', '寅': '陷', '卯': '庙', '辰': '旺', '巳': '平', '午': '庙', '未': '平', '申': '陷', '酉': '庙', '戌': '旺', '亥': '平' },
  '天魁': { '子': '庙', '丑': '庙', '寅': '庙', '卯': '庙', '辰': '庙', '巳': '庙', '午': '庙', '未': '庙', '申': '庙', '酉': '庙', '戌': '庙', '亥': '庙' },
  '天钺': { '子': '庙', '丑': '庙', '寅': '庙', '卯': '庙', '辰': '庙', '巳': '庙', '午': '庙', '未': '庙', '申': '庙', '酉': '庙', '戌': '庙', '亥': '庙' },
  '禄存': { '子': '庙', '丑': '庙', '寅': '庙', '卯': '庙', '辰': '庙', '巳': '庙', '午': '庙', '未': '庙', '申': '庙', '酉': '庙', '戌': '庙', '亥': '庙' },
  '天马': { '子': '平', '丑': '平', '寅': '庙', '卯': '平', '辰': '平', '巳': '庙', '午': '平', '未': '平', '申': '庙', '酉': '平', '戌': '平', '亥': '庙' },
  '擎羊': { '子': '陷', '丑': '庙', '寅': '陷', '卯': '陷', '辰': '庙', '巳': '陷', '午': '陷', '未': '庙', '申': '陷', '酉': '陷', '戌': '庙', '亥': '陷' },
  '陀罗': { '子': '陷', '丑': '陷', '寅': '庙', '卯': '陷', '辰': '陷', '巳': '庙', '午': '陷', '未': '陷', '申': '庙', '酉': '陷', '戌': '陷', '亥': '庙' },
  '火星': { '子': '陷', '丑': '陷', '寅': '庙', '卯': '陷', '辰': '陷', '巳': '庙', '午': '旺', '未': '陷', '申': '陷', '酉': '庙', '戌': '陷', '亥': '陷' },
  '铃星': { '子': '陷', '丑': '陷', '寅': '陷', '卯': '庙', '辰': '陷', '巳': '陷', '午': '陷', '未': '庙', '申': '陷', '酉': '陷', '戌': '陷', '亥': '庙' },
};

// ── 星耀亮度评分 ──
const BRIGHTNESS_SCORE: Record<string, number> = {
  '庙': 10, '旺': 8, '得': 6, '利': 5, '平': 3, '闲': 1, '陷': -3,
};

// ── 辅星查表 ──
const LUCUN_TABLE: Record<string, string> = { '甲': '寅', '乙': '卯', '丙': '巳', '丁': '午', '戊': '巳', '己': '午', '庚': '申', '辛': '酉', '壬': '亥', '癸': '子' };
const QINGYANG_TABLE: Record<string, string> = { '甲': '卯', '乙': '辰', '丙': '午', '丁': '未', '戊': '午', '己': '未', '庚': '酉', '辛': '戌', '壬': '子', '癸': '丑' };
const TUOLUO_TABLE: Record<string, string> = { '甲': '丑', '乙': '寅', '丙': '辰', '丁': '巳', '戊': '辰', '己': '巳', '庚': '未', '辛': '申', '壬': '戌', '癸': '亥' };
const TIANKUI_TABLE: Record<string, string> = { '甲': '丑', '戊': '丑', '庚': '丑', '乙': '子', '己': '子', '丙': '亥', '丁': '亥', '辛': '午', '壬': '卯', '癸': '卯' };
const TIANYUE_TABLE: Record<string, string> = { '甲': '未', '戊': '未', '庚': '未', '乙': '申', '己': '申', '丙': '酉', '丁': '酉', '辛': '寅', '壬': '巳', '癸': '巳' };
const TIANMA_TABLE: Record<string, string> = { '寅': '巳', '午': '巳', '戌': '巳', '申': '亥', '子': '亥', '辰': '亥', '巳': '申', '酉': '申', '丑': '申', '亥': '寅', '卯': '寅', '未': '寅' };

const ZIWEI_GROUP_OFFSETS: Record<string, number> = { '紫微': 0, '天机': -1, '太阳': -3, '武曲': -4, '天同': -5, '廉贞': -8 };
const TIANFU_GROUP_OFFSETS: Record<string, number> = { '天府': 0, '太阴': 1, '贪狼': 2, '巨门': 3, '天相': 4, '天梁': 5, '七杀': 6, '破军': 10 };

// ── 地支五行 (for Ziwei element analysis) ──
const BRANCH_WUXING: Record<string, string> = {
  '寅': '木', '卯': '木', '辰': '土', '巳': '火', '午': '火', '未': '土',
  '申': '金', '酉': '金', '戌': '土', '亥': '水', '子': '水', '丑': '土',
};

// ═══════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════

function getSanFangSiZheng(palaceIdx: number, mingIdx: number): { sanFang: number[]; duiGong: number } {
  const sanFang1 = (palaceIdx + 4) % 12;
  const sanFang2 = (palaceIdx + 8) % 12;
  const duiGong = (palaceIdx + 6) % 12;
  return { sanFang: [sanFang1, sanFang2], duiGong };
}

const getHourBranchIndex = (hour: number): number => Math.floor(((hour + 1) % 24) / 2);

const getMingGongGan = (yearGan: string, mingBranchIndex: number): string => {
  const yearGanIndex = HEAVENLY_STEMS.indexOf(yearGan);
  const yinGanIndex = (yearGanIndex * 2 + 2) % 10;
  return HEAVENLY_STEMS[(yinGanIndex + mingBranchIndex) % 10];
};

const calculateZiweiPosition = (lunarDay: number, bureauNumber: number): number => {
  const quotient = Math.ceil(lunarDay / bureauNumber);
  const remainder = (bureauNumber - (lunarDay % bureauNumber)) % bureauNumber;
  let position: number;
  if (remainder % 2 === 0) {
    position = (quotient + remainder - 1) % 12;
  } else {
    position = (quotient - remainder - 1 + 12) % 12;
  }
  return position;
};

const calculateTianfuPosition = (ziweiPosition: number): number => (12 - ziweiPosition) % 12;
const calculateZuofu = (lunarMonth: number): number => (2 + lunarMonth - 1) % 12;
const calculateYoubi = (lunarMonth: number): number => (8 - lunarMonth + 1 + 12) % 12;
const calculateWenchang = (hourBranchIndex: number): number => (8 - hourBranchIndex + 12) % 12;
const calculateWenqu = (hourBranchIndex: number): number => (2 + hourBranchIndex) % 12;

const calculateHuoxing = (yearBranch: string, hourBranchIndex: number): number => {
  const siGroup = ['巳', '酉', '丑'];
  const haiGroup = ['亥', '卯', '未'];
  let startIndex: number;
  if (siGroup.includes(yearBranch)) startIndex = 4;
  else if (haiGroup.includes(yearBranch)) startIndex = 8;
  else startIndex = 2;
  return (startIndex + hourBranchIndex) % 12;
};

const calculateLingxing = (yearBranch: string, hourBranchIndex: number): number => {
  const yinGroup = ['寅', '午', '戌'];
  const shenGroup = ['申', '子', '辰'];
  const startIndex = (yinGroup.includes(yearBranch) || shenGroup.includes(yearBranch)) ? 4 : 8;
  return (startIndex + hourBranchIndex) % 12;
};

// ═══════════════════════════════════════════════
// v2.0: Palace Strength Scoring Engine
// ═══════════════════════════════════════════════

function scorePalace(palace: ZiweiPalace): number {
  let score = 50; // baseline

  for (const star of palace.stars) {
    const bright = BRIGHTNESS_SCORE[star.brightness] || 0;
    // Major stars have highest weight
    if (star.type === 'major') {
      score += bright * 2.5;
    } else if (star.type === 'auxiliary') {
      score += bright * 1.5;
    } else if (star.type === 'sha') {
      score += bright * 1.2; // 煞星 brightness matters (庙旺煞星反为吉)
    }

    // Si Hua impact
    if (star.sihua === '禄') score += 8;
    if (star.sihua === '权') score += 6;
    if (star.sihua === '科') score += 5;
    if (star.sihua === '忌') score -= 10;
  }

  // Empty palace penalty (no major stars)
  const hasMajor = palace.stars.some(s => s.type === 'major');
  if (!hasMajor) score -= 5;

  return Math.max(5, Math.min(95, Math.round(score)));
}

function evaluatePalace(palace: ZiweiPalace): string {
  const majors = palace.stars.filter(s => s.type === 'major');
  const auxs = palace.stars.filter(s => s.type === 'auxiliary');
  const shas = palace.stars.filter(s => s.type === 'sha');
  const brightMajors = majors.filter(s => ['庙', '旺'].includes(s.brightness));
  const dimMajors = majors.filter(s => s.brightness === '陷');
  const hasLu = palace.stars.some(s => s.sihua === '禄');
  const hasJi = palace.stars.some(s => s.sihua === '忌');

  const parts: string[] = [];
  if (majors.length === 0) {
    parts.push('无主星，借对宫论之');
  } else {
    parts.push(`主星${majors.map(s => `${s.name}(${s.brightness})`).join('、')}`);
    if (brightMajors.length > 0) parts.push('星曜明亮，运势较佳');
    if (dimMajors.length > 0) parts.push('星曜陷落，运势受阻');
  }
  if (auxs.length > 0) parts.push(`吉星${auxs.map(s => s.name).join('、')}助力`);
  if (shas.length > 0) parts.push(`煞星${shas.map(s => s.name).join('、')}冲击`);
  if (hasLu) parts.push('化禄加持');
  if (hasJi) parts.push('化忌入宫');

  return parts.join('。');
}

// ═══════════════════════════════════════════════
// v2.0: Enhanced Pattern Detection (30+ patterns)
// ═══════════════════════════════════════════════

function detectPatterns(palaces: ZiweiPalace[], sihua: SihuaInfo[]): ZiweiPattern[] {
  const patterns: ZiweiPattern[] = [];
  const mingPalace = palaces.find(p => p.isMing);
  if (!mingPalace) return patterns;

  const mingStars = mingPalace.stars.map(s => s.name);
  const mingSha = mingPalace.stars.filter(s => s.type === 'sha');

  const guanluPal = palaces.find(p => p.name === '官禄');
  const caiboPal = palaces.find(p => p.name === '财帛');
  const fumuPal = palaces.find(p => p.name === '父母');
  const fuqiPal = palaces.find(p => p.name === '夫妻');
  const fudePal = palaces.find(p => p.name === '福德');
  const qianyi = palaces.find(p => p.name === '迁移');

  // ─── 吉格 (Auspicious Patterns) ───
  if (mingStars.includes('紫微') && mingStars.includes('天府')) {
    patterns.push({ name: '紫府同宫', type: '吉格', description: '帝星加库星同宫，主一生富贵双全', palaces: [mingPalace.name], impact: 9 });
  }
  if (guanluPal && caiboPal) {
    const gStars = guanluPal.stars.map(s => s.name);
    const cStars = caiboPal.stars.map(s => s.name);
    if ((gStars.includes('紫微') || gStars.includes('天府')) && (cStars.includes('紫微') || cStars.includes('天府'))) {
      patterns.push({ name: '紫府朝垣', type: '吉格', description: '紫微天府在三方四正拱照命宫，主大富大贵', palaces: [guanluPal.name, caiboPal.name], impact: 8 });
    }
  }

  const hasSunBright = palaces.some(p => p.stars.some(s => s.name === '太阳' && ['庙', '旺'].includes(s.brightness)));
  const hasMoonBright = palaces.some(p => p.stars.some(s => s.name === '太阴' && ['庙', '旺'].includes(s.brightness)));
  if (hasSunBright && hasMoonBright) {
    patterns.push({ name: '日月并明', type: '吉格', description: '太阳太阴各在庙旺之位，聪明才智光明磊落', palaces: [], impact: 7 });
  }

  if (mingStars.includes('左辅') || mingStars.includes('右弼')) {
    patterns.push({ name: '辅弼夹命', type: '吉格', description: '左辅右弼在命宫，贵人多助', palaces: [mingPalace.name], impact: 6 });
  }
  if (mingStars.includes('天魁') || mingStars.includes('天钺')) {
    patterns.push({ name: '魁钺同宫', type: '吉格', description: '天魁天钺在命宫或三方，贵人提携', palaces: [mingPalace.name], impact: 6 });
  }
  if (mingPalace.stars.some(s => s.sihua === '禄')) {
    patterns.push({ name: '化禄入命', type: '吉格', description: '化禄飞入命宫，财源广进机遇频现', palaces: [mingPalace.name], impact: 7 });
  }
  if (mingStars.includes('禄存') && mingStars.includes('天马')) {
    patterns.push({ name: '禄马交驰', type: '吉格', description: '禄存天马同宫，发财于远方动中生财', palaces: [mingPalace.name], impact: 7 });
  }

  // 府相朝垣
  const sfzPalaces = mingPalace.sanFang || [];
  const sfzStarNames = sfzPalaces.flatMap(pn => palaces.find(p => p.name === pn)?.stars.map(s => s.name) || []);
  if (sfzStarNames.includes('天府') && sfzStarNames.includes('天相')) {
    patterns.push({ name: '府相朝垣', type: '吉格', description: '天府天相在三方拱照，一生衣食无忧', palaces: sfzPalaces, impact: 7 });
  }

  // 武贪格 (武曲贪狼同宫或对拱)
  if (mingStars.includes('武曲') && mingStars.includes('贪狼')) {
    patterns.push({ name: '武贪同行', type: '特殊格', description: '武曲贪狼同宫，先武后文或先贫后富', palaces: [mingPalace.name], impact: 4 });
  }

  // 杀破狼格
  const allMingStarSet = new Set(mingStars);
  if (allMingStarSet.has('七杀') || allMingStarSet.has('破军') || allMingStarSet.has('贪狼')) {
    const count = [allMingStarSet.has('七杀'), allMingStarSet.has('破军'), allMingStarSet.has('贪狼')].filter(Boolean).length;
    if (count >= 2) {
      patterns.push({ name: '杀破狼', type: '特殊格', description: '杀破狼会聚，一生变动大起大落，宜创业', palaces: [mingPalace.name], impact: 3 });
    }
  }

  // 阳梁昌禄格
  if (mingStars.includes('太阳') && mingStars.includes('天梁') && mingStars.includes('文昌') && mingStars.includes('禄存')) {
    patterns.push({ name: '阳梁昌禄', type: '吉格', description: '太阳天梁文昌禄存会聚，主科举成名', palaces: [mingPalace.name], impact: 8 });
  }

  // 日月反背格
  const sunInDim = palaces.some(p => p.stars.some(s => s.name === '太阳' && s.brightness === '陷'));
  const moonInDim = palaces.some(p => p.stars.some(s => s.name === '太阴' && s.brightness === '陷'));
  if (sunInDim && moonInDim) {
    patterns.push({ name: '日月反背', type: '凶格', description: '太阳太阴均落陷，主劳碌奔波', palaces: [], impact: -6 });
  }

  // 文星拱命
  if ((mingStars.includes('文昌') || sfzStarNames.includes('文昌')) && (mingStars.includes('文曲') || sfzStarNames.includes('文曲'))) {
    patterns.push({ name: '文星拱命', type: '吉格', description: '文昌文曲拱命，才华横溢文采斐然', palaces: [mingPalace.name], impact: 6 });
  }

  // ─── 凶格 (Inauspicious Patterns) ───
  if (mingPalace.stars.some(s => s.sihua === '忌')) {
    patterns.push({ name: '化忌入命', type: '凶格', description: '化忌飞入命宫，阻碍波折需谨慎', palaces: [mingPalace.name], impact: -7 });
  }
  if (mingSha.length >= 2) {
    patterns.push({ name: '煞星聚命', type: '凶格', description: '多颗煞星汇聚命宫，一生多波折', palaces: [mingPalace.name], impact: -6 });
  }

  // 命无正曜
  if (!mingPalace.stars.some(s => s.type === 'major')) {
    patterns.push({ name: '命无正曜', type: '特殊格', description: '命宫无主星，需借对宫星曜论吉凶', palaces: [mingPalace.name], impact: -2 });
  }

  // 擎羊入命 + 陷
  if (mingPalace.stars.some(s => s.name === '擎羊' && s.brightness === '陷')) {
    patterns.push({ name: '羊刃入命', type: '凶格', description: '擎羊陷落命宫，主刑克孤独', palaces: [mingPalace.name], impact: -5 });
  }

  // 火铃夹命
  const adjIndices = [(mingPalace.index + 1) % 12, (mingPalace.index + 11) % 12];
  const adjStars = adjIndices.flatMap(idx => palaces.find(p => p.index === idx)?.stars.map(s => s.name) || []);
  if (adjStars.includes('火星') && adjStars.includes('铃星')) {
    patterns.push({ name: '火铃夹命', type: '凶格', description: '火星铃星夹命宫，主一生多灾', palaces: [mingPalace.name], impact: -5 });
  }

  // 机月同梁格
  const allSanFangStars = new Set([...mingStars, ...sfzStarNames]);
  if (allSanFangStars.has('天机') && allSanFangStars.has('太阴') && allSanFangStars.has('天同') && allSanFangStars.has('天梁')) {
    patterns.push({ name: '机月同梁', type: '特殊格', description: '天机太阴天同天梁会于三方，主从政文职', palaces: [], impact: 5 });
  }

  if (patterns.length === 0) {
    patterns.push({ name: '普通格局', type: '特殊格', description: '无明显大格局，以各宫星曜论吉凶', palaces: [], impact: 0 });
  }

  return patterns;
}

// ═══════════════════════════════════════════════
// v2.0: Independent Strength Analysis Module
// ═══════════════════════════════════════════════

function analyzeStrength(palaces: ZiweiPalace[], patterns: ZiweiPattern[], wuxingju: { name: string; number: number }): ZiweiStrengthAnalysis {
  const mingPalace = palaces.find(p => p.isMing);
  const palaceScores: Record<string, number> = {};

  for (const pal of palaces) {
    palaceScores[pal.name] = pal.strengthScore || scorePalace(pal);
  }

  const mingScore = palaceScores['命宫'] || 50;

  // Pattern impact on overall score
  let patternBonus = 0;
  for (const p of patterns) {
    patternBonus += p.impact;
  }

  const finalScore = Math.max(5, Math.min(95, mingScore + patternBonus));

  // Grade
  let grade: ZiweiStrengthAnalysis['grade'];
  if (finalScore >= 85) grade = '上上';
  else if (finalScore >= 75) grade = '上';
  else if (finalScore >= 65) grade = '中上';
  else if (finalScore >= 50) grade = '中';
  else if (finalScore >= 40) grade = '中下';
  else if (finalScore >= 25) grade = '下';
  else grade = '下下';

  // Key findings
  const findings: string[] = [];
  if (mingPalace) {
    const majors = mingPalace.stars.filter(s => s.type === 'major');
    if (majors.length > 0) {
      findings.push(`命宫主星: ${majors.map(s => `${s.name}(${s.brightness})`).join('、')}`);
    }
  }
  for (const p of patterns.filter(p => Math.abs(p.impact) >= 5)) {
    findings.push(`${p.name}: ${p.description}`);
  }

  // Determine favorable elements from 五行局 and palace distribution
  const juElement = wuxingju.name.charAt(0); // 水/火/木/金/土
  const favorableElements: string[] = [juElement];
  // Add elements that 生 the ju element
  const sheng: Record<string, string> = { '水': '金', '木': '水', '火': '木', '土': '火', '金': '土' };
  if (sheng[juElement]) favorableElements.push(sheng[juElement]);

  return { mingScore: finalScore, grade, findings, favorableElements, palaceScores };
}

// ═══════════════════════════════════════════════
// Palace-level Analysis
// ═══════════════════════════════════════════════

function analyzePalaces(palaces: ZiweiPalace[], mingIdx: number): Record<string, string> {
  const analysis: Record<string, string> = {};
  const aspectMap: Record<string, string> = {
    '命宫': '整体格局与性格', '兄弟': '兄弟姐妹缘分', '夫妻': '婚姻感情',
    '子女': '子女缘分', '财帛': '财运收入', '疾厄': '身体健康',
    '迁移': '出行外出运', '仆役': '人际交友', '官禄': '事业工作',
    '田宅': '房产家业', '福德': '精神生活', '父母': '父母长辈缘分',
  };

  for (const pal of palaces) {
    analysis[pal.name] = `${aspectMap[pal.name] || pal.name}方面：${evaluatePalace(pal)}`;
  }
  return analysis;
}

// ═══════════════════════════════════════════════
// Main Engine
// ═══════════════════════════════════════════════

export const ZiweiEngine = {
  generateReport: (input: ZiweiInput): ZiweiReport => {
    const solar = Solar.fromYmd(input.year, input.month, input.day);
    const lunar = solar.getLunar();
    const lunarMonthRaw = lunar.getMonth();
    const lunarMonth = Math.abs(lunarMonthRaw);
    const lunarDay = lunar.getDay();
    const isLeapMonth = lunarMonthRaw < 0;

    const hourBranchIndex = getHourBranchIndex(input.hour);
    const hourBranch = HOUR_BRANCHES[hourBranchIndex];
    const hourIndex = hourBranchIndex + 1;

    const mingIndex = (lunarMonth + hourIndex - 1) % 12;
    const mingGongBranch = PALACE_BRANCH_ORDER[mingIndex];
    const shenIndex = (mingIndex + hourIndex - 1) % 12;
    const shenGongBranch = PALACE_BRANCH_ORDER[shenIndex];

    const yearGan = lunar.getYearGan();
    const yearZhi = lunar.getYearZhi();
    const mingGan = getMingGongGan(yearGan, mingIndex);
    const wuxingju = WUXING_JU_TABLE[mingGan]?.[mingGongBranch] || { name: '水二局', number: 2 };

    const ziweiPosition = calculateZiweiPosition(lunarDay, wuxingju.number);
    const tianfuPosition = calculateTianfuPosition(ziweiPosition);

    const palaceStars: ZiweiStar[][] = Array(12).fill(null).map(() => []);

    const sihuaConfig = SIHUA_TABLE[yearGan];
    const sihuaList: SihuaInfo[] = [];
    if (sihuaConfig) {
      (['禄', '权', '科', '忌'] as const).forEach(transform => {
        const starName = sihuaConfig[transform];
        sihuaList.push({ star: starName, transform, meaning: SIHUA_MEANINGS[transform] });
      });
    }

    // Place Ziwei group
    Object.entries(ZIWEI_GROUP_OFFSETS).forEach(([starName, offset]) => {
      const position = ((ziweiPosition + offset) % 12 + 12) % 12;
      const branch = PALACE_BRANCH_ORDER[position];
      const sihua = sihuaList.find(s => s.star === starName)?.transform;
      palaceStars[position].push({
        name: starName, type: 'major',
        brightness: STAR_BRIGHTNESS[starName]?.[branch] || '平',
        group: 'ziwei', sihua,
      });
    });

    // Place Tianfu group
    Object.entries(TIANFU_GROUP_OFFSETS).forEach(([starName, offset]) => {
      const position = ((tianfuPosition + offset) % 12 + 12) % 12;
      const branch = PALACE_BRANCH_ORDER[position];
      const sihua = sihuaList.find(s => s.star === starName)?.transform;
      palaceStars[position].push({
        name: starName, type: 'major',
        brightness: STAR_BRIGHTNESS[starName]?.[branch] || '平',
        group: 'tianfu', sihua,
      });
    });

    // Auxiliary stars
    const auxiliaryPositions: { name: string; position: number }[] = [];
    auxiliaryPositions.push({ name: '左辅', position: calculateZuofu(lunarMonth) });
    auxiliaryPositions.push({ name: '右弼', position: calculateYoubi(lunarMonth) });
    auxiliaryPositions.push({ name: '文昌', position: calculateWenchang(hourBranchIndex) });
    auxiliaryPositions.push({ name: '文曲', position: calculateWenqu(hourBranchIndex) });

    const tiankuiBranch = TIANKUI_TABLE[yearGan];
    const tianyueBranch = TIANYUE_TABLE[yearGan];
    if (tiankuiBranch) { const pos = PALACE_BRANCH_ORDER.indexOf(tiankuiBranch); if (pos >= 0) auxiliaryPositions.push({ name: '天魁', position: pos }); }
    if (tianyueBranch) { const pos = PALACE_BRANCH_ORDER.indexOf(tianyueBranch); if (pos >= 0) auxiliaryPositions.push({ name: '天钺', position: pos }); }

    const lucunBranch = LUCUN_TABLE[yearGan];
    if (lucunBranch) { const pos = PALACE_BRANCH_ORDER.indexOf(lucunBranch); if (pos >= 0) auxiliaryPositions.push({ name: '禄存', position: pos }); }

    const qingyangBranch = QINGYANG_TABLE[yearGan];
    const tuoluoBranch = TUOLUO_TABLE[yearGan];
    if (qingyangBranch) { const pos = PALACE_BRANCH_ORDER.indexOf(qingyangBranch); if (pos >= 0) auxiliaryPositions.push({ name: '擎羊', position: pos }); }
    if (tuoluoBranch) { const pos = PALACE_BRANCH_ORDER.indexOf(tuoluoBranch); if (pos >= 0) auxiliaryPositions.push({ name: '陀罗', position: pos }); }

    const tianmaBranch = TIANMA_TABLE[yearZhi];
    if (tianmaBranch) { const pos = PALACE_BRANCH_ORDER.indexOf(tianmaBranch); if (pos >= 0) auxiliaryPositions.push({ name: '天马', position: pos }); }

    auxiliaryPositions.push({ name: '火星', position: calculateHuoxing(yearZhi, hourBranchIndex) });
    auxiliaryPositions.push({ name: '铃星', position: calculateLingxing(yearZhi, hourBranchIndex) });

    // Place auxiliary/sha stars with sihua
    auxiliaryPositions.forEach(({ name, position }) => {
      const branch = PALACE_BRANCH_ORDER[position];
      const isSha = ['擎羊', '陀罗', '火星', '铃星'].includes(name);
      const sihua = sihuaList.find(s => s.star === name)?.transform;
      palaceStars[position].push({
        name, type: isSha ? 'sha' : 'auxiliary',
        brightness: STAR_BRIGHTNESS[name]?.[branch] || '平',
        group: isSha ? 'sha' : 'auxiliary', sihua,
      });
    });

    // Build palaces with san-fang-si-zheng and scoring
    const palaces = PALACE_ORDER.map((name, index) => {
      const branchIndex = (mingIndex + index) % 12;
      const branch = PALACE_BRANCH_ORDER[branchIndex];
      const sfz = getSanFangSiZheng(branchIndex, mingIndex);
      const sanFangNames = sfz.sanFang.map(idx => {
        const offset = ((idx - mingIndex) % 12 + 12) % 12;
        return PALACE_ORDER[offset] || '';
      }).filter(Boolean);
      const duiGongOffset = ((sfz.duiGong - mingIndex) % 12 + 12) % 12;
      const duiGongName = PALACE_ORDER[duiGongOffset] || '';

      const pal: ZiweiPalace = {
        name, branch, index: branchIndex,
        isMing: branchIndex === mingIndex,
        isShen: branchIndex === shenIndex,
        stars: palaceStars[branchIndex] || [],
        sanFang: sanFangNames,
        duiGong: duiGongName,
      };

      // v2.0: Score each palace
      pal.strengthScore = scorePalace(pal);
      pal.evaluation = evaluatePalace(pal);

      return pal;
    });

    // Update sihua with palace info
    for (const sh of sihuaList) {
      const pal = palaces.find(p => p.stars.some(s => s.name === sh.star));
      if (pal) sh.palace = pal.name;
    }

    // Daxian
    const startDaxianAge = wuxingju.number;
    const yearGanIndex = HEAVENLY_STEMS.indexOf(yearGan);
    const isYangYear = yearGanIndex % 2 === 0;
    const isMale = input.gender === 'male';
    const isClockwise = (isYangYear && isMale) || (!isYangYear && !isMale);

    const daxian: DaxianInfo[] = [];
    for (let i = 0; i < 8; i++) {
      const startAge = startDaxianAge + i * 10;
      const endAge = startAge + 9;
      const palaceOffset = isClockwise ? i : -i;
      const palaceIndex = ((mingIndex + palaceOffset) % 12 + 12) % 12;
      const daxianPalace = palaces.find(p => p.index === palaceIndex);
      daxian.push({
        startAge, endAge,
        palaceName: daxianPalace?.name || PALACE_ORDER[i % 12],
        branch: PALACE_BRANCH_ORDER[palaceIndex],
        stars: palaceStars[palaceIndex] || [],
      });
    }

    // Liunian
    const currentYear = new Date().getFullYear();
    const birthYear = input.year;
    const liunian: LiunianInfo[] = [];
    for (let offset = -2; offset <= 10; offset++) {
      const targetYear = currentYear + offset;
      const age = targetYear - birthYear;
      if (age < 1 || age > 100) continue;
      const yearBranchIdx = ((targetYear - 4) % 12 + 12) % 12;
      const lnBranch = PALACE_BRANCH_ORDER[yearBranchIdx];
      const lnPalace = palaces.find(p => p.branch === lnBranch);
      const targetYearGan = HEAVENLY_STEMS[((targetYear - 4) % 10 + 10) % 10];
      const lnSihuaConfig = SIHUA_TABLE[targetYearGan];
      const lnSihua: SihuaInfo[] = [];
      if (lnSihuaConfig) {
        (['禄', '权', '科', '忌'] as const).forEach(transform => {
          lnSihua.push({ star: lnSihuaConfig[transform], transform, meaning: SIHUA_MEANINGS[transform] });
        });
      }
      liunian.push({
        year: targetYear, age,
        palaceName: lnPalace?.name || '未知',
        branch: lnBranch,
        stars: lnPalace?.stars || [],
        sihua: lnSihua,
      });
    }

    // Detect patterns
    const patterns = detectPatterns(palaces, sihuaList);

    // Analyze palaces
    const palaceAnalysis = analyzePalaces(palaces, mingIndex);

    // v2.0: Strength analysis
    const strengthAnalysis = analyzeStrength(palaces, patterns, wuxingju);

    return {
      solarDate: `${input.year}年${input.month}月${input.day}日`,
      lunarDate: `${lunar.getYear()}年${isLeapMonth ? '闰' : ''}${lunarMonth}月${lunarDay}日`,
      lunarMonth, lunarDay, isLeapMonth,
      yearGanZhi: lunar.getYearInGanZhi(),
      monthGanZhi: lunar.getMonthInGanZhi(),
      dayGanZhi: lunar.getDayInGanZhi(),
      hourBranch,
      mingGong: mingGongBranch,
      shenGong: shenGongBranch,
      palaces, wuxingju, ziweiPosition, tianfuPosition,
      sihua: sihuaList,
      auxiliaryStars: auxiliaryPositions.map(p => p.name),
      daxian, startDaxianAge,
      liunian, patterns, palaceAnalysis,
      strengthAnalysis,
    };
  },
};
