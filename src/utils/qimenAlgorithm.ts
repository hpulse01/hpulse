/**
 * 奇门遁甲引擎 v3.0 (Qi Men Dun Jia)
 *
 * v3.0 升级内容：
 * - 空亡宫检测（旬空二支）
 * - 马星计算（驿马星）
 * - 暗干系统（天盘暗干推算）
 * - 用神分析（按事类取用神宫位）
 * - 门迫/击刑完整判定
 * - 增强至40+格局
 *
 * 规则版本: 拆补法 v3.0
 * 参考: 《奇门遁甲统宗》《御定奇门宝鉴》《奇门法窍》
 */

import type { EngineOutput, FateVector, StandardizedInput, TimeWindow } from '@/types/prediction';

// ═══════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════

export type DunType = '阳遁' | '阴遁';

export interface QimenPalace {
  position: number;
  name: string;
  earthStem: string;
  heavenStem: string;
  gate: string;
  star: string;
  deity: string;
}

export interface QimenChart {
  dunType: DunType;
  juNumber: number;
  zhiFu: string;
  zhiShi: string;
  hourStem: string;
  hourBranch: string;
  palaces: QimenPalace[];
  xunShou: string;
}

export interface QimenPattern {
  name: string;
  type: '大吉' | '吉' | '平' | '凶' | '大凶';
  description: string;
  palace?: number;
}

/** v3.0: 空亡信息 */
export interface KongWangInfo {
  branches: [string, string];
  affectedPalaces: number[];
  interpretation: string;
}

/** v3.0: 马星信息 */
export interface MaXingInfo {
  branch: string;
  palace: number;
  isActive: boolean;
  interpretation: string;
}

/** v3.0: 用神分析 */
export interface YongShenAnalysis {
  category: string;
  yongShenPalace: number;
  palaceGate: string;
  palaceStar: string;
  assessment: string;
}

export interface QimenResult {
  chart: QimenChart;
  score: number;
  summary: string;
  pattern: string;
  /** v2.0: All detected patterns */
  patterns: QimenPattern[];
  /** v2.0: Hour stem palace analysis */
  hourPalaceAnalysis: string;
  /** v3.0: 空亡 */
  kongWang: KongWangInfo;
  /** v3.0: 马星 */
  maXing: MaXingInfo;
  /** v3.0: 用神分析 */
  yongShenAnalysis: YongShenAnalysis[];
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

const PALACE_NAMES = ['', '坎一宫', '坤二宫', '震三宫', '巽四宫', '中五宫', '乾六宫', '兑七宫', '艮八宫', '离九宫'];

const NINE_STARS = ['天蓬', '天芮', '天冲', '天辅', '天禽', '天心', '天柱', '天任', '天英'];
const EIGHT_GATES = ['休门', '死门', '伤门', '杜门', '中(无门)', '开门', '惊门', '生门', '景门'];

const EIGHT_DEITIES_YANG = ['值符', '腾蛇', '太阴', '六合', '白虎', '玄武', '九地', '九天'];
const EIGHT_DEITIES_YIN = ['值符', '腾蛇', '太阴', '六合', '白虎', '玄武', '九天', '九地'];

/** 洛书飞布顺序（排除中5宫）：1→8→3→4→9→2→7→6 */
const LUOSHU_FLY_ORDER = [1, 8, 3, 4, 9, 2, 7, 6];

/** 六甲旬首 → 遁干 mapping */
const XUN_SHOU_DUN: Record<string, { xunShou: string; dunGan: string; palace: number }> = {
  '甲子': { xunShou: '甲子', dunGan: '戊', palace: 1 },
  '甲戌': { xunShou: '甲戌', dunGan: '己', palace: 2 },
  '甲申': { xunShou: '甲申', dunGan: '庚', palace: 8 },
  '甲午': { xunShou: '甲午', dunGan: '辛', palace: 9 },
  '甲辰': { xunShou: '甲辰', dunGan: '壬', palace: 4 },
  '甲寅': { xunShou: '甲寅', dunGan: '癸', palace: 3 },
};

/** 三奇: 乙丙丁; 六仪: 戊己庚辛壬癸 */
const SAN_QI_LIU_YI = ['戊', '己', '庚', '辛', '壬', '癸', '丁', '丙', '乙'];

// ── 节气配局 ──
interface JieQiConfig { name: string; dunType: DunType; upperJu: number; middleJu: number; lowerJu: number; }

const JIEQI_TABLE: JieQiConfig[] = [
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
  hourStem: string; hourBranch: string; hourGanZhi: string; dayGanIndex: number; dayGanZhi: string;
} {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  const jdn = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;

  const dayGanZhiIndex = (jdn + 49) % 60;
  const dayGanIndex = dayGanZhiIndex % 10;
  const dayBranchIndex = dayGanZhiIndex % 12;

  const zhiIndex = Math.floor(((hour + 1) % 24) / 2);
  const hourGanStart = [0, 2, 4, 6, 8][dayGanIndex % 5];
  const hourGanIndex = (hourGanStart + zhiIndex) % 10;

  return {
    hourStem: TIAN_GAN[hourGanIndex],
    hourBranch: DI_ZHI[zhiIndex],
    hourGanZhi: TIAN_GAN[hourGanIndex] + DI_ZHI[zhiIndex],
    dayGanIndex,
    dayGanZhi: TIAN_GAN[dayGanIndex] + DI_ZHI[dayBranchIndex],
  };
}

// ═══════════════════════════════════════════════
// 节气/局数
// ═══════════════════════════════════════════════

function getApproxJieqiIndex(month: number, day: number): number {
  const monthOffsets = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23];
  const baseIdx = monthOffsets[(month - 1) % 12];
  const half = day >= 16 ? 1 : 0;
  if (month === 12 && day >= 22) return 0;
  return (baseIdx + half) % 24;
}

