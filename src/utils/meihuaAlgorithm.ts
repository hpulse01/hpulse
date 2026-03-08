/**
 * 梅花易数引擎 (Meihua Yishu / Plum Blossom Numerology)
 *
 * 即时感应型体系，核心能力：
 * 1. 时间起卦 (Time-based hexagram)
 * 2. 数字起卦 (Number-based hexagram)
 *
 * 算法参考：邵雍《梅花易数》原典
 */

import type { EngineOutput, FateVector, StandardizedInput } from '@/types/prediction';

// ═══════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════

/** 八卦 (Eight Trigrams) */
export interface Trigram {
  /** 卦序 0-7 (乾兑离震巽坎艮坤) */
  index: number;
  name: string;
  nameCN: string;
  element: WuXing;
  nature: string;
}

export type WuXing = '金' | '木' | '水' | '火' | '土';

export interface MeihuaGua {
  /** 上卦 (outer trigram) */
  upper: Trigram;
  /** 下卦 (inner trigram) */
  lower: Trigram;
  /** 六十四卦名 */
  name: string;
  /** 卦辞简述 */
  description: string;
}

export interface TiYongRelation {
  /** 体卦 */
  tiGua: Trigram;
  /** 用卦 */
  yongGua: Trigram;
  /** 体卦五行 */
  tiElement: WuXing;
  /** 用卦五行 */
  yongElement: WuXing;
  /** 体用生克关系 */
  relation: '体生用' | '用生体' | '体克用' | '用克体' | '比和';
  /** 吉凶倾向 */
  tendency: '吉' | '凶' | '中' | '大吉' | '大凶';
  /** 解释 */
  explanation: string;
}

export interface MeihuaResult {
  /** 起卦方式 */
  method: 'time' | 'number';
  /** 本卦 */
  benGua: MeihuaGua;
  /** 互卦 */
  huGua: MeihuaGua;
  /** 变卦 */
  bianGua: MeihuaGua;
  /** 动爻位置 (1-6) */
  dongYao: number;
  /** 体用关系 */
  tiYong: TiYongRelation;
  /** 上卦数 */
  upperNumber: number;
  /** 下卦数 */
  lowerNumber: number;
  /** 总数 */
  totalNumber: number;
  /** 基础吉凶评分 0-100 */
  score: number;
  /** 卦象简析 */
  interpretation: string;
}

export interface MeihuaInput {
  /** 起卦方式 */
  method: 'time' | 'number';
  /** 时间起卦用 (农历年月日时) */
  year?: number;
  month?: number;
  day?: number;
  hour?: number;
  /** 数字起卦用 */
  number1?: number;
  number2?: number;
}

// ═══════════════════════════════════════════════
// 八卦常量
// ═══════════════════════════════════════════════

const TRIGRAMS: Trigram[] = [
  { index: 0, name: 'Qian',  nameCN: '乾', element: '金', nature: '天' },
  { index: 1, name: 'Dui',   nameCN: '兑', element: '金', nature: '泽' },
  { index: 2, name: 'Li',    nameCN: '离', element: '火', nature: '火' },
  { index: 3, name: 'Zhen',  nameCN: '震', element: '木', nature: '雷' },
  { index: 4, name: 'Xun',   nameCN: '巽', element: '木', nature: '风' },
  { index: 5, name: 'Kan',   nameCN: '坎', element: '水', nature: '水' },
  { index: 6, name: 'Gen',   nameCN: '艮', element: '土', nature: '山' },
  { index: 7, name: 'Kun',   nameCN: '坤', element: '土', nature: '地' },
];

/** 先天八卦数：乾1兑2离3震4巽5坎6艮7坤8 → 转为0-indexed */
function trigramByXiantianNumber(n: number): Trigram {
  // 先天数1-8 → index mapping: 1→乾(0), 2→兑(1), 3→离(2), 4→震(3), 5→巽(4), 6→坎(5), 7→艮(6), 8→坤(7)
  const idx = ((n - 1) % 8 + 8) % 8;
  return TRIGRAMS[idx];
}

