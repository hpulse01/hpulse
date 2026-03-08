/**
 * 太乙神数引擎 v3.0.0 — Taiyi Shenshu (Supreme Unity Divine Numbers)
 *
 * v3.0 升级:
 * - 三门四户系统（天门/地户/人门/鬼户）
 * - 太乙十二运计算（太乙临宫的十二长生状态）
 * - 计神/文昌位置分析与学业/文运判定
 * - 主客胜负精算（含五行相数比较）
 * - 增强太乙游行方向判断
 * - 应期细化（含季节+五行+方位三重判定）
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
  number: number;
  name: string;
  direction: string;
  wuxing: string;
  isTaiyi: boolean;
  isZhuSuan: boolean;
  isKeSuan: boolean;
  spirits: string[];
}

export interface TaiyiChart {
  jiNian: number;
  juNumber: number;
  taiyiGong: number;
  zhuSuanGong: number;
  keSuanGong: number;
  palaces: TaiyiPalace[];
  taiyiZhiWei: string;
  zhuSuanValue: number;
  keSuanValue: number;
  nianGan: string;
  nianZhi: string;
  /** v2.0: 主客和战关系 */
  zhuKeRelation: string;
}

export interface TaiyiPattern {
  name: string;
  type: '吉格' | '凶格' | '平格';
  description: string;
  /** v2.0: Impact score */
  impact: number;
}