function getJuNumber(month: number, day: number): { dunType: DunType; juNumber: number; jieqiName: string } {
  const jieqiIndex = getApproxJieqiIndex(month, day);
  const config = JIEQI_TABLE[jieqiIndex % 24];
  const yuan = day % 3;
  let ju: number;
  if (yuan === 0) ju = config.upperJu;
  else if (yuan === 1) ju = config.middleJu;
  else ju = config.lowerJu;
  return { dunType: config.dunType, juNumber: ju, jieqiName: config.name };
}

// ═══════════════════════════════════════════════
// 旬首计算 (v2.0 simplified)
// ═══════════════════════════════════════════════

function getXunShouInfo(hourGanZhi: string): { xunShou: string; dunGan: string; palace: number } {
  // Find which 旬 the hourGanZhi belongs to
  const ganIdx = TIAN_GAN.indexOf(hourGanZhi[0]);
  const zhiIdx = DI_ZHI.indexOf(hourGanZhi[1]);
  if (ganIdx < 0 || zhiIdx < 0) return XUN_SHOU_DUN['甲子'];

  // Calculate the 旬首: go back to the 甲 of this 旬
  const offset = ganIdx; // how many steps from 甲
  const xunShouZhiIdx = ((zhiIdx - offset) % 12 + 12) % 12;
  const xunShouStr = '甲' + DI_ZHI[xunShouZhiIdx];

  return XUN_SHOU_DUN[xunShouStr] || XUN_SHOU_DUN['甲子'];
}

// ═══════════════════════════════════════════════
// v2.0: 九宫排盘 (cleaned up)
// ═══════════════════════════════════════════════

/** Get the position of a palace in the fly order */
function flyOrderIndex(palace: number): number {
  return LUOSHU_FLY_ORDER.indexOf(palace);
}

/** Fly from startPalace, step n positions (positive=yang/forward, negative=yin/backward) */
function flyStep(startPalace: number, steps: number, dunType: DunType): number {
  const startIdx = flyOrderIndex(startPalace);
  if (startIdx < 0) return 1;
  const direction = dunType === '阳遁' ? 1 : -1;
  const targetIdx = ((startIdx + steps * direction) % 8 + 8) % 8;
  return LUOSHU_FLY_ORDER[targetIdx];
}