/** 六十四卦名 (upper index * 8 + lower index) */
const HEXAGRAM_NAMES: Record<number, string> = {
  0:  '乾为天',   1: '天泽履',   2: '天火同人', 3: '天雷无妄',
  4:  '天风姤',   5: '天水讼',   6: '天山遁',   7: '天地否',
  8:  '泽天夬',   9: '兑为泽',  10: '泽火革',  11: '泽雷随',
  12: '泽风大过', 13: '泽水困',  14: '泽山咸',  15: '泽地萃',
  16: '火天大有', 17: '火泽睽',  18: '离为火',  19: '火雷噬嗑',
  20: '火风鼎',  21: '火水未济', 22: '火山旅',  23: '火地晋',
  24: '雷天大壮', 25: '雷泽归妹', 26: '雷火丰',  27: '震为雷',
  28: '雷风恒',  29: '雷水解',  30: '雷山小过', 31: '雷地豫',
  32: '风天小畜', 33: '风泽中孚', 34: '风火家人', 35: '风雷益',
  36: '巽为风',  37: '风水涣',  38: '风山渐',  39: '风地观',
  40: '水天需',  41: '水泽节',  42: '水火既济', 43: '水雷屯',
  44: '水风井',  45: '坎为水',  46: '水山蹇',  47: '水地比',
  48: '山天大畜', 49: '山泽损',  50: '山火贲',  51: '山雷颐',
  52: '山风蛊',  53: '山水蒙',  54: '艮为山',  55: '山地剥',
  56: '地天泰',  57: '地泽临',  58: '地火明夷', 59: '地雷复',
  60: '地风升',  61: '地水师',  62: '地山谦',  63: '坤为地',
};

// ═══════════════════════════════════════════════
// 五行生克
// ═══════════════════════════════════════════════

type WuXingRelation = '生' | '克' | '比';

function wuxingRelation(a: WuXing, b: WuXing): { from: WuXing; to: WuXing; rel: WuXingRelation } {
  const sheng: Record<WuXing, WuXing> = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
  const ke: Record<WuXing, WuXing> = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' };
  if (a === b) return { from: a, to: b, rel: '比' };
  if (sheng[a] === b) return { from: a, to: b, rel: '生' };
  if (ke[a] === b) return { from: a, to: b, rel: '克' };
  if (sheng[b] === a) return { from: b, to: a, rel: '生' };
  if (ke[b] === a) return { from: b, to: a, rel: '克' };
  return { from: a, to: b, rel: '比' };
}

// ═══════════════════════════════════════════════
// 起卦核心算法
// ═══════════════════════════════════════════════

function makeGua(upper: Trigram, lower: Trigram): MeihuaGua {
  const key = upper.index * 8 + lower.index;
  return {
    upper,
    lower,
    name: HEXAGRAM_NAMES[key] || `${upper.nameCN}${lower.nameCN}`,
    description: `上${upper.nameCN}(${upper.nature})下${lower.nameCN}(${lower.nature})`,
  };
}

/** 互卦：取2,3,4爻为下卦，3,4,5爻为上卦（爻从下往上1-6） */
function computeHuGua(upper: Trigram, lower: Trigram): MeihuaGua {
  // 六爻二进制：爻1(最下)到爻6(最上)
  // lower trigram: 爻1,2,3; upper trigram: 爻4,5,6
  // 卦的二进制表示（阳=1，阴=0，从下到上）
  const lines = trigramToLines(lower).concat(trigramToLines(upper));
  // 互卦下卦 = 爻2,3,4
  const huLower = linesToTrigram([lines[1], lines[2], lines[3]]);
  // 互卦上卦 = 爻3,4,5
  const huUpper = linesToTrigram([lines[2], lines[3], lines[4]]);
  return makeGua(huUpper, huLower);
}

/** 变卦：动爻变阴阳 */
function computeBianGua(upper: Trigram, lower: Trigram, dongYao: number): MeihuaGua {
  const lines = trigramToLines(lower).concat(trigramToLines(upper));
  const idx = dongYao - 1; // 0-indexed
  lines[idx] = lines[idx] === 1 ? 0 : 1;
  const bianLower = linesToTrigram([lines[0], lines[1], lines[2]]);
  const bianUpper = linesToTrigram([lines[3], lines[4], lines[5]]);
  return makeGua(bianUpper, bianLower);
}

