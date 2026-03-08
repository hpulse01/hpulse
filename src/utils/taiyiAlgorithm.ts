/**
 * 太乙神数引擎 v1.0.0 — Taiyi Shenshu (Supreme Unity Divine Numbers)
 *
 * 本轮实现范围：
 * - 时态趋势型太乙（基于 queryTimeUtc 起局）
 * - 太乙积年法简化（以公元年换算太乙年数）
 * - 九宫结构 + 太乙值位 + 主算 / 客算
 * - 十六神排布（简化为核心八神）
 * - 基础格局判定 + 趋势等级 + 吉凶评分 + 应期摘要
 *
 * 规则版本：
 * - 采用"太乙统宗"简化版起局规则
 * - 太乙积年以公元元年为元，周期以 360 年为一大周期
 * - 局数 = 积年数 mod 72 → 映射九宫
 * - 太乙值位按局数落宫
 * - 主算 / 客算按奇偶局分
 *
 * uncertaintyNotes:
 * - 当前只实现一个规则版本（太乙统宗简化）
 * - 积年换算为简化公元纪年法，非精确上元积年
 * - 十六神简化为八神
 * - 其他门派版本尚未接入
 * - 节气/历法周期换算为简化实现
 */

import type { StandardizedInput, FateVector, EngineOutput } from '@/types/prediction';

// ═══════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════

export interface TaiyiInput {
  queryTimeUtc: string;
  timezoneOffsetMinutes: number;
}

export interface TaiyiPalace {
  /** 宫位编号 1-9 */
  number: number;
  /** 宫位名称 */
  name: string;
  /** 方位 */
  direction: string;
  /** 五行 */
  wuxing: string;
  /** 此宫是否为太乙所在 */
  isTaiyi: boolean;
  /** 此宫是否为主算所在 */
  isZhuSuan: boolean;
  /** 此宫是否为客算所在 */
  isKeSuan: boolean;
  /** 落入此宫的神煞 */
  spirits: string[];
}

export interface TaiyiChart {
  /** 太乙积年数 */
  jiNian: number;
  /** 局数 (1-72) */
  juNumber: number;
  /** 太乙落宫编号 */
  taiyiGong: number;
  /** 主算落宫编号 */
  zhuSuanGong: number;
  /** 客算落宫编号 */
  keSuanGong: number;
  /** 九宫 */
  palaces: TaiyiPalace[];
  /** 太乙值位名称 */
  taiyiZhiWei: string;
  /** 主算值 */
  zhuSuanValue: number;
  /** 客算值 */
  keSuanValue: number;
  /** 年干 */
  nianGan: string;
  /** 年支 */
  nianZhi: string;
}

export interface TaiyiPattern {
  /** 格局名称 */
  name: string;
  /** 格局类型 */
  type: '吉格' | '凶格' | '平格';
  /** 格局描述 */
  description: string;
}

export interface TaiyiResult {
  chart: TaiyiChart;
  /** 格局 */
  patterns: TaiyiPattern[];
  /** 趋势等级 */
  trendLevel: '大旺' | '旺' | '平' | '衰' | '大衰';
  /** 吉凶等级 */
  auspiciousness: '大吉' | '吉' | '中平' | '凶' | '大凶';
  /** 应期摘要 */
  yingQi: string;
  /** 总结 */
  summary: string;
  /** 元数据 */
  meta: TaiyiMeta;
}

export interface TaiyiMeta {
  engineVersion: string;
  ruleSchool: string;
  warnings: string[];
  uncertaintyNotes: string[];
}

// ═══════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════

const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

/** 九宫定义 */
const NINE_PALACES: Array<{ number: number; name: string; direction: string; wuxing: string }> = [
  { number: 1, name: '坎宫', direction: '北', wuxing: '水' },
  { number: 2, name: '坤宫', direction: '西南', wuxing: '土' },
  { number: 3, name: '震宫', direction: '东', wuxing: '木' },
  { number: 4, name: '巽宫', direction: '东南', wuxing: '木' },
  { number: 5, name: '中宫', direction: '中', wuxing: '土' },
  { number: 6, name: '乾宫', direction: '西北', wuxing: '金' },
  { number: 7, name: '兑宫', direction: '西', wuxing: '金' },
  { number: 8, name: '艮宫', direction: '东北', wuxing: '土' },
  { number: 9, name: '离宫', direction: '南', wuxing: '火' },
];