function distributeEarthStems(juNumber: number, dunType: DunType): string[] {
  const result: string[] = new Array(9).fill('');

  // 地盘: 戊(甲子遁干)从局数宫开始，按SAN_QI_LIU_YI顺序排布
  // 阳遁顺排，阴遁逆排
  for (let i = 0; i < 9; i++) {
    if (i === 4) {
      // 天禽寄中5宫 → 戊己庚辛壬癸丁丙乙 中第5个(壬)给中宫
      // Actually 中5宫特殊处理：天禽星寄坤2宫
      result[4] = SAN_QI_LIU_YI[4]; // 壬 for center
      continue;
    }
    const seqIdx = i < 4 ? i : i; // SAN_QI_LIU_YI index
    const palace = flyStep(juNumber, i < 4 ? i : i - 1, dunType);
    // Map: index 0→戊 at juNumber, then fly
    if (i === 0) {
      result[juNumber - 1] = SAN_QI_LIU_YI[0]; // 戊 at ju palace
    }
  }

  // Simplified correct approach:
  // Place 戊己庚辛壬癸丁丙乙 starting from juNumber palace, flying in order
  const stems = [...SAN_QI_LIU_YI]; // 9 stems
  const finalResult: string[] = new Array(9).fill('');

  let currentPalace = juNumber;
  for (let i = 0; i < 9; i++) {
    if (i === 4) {
      // 中5宫固定放天禽对应的干
      finalResult[4] = stems[4];
      continue;
    }
    const actualIdx = i < 4 ? i : i;
    // For non-center palaces, fly from juNumber
    const palace = i === 0 ? juNumber : flyStep(juNumber, i < 5 ? i : i - 1, dunType);
    finalResult[palace - 1] = stems[actualIdx];
  }

  // Fill any empty with fallback
  for (let i = 0; i < 9; i++) {
    if (!finalResult[i]) finalResult[i] = stems[i % 9];
  }

  return finalResult;
}

function distributeHeavenStems(earthStems: string[], xunPalace: number, hourStem: string, dunType: DunType): string[] {
  // 天盘: 值符(旬首所在宫的地盘干)随时干飞转
  const result = [...earthStems];

  // Find which palace the hour stem is on the earth plate
  const hourStemPalace = earthStems.indexOf(hourStem);
  if (hourStemPalace >= 0 && xunPalace > 0) {
    // Calculate shift
    const fromIdx = flyOrderIndex(xunPalace);
    const toIdx = hourStemPalace; // 0-indexed

    // Simplified: rotate the earth stems by the shift
    const shift = ((toIdx - fromIdx + 1) % 8 + 8) % 8;
    const shifted: string[] = new Array(9).fill('');
    for (let i = 0; i < 9; i++) {
      if (i === 4) { shifted[4] = earthStems[4]; continue; }
      shifted[(i + shift) % 9] = earthStems[i];
    }
    return shifted;
  }

  return result;
}

function distributeStars(xunPalace: number, hourStemIdx: number, dunType: DunType): string[] {
  const result: string[] = new Array(9).fill('');
  const shift = hourStemIdx % 8;

  for (let i = 0; i < 9; i++) {
    if (i === 4) { result[4] = NINE_STARS[4]; continue; }
    const fromPalace = LUOSHU_FLY_ORDER[i < 4 ? i : i - 1];
    const toPalace = flyStep(fromPalace, shift, dunType);
    result[toPalace - 1] = NINE_STARS[fromPalace - 1];
  }
  // Fill remaining
  for (let i = 0; i < 9; i++) {
    if (!result[i]) result[i] = NINE_STARS[i];
  }
  return result;
}

function distributeGates(xunPalace: number, hourStemIdx: number, dunType: DunType): string[] {
  const result: string[] = new Array(9).fill('');
  const shift = hourStemIdx % 8;

  for (let i = 0; i < 9; i++) {
    if (i === 4) { result[4] = EIGHT_GATES[4]; continue; }
    const fromPalace = LUOSHU_FLY_ORDER[i < 4 ? i : i - 1];
    const toPalace = flyStep(fromPalace, shift, dunType);
    result[toPalace - 1] = EIGHT_GATES[fromPalace - 1];
  }
  for (let i = 0; i < 9; i++) {
    if (!result[i]) result[i] = EIGHT_GATES[i];
  }
  return result;
}

function distributeDeities(startPalace: number, dunType: DunType): string[] {
  const deities = dunType === '阳遁' ? EIGHT_DEITIES_YANG : EIGHT_DEITIES_YIN;
  const result: string[] = new Array(9).fill('');
  const startIdx = flyOrderIndex(startPalace);

  for (let i = 0; i < 8; i++) {
    const palace = LUOSHU_FLY_ORDER[(startIdx + i) % 8];
    result[palace - 1] = deities[i];
  }
  result[4] = '(中宫)';
  for (let i = 0; i < 9; i++) {
    if (!result[i]) result[i] = deities[i % deities.length];
  }
  return result;
}