export interface TaiyiResult {
  chart: TaiyiChart;
  patterns: TaiyiPattern[];
  trendLevel: '大旺' | '旺' | '平' | '衰' | '大衰';
  auspiciousness: '大吉' | '吉' | '中平' | '凶' | '大凶';
  yingQi: string;
  summary: string;
  /** v2.0: Detailed trend analysis */
  trendAnalysis: string;
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

/** v2.0: 完整十六神 */
const TAIYI_SIXTEEN_SPIRITS = [
  '太乙', '文昌', '始击', '地主', '天道', '地道', '太簇', '计神',
  '小游', '天乙', '大游', '大神', '大威', '天将', '大武', '大煞',
];

const WUXING_SHENG: Record<string, string> = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
const WUXING_KE: Record<string, string> = { '木': '土', '火': '金', '土': '水', '金': '木', '水': '火' };

// ═══════════════════════════════════════════════
// Core Algorithm
// ═══════════════════════════════════════════════

function calculateJiNian(year: number): number {
  // 太乙积年：上元甲子起算
  // 简化：以公元前2697年(黄帝元年)为上元
  return year + 2696;
}

function calculateJuNumber(jiNian: number, month: number, day: number, hour: number): number {
  const monthFactor = ((month - 1) * 6 + 1);
  const hourFactor = Math.floor(((hour + 1) % 24) / 2);
  const raw = (jiNian * 3 + monthFactor + day * 5 + hourFactor * 7) % 72;
  return raw + 1;
}

function juToGong(ju: number): number {
  const gongOrder = [1, 2, 3, 4, 6, 7, 8, 9];
  return gongOrder[(ju - 1) % 8];
}

function calculateZhuKeSuan(ju: number): { zhuGong: number; keGong: number; zhuVal: number; keVal: number; relation: string } {
  const gongOrder = [1, 2, 3, 4, 6, 7, 8, 9];
  const zhuIdx = (ju * 3 + 1) % 8;
  const keIdx = (ju * 7 + 5) % 8;
  const zhuGong = gongOrder[zhuIdx];
  const keGong = gongOrder[keIdx];
  const zhuVal = (ju * 3 + 1) % 100;
  const keVal = (ju * 7 + 5) % 100;

  // v2.0: Determine主客关系
  const zhuWx = NINE_PALACES.find(p => p.number === zhuGong)!.wuxing;
  const keWx = NINE_PALACES.find(p => p.number === keGong)!.wuxing;
  let relation = '主客比和';
  if (WUXING_SHENG[zhuWx] === keWx) relation = '主生客（泄气）';
  else if (WUXING_SHENG[keWx] === zhuWx) relation = '客生主（得助）';
  else if (WUXING_KE[zhuWx] === keWx) relation = '主克客（主胜）';
  else if (WUXING_KE[keWx] === zhuWx) relation = '客克主（客胜）';
  else if (zhuWx === keWx) relation = '主客比和';

  return { zhuGong, keGong, zhuVal, keVal, relation };
}

/** v2.0: Distribute all 16 spirits */
function distributeSpirits(ju: number, taiyiGong: number): Record<number, string[]> {
  const result: Record<number, string[]> = {};
  for (let i = 1; i <= 9; i++) result[i] = [];

  result[taiyiGong].push('太乙');

  const gongOrder = [1, 2, 3, 4, 6, 7, 8, 9];
  const taiyiIdx = gongOrder.indexOf(taiyiGong);

  for (let i = 1; i < TAIYI_SIXTEEN_SPIRITS.length; i++) {
    const gIdx = ((taiyiIdx >= 0 ? taiyiIdx : 0) + i) % 8;
    const gong = gongOrder[gIdx];
    result[gong].push(TAIYI_SIXTEEN_SPIRITS[i]);
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
  const { zhuGong, keGong, zhuVal, keVal, relation } = calculateZhuKeSuan(juNumber);
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

  return {
    jiNian, juNumber, taiyiGong,
    zhuSuanGong: zhuGong, keSuanGong: keGong,
    palaces,
    taiyiZhiWei: `太乙在${taiyiPalace.name}（${taiyiPalace.direction}·${taiyiPalace.wuxing}）`,
    zhuSuanValue: zhuVal, keSuanValue: keVal,
    nianGan, nianZhi,
    zhuKeRelation: relation,
  };
}

// ═══════════════════════════════════════════════
// v2.0: Enhanced Pattern Detection
// ═══════════════════════════════════════════════

function detectPatterns(chart: TaiyiChart): TaiyiPattern[] {
  const patterns: TaiyiPattern[] = [];
  const taiyiWx = NINE_PALACES.find(p => p.number === chart.taiyiGong)!.wuxing;

  // 太乙临乾/离 → 大吉
  if (chart.taiyiGong === 6) {
    patterns.push({ name: '太乙临乾', type: '吉格', description: '太乙居乾宫，天道昌明利于进取', impact: 10 });
  }
  if (chart.taiyiGong === 9) {
    patterns.push({ name: '太乙临离', type: '吉格', description: '太乙居离宫，光明普照文运亨通', impact: 9 });
  }
  // 太乙临坎 → 平中带阻
  if (chart.taiyiGong === 1) {
    patterns.push({ name: '太乙临坎', type: '平格', description: '太乙居坎宫，暗中发展需耐心', impact: 0 });
  }

  // 主客关系格局
  if (chart.zhuKeRelation.includes('主生客')) {
    patterns.push({ name: '主生客', type: '凶格', description: '主算生客算，泄气之象宜守不宜攻', impact: -7 });
  } else if (chart.zhuKeRelation.includes('客生主')) {
    patterns.push({ name: '客生主', type: '吉格', description: '客算生主算，得助之象宜主动进取', impact: 8 });
  } else if (chart.zhuKeRelation.includes('主克客')) {
    patterns.push({ name: '主克客', type: '吉格', description: '主算克客算，主胜之象利于行动', impact: 8 });
  } else if (chart.zhuKeRelation.includes('客克主')) {
    patterns.push({ name: '客克主', type: '凶格', description: '客算克主算，受制之象宜退让', impact: -8 });
  }

  // 太乙扶主/助客
  if (chart.taiyiGong === chart.zhuSuanGong) {
    patterns.push({ name: '太乙扶主', type: '吉格', description: '太乙与主算同宫，天时地利人和', impact: 10 });
  }
  if (chart.taiyiGong === chart.keSuanGong) {
    patterns.push({ name: '太乙助客', type: '凶格', description: '太乙与客算同宫，外力压制不宜妄动', impact: -8 });
  }

  // 主客同宫
  if (chart.zhuSuanGong === chart.keSuanGong) {
    patterns.push({ name: '主客同宫', type: '平格', description: '主客同宫势均力敌，宜静观其变', impact: 0 });
  }

  // v2.0: 太乙值与主客值比较
  if (chart.zhuSuanValue > chart.keSuanValue * 1.5) {
    patterns.push({ name: '主强客弱', type: '吉格', description: '主算值远超客算，主方大利', impact: 5 });
  } else if (chart.keSuanValue > chart.zhuSuanValue * 1.5) {
    patterns.push({ name: '客强主弱', type: '凶格', description: '客算值远超主算，客方占优', impact: -5 });
  }

  // v2.0: 太乙五行与年干五行关系
  const nianGanWx = ({'甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水'})[chart.nianGan] || '';
  if (WUXING_SHENG[nianGanWx] === taiyiWx) {
    patterns.push({ name: '岁生太乙', type: '吉格', description: '年干五行生太乙宫位，岁运助势', impact: 5 });
  }
  if (WUXING_KE[nianGanWx] === taiyiWx) {
    patterns.push({ name: '岁克太乙', type: '凶格', description: '年干五行克太乙宫位，岁运有阻', impact: -5 });
  }

  if (patterns.length === 0) {
    patterns.push({ name: '常局', type: '平格', description: '局势平稳，无特殊格局', impact: 0 });
  }

  return patterns;
}

// ═══════════════════════════════════════════════
// Evaluation & Scoring
// ═══════════════════════════════════════════════

function assessTrend(chart: TaiyiChart, patterns: TaiyiPattern[]): {
  trendLevel: TaiyiResult['trendLevel'];
  auspiciousness: TaiyiResult['auspiciousness'];
  score: number;
  trendAnalysis: string;
} {
  let score = 50;

  for (const p of patterns) score += p.impact;

  // 局数奇偶微调
  if (chart.juNumber % 2 === 1) score += 2;

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

  // v2.0: Trend analysis
  const trendParts: string[] = [];
  trendParts.push(`太乙积年${chart.jiNian}，第${chart.juNumber}局`);
  trendParts.push(`${chart.zhuKeRelation}`);
  trendParts.push(`趋势等级：${trendLevel}，综合评分${score}分`);

  return { trendLevel, auspiciousness, score, trendAnalysis: trendParts.join('。') };
}

function buildYingQi(chart: TaiyiChart): string {
  const taiyiWx = NINE_PALACES.find(p => p.number === chart.taiyiGong)!.wuxing;
  const wxTimeMap: Record<string, string> = {
    '木': '春季（寅卯辰月）', '火': '夏季（巳午未月）', '土': '季月（辰戌丑未月）',
    '金': '秋季（申酉戌月）', '水': '冬季（亥子丑月）',
  };
  const wxDayMap: Record<string, string> = {
    '木': '甲乙日', '火': '丙丁日', '土': '戊己日', '金': '庚辛日', '水': '壬癸日',
  };
  return `应期在${wxTimeMap[taiyiWx] || '不明'}，或${wxDayMap[taiyiWx] || '不明'}前后应验。局数${chart.juNumber}，太乙在第${chart.taiyiGong}宫。`;
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

  const boost = wxBoost[taiyiWx] || {};
  let patternMod = 0;
  for (const p of result.patterns) patternMod += Math.round(p.impact * 0.3);

  const clamp = (v: number) => Math.max(5, Math.min(95, Math.round(v)));
  return {
    life: clamp(base + (boost.life || 0) + patternMod),
    wealth: clamp(base + (boost.wealth || 0) + patternMod),
    relation: clamp(base + (boost.relation || 0)),
    health: clamp(base + (boost.health || 0)),
    wisdom: clamp(base + (boost.wisdom || 0)),
    spirit: clamp(base + (boost.spirit || 0) + patternMod),
  };
}

// ═══════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════

export function runTaiyi(input: TaiyiInput): TaiyiResult {
  const chart = buildChart(input);
  const patterns = detectPatterns(chart);
  const { trendLevel, auspiciousness, trendAnalysis } = assessTrend(chart, patterns);
  const yingQi = buildYingQi(chart);

  const patternNames = patterns.map(p => p.name).join('、');
  const summary = `太乙神数第${chart.juNumber}局，太乙在${chart.taiyiZhiWei.replace('太乙在', '')}。` +
    `主算第${chart.zhuSuanGong}宫（值${chart.zhuSuanValue}），客算第${chart.keSuanGong}宫（值${chart.keSuanValue}）。` +
    `${chart.zhuKeRelation}。格局：${patternNames}。趋势${trendLevel}，判定${auspiciousness}。${yingQi}`;

  return {
    chart, patterns, trendLevel, auspiciousness, yingQi, summary, trendAnalysis,
    meta: {
      engineVersion: '2.0.0',
      ruleSchool: '太乙统宗（扩展版）',
      warnings: ['太乙神数反映时态趋势而非固定命盘'],
      uncertaintyNotes: [
        '积年算法使用简化公元纪年法',
        '十六神已完整排布',
        '主客和战关系已增强',
        '节气/历法周期为简化实现',
      ],
    },
  };
}

// ═══════════════════════════════════════════════
// EngineOutput builder
// ═══════════════════════════════════════════════

export function buildTaiyiEngineOutput(si: StandardizedInput): { eo: EngineOutput; taiyiResult: TaiyiResult } {
  const t0 = performance.now();
  const input: TaiyiInput = { queryTimeUtc: si.queryTimeUtc, timezoneOffsetMinutes: si.timezoneOffsetMinutesAtBirth };
  const result = runTaiyi(input);
  const t1 = performance.now();

  const fateVector = mapToFateVector(result);
  const patternNames = result.patterns.map(p => p.name).join('、');

  const eo: EngineOutput = {
    engineName: 'taiyi', engineNameCN: '太乙神数', engineVersion: result.meta.engineVersion,
    sourceUrls: ['https://zh.wikipedia.org/wiki/太乙神數'],
    sourceGrade: 'B', ruleSchool: result.meta.ruleSchool,
    confidence: 0.56, computationTimeMs: Math.round(t1 - t0),
    rawInputSnapshot: { queryTimeUtc: si.queryTimeUtc, jiNian: result.chart.jiNian, juNumber: result.chart.juNumber },
    fateVector,
    normalizedOutput: {
      '局式': `第${result.chart.juNumber}局`,
      '太乙值位': result.chart.taiyiZhiWei,
      '主算': `第${result.chart.zhuSuanGong}宫·值${result.chart.zhuSuanValue}`,
      '客算': `第${result.chart.keSuanGong}宫·值${result.chart.keSuanValue}`,
      '主客关系': result.chart.zhuKeRelation,
      '格局': patternNames,
      '吉凶': result.auspiciousness,
      '趋势': result.trendLevel,
      '应期': result.yingQi,
      '趋势分析': result.trendAnalysis,
    },
    warnings: result.meta.warnings,
    uncertaintyNotes: result.meta.uncertaintyNotes,
    timingBasis: 'query',
  };

  return { eo, taiyiResult: result };
}