/** 太乙八神 (简化十六神为核心八神) */
const TAIYI_SPIRITS = ['太乙', '文昌', '始击', '地主', '天道', '地道', '太簇', '计神'];

/** 宫位五行吉凶基础分 */
const PALACE_SCORE: Record<string, number> = {
  '水': 3, '木': 4, '火': 2, '土': 0, '金': 1,
};

/** 五行生克 */
const WUXING_SHENG: Record<string, string> = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
const WUXING_KE: Record<string, string> = { '木': '土', '火': '金', '土': '水', '金': '木', '水': '火' };

// ═══════════════════════════════════════════════
// Core Algorithm
// ═══════════════════════════════════════════════

function calculateJiNian(year: number): number {
  // 太乙积年：简化以公元元年(1 CE)为起点
  // 积年 = year (公元年)
  // 实际太乙积年应从上元甲子起算，此处简化
  return Math.abs(year);
}

function calculateJuNumber(jiNian: number, month: number, day: number, hour: number): number {
  // 局数 = (积年 * 月系数 + 日 + 时辰系数) mod 72 + 1
  const monthFactor = ((month - 1) * 6 + 1);
  const hourFactor = Math.floor(((hour + 1) % 24) / 2);
  const raw = (jiNian * 3 + monthFactor + day * 5 + hourFactor * 7) % 72;
  return raw + 1; // 1-72
}

function juToGong(ju: number): number {
  // 局数映射到九宫（太乙落宫）
  // 太乙不入中宫（5宫），按 1-4, 6-9 循环
  const gongOrder = [1, 2, 3, 4, 6, 7, 8, 9];
  return gongOrder[(ju - 1) % 8];
}

function calculateZhuKeSuan(ju: number): { zhuGong: number; keGong: number; zhuVal: number; keVal: number } {
  // 主算 = (局数 * 3 + 1) mod 8 → 映射九宫 (跳过5)
  // 客算 = (局数 * 7 + 5) mod 8 → 映射九宫 (跳过5)
  const gongOrder = [1, 2, 3, 4, 6, 7, 8, 9];
  const zhuIdx = (ju * 3 + 1) % 8;
  const keIdx = (ju * 7 + 5) % 8;
  const zhuVal = (ju * 3 + 1) % 100;
  const keVal = (ju * 7 + 5) % 100;
  return {
    zhuGong: gongOrder[zhuIdx],
    keGong: gongOrder[keIdx],
    zhuVal,
    keVal,
  };
}

function distributeSpirits(ju: number, taiyiGong: number): Record<number, string[]> {
  // 八神分布到九宫
  const result: Record<number, string[]> = {};
  for (let i = 1; i <= 9; i++) result[i] = [];
  
  // 太乙本身在太乙宫
  result[taiyiGong].push('太乙');
  
  // 其余七神按局数偏移分布
  const gongOrder = [1, 2, 3, 4, 6, 7, 8, 9];
  for (let i = 1; i < TAIYI_SPIRITS.length; i++) {
    const gIdx = (gongOrder.indexOf(taiyiGong) + i) % 8;
    const gong = gongOrder[gIdx >= 0 ? gIdx : gIdx + 8];
    result[gong].push(TAIYI_SPIRITS[i]);
  }
  
  return result;
}

function getYearGanZhi(year: number): { gan: string; zhi: string } {
  const stemIdx = ((year - 4) % 10 + 10) % 10;
  const branchIdx = ((year - 4) % 12 + 12) % 12;
  return { gan: STEMS[stemIdx], zhi: BRANCHES[branchIdx] };
}