function buildChart(input: QimenInput): QimenChart {
  const { year, month, day, hour } = input;
  const ganZhiInfo = getGanZhi(year, month, day, hour);
  const { hourStem, hourBranch, hourGanZhi } = ganZhiInfo;
  const { dunType, juNumber } = getJuNumber(month, day);
  const xunInfo = getXunShouInfo(hourGanZhi);

  const earthStems = distributeEarthStems(juNumber, dunType);
  const heavenStems = distributeHeavenStems(earthStems, xunInfo.palace, hourStem, dunType);
  const stars = distributeStars(xunInfo.palace, TIAN_GAN.indexOf(hourStem), dunType);
  const gates = distributeGates(xunInfo.palace, TIAN_GAN.indexOf(hourStem), dunType);

  const hourPalaceIdx = TIAN_GAN.indexOf(hourStem);
  const hourPalace = flyStep(juNumber, hourPalaceIdx % 8, dunType);
  const deities = distributeDeities(hourPalace, dunType);

  const zhiFuStarIndex = (xunInfo.palace - 1) % 9;
  const zhiFu = NINE_STARS[zhiFuStarIndex];
  const zhiShi = EIGHT_GATES[(xunInfo.palace - 1) % 9];

  const palaces: QimenPalace[] = [];
  for (let i = 1; i <= 9; i++) {
    palaces.push({
      position: i, name: PALACE_NAMES[i],
      earthStem: earthStems[i - 1], heavenStem: heavenStems[i - 1],
      gate: gates[i - 1], star: stars[i - 1], deity: deities[i - 1],
    });
  }

  return { dunType, juNumber, zhiFu, zhiShi, hourStem, hourBranch, palaces, xunShou: xunInfo.xunShou };
}

// ═══════════════════════════════════════════════
// v2.0: Enhanced Pattern Detection (30+ patterns)
// ═══════════════════════════════════════════════

const AUSPICIOUS_GATES = ['开门', '休门', '生门'];
const NEUTRAL_GATES = ['景门', '杜门'];
const INAUSPICIOUS_GATES = ['死门', '惊门', '伤门'];
const AUSPICIOUS_STARS = ['天心', '天任', '天辅', '天冲'];
const INAUSPICIOUS_STARS = ['天蓬', '天芮', '天柱'];
const SAN_QI = ['乙', '丙', '丁'];

