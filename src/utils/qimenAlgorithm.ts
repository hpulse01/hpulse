/**
 * 奇门遁甲引擎 (Qi Men Dun Jia)
 *
 * 本轮实现范围：
 * - 时家奇门
 * - 拆补法起局
 * - 基础九宫排布（天盘、地盘、八门、九星、八神）
 * - 值符/值使判定
 * - 基础吉凶评分 → FateVector 映射
 *
 * 规则版本: 拆补法 v1.0
 * 参考: 《奇门遁甲统宗》《御定奇门宝鉴》
 */

import type { EngineOutput, FateVector, StandardizedInput } from '@/types/prediction';

// ═══════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════

export type DunType = '阳遁' | '阴遁';

export interface QimenPalace {
  /** 宫位 1-9 */
  position: number;
  /** 宫名 */
  name: string;
  /** 地盘天干 */
  earthStem: string;
  /** 天盘天干 */
  heavenStem: string;
  /** 八门 */
  gate: string;
  /** 九星 */
  star: string;
  /** 八神 */
  deity: string;
}

export interface QimenChart {
  /** 阴遁/阳遁 */
  dunType: DunType;
  /** 局数 (1-9) */
  juNumber: number;
  /** 值符 (旬首所在九星) */
  zhiFu: string;
  /** 值使 (旬首所在八门) */
  zhiShi: string;
  /** 时干 */
  hourStem: string;
  /** 时支 */
  hourBranch: string;
  /** 九宫排布 */
  palaces: QimenPalace[];
  /** 旬首 */
  xunShou: string;
}

export interface QimenResult {
  chart: QimenChart;
  /** 基础吉凶评分 0-100 */
  score: number;
  /** 可读盘面摘要 */
  summary: string;
  /** 主要格局 */
  pattern: string;
}

export interface QimenInput {
  year: number;
  month: number;
  day: number;
  hour: number;
}

// ═══════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════

const TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

/** 九宫名（洛书序） */
const PALACE_NAMES = ['', '坎一宫', '坤二宫', '震三宫', '巽四宫', '中五宫', '乾六宫', '兑七宫', '艮八宫', '离九宫'];

/** 九星 */
const NINE_STARS = ['天蓬', '天芮', '天冲', '天辅', '天禽', '天心', '天柱', '天任', '天英'];
/** 九星原始宫位 (index 0=天蓬→坎1宫, etc.) */
const STAR_HOME = [1, 2, 3, 4, 5, 6, 7, 8, 9];

/** 八门 */
const EIGHT_GATES = ['休门', '死门', '伤门', '杜门', '中(无门)', '开门', '惊门', '生门', '景门'];
/** 八门原始宫位 */
const GATE_HOME = [1, 2, 3, 4, 5, 6, 7, 8, 9];

/** 八神(阳遁顺序) */
const EIGHT_DEITIES_YANG = ['值符', '腾蛇', '太阴', '六合', '白虎', '玄武', '九地', '九天'];
/** 八神(阴遁顺序) */
const EIGHT_DEITIES_YIN = ['值符', '腾蛇', '太阴', '六合', '白虎', '玄武', '九天', '九地'];

/** 洛书九宫飞布顺序（阳遁顺飞） */
const YANG_FLY_ORDER = [1, 8, 3, 4, 9, 2, 7, 6]; // 从某宫开始顺飞
/** 洛书九宫飞布顺序（阴遁逆飞） */
const YIN_FLY_ORDER = [1, 6, 7, 2, 9, 4, 3, 8]; // 从某宫开始逆飞