function buildChart(input: TaiyiInput): TaiyiChart {
  const queryDate = new Date(input.queryTimeUtc);
  const localMs = queryDate.getTime() + input.timezoneOffsetMinutes * 60000;
  const local = new Date(localMs);

  const year = local.getUTCFullYear();
  const month = local.getUTCMonth() + 1;
  const day = local.getUTCDate();
  const hour = local.getUTCHours();

  const jiNian = calculateJiNian(year);
  const juNumber = calculateJuNumber(jiNian, month, day, hour);
  const taiyiGong = juToGong(juNumber);
  const { zhuGong, keGong, zhuVal, keVal } = calculateZhuKeSuan(juNumber);
  const spiritMap = distributeSpirits(juNumber, taiyiGong);
  const { gan: nianGan, zhi: nianZhi } = getYearGanZhi(year);

  const palaces: TaiyiPalace[] = NINE_PALACES.map(p => ({
    ...p,
    isTaiyi: p.number === taiyiGong,
    isZhuSuan: p.number === zhuGong,
    isKeSuan: p.number === keGong,
    spirits: spiritMap[p.number] || [],
  }));

  const taiyiPalace = NINE_PALACES.find(p => p.number === taiyiGong)!;
  const taiyiZhiWei = `太乙在${taiyiPalace.name}（${taiyiPalace.direction}·${taiyiPalace.wuxing}）`;

  return {
    jiNian,
    juNumber,
    taiyiGong,
    zhuSuanGong: zhuGong,
    keSuanGong: keGong,
    palaces,
    taiyiZhiWei: taiyiZhiWei,
    zhuSuanValue: zhuVal,
    keSuanValue: keVal,
    nianGan,
    nianZhi,
  };
}

function detectPatterns(chart: TaiyiChart): TaiyiPattern[] {
  const patterns: TaiyiPattern[] = [];
  const taiyiWx = NINE_PALACES.find(p => p.number === chart.taiyiGong)!.wuxing;
  const zhuWx = NINE_PALACES.find(p => p.number === chart.zhuSuanGong)!.wuxing;
  const keWx = NINE_PALACES.find(p => p.number === chart.keSuanGong)!.wuxing;

  // 太乙临乾/离 → 吉格
  if (chart.taiyiGong === 6) {
    patterns.push({ name: '太乙临乾', type: '吉格', description: '太乙居乾宫，天道昌明，利于进取' });
  }
  if (chart.taiyiGong === 9) {
    patterns.push({ name: '太乙临离', type: '吉格', description: '太乙居离宫，光明普照，文运亨通' });
  }

  // 主客关系
  if (WUXING_SHENG[zhuWx] === keWx) {
    patterns.push({ name: '主生客', type: '凶格', description: '主算生客算，泄气之象，宜守不宜攻' });
  } else if (WUXING_SHENG[keWx] === zhuWx) {
    patterns.push({ name: '客生主', type: '吉格', description: '客算生主算，得助之象，宜主动进取' });
  } else if (WUXING_KE[zhuWx] === keWx) {
    patterns.push({ name: '主克客', type: '吉格', description: '主算克客算，主胜之象，利于行动' });
  } else if (WUXING_KE[keWx] === zhuWx) {
    patterns.push({ name: '客克主', type: '凶格', description: '客算克主算，受制之象，宜退让避让' });
  }

  // 太乙与主算同宫 → 大吉
  if (chart.taiyiGong === chart.zhuSuanGong) {
    patterns.push({ name: '太乙扶主', type: '吉格', description: '太乙与主算同宫，天时地利人和' });
  }

  // 太乙与客算同宫 → 凶
  if (chart.taiyiGong === chart.keSuanGong) {
    patterns.push({ name: '太乙助客', type: '凶格', description: '太乙与客算同宫，外力压制，不宜妄动' });
  }

  // 主客同宫 → 平
  if (chart.zhuSuanGong === chart.keSuanGong) {
    patterns.push({ name: '主客同宫', type: '平格', description: '主客同宫，势均力敌，宜静观其变' });
  }

  // 如果没有格局，给一个默认
  if (patterns.length === 0) {
    patterns.push({ name: '常局', type: '平格', description: '局势平稳，无特殊格局' });
  }

  return patterns;
}