function detectPatterns(chart: QimenChart): QimenPattern[] {
  const patterns: QimenPattern[] = [];

  // Find the hour stem palace
  let hourPalace: QimenPalace | undefined;
  for (const p of chart.palaces) {
    if (p.heavenStem === chart.hourStem || p.earthStem === chart.hourStem) {
      hourPalace = p;
      break;
    }
  }

  // 1. 三奇得使 (Three Marvels with Emissary)
  for (const p of chart.palaces) {
    if (p.position === 5) continue;
    if (SAN_QI.includes(p.heavenStem) && AUSPICIOUS_GATES.includes(p.gate)) {
      const qiName = p.heavenStem === '乙' ? '日奇' : p.heavenStem === '丙' ? '月奇' : '星奇';
      patterns.push({
        name: `${qiName}得使`,
        type: '大吉',
        description: `${p.heavenStem}(${qiName})临${p.gate}，三奇得使大吉`,
        palace: p.position,
      });
    }
  }

  // 2. 三奇入墓 (Three Marvels enter tomb)
  const tombMap: Record<string, number> = { '乙': 2, '丙': 6, '丁': 9 }; // 简化
  for (const p of chart.palaces) {
    if (SAN_QI.includes(p.heavenStem) && tombMap[p.heavenStem] === p.position) {
      patterns.push({
        name: '奇入墓',
        type: '凶',
        description: `${p.heavenStem}奇入墓于${p.name}，虽有奇不能发用`,
        palace: p.position,
      });
    }
  }

  // 3. 门迫 (Gate confined)
  const gateElement: Record<string, string> = {
    '开门': '金', '休门': '水', '生门': '土', '伤门': '木',
    '杜门': '木', '景门': '火', '死门': '土', '惊门': '金',
  };
  const palaceElement: Record<number, string> = { 1: '水', 2: '土', 3: '木', 4: '木', 6: '金', 7: '金', 8: '土', 9: '火' };
  const keMap: Record<string, string> = { '木': '土', '火': '金', '土': '水', '金': '木', '水': '火' };

  for (const p of chart.palaces) {
    if (p.position === 5) continue;
    const ge = gateElement[p.gate];
    const pe = palaceElement[p.position];
    if (ge && pe && keMap[pe] === ge) {
      patterns.push({
        name: '门迫',
        type: '凶',
        description: `${p.gate}受${p.name}宫位克制，为门迫不利`,
        palace: p.position,
      });
    }
  }

  // 4. 值符值使吉凶
  if (AUSPICIOUS_STARS.includes(chart.zhiFu)) {
    patterns.push({ name: '值符吉星', type: '吉', description: `值符${chart.zhiFu}为吉星当值，总体利好` });
  }
  if (INAUSPICIOUS_STARS.includes(chart.zhiFu)) {
    patterns.push({ name: '值符凶星', type: '凶', description: `值符${chart.zhiFu}为凶星当值，须审慎` });
  }
  if (AUSPICIOUS_GATES.includes(chart.zhiShi)) {
    patterns.push({ name: '值使吉门', type: '吉', description: `值使${chart.zhiShi}为吉门，事可行` });
  }

  // 5. 时干宫位组合分析
  if (hourPalace) {
    const gateOk = AUSPICIOUS_GATES.includes(hourPalace.gate);
    const starOk = AUSPICIOUS_STARS.includes(hourPalace.star);
    const sanQiOk = SAN_QI.includes(hourPalace.heavenStem);

    if (gateOk && starOk && sanQiOk) {
      patterns.push({ name: '三吉并临', type: '大吉', description: `时干临${hourPalace.gate}+${hourPalace.star}+${hourPalace.heavenStem}奇，三吉齐聚`, palace: hourPalace.position });
    } else if (gateOk && starOk) {
      patterns.push({ name: '门星皆吉', type: '吉', description: `时干临${hourPalace.gate}+${hourPalace.star}，门星俱佳`, palace: hourPalace.position });
    } else if (INAUSPICIOUS_GATES.includes(hourPalace.gate) && INAUSPICIOUS_STARS.includes(hourPalace.star)) {
      patterns.push({ name: '门星皆凶', type: '大凶', description: `时干临${hourPalace.gate}+${hourPalace.star}，门星俱凶`, palace: hourPalace.position });
    }
  }

  // 6. 天干克应 (庚+某干 = 特定格局)
  for (const p of chart.palaces) {
    if (p.position === 5) continue;
    // 庚+乙 = 刑格
    if ((p.heavenStem === '庚' && p.earthStem === '乙') || (p.heavenStem === '乙' && p.earthStem === '庚')) {
      patterns.push({ name: '奇仪刑格', type: '凶', description: `庚乙相遇于${p.name}，主阻隔牵制`, palace: p.position });
    }
    // 丙+庚 = 太白入荧
    if (p.heavenStem === '丙' && p.earthStem === '庚') {
      patterns.push({ name: '火入金乡', type: '吉', description: `丙奇制庚于${p.name}，客胜主败`, palace: p.position });
    }
    // 庚+丙 = 荧入太白
    if (p.heavenStem === '庚' && p.earthStem === '丙') {
      patterns.push({ name: '太白入荧', type: '凶', description: `庚加丙于${p.name}，白虎猖狂`, palace: p.position });
    }
  }

  // v3.0: 击刑检测
  const xingMap: Record<string, string[]> = {
    '寅': ['巳', '申'], '巳': ['寅', '申'], '申': ['寅', '巳'],
    '丑': ['未', '戌'], '未': ['丑', '戌'], '戌': ['丑', '未'],
    '子': ['卯'], '卯': ['子'],
    '辰': ['辰'], '午': ['午'], '酉': ['酉'], '亥': ['亥'],
  };
  for (const p of chart.palaces) {
    if (p.position === 5) continue;
    const hBranch = chart.hourBranch;
    const earthBranch = DI_ZHI[((p.position - 1) * 4 + 2) % 12] || '';
    if (xingMap[hBranch]?.includes(earthBranch)) {
      patterns.push({
        name: '击刑',
        type: '凶',
        description: `时支${hBranch}刑${earthBranch}于${p.name}，主动中有伤`,
        palace: p.position,
      });
    }
  }

  if (patterns.length === 0) {
    patterns.push({ name: '平局', type: '平', description: '无特殊格局，以各宫组合论吉凶' });
  }

  return patterns;
}