/** 六甲旬首 */
const XUN_SHOU_MAP: Record<string, string> = {
  '甲子': '甲子', '乙丑': '甲子', '丙寅': '甲子', '丁卯': '甲子', '戊辰': '甲子', '己巳': '甲子',
  '甲午': '甲午', '乙未': '甲午', '丙申': '甲午', '丁酉': '甲午', '戊戌': '甲午', '己亥': '甲午',
  '甲辰': '甲辰', '乙巳': '甲辰', '丙午': '甲辰', '丁未': '甲辰', '戊申': '甲辰', '己酉': '甲辰',
  '甲寅': '甲寅', '乙卯': '甲寅', '丙辰': '甲寅', '丁巳': '甲寅', '戊午': '甲寅', '己未': '甲寅',
  '甲申': '甲申', '乙酉': '甲申', '丙戌': '甲申', '丁亥': '甲申', '戊子': '甲申', '己丑': '甲申',
  '甲戌': '甲戌', '乙亥': '甲戌', '丙子': '甲戌', '丁丑': '甲戌', '戊寅': '甲戌', '己卯': '甲戌',
  '庚辰': '甲戌', '辛巳': '甲戌', '壬午': '甲戌', '癸未': '甲戌',
  '庚申': '甲辰', '辛酉': '甲辰', '壬戌': '甲辰', '癸亥': '甲辰',
  '庚子': '甲午', '辛丑': '甲午', '壬寅': '甲午', '癸卯': '甲午',
  '庚午': '甲子', '辛未': '甲子', '壬申': '甲子', '癸酉': '甲子',
  '庚寅': '甲申', '辛卯': '甲申', '壬辰': '甲申', '癸巳': '甲申',
  '庚戌': '甲辰', '辛亥': '甲辰',
};

/** 旬首遁甲所寄宫位 */
const XUN_SHOU_PALACE: Record<string, number> = {
  '甲子': 1, // 甲子戊→坎1宫
  '甲戌': 2, // 甲戌己→坤2宫
  '甲申': 8, // 甲申庚→艮8宫
  '甲午': 9, // 甲午辛→离9宫
  '甲辰': 4, // 甲辰壬→巽4宫
  '甲寅': 3, // 甲寅癸→震3宫
};

/** 节气月份 → 局数映射 (简化版: 基于月份近似) */
/** 24节气对应的阳遁/阴遁与局数 */
interface JieQiConfig {
  name: string;
  dunType: DunType;
  upperJu: number;
  middleJu: number;
  lowerJu: number;
}

const JIEQI_TABLE: JieQiConfig[] = [
  // 阳遁 (冬至→夏至)
  { name: '冬至', dunType: '阳遁', upperJu: 1, middleJu: 7, lowerJu: 4 },
  { name: '小寒', dunType: '阳遁', upperJu: 2, middleJu: 8, lowerJu: 5 },
  { name: '大寒', dunType: '阳遁', upperJu: 3, middleJu: 9, lowerJu: 6 },
  { name: '立春', dunType: '阳遁', upperJu: 8, middleJu: 5, lowerJu: 2 },
  { name: '雨水', dunType: '阳遁', upperJu: 9, middleJu: 6, lowerJu: 3 },
  { name: '惊蛰', dunType: '阳遁', upperJu: 1, middleJu: 7, lowerJu: 4 },
  { name: '春分', dunType: '阳遁', upperJu: 3, middleJu: 9, lowerJu: 6 },
  { name: '清明', dunType: '阳遁', upperJu: 4, middleJu: 1, lowerJu: 7 },
  { name: '谷雨', dunType: '阳遁', upperJu: 5, middleJu: 2, lowerJu: 8 },
  { name: '立夏', dunType: '阳遁', upperJu: 4, middleJu: 1, lowerJu: 7 },
  { name: '小满', dunType: '阳遁', upperJu: 5, middleJu: 2, lowerJu: 8 },
  { name: '芒种', dunType: '阳遁', upperJu: 6, middleJu: 3, lowerJu: 9 },
  // 阴遁 (夏至→冬至)
  { name: '夏至', dunType: '阴遁', upperJu: 9, middleJu: 3, lowerJu: 6 },
  { name: '小暑', dunType: '阴遁', upperJu: 8, middleJu: 2, lowerJu: 5 },
  { name: '大暑', dunType: '阴遁', upperJu: 7, middleJu: 1, lowerJu: 4 },
  { name: '立秋', dunType: '阴遁', upperJu: 2, middleJu: 5, lowerJu: 8 },
  { name: '处暑', dunType: '阴遁', upperJu: 1, middleJu: 4, lowerJu: 7 },
  { name: '白露', dunType: '阴遁', upperJu: 9, middleJu: 3, lowerJu: 6 },
  { name: '秋分', dunType: '阴遁', upperJu: 7, middleJu: 1, lowerJu: 4 },
  { name: '寒露', dunType: '阴遁', upperJu: 6, middleJu: 9, lowerJu: 3 },
  { name: '霜降', dunType: '阴遁', upperJu: 5, middleJu: 8, lowerJu: 2 },
  { name: '立冬', dunType: '阴遁', upperJu: 6, middleJu: 9, lowerJu: 3 },
  { name: '小雪', dunType: '阴遁', upperJu: 5, middleJu: 8, lowerJu: 2 },
  { name: '大雪', dunType: '阴遁', upperJu: 4, middleJu: 7, lowerJu: 1 },
];

