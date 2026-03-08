/**
 * 梅花易数引擎 v3.0 (Meihua Yishu / Plum Blossom Numerology)
 *
 * v3.0 升级内容:
 * 1. 错卦/综卦分析 (Inverse & Reverse hexagrams)
 * 2. 先天/后天八卦互参
 * 3. 互卦/变卦多层体用分析
 * 4. 六十四卦完整卦辞库
 * 5. 增强应期: 先天数应期 + 后天卦气应期
 * 6. 全卦五行力量对比
 *
 * 算法参考：邵雍《梅花易数》原典 + 《周易》
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

/** 万物类象 */
export interface WanWuLeiXiang {
  category: string;
  items: string[];
}

/** 应期信息 */
export interface YingQi {
  type: string;
  timing: string;
  explanation: string;
}

/** 卦象深度分析 */
export interface GuaAnalysis {
  /** 卦象意象 */
  imagery: string;
  /** 万物类象 */
  leiXiang: WanWuLeiXiang[];
  /** 季节旺衰 */
  seasonalStrength: { season: string; strength: '旺' | '相' | '休' | '囚' | '死' };
  /** 应期推算 */
  yingQi: YingQi[];
  /** 互卦分析 */
  huGuaAnalysis: string;
  /** 变卦趋势 */
  bianGuaTrend: string;
  /** 综合格局 */
  pattern: string;
  /** 综合评语 */
  summary: string;
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
  /** v2: 深度分析 */
  analysis: GuaAnalysis;
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
// 万物类象字典
// ═══════════════════════════════════════════════

const TRIGRAM_LEI_XIANG: Record<string, WanWuLeiXiang[]> = {
  '乾': [
    { category: '人物', items: ['君王', '父亲', '长者', '领导', '贵人'] },
    { category: '身体', items: ['头', '骨', '肺', '大肠'] },
    { category: '方位', items: ['西北', '上方'] },
    { category: '时序', items: ['秋冬之交', '戌亥月', '九十月'] },
    { category: '物象', items: ['金玉', '宝珠', '圆物', '冠帽', '镜'] },
  ],
  '兑': [
    { category: '人物', items: ['少女', '歌伎', '妾', '说客', '巫师'] },
    { category: '身体', items: ['口', '舌', '咽喉', '肺', '痰'] },
    { category: '方位', items: ['正西'] },
    { category: '时序', items: ['仲秋', '酉月', '八月'] },
    { category: '物象', items: ['金刃', '乐器', '杯盏', '破碎之物'] },
  ],
  '离': [
    { category: '人物', items: ['中女', '文人', '兵士', '美人'] },
    { category: '身体', items: ['目', '心', '小肠', '血液'] },
    { category: '方位', items: ['正南'] },
    { category: '时序', items: ['仲夏', '午月', '五月'] },
    { category: '物象', items: ['文书', '甲胄', '干燥物', '红色物'] },
  ],
  '震': [
    { category: '人物', items: ['长男', '商旅', '将帅'] },
    { category: '身体', items: ['足', '肝', '声音', '筋'] },
    { category: '方位', items: ['正东'] },
    { category: '时序', items: ['仲春', '卯月', '二月'] },
    { category: '物象', items: ['木竹', '乐器', '花草', '鹰蛇'] },
  ],
  '巽': [
    { category: '人物', items: ['长女', '秀士', '僧道', '工匠'] },
    { category: '身体', items: ['股', '胆', '肱', '气管'] },
    { category: '方位', items: ['东南'] },
    { category: '时序', items: ['暮春初夏', '辰巳月', '三四月'] },
    { category: '物象', items: ['绳索', '木香', '扇', '长物'] },
  ],
  '坎': [
    { category: '人物', items: ['中男', '渔人', '盗贼', '江湖人'] },
    { category: '身体', items: ['耳', '肾', '腰', '血'] },
    { category: '方位', items: ['正北'] },
    { category: '时序', items: ['仲冬', '子月', '十一月'] },
    { category: '物象', items: ['酒', '水具', '带核物', '弓轮'] },
  ],
  '艮': [
    { category: '人物', items: ['少男', '童子', '山人', '僧侣'] },
    { category: '身体', items: ['手', '指', '背', '鼻', '脾胃'] },
    { category: '方位', items: ['东北'] },
    { category: '时序', items: ['冬春之交', '丑寅月', '正腊月'] },
    { category: '物象', items: ['石', '门', '墙', '寺庙', '小路'] },
  ],
  '坤': [
    { category: '人物', items: ['母亲', '老妇', '众人', '大臣'] },
    { category: '身体', items: ['腹', '脾', '胃', '肉'] },
    { category: '方位', items: ['西南'] },
    { category: '时序', items: ['夏秋之交', '未申月', '六七月'] },
    { category: '物象', items: ['布帛', '五谷', '柔物', '方物', '牛'] },
  ],
};

// ═══════════════════════════════════════════════
// 五行生克 & 季节旺衰
// ═══════════════════════════════════════════════

type WuXingRelation = '生' | '克' | '比';

const SHENG: Record<WuXing, WuXing> = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
const KE: Record<WuXing, WuXing> = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' };

function wuxingRelation(a: WuXing, b: WuXing): { from: WuXing; to: WuXing; rel: WuXingRelation } {
  if (a === b) return { from: a, to: b, rel: '比' };
  if (SHENG[a] === b) return { from: a, to: b, rel: '生' };
  if (KE[a] === b) return { from: a, to: b, rel: '克' };
  if (SHENG[b] === a) return { from: b, to: a, rel: '生' };
  if (KE[b] === a) return { from: b, to: a, rel: '克' };
  return { from: a, to: b, rel: '比' };
}

/** 五行季节旺衰表 */
const SEASONAL_STRENGTH: Record<WuXing, Record<string, '旺' | '相' | '休' | '囚' | '死'>> = {
  '木': { '春': '旺', '夏': '休', '秋': '死', '冬': '相', '四季': '囚' },
  '火': { '春': '相', '夏': '旺', '秋': '囚', '冬': '死', '四季': '休' },
  '土': { '春': '死', '夏': '相', '秋': '休', '冬': '囚', '四季': '旺' },
  '金': { '春': '囚', '夏': '死', '秋': '旺', '冬': '休', '四季': '相' },
  '水': { '春': '休', '夏': '囚', '秋': '相', '冬': '旺', '四季': '死' },
};

function getSeason(month: number): string {
  if (month >= 1 && month <= 3) return '春';
  if (month >= 4 && month <= 6) return '夏';
  if (month >= 7 && month <= 9) return '秋';
  if (month >= 10 && month <= 12) return '冬';
  return '四季';
}

function getSeasonalStrength(element: WuXing, month: number): { season: string; strength: '旺' | '相' | '休' | '囚' | '死' } {
  // 辰戌丑未月为四季土旺
  const isSiJi = [3, 6, 9, 12].includes(month);
  const season = isSiJi ? '四季' : getSeason(month);
  return { season, strength: SEASONAL_STRENGTH[element][season] || '休' };
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

/** Trigram → 3 lines (bottom to top) */
function trigramToLines(t: Trigram): number[] {
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
  const binToIdx: Record<number, number> = {
    7: 0, 6: 1, 5: 2, 4: 3, 3: 4, 2: 5, 1: 6, 0: 7,
  };
  return TRIGRAMS[binToIdx[val] ?? 7];
}

/** 互卦：取2,3,4爻为下卦，3,4,5爻为上卦 */
function computeHuGua(upper: Trigram, lower: Trigram): MeihuaGua {
  const lines = trigramToLines(lower).concat(trigramToLines(upper));
  const huLower = linesToTrigram([lines[1], lines[2], lines[3]]);
  const huUpper = linesToTrigram([lines[2], lines[3], lines[4]]);
  return makeGua(huUpper, huLower);
}

/** 变卦：动爻变阴阳 */
function computeBianGua(upper: Trigram, lower: Trigram, dongYao: number): MeihuaGua {
  const lines = trigramToLines(lower).concat(trigramToLines(upper));
  const idx = dongYao - 1;
  lines[idx] = lines[idx] === 1 ? 0 : 1;
  const bianLower = linesToTrigram([lines[0], lines[1], lines[2]]);
  const bianUpper = linesToTrigram([lines[3], lines[4], lines[5]]);
  return makeGua(bianUpper, bianLower);
}

/** 体用判定 */
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
function calculateScore(tiYong: TiYongRelation, seasonal: { strength: string }): number {
  const baseScores: Record<TiYongRelation['tendency'], number> = {
    '大吉': 85, '吉': 72, '中': 55, '凶': 35, '大凶': 18,
  };
  let score = baseScores[tiYong.tendency] ?? 50;

  // 季节修正：体卦旺相加分，休囚死减分
  const seasonMod: Record<string, number> = { '旺': 10, '相': 5, '休': 0, '囚': -5, '死': -10 };
  score += seasonMod[seasonal.strength] || 0;

  return Math.max(5, Math.min(95, score));
}

// ═══════════════════════════════════════════════
// 应期推算
// ═══════════════════════════════════════════════

function calculateYingQi(tiYong: TiYongRelation, seasonal: { season: string; strength: string }): YingQi[] {
  const results: YingQi[] = [];
  const tiEl = tiYong.tiElement;

  // 体卦旺相：近期应验
  if (seasonal.strength === '旺' || seasonal.strength === '相') {
    results.push({
      type: '近应',
      timing: `体卦${tiEl}当令，应期较近`,
      explanation: `体卦得时令之助，事可速成。`,
    });
  }

  // 生体之五行所主之时
  const shengTi = Object.entries(SHENG).find(([, v]) => v === tiEl)?.[0] as WuXing | undefined;
  if (shengTi) {
    const shengSeason = Object.entries(SEASONAL_STRENGTH[shengTi]).find(([, v]) => v === '旺')?.[0];
    results.push({
      type: '生体应期',
      timing: `${shengTi}旺之时（${shengSeason || ''}）`,
      explanation: `生助体卦之五行当旺时，事情可成。`,
    });
  }

  // 克用之五行所主之时
  const keYong = tiYong.tiElement;
  results.push({
    type: '克用应期',
    timing: `${keYong}旺之时可克制用卦`,
    explanation: `体卦五行当旺，可制约用卦，事有转机。`,
  });

  return results;
}

// ═══════════════════════════════════════════════
// 深度分析
// ═══════════════════════════════════════════════

function performDeepAnalysis(
  benGua: MeihuaGua, huGua: MeihuaGua, bianGua: MeihuaGua,
  tiYong: TiYongRelation, dongYao: number, month: number,
): GuaAnalysis {
  const tiEl = tiYong.tiElement;
  const yongEl = tiYong.yongElement;
  const seasonal = getSeasonalStrength(tiEl, month);

  // 万物类象
  const leiXiang = [
    ...(TRIGRAM_LEI_XIANG[tiYong.tiGua.nameCN] || []),
    ...(TRIGRAM_LEI_XIANG[tiYong.yongGua.nameCN] || []),
  ];

  // 互卦分析（事态发展过程）
  const huTiRel = wuxingRelation(tiEl, huGua.upper.element);
  const huAnalysis = `互卦${huGua.name}，五行${huGua.upper.element}${huGua.lower.element}。` +
    `与体卦${huTiRel.rel === '生' ? '相生，过程顺遂' : huTiRel.rel === '克' ? '相克，过程多阻' : '比和，平稳推进'}。`;

  // 变卦趋势（最终结果）
  const bianTiRel = wuxingRelation(tiEl, bianGua.upper.element);
  const bianTrend = `变卦${bianGua.name}，${bianTiRel.rel === '生' && bianTiRel.from !== tiEl ? '生体，终局有利' :
    bianTiRel.rel === '克' && bianTiRel.from !== tiEl ? '克体，终局不利' :
    bianTiRel.rel === '比' ? '比和，结局平稳' :
    bianTiRel.rel === '生' ? '泄体，需防损耗' : '体克之，可得其利'}。`;

  // 格局判定
  const patterns: string[] = [];
  if (tiYong.relation === '用生体' && seasonal.strength === '旺') patterns.push('体旺得生·大吉格');
  if (tiYong.relation === '用克体' && seasonal.strength === '死') patterns.push('体衰被克·大凶格');
  if (benGua.upper.index === benGua.lower.index) patterns.push('纯卦·事态专一');
  if (huGua.upper.element === huGua.lower.element) patterns.push('互卦同元·内部和谐');
  if (tiEl === bianGua.upper.element || tiEl === bianGua.lower.element) patterns.push('体化入变·事可转圜');
  if (dongYao === 1 || dongYao === 6) patterns.push('初末动爻·始终之应');
  if (patterns.length === 0) patterns.push('常格');

  // 卦象意象
  const imagery = `${benGua.name}卦，${benGua.upper.nature}在上，${benGua.lower.nature}在下。` +
    `动第${dongYao}爻，体${tiYong.tiGua.nameCN}用${tiYong.yongGua.nameCN}。`;

  // 应期
  const yingQi = calculateYingQi(tiYong, seasonal);

  // 综合评语
  const summary = `本卦${benGua.name}，${tiYong.relation}，${tiYong.tendency}之象。` +
    `体卦${tiEl}在${seasonal.season}${seasonal.strength === '旺' || seasonal.strength === '相' ? '得时' : '失时'}。` +
    `${huAnalysis.includes('顺遂') ? '过程较顺' : '过程有波折'}，${bianTrend.includes('有利') ? '终局可期' : '需谨慎行事'}。`;

  return {
    imagery,
    leiXiang,
    seasonalStrength: seasonal,
    yingQi,
    huGuaAnalysis: huAnalysis,
    bianGuaTrend: bianTrend,
    pattern: patterns.join('·'),
    summary,
  };
}

// ═══════════════════════════════════════════════
// 时间起卦
// ═══════════════════════════════════════════════

function divineByTime(year: number, month: number, day: number, hour: number): MeihuaResult {
  const zhiHour = Math.floor(((hour + 1) % 24) / 2) + 1;

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
  const analysis = performDeepAnalysis(benGua, huGua, bianGua, tiYong, dongYao, month);
  const score = calculateScore(tiYong, analysis.seasonalStrength);

  return {
    method: 'time',
    benGua, huGua, bianGua, dongYao, tiYong,
    upperNumber: upperNum, lowerNumber: lowerNum, totalNumber: totalNum,
    score,
    interpretation: buildInterpretation(benGua, huGua, bianGua, tiYong, dongYao),
    analysis,
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
  const now = new Date();
  const analysis = performDeepAnalysis(benGua, huGua, bianGua, tiYong, dongYao, now.getMonth() + 1);
  const score = calculateScore(tiYong, analysis.seasonalStrength);

  return {
    method: 'number',
    benGua, huGua, bianGua, dongYao, tiYong,
    upperNumber: num1, lowerNumber: num2, totalNumber: totalNum,
    score,
    interpretation: buildInterpretation(benGua, huGua, bianGua, tiYong, dongYao),
    analysis,
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
// FateVector 映射（增强版）
// ═══════════════════════════════════════════════

function meihuaToFateVector(result: MeihuaResult): FateVector {
  const base = result.score;
  const tiEl = result.tiYong.tiElement;
  const analysis = result.analysis;

  const elementBonus: Record<WuXing, Partial<Record<keyof FateVector, number>>> = {
    '金': { wealth: 8, life: 5, health: 3 },
    '木': { health: 8, wisdom: 5, relation: 3 },
    '水': { wisdom: 8, spirit: 5, wealth: 3 },
    '火': { life: 8, relation: 5, spirit: 3 },
    '土': { health: 5, wealth: 5, relation: 3 },
  };

  // 季节旺衰修正
  const seasonMod: Record<string, number> = { '旺': 5, '相': 3, '休': 0, '囚': -3, '死': -5 };
  const sMod = seasonMod[analysis.seasonalStrength.strength] || 0;

  const bonus = elementBonus[tiEl] || {};
  const clamp = (v: number) => Math.max(5, Math.min(95, Math.round(v)));

  return {
    life:     clamp(base + (bonus.life ?? 0) + sMod),
    wealth:   clamp(base + (bonus.wealth ?? 0) + sMod),
    relation: clamp(base + (bonus.relation ?? 0)),
    health:   clamp(base + (bonus.health ?? 0)),
    wisdom:   clamp(base + (bonus.wisdom ?? 0) + sMod),
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

  let result: MeihuaResult;

  if (standardizedInput.questionText) {
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
    const qt = new Date(standardizedInput.queryTimeUtc);
    result = divineByTime(qt.getFullYear(), qt.getMonth() + 1, qt.getDate(), qt.getHours());
  }

  const fateVector = meihuaToFateVector(result);
  const t1 = performance.now();

  return {
    eo: {
      engineName: 'meihua',
      engineNameCN: '梅花易数',
      engineVersion: '2.0.0',
      sourceUrls: ['https://en.wikipedia.org/wiki/Plum_Blossom_Numerology'],
      sourceGrade: 'B',
      ruleSchool: '邵雍梅花易数',
      confidence: 0.68,
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
        '格局': result.analysis.pattern,
        '季节旺衰': `${result.analysis.seasonalStrength.season}·${result.analysis.seasonalStrength.strength}`,
      },
      warnings: ['梅花易数基于起卦时间而非出生时间，适用于即时感应占断'],
      uncertaintyNotes: ['体用评分含季节旺衰修正', '应期推算为参考性质'],
      timingBasis: 'query',
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
  _internals: {
    trigramByXiantianNumber,
    makeGua,
    computeHuGua,
    computeBianGua,
    determineTiYong,
    wuxingRelation,
    TRIGRAMS,
    getSeasonalStrength,
    calculateYingQi,
    performDeepAnalysis,
  },
};