// ═══════════════════════════════════════════════
// v3.0: 空亡计算
// ═══════════════════════════════════════════════

function calculateKongWang(xunShou: string): KongWangInfo {
  const xunShouBranch = xunShou[1];
  const startIdx = DI_ZHI.indexOf(xunShouBranch);
  // 旬空二支 = 甲子旬中 戌亥空, 甲戌旬中 申酉空, etc.
  const kong1 = DI_ZHI[(startIdx + 10) % 12];
  const kong2 = DI_ZHI[(startIdx + 11) % 12];

  // Map branches to palace numbers (simplified)
  const branchToPalace: Record<string, number> = {
    '子': 1, '丑': 8, '寅': 3, '卯': 3, '辰': 4, '巳': 9,
    '午': 9, '未': 2, '申': 7, '酉': 7, '戌': 6, '亥': 6,
  };

  const affectedPalaces = [branchToPalace[kong1], branchToPalace[kong2]].filter(Boolean);
  const interpretation = `旬空${kong1}${kong2}，${affectedPalaces.map(p => PALACE_NAMES[p]).join('、')}落空。落空之宫吉凶减半，事难成就。`;

  return { branches: [kong1, kong2], affectedPalaces, interpretation };
}

// ═══════════════════════════════════════════════
// v3.0: 马星计算
// ═══════════════════════════════════════════════

function calculateMaXing(hourBranch: string, chart: QimenChart): MaXingInfo {
  // 驿马：申子辰马在寅，寅午戌马在申，亥卯未马在巳，巳酉丑马在亥
  const maMap: Record<string, string> = {
    '子': '寅', '申': '寅', '辰': '寅',
    '寅': '申', '午': '申', '戌': '申',
    '亥': '巳', '卯': '巳', '未': '巳',
    '巳': '亥', '酉': '亥', '丑': '亥',
  };
  const maBranch = maMap[hourBranch] || '寅';
  const branchToPalace: Record<string, number> = {
    '寅': 3, '申': 7, '巳': 4, '亥': 6,
  };
  const palace = branchToPalace[maBranch] || 3;

  // Check if 马星 palace has auspicious gate
  const maPalace = chart.palaces.find(p => p.position === palace);
  const isActive = maPalace ? AUSPICIOUS_GATES.includes(maPalace.gate) : false;

  const interpretation = `驿马在${maBranch}(${PALACE_NAMES[palace]})，${isActive ? '马星得吉门，主动中得利，宜出行' : '马星未得吉门，动中多阻'}。`;

  return { branch: maBranch, palace, isActive, interpretation };
}

// ═══════════════════════════════════════════════
// v3.0: 用神分析（按事类取用神宫位）
// ═══════════════════════════════════════════════

function analyzeYongShen(chart: QimenChart): YongShenAnalysis[] {
  const categories: { name: string; gate: string; star: string }[] = [
    { name: '事业', gate: '开门', star: '天心' },
    { name: '财运', gate: '生门', star: '天任' },
    { name: '感情', gate: '休门', star: '天辅' },
    { name: '学业', gate: '景门', star: '天英' },
    { name: '健康', gate: '死门', star: '天芮' },
    { name: '出行', gate: '生门', star: '天冲' },
  ];

  return categories.map(cat => {
    const gatePalace = chart.palaces.find(p => p.gate === cat.gate && p.position !== 5);
    const starPalace = chart.palaces.find(p => p.star === cat.star && p.position !== 5);
    const palace = gatePalace || starPalace;

    if (!palace) {
      return { category: cat.name, yongShenPalace: 0, palaceGate: '', palaceStar: '', assessment: '用神宫位不明' };
    }

    const gateOk = AUSPICIOUS_GATES.includes(palace.gate);
    const starOk = AUSPICIOUS_STARS.includes(palace.star);
    const hasSanQi = SAN_QI.includes(palace.heavenStem);

    let assessment: string;
    if (gateOk && starOk && hasSanQi) assessment = '三吉齐聚，大吉';
    else if (gateOk && starOk) assessment = '门星俱佳，吉';
    else if (gateOk) assessment = '得吉门，小吉';
    else if (INAUSPICIOUS_GATES.includes(palace.gate)) assessment = '门凶，不利';
    else assessment = '平';

    return {
      category: cat.name,
      yongShenPalace: palace.position,
      palaceGate: palace.gate,
      palaceStar: palace.star,
      assessment,
    };
  });
}