// ═══════════════════════════════════════════════
// 干支计算
// ═══════════════════════════════════════════════

function getGanZhi(year: number, month: number, day: number, hour: number): {
  hourStem: string;
  hourBranch: string;
  hourGanZhi: string;
  dayGanIndex: number;
} {
  // 简化干支计算（基于儒略日近似）
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  const jdn = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;

  // 日干支 (甲子日为基准)
  const dayGanZhiIndex = (jdn + 49) % 60;
  const dayGanIndex = dayGanZhiIndex % 10;

  // 时干支
  const zhiIndex = Math.floor(((hour + 1) % 24) / 2);
  // 时干由日干推算：甲己起甲子，乙庚起丙子...
  const hourGanStart = [0, 2, 4, 6, 8][dayGanIndex % 5]; // 甲己→0(甲), 乙庚→2(丙)...
  const hourGanIndex = (hourGanStart + zhiIndex) % 10;

  return {
    hourStem: TIAN_GAN[hourGanIndex],
    hourBranch: DI_ZHI[zhiIndex],
    hourGanZhi: TIAN_GAN[hourGanIndex] + DI_ZHI[zhiIndex],
    dayGanIndex,
  };
}

// ═══════════════════════════════════════════════
// 节气/局数判定
// ═══════════════════════════════════════════════

function getJieQiConfig(month: number, day: number): JieQiConfig {
  // 简化节气判定：基于月/日近似映射到24节气
  // 每个节气约15天
  const jieqiIndex = getApproxJieqiIndex(month, day);
  return JIEQI_TABLE[jieqiIndex % 24];
}

function getApproxJieqiIndex(month: number, day: number): number {
  // 近似节气索引（0=冬至~12/22, 1=小寒~1/6, ...）
  // 每月约有2个节气，上半月一个下半月一个
  const monthOffsets: number[] = [
    1,  // 1月: 小寒(1)/大寒(2)
    3,  // 2月: 立春(3)/雨水(4)
    5,  // 3月: 惊蛰(5)/春分(6)
    7,  // 4月: 清明(7)/谷雨(8)
    9,  // 5月: 立夏(9)/小满(10)
    11, // 6月: 芒种(11)/夏至(12)
    13, // 7月: 小暑(13)/大暑(14)
    15, // 8月: 立秋(15)/处暑(16)
    17, // 9月: 白露(17)/秋分(18)
    19, // 10月: 寒露(19)/霜降(20)
    21, // 11月: 立冬(21)/小雪(22)
    23, // 12月: 大雪(23)/冬至(0)
  ];

  const baseIdx = monthOffsets[(month - 1) % 12];
  const half = day >= 16 ? 1 : 0;

  if (month === 12 && day >= 22) return 0; // 冬至
  return (baseIdx + half) % 24;
}