function assessTrend(chart: TaiyiChart, patterns: TaiyiPattern[]): {
  trendLevel: TaiyiResult['trendLevel'];
  auspiciousness: TaiyiResult['auspiciousness'];
  score: number;
} {
  let score = 50;

  // 格局影响
  for (const p of patterns) {
    if (p.type === '吉格') score += 10;
    if (p.type === '凶格') score -= 10;
  }

  // 太乙落宫五行基础分
  const taiyiWx = NINE_PALACES.find(p => p.number === chart.taiyiGong)!.wuxing;
  score += (PALACE_SCORE[taiyiWx] || 0) * 2;

  // 主算 > 客算 → 利
  if (chart.zhuSuanValue > chart.keSuanValue) score += 5;
  if (chart.zhuSuanValue < chart.keSuanValue) score -= 5;

  // 局数奇偶微调
  if (chart.juNumber % 2 === 1) score += 2; // 奇数局阳气略旺

  score = Math.max(5, Math.min(95, score));

  let trendLevel: TaiyiResult['trendLevel'];
  if (score >= 75) trendLevel = '大旺';
  else if (score >= 60) trendLevel = '旺';
  else if (score >= 40) trendLevel = '平';
  else if (score >= 25) trendLevel = '衰';
  else trendLevel = '大衰';

  let auspiciousness: TaiyiResult['auspiciousness'];
  if (score >= 75) auspiciousness = '大吉';
  else if (score >= 60) auspiciousness = '吉';
  else if (score >= 40) auspiciousness = '中平';
  else if (score >= 25) auspiciousness = '凶';
  else auspiciousness = '大凶';

  return { trendLevel, auspiciousness, score };
}

function buildYingQi(chart: TaiyiChart): string {
  // 应期：根据太乙宫位五行推算
  const taiyiWx = NINE_PALACES.find(p => p.number === chart.taiyiGong)!.wuxing;
  const wxTimeMap: Record<string, string> = {
    '木': '春季（寅卯辰月）',
    '火': '夏季（巳午未月）',
    '土': '季月（辰戌丑未月）',
    '金': '秋季（申酉戌月）',
    '水': '冬季（亥子丑月）',
  };
  const wxDayMap: Record<string, string> = {
    '木': '甲乙日',
    '火': '丙丁日',
    '土': '戊己日',
    '金': '庚辛日',
    '水': '壬癸日',
  };
  return `应期在${wxTimeMap[taiyiWx] || '不明'}，或${wxDayMap[taiyiWx] || '不明'}前后应验。局数${chart.juNumber}，太乙在第${chart.taiyiGong}宫。`;
}

function buildSummary(
  chart: TaiyiChart,
  patterns: TaiyiPattern[],
  trendLevel: string,
  auspiciousness: string,
  yingQi: string,
): string {
  const patternNames = patterns.map(p => p.name).join('、');
  return `太乙神数第${chart.juNumber}局，太乙在${chart.taiyiZhiWei.replace('太乙在', '')}。` +
    `主算第${chart.zhuSuanGong}宫（值${chart.zhuSuanValue}），客算第${chart.keSuanGong}宫（值${chart.keSuanValue}）。` +
    `格局：${patternNames}。趋势${trendLevel}，综合判定${auspiciousness}。` +
    `${yingQi}`;
}

// ═══════════════════════════════════════════════
// FateVector Mapping
// ═══════════════════════════════════════════════