/** Trigram → 3 lines (bottom to top), 乾=[1,1,1], 坤=[0,0,0] */
function trigramToLines(t: Trigram): number[] {
  // 乾=111, 兑=110, 离=101, 震=001, 巽=011, 坎=010, 艮=100, 坤=000
  const map: Record<number, number[]> = {
    0: [1,1,1], // 乾
    1: [0,1,1], // 兑 (bottom yin)
    2: [1,0,1], // 离 (middle yin)
    3: [1,0,0], // 震 (top yang only → bottom yang)
    4: [0,1,1].map(x => 1-x) as number[], // 巽=110→ wait...
    5: [0,1,0], // 坎
    6: [0,0,1], // 艮
    7: [0,0,0], // 坤
  };
  // Actually let me redefine properly. Traditional binary (bottom to top):
  // 乾☰=111, 兑☱=011, 离☲=101, 震☳=100, 巽☴=011→NO
  // Let me use standard: bottom-to-top
  // 乾(≡)=1,1,1  兑(☱)=1,1,0  离(☲)=1,0,1  震(☳)=0,0,1
  // 巽(☴)=1,1,0→NO  巽(☴)=0,1,1→NO
  // Standard encoding bottom-to-top:
  // 乾=111, 兑=110, 离=101, 震=100, 巽=011, 坎=010, 艮=001, 坤=000
  const standard: Record<number, [number,number,number]> = {
    0: [1,1,1], // 乾
    1: [1,1,0], // 兑
    2: [1,0,1], // 离
    3: [1,0,0], // 震
    4: [0,1,1], // 巽
    5: [0,1,0], // 坎
    6: [0,0,1], // 艮
    7: [0,0,0], // 坤
  };
  return [...standard[t.index]];
}

function linesToTrigram(lines: number[]): Trigram {
  const val = (lines[0] << 2) | (lines[1] << 1) | lines[2];
  // Reverse mapping from binary to trigram index
  const binToIdx: Record<number, number> = {
    7: 0, // 111→乾
    6: 1, // 110→兑
    5: 2, // 101→离
    4: 3, // 100→震
    3: 4, // 011→巽
    2: 5, // 010→坎
    1: 6, // 001→艮
    0: 7, // 000→坤
  };
  return TRIGRAMS[binToIdx[val] ?? 7];
}

/** 体用判定：动爻在上卦则上卦为用、下卦为体；动爻在下卦则下卦为用、上卦为体 */
function determineTiYong(benGua: MeihuaGua, dongYao: number): TiYongRelation {
  const inUpper = dongYao > 3;
  const tiGua = inUpper ? benGua.lower : benGua.upper;
  const yongGua = inUpper ? benGua.upper : benGua.lower;

  const rel = wuxingRelation(tiGua.element, yongGua.element);

  let relation: TiYongRelation['relation'];
  let tendency: TiYongRelation['tendency'];
  let explanation: string;

  if (rel.rel === '比') {
    relation = '比和';
    tendency = '中';
    explanation = `体卦${tiGua.nameCN}(${tiGua.element})与用卦${yongGua.nameCN}(${yongGua.element})五行相同，为比和之象，事势平稳。`;
  } else if (rel.rel === '生' && rel.from === tiGua.element) {
    relation = '体生用';
    tendency = '凶';
    explanation = `体卦${tiGua.nameCN}(${tiGua.element})生用卦${yongGua.nameCN}(${yongGua.element})，体气外泄，耗损之象。`;
  } else if (rel.rel === '生' && rel.from === yongGua.element) {
    relation = '用生体';
    tendency = '大吉';
    explanation = `用卦${yongGua.nameCN}(${yongGua.element})生体卦${tiGua.nameCN}(${tiGua.element})，外来助力，大吉之象。`;
  } else if (rel.rel === '克' && rel.from === tiGua.element) {
    relation = '体克用';
    tendency = '吉';
    explanation = `体卦${tiGua.nameCN}(${tiGua.element})克用卦${yongGua.nameCN}(${yongGua.element})，我制彼方，有利可图。`;
  } else {
    relation = '用克体';
    tendency = '大凶';
    explanation = `用卦${yongGua.nameCN}(${yongGua.element})克体卦${tiGua.nameCN}(${tiGua.element})，外力压制，大凶之象。`;
  }

  return { tiGua, yongGua, tiElement: tiGua.element, yongElement: yongGua.element, relation, tendency, explanation };
}