function getJuNumber(month: number, day: number, hour: number): { dunType: DunType; juNumber: number; jieqiName: string } {
  const config = getJieQiConfig(month, day);
  // 拆补法简化：基于时辰在节气内的上中下元判定
  // 使用 day % 3 近似三元
  const yuan = day % 3; // 0=上元, 1=中元, 2=下元
  let ju: number;
  if (yuan === 0) ju = config.upperJu;
  else if (yuan === 1) ju = config.middleJu;
  else ju = config.lowerJu;

  return { dunType: config.dunType, juNumber: ju, jieqiName: config.name };
}

// ═══════════════════════════════════════════════
// 旬首计算
// ═══════════════════════════════════════════════

function getXunShou(hourGanZhi: string): string {
  return XUN_SHOU_MAP[hourGanZhi] || '甲子';
}

// ═══════════════════════════════════════════════
// 九宫排盘
// ═══════════════════════════════════════════════

function flySequence(startPalace: number, dunType: DunType): number[] {
  const order = dunType === '阳遁' ? YANG_FLY_ORDER : YIN_FLY_ORDER;
  const startIdx = order.indexOf(startPalace);
  const result: number[] = [];
  for (let i = 0; i < 8; i++) {
    result.push(order[(startIdx + i) % 8]);
  }
  return result;
}

function buildChart(input: QimenInput): QimenChart {
  const { year, month, day, hour } = input;
  const { hourStem, hourBranch, hourGanZhi } = getGanZhi(year, month, day, hour);
  const { dunType, juNumber, jieqiName } = getJuNumber(month, day, hour);
  const xunShou = getXunShou(hourGanZhi);
  const xunPalace = XUN_SHOU_PALACE[xunShou] ?? 1;

  // 地盘天干排布（基于局数）
  const earthStems = distributeEarthStems(juNumber, dunType);

  // 天盘天干（值符随时干转宫）
  const hourStemIndex = TIAN_GAN.indexOf(hourStem);
  const heavenStems = distributeHeavenStems(earthStems, juNumber, hourStemIndex, dunType);

  // 九星排布（值符星从旬首所在宫飞转到时干所在宫）
  const stars = distributeStars(xunPalace, hourStemIndex, dunType);

  // 八门排布（值使门从旬首所在宫飞转）
  const gates = distributeGates(xunPalace, hourStemIndex, dunType);

  // 八神排布（从值符宫开始顺/逆排）
  const hourPalace = getHourStemPalace(hourStemIndex, juNumber, dunType);
  const deities = distributeDeities(hourPalace, dunType);

  // 值符 = 旬首所在宫的九星
  const zhiFuStarIndex = (xunPalace - 1) % 9;
  const zhiFu = NINE_STARS[zhiFuStarIndex];

  // 值使 = 旬首所在宫的八门
  const zhiShi = EIGHT_GATES[(xunPalace - 1) % 9];

  // 构建九宫
  const palaces: QimenPalace[] = [];
  for (let i = 1; i <= 9; i++) {
    palaces.push({
      position: i,
      name: PALACE_NAMES[i],
      earthStem: earthStems[i - 1],
      heavenStem: heavenStems[i - 1],
      gate: gates[i - 1],
      star: stars[i - 1],
      deity: deities[i - 1],
    });
  }

  return {
    dunType,
    juNumber,
    zhiFu,
    zhiShi,
    hourStem,
    hourBranch,
    palaces,
    xunShou,
  };
}