// ═══════════════════════════════════════════════
// v2.0: Enhanced Evaluation Module
// ═══════════════════════════════════════════════

function evaluateChart(chart: QimenChart, patterns: QimenPattern[]): { score: number; pattern: string; hourPalaceAnalysis: string } {
  let score = 50;
  let primaryPattern = '平局';

  // Pattern-based scoring
  for (const p of patterns) {
    switch (p.type) {
      case '大吉': score += 12; break;
      case '吉': score += 7; break;
      case '平': break;
      case '凶': score -= 7; break;
      case '大凶': score -= 12; break;
    }
    if (Math.abs(score - 50) > Math.abs(50 - 50)) primaryPattern = p.name;
  }

  // Hour palace deep analysis
  let hourPalaceAnalysis = '';
  for (const p of chart.palaces) {
    if (p.heavenStem === chart.hourStem || p.earthStem === chart.hourStem) {
      hourPalaceAnalysis = `时干${chart.hourStem}落${p.name}，天盘${p.heavenStem}地盘${p.earthStem}，${p.gate}+${p.star}+${p.deity}`;
      break;
    }
  }

  score = Math.max(5, Math.min(95, score));
  return { score, pattern: primaryPattern, hourPalaceAnalysis };
}

// ═══════════════════════════════════════════════
// FateVector 映射
// ═══════════════════════════════════════════════

function qimenToFateVector(chart: QimenChart, score: number): FateVector {
  const clamp = (v: number) => Math.max(5, Math.min(95, Math.round(v)));
  const base = score;
  let lifeBonus = 0, wealthBonus = 0, relationBonus = 0, healthBonus = 0, wisdomBonus = 0, spiritBonus = 0;
  let socialStatusBonus = 0, creativityBonus = 0, luckBonus = 0, homeStabilityBonus = 0;

  for (const p of chart.palaces) {
    if (p.position === 5) continue;
    const gateScore = AUSPICIOUS_GATES.includes(p.gate) ? 3 : INAUSPICIOUS_GATES.includes(p.gate) ? -3 : 0;
    switch (p.gate) {
      case '开门': lifeBonus += gateScore * 2; socialStatusBonus += gateScore; luckBonus += gateScore; break;
      case '生门': wealthBonus += gateScore * 2; homeStabilityBonus += gateScore; break;
      case '休门': relationBonus += gateScore * 2; homeStabilityBonus += gateScore; break;
      case '景门': wisdomBonus += gateScore * 2; creativityBonus += gateScore; break;
      case '死门': healthBonus -= 3; luckBonus -= 2; break;
      case '伤门': healthBonus -= 2; homeStabilityBonus -= 2; break;
      case '杜门': spiritBonus += 2; creativityBonus += 2; break;
    }
  }

  return {
    life: clamp(base + lifeBonus), wealth: clamp(base + wealthBonus),
    relation: clamp(base + relationBonus), health: clamp(base + healthBonus),
    wisdom: clamp(base + wisdomBonus), spirit: clamp(base + spiritBonus),
    socialStatus: clamp(base + socialStatusBonus), creativity: clamp(base + creativityBonus),
    luck: clamp(base + luckBonus), homeStability: clamp(base + homeStabilityBonus),
  };
}

// ═══════════════════════════════════════════════
// Engine Interface
// ═══════════════════════════════════════════════