/** 基础吉凶评分 */
function calculateScore(tiYong: TiYongRelation): number {
  const baseScores: Record<TiYongRelation['tendency'], number> = {
    '大吉': 85,
    '吉': 72,
    '中': 55,
    '凶': 35,
    '大凶': 18,
  };
  return baseScores[tiYong.tendency] ?? 50;
}

// ═══════════════════════════════════════════════
// 时间起卦
// ═══════════════════════════════════════════════

function divineByTime(year: number, month: number, day: number, hour: number): MeihuaResult {
  // 梅花起卦法：年数+月数+日数 = 上卦数，年+月+日+时 = 下卦数
  // 先天数取余8得卦，总数取余6得动爻
  // 地支时辰：子1丑2寅3卯4辰5巳6午7未8申9酉10戌11亥12
  const zhiHour = Math.floor(((hour + 1) % 24) / 2) + 1; // 简化地支时辰

  const upperNum = year + month + day;
  const lowerNum = upperNum + zhiHour;
  const totalNum = lowerNum;

  const upperRem = ((upperNum % 8) || 8);
  const lowerRem = ((lowerNum % 8) || 8);
  const dongYao = ((totalNum % 6) || 6);

  const upper = trigramByXiantianNumber(upperRem);
  const lower = trigramByXiantianNumber(lowerRem);

  const benGua = makeGua(upper, lower);
  const huGua = computeHuGua(upper, lower);
  const bianGua = computeBianGua(upper, lower, dongYao);
  const tiYong = determineTiYong(benGua, dongYao);
  const score = calculateScore(tiYong);

  return {
    method: 'time',
    benGua,
    huGua,
    bianGua,
    dongYao,
    tiYong,
    upperNumber: upperNum,
    lowerNumber: lowerNum,
    totalNumber: totalNum,
    score,
    interpretation: buildInterpretation(benGua, huGua, bianGua, tiYong, dongYao),
  };
}

// ═══════════════════════════════════════════════
// 数字起卦
// ═══════════════════════════════════════════════

function divineByNumber(num1: number, num2: number): MeihuaResult {
  const upperRem = ((num1 % 8) || 8);
  const lowerRem = ((num2 % 8) || 8);
  const totalNum = num1 + num2;
  const dongYao = ((totalNum % 6) || 6);

  const upper = trigramByXiantianNumber(upperRem);
  const lower = trigramByXiantianNumber(lowerRem);

  const benGua = makeGua(upper, lower);
  const huGua = computeHuGua(upper, lower);
  const bianGua = computeBianGua(upper, lower, dongYao);
  const tiYong = determineTiYong(benGua, dongYao);
  const score = calculateScore(tiYong);

  return {
    method: 'number',
    benGua,
    huGua,
    bianGua,
    dongYao,
    tiYong,
    upperNumber: num1,
    lowerNumber: num2,
    totalNumber: totalNum,
    score,
    interpretation: buildInterpretation(benGua, huGua, bianGua, tiYong, dongYao),
  };
}

function buildInterpretation(
  ben: MeihuaGua, hu: MeihuaGua, bian: MeihuaGua,
  tiYong: TiYongRelation, dongYao: number,
): string {
  return (
    `本卦${ben.name}，动第${dongYao}爻。` +
    `互卦${hu.name}，变卦${bian.name}。` +
    `体卦${tiYong.tiGua.nameCN}(${tiYong.tiElement})，用卦${tiYong.yongGua.nameCN}(${tiYong.yongElement})。` +
    `${tiYong.relation}，${tiYong.explanation}`
  );
}