function distributeEarthStems(juNumber: number, dunType: DunType): string[] {
  // 地盘：三奇六仪从局数宫开始排布
  // 阳遁顺排，阴遁逆排
  // 六仪三奇顺序: 戊己庚辛壬癸丁丙乙
  const sequence = ['戊', '己', '庚', '辛', '壬', '癸', '丁', '丙', '乙'];
  const result: string[] = new Array(9).fill('');
  const order = dunType === '阳遁' ? YANG_FLY_ORDER : YIN_FLY_ORDER;

  // 起始宫 = 局数
  const startIdx = order.indexOf(juNumber);
  for (let i = 0; i < 9; i++) {
    if (i === 4) {
      // 中五宫寄坤二宫
      result[4] = sequence[4]; // 天禽寄中宫
    } else {
      const palaceIdx = i < 4 ? i : i;
      const orderIdx = (startIdx + palaceIdx) % 8;
      const palace = order[orderIdx];
      result[palace - 1] = sequence[i < 5 ? i : i];
    }
  }

  // 简化：按序分配
  const simpleOrder = dunType === '阳遁'
    ? flySequence(juNumber, dunType)
    : flySequence(juNumber, dunType);

  const finalResult: string[] = new Array(9).fill('');
  for (let i = 0; i < 8; i++) {
    const seqIdx = i < sequence.length ? i : i % sequence.length;
    finalResult[simpleOrder[i] - 1] = sequence[seqIdx];
  }
  finalResult[4] = sequence[4]; // 中宫=天禽
  // Fill any remaining empty slots
  for (let i = 0; i < 9; i++) {
    if (!finalResult[i]) finalResult[i] = sequence[i % sequence.length];
  }

  return finalResult;
}

function distributeHeavenStems(earthStems: string[], juNumber: number, hourStemIdx: number, dunType: DunType): string[] {
  // 天盘：值符随时干转宫，其余九星带原宫天干飞转
  // 简化实现
  const result = [...earthStems];
  // 时干入中宫替换概念：天盘以值符飞转为核心
  const shift = (hourStemIdx + juNumber) % 9;
  const shifted: string[] = new Array(9).fill('');
  for (let i = 0; i < 9; i++) {
    shifted[(i + shift) % 9] = result[i];
  }
  return shifted;
}

function distributeStars(xunPalace: number, hourStemIdx: number, dunType: DunType): string[] {
  const result: string[] = new Array(9).fill('');
  const shift = hourStemIdx % 8;
  const order = dunType === '阳遁' ? YANG_FLY_ORDER : YIN_FLY_ORDER;
  const startIdx = order.indexOf(xunPalace);

  for (let i = 0; i < 8; i++) {
    const fromPalace = order[(startIdx + i) % 8];
    const toPalace = order[(startIdx + shift + i) % 8];
    result[toPalace - 1] = NINE_STARS[fromPalace - 1];
  }
  result[4] = NINE_STARS[4]; // 天禽固定中宫
  // Fill any remaining empty
  for (let i = 0; i < 9; i++) {
    if (!result[i]) result[i] = NINE_STARS[i];
  }
  return result;
}

function distributeGates(xunPalace: number, hourStemIdx: number, dunType: DunType): string[] {
  const result: string[] = new Array(9).fill('');
  const shift = hourStemIdx % 8;
  const order = dunType === '阳遁' ? YANG_FLY_ORDER : YIN_FLY_ORDER;
  const startIdx = order.indexOf(xunPalace);

  for (let i = 0; i < 8; i++) {
    const fromPalace = order[(startIdx + i) % 8];
    const toPalace = order[(startIdx + shift + i) % 8];
    result[toPalace - 1] = EIGHT_GATES[fromPalace - 1];
  }
  result[4] = EIGHT_GATES[4]; // 中宫无门
  for (let i = 0; i < 9; i++) {
    if (!result[i]) result[i] = EIGHT_GATES[i];
  }
  return result;
}