function mapToFateVector(result: TaiyiResult): FateVector {
  const baseMap: Record<string, number> = { '大吉': 78, '吉': 64, '中平': 50, '凶': 36, '大凶': 22 };
  const base = baseMap[result.auspiciousness] || 50;

  const taiyiWx = NINE_PALACES.find(p => p.number === result.chart.taiyiGong)!.wuxing;
  const wxBoost: Record<string, Record<string, number>> = {
    '木': { life: 4, wisdom: 5, health: 3, wealth: 0, relation: 2, spirit: 3 },
    '火': { life: 5, wisdom: 3, health: -2, wealth: 2, relation: 4, spirit: 6 },
    '土': { life: 2, wisdom: 0, health: 5, wealth: 5, relation: 3, spirit: 0 },
    '金': { life: 3, wisdom: 4, health: 1, wealth: 4, relation: -1, spirit: 2 },
    '水': { life: 1, wisdom: 6, health: 3, wealth: 2, relation: 3, spirit: 5 },
  };
  const boost = wxBoost[taiyiWx] || { life: 0, wisdom: 0, health: 0, wealth: 0, relation: 0, spirit: 0 };

  // 格局额外修正
  let patternMod = 0;
  for (const p of result.patterns) {
    if (p.type === '吉格') patternMod += 3;
    if (p.type === '凶格') patternMod -= 3;
  }

  return {
    life: clamp(base + boost.life + patternMod),
    wealth: clamp(base + boost.wealth + patternMod),
    relation: clamp(base + boost.relation),
    health: clamp(base + boost.health),
    wisdom: clamp(base + boost.wisdom),
    spirit: clamp(base + boost.spirit + patternMod),
  };
}

function clamp(v: number): number {
  return Math.max(5, Math.min(95, Math.round(v)));
}

// ═══════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════

export function runTaiyi(input: TaiyiInput): TaiyiResult {
  const chart = buildChart(input);
  const patterns = detectPatterns(chart);
  const { trendLevel, auspiciousness } = assessTrend(chart, patterns);
  const yingQi = buildYingQi(chart);
  const summary = buildSummary(chart, patterns, trendLevel, auspiciousness, yingQi);

  return {
    chart,
    patterns,
    trendLevel,
    auspiciousness,
    yingQi,
    summary,
    meta: {
      engineVersion: '1.0.0',
      ruleSchool: '太乙统宗（简化版）',
      warnings: ['太乙神数结果基于起局时间，反映时态趋势而非固定命盘'],
      uncertaintyNotes: [
        '当前只实现一个规则版本（太乙统宗简化）',
        '积年换算为简化公元纪年法，非精确上元积年',
        '十六神简化为八神',
        '节气/历法/周期换算为简化实现',
        '其他门派版本尚未接入',
      ],
    },
  };
}

// ═══════════════════════════════════════════════
// EngineOutput builder (for orchestrator)
// ═══════════════════════════════════════════════

export function buildTaiyiEngineOutput(si: StandardizedInput): { eo: EngineOutput; taiyiResult: TaiyiResult } {
  const t0 = performance.now();
  const input: TaiyiInput = {
    queryTimeUtc: si.queryTimeUtc,
    timezoneOffsetMinutes: si.timezoneOffsetMinutesAtBirth,
  };
  const result = runTaiyi(input);
  const t1 = performance.now();

  const fateVector = mapToFateVector(result);
  const patternNames = result.patterns.map(p => p.name).join('、');

  const eo: EngineOutput = {
    engineName: 'taiyi',
    engineNameCN: '太乙神数',
    engineVersion: result.meta.engineVersion,
    sourceUrls: ['https://zh.wikipedia.org/wiki/太乙神數'],
    sourceGrade: 'B',
    ruleSchool: result.meta.ruleSchool,
    confidence: 0.52,
    computationTimeMs: Math.round(t1 - t0),
    rawInputSnapshot: { queryTimeUtc: si.queryTimeUtc, juNumber: result.chart.juNumber },
    fateVector,
    normalizedOutput: {
      '局式': `第${result.chart.juNumber}局`,
      '太乙值位': result.chart.taiyiZhiWei,
      '主算': `第${result.chart.zhuSuanGong}宫·值${result.chart.zhuSuanValue}`,
      '客算': `第${result.chart.keSuanGong}宫·值${result.chart.keSuanValue}`,
      '关键宫位': `太乙${result.chart.taiyiGong}宫 主${result.chart.zhuSuanGong}宫 客${result.chart.keSuanGong}宫`,
      '格局': patternNames,
      '吉凶': result.auspiciousness,
      '趋势': result.trendLevel,
      '应期': result.yingQi,
    },
    warnings: result.meta.warnings,
    uncertaintyNotes: result.meta.uncertaintyNotes,
    timingBasis: 'query',
  };

  return { eo, taiyiResult: result };
}