// ═══════════════════════════════════════════════
// FateVector 映射
// ═══════════════════════════════════════════════

function meihuaToFateVector(result: MeihuaResult): FateVector {
  const base = result.score;
  const tiEl = result.tiYong.tiElement;

  // 五行 → 六维偏向
  const elementBonus: Record<WuXing, Partial<Record<keyof FateVector, number>>> = {
    '金': { wealth: 8, life: 5 },
    '木': { health: 8, wisdom: 5 },
    '水': { wisdom: 8, spirit: 5 },
    '火': { life: 8, relation: 5 },
    '土': { health: 5, wealth: 5, relation: 3 },
  };

  const bonus = elementBonus[tiEl] || {};
  const clamp = (v: number) => Math.max(5, Math.min(95, Math.round(v)));

  return {
    life:     clamp(base + (bonus.life ?? 0)),
    wealth:   clamp(base + (bonus.wealth ?? 0)),
    relation: clamp(base + (bonus.relation ?? 0)),
    health:   clamp(base + (bonus.health ?? 0)),
    wisdom:   clamp(base + (bonus.wisdom ?? 0)),
    spirit:   clamp(base + (bonus.spirit ?? 0)),
  };
}

// ═══════════════════════════════════════════════
// Engine Interface for Orchestrator
// ═══════════════════════════════════════════════

export function runMeihua(standardizedInput: StandardizedInput): {
  eo: EngineOutput;
  meihuaResult: MeihuaResult;
} {
  const t0 = performance.now();

  // Determine divination method based on input
  let result: MeihuaResult;

  if (standardizedInput.questionText) {
    // 文本转数字起卦：取文本字符编码和
    const chars = standardizedInput.questionText;
    const halfLen = Math.ceil(chars.length / 2);
    let n1 = 0, n2 = 0;
    for (let i = 0; i < chars.length; i++) {
      if (i < halfLen) n1 += chars.charCodeAt(i);
      else n2 += chars.charCodeAt(i);
    }
    if (n1 === 0) n1 = 1;
    if (n2 === 0) n2 = 1;
    result = divineByNumber(n1, n2);
  } else {
    // 时间起卦：使用 queryTimeUtc
    const qt = new Date(standardizedInput.queryTimeUtc);
    const lunarYear = qt.getFullYear();
    const lunarMonth = qt.getMonth() + 1;
    const lunarDay = qt.getDate();
    const lunarHour = qt.getHours();
    result = divineByTime(lunarYear, lunarMonth, lunarDay, lunarHour);
  }

  const fateVector = meihuaToFateVector(result);
  const t1 = performance.now();

  return {
    eo: {
      engineName: 'meihua',
      engineNameCN: '梅花易数',
      engineVersion: '1.0.0',
      sourceUrls: ['https://en.wikipedia.org/wiki/Plum_Blossom_Numerology'],
      sourceGrade: 'B',
      ruleSchool: '邵雍梅花易数',
      confidence: 0.62,
      computationTimeMs: Math.round(t1 - t0),
      rawInputSnapshot: {
        method: result.method,
        upperNumber: result.upperNumber,
        lowerNumber: result.lowerNumber,
      },
      fateVector,
      normalizedOutput: {
        '本卦': result.benGua.name,
        '互卦': result.huGua.name,
        '变卦': result.bianGua.name,
        '动爻': String(result.dongYao),
        '体用': result.tiYong.relation,
        '吉凶': result.tiYong.tendency,
      },
      warnings: ['梅花易数基于起卦时间而非出生时间，适用于即时感应占断'],
      uncertaintyNotes: ['梅花体用评分为启发式映射', '时间起卦使用公历近似'],
    },
    meihuaResult: result,
  };
}

// Export for testing
export const MeihuaEngine = {
  divineByTime,
  divineByNumber,
  meihuaToFateVector,
  runMeihua,
  // Expose internals for testing
  _internals: {
    trigramByXiantianNumber,
    makeGua,
    computeHuGua,
    computeBianGua,
    determineTiYong,
    wuxingRelation,
    TRIGRAMS,
  },
};