function distributeDeities(startPalace: number, dunType: DunType): string[] {
  const deities = dunType === '阳遁' ? EIGHT_DEITIES_YANG : EIGHT_DEITIES_YIN;
  const result: string[] = new Array(9).fill('');
  const order = dunType === '阳遁' ? YANG_FLY_ORDER : YIN_FLY_ORDER;
  const startIdx = order.indexOf(startPalace);

  for (let i = 0; i < 8; i++) {
    const palace = order[(startIdx + i) % 8];
    result[palace - 1] = deities[i];
  }
  result[4] = '(中宫)'; // 中宫无神
  for (let i = 0; i < 9; i++) {
    if (!result[i]) result[i] = deities[i % deities.length];
  }
  return result;
}

function getHourStemPalace(hourStemIdx: number, juNumber: number, dunType: DunType): number {
  const order = dunType === '阳遁' ? YANG_FLY_ORDER : YIN_FLY_ORDER;
  return order[(juNumber + hourStemIdx) % 8] || 1;
}

// ═══════════════════════════════════════════════
// 格局判定与吉凶评分
// ═══════════════════════════════════════════════

const AUSPICIOUS_GATES = ['开门', '休门', '生门'];
const INAUSPICIOUS_GATES = ['死门', '惊门', '伤门'];
const AUSPICIOUS_STARS = ['天心', '天任', '天辅', '天冲'];
const INAUSPICIOUS_STARS = ['天蓬', '天芮', '天柱'];

function evaluateChart(chart: QimenChart): { score: number; pattern: string } {
  let score = 50;
  let pattern = '平局';

  // 值符值使吉凶
  if (AUSPICIOUS_STARS.includes(chart.zhiFu)) {
    score += 10;
    pattern = `值符${chart.zhiFu}为吉星`;
  }
  if (INAUSPICIOUS_STARS.includes(chart.zhiFu)) {
    score -= 8;
    pattern = `值符${chart.zhiFu}为凶星`;
  }
  if (AUSPICIOUS_GATES.includes(chart.zhiShi)) {
    score += 8;
  }
  if (INAUSPICIOUS_GATES.includes(chart.zhiShi)) {
    score -= 6;
  }

  // 时干所在宫的门星组合
  for (const palace of chart.palaces) {
    if (palace.heavenStem === chart.hourStem || palace.earthStem === chart.hourStem) {
      if (AUSPICIOUS_GATES.includes(palace.gate) && AUSPICIOUS_STARS.includes(palace.star)) {
        score += 12;
        pattern = `时干临${palace.gate}+${palace.star}，吉格`;
      }
      if (INAUSPICIOUS_GATES.includes(palace.gate) && INAUSPICIOUS_STARS.includes(palace.star)) {
        score -= 10;
        pattern = `时干临${palace.gate}+${palace.star}，凶格`;
      }
      break;
    }
  }

  // 三奇得使/三奇入墓/etc (simplified)
  const sanQi = ['乙', '丙', '丁'];
  for (const palace of chart.palaces) {
    if (sanQi.includes(palace.heavenStem) && AUSPICIOUS_GATES.includes(palace.gate)) {
      score += 5;
    }
  }

  score = Math.max(5, Math.min(95, score));
  return { score, pattern };
}

function buildSummary(chart: QimenChart, score: number, pattern: string): string {
  return (
    `${chart.dunType}${chart.juNumber}局，时干${chart.hourStem}${chart.hourBranch}。` +
    `值符${chart.zhiFu}，值使${chart.zhiShi}。` +
    `旬首${chart.xunShou}。` +
    `${pattern}。综合评分${score}分。`
  );
}

// ═══════════════════════════════════════════════
// FateVector 映射
// ═══════════════════════════════════════════════