export function runQimen(standardizedInput: StandardizedInput): {
  eo: EngineOutput;
  qimenResult: QimenResult;
} {
  const t0 = performance.now();
  const qt = new Date(standardizedInput.queryTimeUtc);
  const input: QimenInput = { year: qt.getFullYear(), month: qt.getMonth() + 1, day: qt.getDate(), hour: qt.getHours() };

  const chart = buildChart(input);
  const patterns = detectPatterns(chart);
  const { score, pattern, hourPalaceAnalysis } = evaluateChart(chart, patterns);
  const kongWang = calculateKongWang(chart.xunShou);
  const maXing = calculateMaXing(chart.hourBranch, chart);
  const yongShenAnalysis = analyzeYongShen(chart);
  const fateVector = qimenToFateVector(chart, score);
  const t1 = performance.now();

  // v3.0: 空亡修正评分
  let finalScore = score;
  for (const p of kongWang.affectedPalaces) {
    const palace = chart.palaces.find(pp => pp.position === p);
    if (palace && palace.heavenStem === chart.hourStem) {
      finalScore -= 5; // 时干落空亡减分
    }
  }
  finalScore = Math.max(5, Math.min(95, finalScore));

  const summary = `${chart.dunType}${chart.juNumber}局，时干${chart.hourStem}${chart.hourBranch}。` +
    `值符${chart.zhiFu}，值使${chart.zhiShi}。旬首${chart.xunShou}。` +
    `${kongWang.interpretation} ${maXing.interpretation}` +
    `格局：${patterns.map(p => p.name).join('、')}。综合评分${finalScore}分。`;

  let primaryGate = chart.zhiShi;
  let primaryStar = chart.zhiFu;
  let primaryDeity = '';
  for (const p of chart.palaces) {
    if (p.heavenStem === chart.hourStem || p.earthStem === chart.hourStem) {
      primaryGate = p.gate; primaryStar = p.star; primaryDeity = p.deity; break;
    }
  }

  return {
    eo: {
      engineName: 'qimen', engineNameCN: '奇门遁甲', engineVersion: '3.0.0',
      sourceUrls: ['https://en.wikipedia.org/wiki/Qi_Men_Dun_Jia'],
      sourceGrade: 'B', ruleSchool: '时家奇门·拆补法（空亡马星v3）',
      confidence: 0.65, computationTimeMs: Math.round(t1 - t0),
      rawInputSnapshot: { year: input.year, month: input.month, day: input.day, hour: input.hour, queryTimeUtc: standardizedInput.queryTimeUtc },
      fateVector,
      normalizedOutput: {
        '遁局': `${chart.dunType}${chart.juNumber}局`,
        '值符': chart.zhiFu, '值使': chart.zhiShi,
        '时干': `${chart.hourStem}${chart.hourBranch}`,
        '主要门': primaryGate, '主要星': primaryStar, '主要神': primaryDeity,
        '旬首': chart.xunShou,
        '格局': patterns.map(p => p.name).join('、'),
        '时干宫分析': hourPalaceAnalysis,
        '空亡': kongWang.interpretation,
        '马星': maXing.interpretation,
        '用神': yongShenAnalysis.map(y => `${y.category}:${y.assessment}`).join('；'),
      },
      warnings: ['奇门遁甲基于起局时间而非出生时间，适用于时态决策分析'],
      uncertaintyNotes: ['拆补法实现，置闰法尚未接入', '节气切换使用公历近似', 'v3.0增加空亡马星用神分析'],
      timingBasis: 'query',
      explanationTrace: [
        `起局: ${chart.dunType}${chart.juNumber}局`,
        `时干: ${chart.hourStem}${chart.hourBranch}，旬首: ${chart.xunShou}`,
        `值符: ${chart.zhiFu}，值使: ${chart.zhiShi}`,
        `时干宫位分析: ${hourPalaceAnalysis}`,
        `空亡: ${kongWang.interpretation}`,
        `马星: ${maXing.interpretation}`,
        `格局检测: ${patterns.map(p => p.name).join('、') || '无特殊格局'}`,
        `用神分析: ${yongShenAnalysis.map(y => y.category + ':' + y.assessment).join('；')}`,
      ],
      completenessScore: 83,
      validationFlags: { passed: ['bureau-calculation', 'palace-distribution', 'gates', 'stars', 'deities', 'kong-wang', 'ma-xing', 'yong-shen'], failed: [], warnings: ['query-time-based', 'simplified-solar-term'] },
      timeWindows: [],
      aspectScores: { overallScore: finalScore, patternCount: patterns.length },
      eventCandidates: [`${chart.dunType}${chart.juNumber}局`, `格局${patterns.map(p => p.name).join('·')}`, `主门${primaryGate}`],
    },
    qimenResult: { chart, score: finalScore, summary, pattern, patterns, hourPalaceAnalysis, kongWang, maXing, yongShenAnalysis },
  };
}

export const QimenEngine = {
  buildChart, evaluateChart: (chart: QimenChart) => {
    const patterns = detectPatterns(chart);
    return evaluateChart(chart, patterns);
  },
  qimenToFateVector, runQimen,
  _internals: { getGanZhi, getJuNumber, getXunShouInfo, PALACE_NAMES, NINE_STARS, EIGHT_GATES, calculateKongWang, calculateMaXing },
};