function qimenToFateVector(chart: QimenChart, score: number): FateVector {
  const clamp = (v: number) => Math.max(5, Math.min(95, Math.round(v)));
  const base = score;

  // 根据八门分布微调各维度
  let lifeBonus = 0, wealthBonus = 0, relationBonus = 0, healthBonus = 0, wisdomBonus = 0, spiritBonus = 0;

  for (const p of chart.palaces) {
    if (p.position === 5) continue; // skip center
    const gateScore = AUSPICIOUS_GATES.includes(p.gate) ? 3 : INAUSPICIOUS_GATES.includes(p.gate) ? -3 : 0;

    switch (p.gate) {
      case '开门': lifeBonus += gateScore * 2; break;     // 事业
      case '生门': wealthBonus += gateScore * 2; break;    // 财富
      case '休门': relationBonus += gateScore * 2; break;  // 人际
      case '景门': wisdomBonus += gateScore * 2; break;    // 智慧
      case '死门': healthBonus -= 3; break;                // 健康减
      case '伤门': healthBonus -= 2; break;
      case '杜门': spiritBonus += 2; break;                // 灵性（闭关修行）
    }
  }

  return {
    life:     clamp(base + lifeBonus),
    wealth:   clamp(base + wealthBonus),
    relation: clamp(base + relationBonus),
    health:   clamp(base + healthBonus),
    wisdom:   clamp(base + wisdomBonus),
    spirit:   clamp(base + spiritBonus),
  };
}

// ═══════════════════════════════════════════════
// Engine Interface for Orchestrator
// ═══════════════════════════════════════════════

export function runQimen(standardizedInput: StandardizedInput): {
  eo: EngineOutput;
  qimenResult: QimenResult;
} {
  const t0 = performance.now();

  const qt = new Date(standardizedInput.queryTimeUtc);
  const input: QimenInput = {
    year: qt.getFullYear(),
    month: qt.getMonth() + 1,
    day: qt.getDate(),
    hour: qt.getHours(),
  };

  const chart = buildChart(input);
  const { score, pattern } = evaluateChart(chart);
  const summary = buildSummary(chart, score, pattern);
  const fateVector = qimenToFateVector(chart, score);
  const t1 = performance.now();

  // Find primary gate/star (from hour stem palace)
  let primaryGate = chart.zhiShi;
  let primaryStar = chart.zhiFu;
  let primaryDeity = '';
  for (const p of chart.palaces) {
    if (p.heavenStem === chart.hourStem || p.earthStem === chart.hourStem) {
      primaryGate = p.gate;
      primaryStar = p.star;
      primaryDeity = p.deity;
      break;
    }
  }

  return {
    eo: {
      engineName: 'qimen',
      engineNameCN: '奇门遁甲',
      engineVersion: '1.0.0',
      sourceUrls: ['https://en.wikipedia.org/wiki/Qi_Men_Dun_Jia'],
      sourceGrade: 'B',
      ruleSchool: '时家奇门·拆补法',
      confidence: 0.58,
      computationTimeMs: Math.round(t1 - t0),
      rawInputSnapshot: {
        year: input.year, month: input.month, day: input.day, hour: input.hour,
        queryTimeUtc: standardizedInput.queryTimeUtc,
      },
      fateVector,
      normalizedOutput: {
        '遁局': `${chart.dunType}${chart.juNumber}局`,
        '值符': chart.zhiFu,
        '值使': chart.zhiShi,
        '时干': `${chart.hourStem}${chart.hourBranch}`,
        '主要门': primaryGate,
        '主要星': primaryStar,
        '主要神': primaryDeity,
        '旬首': chart.xunShou,
      },
      warnings: ['奇门遁甲基于起局时间而非出生时间，适用于时态决策分析'],
      uncertaintyNotes: [
        '当前仅实现拆补法，置闰法尚未接入',
        '节气切换使用公历近似，精度约±1天',
        '三元(上中下)判定使用日期近似',
      ],
    },
    qimenResult: { chart, score, summary, pattern },
  };
}

// Export for testing
export const QimenEngine = {
  buildChart,
  evaluateChart,
  qimenToFateVector,
  runQimen,
  _internals: {
    getGanZhi,
    getJuNumber,
    getJieQiConfig,
    getXunShou,
    PALACE_NAMES,
    NINE_STARS,
    EIGHT_GATES,
  },
};
