/**
 * 大六壬引擎 v1.0.0 — Da Liu Ren (Greater Six Ren)
 *
 * 本轮实现范围：
 * - 时课型大六壬（基于 queryTimeUtc 起课）
 * - 月将 + 时辰起天地盘
 * - 四课生成
 * - 三传生成（贼克法 → 涉害法 → 遥克法 → 昴星法 简化）
 * - 十二天将排布
 * - 基础吉凶评分
 * - FateVector 六维映射
 *
 * 规则版本：标准古法大六壬（非小六壬）
 * 月将取法：简化太阳过宫法（基于节气中气）
 * 天将排布：贵人起法（昼贵人 / 夜贵人 按日干查表）
 *
 * uncertaintyNotes:
 * - 当前只实现一个规则版本
 * - 月将精确度受简化节气算法影响
 * - 三传取法在特殊格局（伏吟/返吟等）使用简化规则
 * - 其他门派版本尚未接入
 */

import type { StandardizedInput, FateVector, EngineOutput } from '@/types/prediction';

// ═══════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════

export interface LiuRenInput {
  /** 查询时间 UTC ISO */
  queryTimeUtc: string;
  /** 出生年（用于日干确定）*/
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  birthHour: number;
  /** 时区偏移分钟 */
  timezoneOffsetMinutes: number;
}

export interface LiuRenSiKe {
  /** 四课，每课有上下两个地支 */
  courses: Array<{ upper: string; lower: string; label: string }>;
}

export interface LiuRenSanChuan {
  /** 初传、中传、末传 */
  chu: string;
  zhong: string;
  mo: string;
  method: string; // 取传方法
}

export interface LiuRenTianJiang {
  /** 十二天将及其落宫 */
  generals: Array<{ name: string; branch: string }>;
  /** 贵人地支 */
  guiRen: string;
  /** 昼/夜贵人 */
  guiType: '昼贵' | '夜贵';
}

export interface LiuRenChart {
  /** 天盘（地支顺序，天盘[i] 在地盘 BRANCHES[i] 上）*/
  tianPan: string[];
  /** 地盘（固定子丑寅…） */
  diPan: string[];
  /** 月将 */
  yueJiang: string;
  /** 占时地支 */
  shiBranch: string;
  /** 日干 */
  riGan: string;
  /** 日支 */
  riBranch: string;
}

export interface LiuRenResult {
  chart: LiuRenChart;
  siKe: LiuRenSiKe;
  sanChuan: LiuRenSanChuan;
  tianJiang: LiuRenTianJiang;
  /** 课体名称 */
  keType: string;
  /** 吉凶等级 */
  auspiciousness: '大吉' | '吉' | '中平' | '凶' | '大凶';
  /** 占断摘要 */
  summary: string;
  /** 引擎元数据 */
  meta: LiuRenMeta;
}

export interface LiuRenMeta {
  engineVersion: string;
  ruleSchool: string;
  warnings: string[];
  uncertaintyNotes: string[];
}

// ═══════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════

const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];

const BRANCH_INDEX: Record<string, number> = {};
BRANCHES.forEach((b, i) => { BRANCH_INDEX[b] = i; });

const STEM_INDEX: Record<string, number> = {};
STEMS.forEach((s, i) => { STEM_INDEX[s] = i; });

/** 地支五行 */
const BRANCH_WUXING: Record<string, string> = {
  '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火',
  '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水',
};

/** 天干五行 */
const STEM_WUXING: Record<string, string> = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
  '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水',
};

/** 五行生克 */
const WUXING_SHENG: Record<string, string> = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
const WUXING_KE: Record<string, string> = { '木': '土', '火': '金', '土': '水', '金': '木', '水': '火' };

/** 十二天将 */
const TIAN_JIANG = ['贵人', '腾蛇', '朱雀', '六合', '勾陈', '青龙', '天空', '白虎', '太常', '玄武', '太阴', '天后'];

/** 天将吉凶属性 */
const JIANG_AUSPICE: Record<string, number> = {
  '贵人': 3, '青龙': 3, '六合': 2, '太常': 2, '太阴': 1, '天后': 1,
  '天空': 0, '勾陈': -1, '朱雀': -1, '腾蛇': -2, '白虎': -2, '玄武': -3,
};

/**
 * 昼贵人起始地支 (按日干查)
 * 甲戊庚→丑, 乙己→子, 丙丁→亥, 壬癸→巳, 辛→午
 */
const DAY_GUI_REN: Record<string, string> = {
  '甲': '丑', '戊': '丑', '庚': '丑',
  '乙': '子', '己': '子',
  '丙': '亥', '丁': '亥',
  '壬': '巳', '癸': '巳',
  '辛': '午',
};

/**
 * 夜贵人起始地支
 * 甲戊庚→未, 乙己→申, 丙丁→酉, 壬癸→卯, 辛→寅 (简化版)
 */
const NIGHT_GUI_REN: Record<string, string> = {
  '甲': '未', '戊': '未', '庚': '未',
  '乙': '申', '己': '申',
  '丙': '酉', '丁': '酉',
  '壬': '卯', '癸': '卯',
  '辛': '寅',
};

/**
 * 月将（太阳过宫）简化表
 * 按月份近似：正月亥, 二月戌, …十二月子
 * 实际应按中气切换，此处简化
 */
const MONTH_JIANG: string[] = ['亥', '戌', '酉', '申', '未', '午', '巳', '辰', '卯', '寅', '丑', '子'];

// ═══════════════════════════════════════════════
// Gan-Zhi helpers
// ═══════════════════════════════════════════════

function getDayGanZhi(year: number, month: number, day: number): { gan: string; zhi: string } {
  // 日干支：使用蔡勒公式简化
  const y = year;
  const m = month;
  const d = day;
  // 基准：1900-01-01 = 甲子日 (stem=0, branch=0)
  const base = new Date(1900, 0, 1);
  const target = new Date(y, m - 1, d);
  const diffDays = Math.round((target.getTime() - base.getTime()) / 86400000);
  // 1900-01-01 = 甲子 → index 0
  // But historically 1900-01-31 (Chinese NY) was 庚子. We use a known offset.
  // Known: 2000-01-01 is 戊午 (stem=4, branch=6)
  const base2 = new Date(2000, 0, 1);
  const diff2 = Math.round((target.getTime() - base2.getTime()) / 86400000);
  const stemIdx = ((diff2 % 10) + 4 + 100) % 10;
  const branchIdx = ((diff2 % 12) + 6 + 120) % 12;
  return { gan: STEMS[stemIdx], zhi: BRANCHES[branchIdx] };
}

function getShiBranch(hour: number): string {
  // 时辰：23-1子, 1-3丑, ...
  const idx = Math.floor(((hour + 1) % 24) / 2);
  return BRANCHES[idx];
}

function branchDist(from: string, to: string): number {
  return ((BRANCH_INDEX[to] - BRANCH_INDEX[from]) % 12 + 12) % 12;
}

// ═══════════════════════════════════════════════
// Core Algorithm
// ═══════════════════════════════════════════════

function buildTianPan(yueJiang: string, shiBranch: string): string[] {
  // 月将加临时辰：月将坐在时辰位置上
  // 天盘[i] = BRANCHES[(yueJiangIdx + (i - shiIdx) + 12) % 12]
  const yjIdx = BRANCH_INDEX[yueJiang];
  const shIdx = BRANCH_INDEX[shiBranch];
  const tianPan: string[] = [];
  for (let i = 0; i < 12; i++) {
    const tpIdx = (yjIdx + (i - shIdx) + 120) % 12;
    tianPan.push(BRANCHES[tpIdx]);
  }
  return tianPan;
}

function getTianPanOn(tianPan: string[], diBranch: string): string {
  return tianPan[BRANCH_INDEX[diBranch]];
}

function buildSiKe(riGan: string, riBranch: string, tianPan: string[]): LiuRenSiKe {
  // 日干寄宫
  const ganGong = ganToGong(riGan);

  // 第一课：日干上神（天盘在日干寄宫上的地支）
  const ke1Upper = getTianPanOn(tianPan, ganGong);
  // 第二课：上神的上神
  const ke2Upper = getTianPanOn(tianPan, ke1Upper);
  // 第三课：日支上神
  const ke3Upper = getTianPanOn(tianPan, riBranch);
  // 第四课：上神的上神
  const ke4Upper = getTianPanOn(tianPan, ke3Upper);

  return {
    courses: [
      { upper: ke1Upper, lower: ganGong, label: '第一课' },
      { upper: ke2Upper, lower: ke1Upper, label: '第二课' },
      { upper: ke3Upper, lower: riBranch, label: '第三课' },
      { upper: ke4Upper, lower: ke3Upper, label: '第四课' },
    ],
  };
}

/** 天干寄宫 */
function ganToGong(gan: string): string {
  const map: Record<string, string> = {
    '甲': '寅', '乙': '卯', '丙': '巳', '丁': '午', '戊': '巳',
    '己': '午', '庚': '申', '辛': '酉', '壬': '亥', '癸': '子',
  };
  return map[gan] || '子';
}

/** 五行克关系：a 克 b? */
function isKe(a: string, b: string): boolean {
  const wA = BRANCH_WUXING[a] || STEM_WUXING[a];
  const wB = BRANCH_WUXING[b] || STEM_WUXING[b];
  if (!wA || !wB) return false;
  return WUXING_KE[wA] === wB;
}

function buildSanChuan(siKe: LiuRenSiKe, riGan: string, riBranch: string, tianPan: string[]): LiuRenSanChuan {
  // 1. 贼克法：找四课中上克下或下克上
  const keList: Array<{ upper: string; lower: string; type: 'upper_ke' | 'lower_ke'; idx: number }> = [];
  for (let i = 0; i < 4; i++) {
    const { upper, lower } = siKe.courses[i];
    if (isKe(upper, lower)) {
      keList.push({ upper, lower, type: 'upper_ke', idx: i });
    }
    if (isKe(lower, upper)) {
      keList.push({ upper, lower, type: 'lower_ke', idx: i });
    }
  }

  let chu: string;
  let method: string;

  if (keList.length === 1) {
    // 唯一克，取之为初传
    const k = keList[0];
    chu = k.type === 'upper_ke' ? k.upper : k.lower;
    method = '贼克法（唯一克）';
  } else if (keList.length > 1) {
    // 多克取下贼上（下克上优先），若无则取上克下
    const lowerKe = keList.filter(k => k.type === 'lower_ke');
    if (lowerKe.length >= 1) {
      // 取最后一个下克上（简化涉害法）
      chu = lowerKe[lowerKe.length - 1].lower;
      method = lowerKe.length === 1 ? '贼克法（下贼上）' : '涉害法（简化取末下贼上）';
    } else {
      // 只有上克下
      chu = keList[keList.length - 1].upper;
      method = keList.length === 1 ? '贼克法（上克下）' : '涉害法（简化取末上克下）';
    }
  } else {
    // 无克 → 遥克法 / 昴星法 简化：取第一课上神
    chu = siKe.courses[0].upper;
    method = '昴星法（简化：无克取一课上神）';
  }

  // 中传：初传的上神
  const zhong = getTianPanOn(tianPan, chu);
  // 末传：中传的上神
  const mo = getTianPanOn(tianPan, zhong);

  return { chu, zhong, mo, method };
}

function buildTianJiang(riGan: string, shiBranch: string, tianPan: string[]): LiuRenTianJiang {
  // 判断昼夜：巳午为昼（简化：6-18时为昼）
  const shiIdx = BRANCH_INDEX[shiBranch];
  const isDaytime = shiIdx >= 3 && shiIdx <= 8; // 寅~申 近似昼
  const guiType = isDaytime ? '昼贵' as const : '夜贵' as const;
  const guiRenBranch = isDaytime ? DAY_GUI_REN[riGan] : NIGHT_GUI_REN[riGan];
  const guiRen = guiRenBranch || '丑';

  // 贵人落在 guiRen 位，其余天将按顺序排列
  // 贵人顺行（昼）或逆行（夜）
  const generals: Array<{ name: string; branch: string }> = [];
  const guiIdx = BRANCH_INDEX[guiRen];
  for (let i = 0; i < 12; i++) {
    const branchIdx = isDaytime
      ? (guiIdx + i) % 12
      : (guiIdx - i + 120) % 12;
    generals.push({
      name: TIAN_JIANG[i],
      branch: BRANCHES[branchIdx],
    });
  }

  return { generals, guiRen, guiType };
}

function assessAuspiciousness(
  sanChuan: LiuRenSanChuan,
  tianJiang: LiuRenTianJiang,
  riGan: string,
): { auspiciousness: LiuRenResult['auspiciousness']; score: number } {
  let score = 50;

  // 三传五行与日干关系
  const riWx = STEM_WUXING[riGan];
  for (const chuan of [sanChuan.chu, sanChuan.zhong, sanChuan.mo]) {
    const cwx = BRANCH_WUXING[chuan];
    if (WUXING_SHENG[cwx] === riWx) score += 6; // 生我
    if (WUXING_SHENG[riWx] === cwx) score -= 2; // 我生泄气
    if (WUXING_KE[cwx] === riWx) score -= 8;    // 克我
    if (WUXING_KE[riWx] === cwx) score += 3;    // 我克得财
  }

  // 天将吉凶
  for (const g of tianJiang.generals.slice(0, 4)) {
    score += (JIANG_AUSPICE[g.name] || 0) * 2;
  }

  // 贵人加分
  const guiOnChuan = tianJiang.generals.find(g => g.name === '贵人');
  if (guiOnChuan && [sanChuan.chu, sanChuan.zhong, sanChuan.mo].includes(guiOnChuan.branch)) {
    score += 8;
  }

  score = Math.max(5, Math.min(95, score));

  let auspiciousness: LiuRenResult['auspiciousness'];
  if (score >= 75) auspiciousness = '大吉';
  else if (score >= 60) auspiciousness = '吉';
  else if (score >= 40) auspiciousness = '中平';
  else if (score >= 25) auspiciousness = '凶';
  else auspiciousness = '大凶';

  return { auspiciousness, score };
}

function classifyKeType(siKe: LiuRenSiKe, sanChuan: LiuRenSanChuan): string {
  // 简化课体分类
  const c = siKe.courses;
  // 伏吟：四课上下相同
  if (c.every(k => k.upper === k.lower)) return '伏吟课';
  // 返吟：四课上下对冲
  if (c.every(k => branchDist(k.lower, k.upper) === 6)) return '返吟课';
  // 元首课：第一课有上克下
  if (isKe(c[0].upper, c[0].lower)) return '元首课';
  // 重审课：不是第一课有克
  for (let i = 1; i < 4; i++) {
    if (isKe(c[i].upper, c[i].lower) || isKe(c[i].lower, c[i].upper)) return '重审课';
  }
  // 其余
  if (sanChuan.method.includes('昴星')) return '昴星课';
  return '别责课';
}

function buildSummary(
  keType: string,
  auspiciousness: string,
  sanChuan: LiuRenSanChuan,
  tianJiang: LiuRenTianJiang,
): string {
  const guiGen = tianJiang.generals.find(g => g.name === '贵人');
  return `课体为「${keType}」，取传法：${sanChuan.method}。` +
    `三传为${sanChuan.chu}→${sanChuan.zhong}→${sanChuan.mo}。` +
    `${tianJiang.guiType}贵人临${tianJiang.guiRen}${guiGen ? '' : ''}。` +
    `综合判定：${auspiciousness}。`;
}

// ═══════════════════════════════════════════════
// FateVector Mapping
// ═══════════════════════════════════════════════

function mapToFateVector(result: LiuRenResult): FateVector {
  const { sanChuan, tianJiang, auspiciousness } = result;
  const baseMap: Record<string, number> = { '大吉': 80, '吉': 65, '中平': 50, '凶': 35, '大凶': 20 };
  const base = baseMap[auspiciousness] || 50;

  // 按三传五行细分
  const chuWx = BRANCH_WUXING[sanChuan.chu];
  const zhongWx = BRANCH_WUXING[sanChuan.zhong];
  const moWx = BRANCH_WUXING[sanChuan.mo];

  const wxBoost: Record<string, Record<string, number>> = {
    '木': { life: 3, wisdom: 5, health: 2, wealth: 0, relation: 2, spirit: 3 },
    '火': { life: 5, wisdom: 3, health: -2, wealth: 2, relation: 3, spirit: 5 },
    '土': { life: 2, wisdom: 0, health: 4, wealth: 5, relation: 3, spirit: 0 },
    '金': { life: 3, wisdom: 4, health: 0, wealth: 4, relation: -2, spirit: 2 },
    '水': { life: 0, wisdom: 5, health: 3, wealth: 2, relation: 4, spirit: 5 },
  };

  const life = clamp(base + (wxBoost[chuWx]?.life || 0));
  const wealth = clamp(base + (wxBoost[zhongWx]?.wealth || 0));
  const relation = clamp(base + (wxBoost[moWx]?.relation || 0));
  const health = clamp(base + (wxBoost[chuWx]?.health || 0));
  const wisdom = clamp(base + (wxBoost[zhongWx]?.wisdom || 0));
  const spirit = clamp(base + (wxBoost[moWx]?.spirit || 0));

  // 天将贵人加成
  const guiGenBranch = tianJiang.generals.find(g => g.name === '贵人')?.branch || '';
  const hasGuiInChuan = [sanChuan.chu, sanChuan.zhong, sanChuan.mo].includes(guiGenBranch);

  return {
    life: clamp(life + (hasGuiInChuan ? 5 : 0)),
    wealth: clamp(wealth),
    relation: clamp(relation + (hasGuiInChuan ? 3 : 0)),
    health: clamp(health),
    wisdom: clamp(wisdom),
    spirit: clamp(spirit + (hasGuiInChuan ? 4 : 0)),
  };
}

function clamp(v: number): number {
  return Math.max(5, Math.min(95, Math.round(v)));
}

// ═══════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════

export function runLiuRen(input: LiuRenInput): LiuRenResult {
  const queryDate = new Date(input.queryTimeUtc);
  const localMs = queryDate.getTime() + input.timezoneOffsetMinutes * 60000;
  const local = new Date(localMs);

  const localYear = local.getUTCFullYear();
  const localMonth = local.getUTCMonth() + 1;
  const localDay = local.getUTCDate();
  const localHour = local.getUTCHours();

  // 日干支
  const { gan: riGan, zhi: riBranch } = getDayGanZhi(localYear, localMonth, localDay);

  // 时辰
  const shiBranch = getShiBranch(localHour);

  // 月将（简化按月份）
  const yueJiang = MONTH_JIANG[(localMonth - 1) % 12];

  // 天盘
  const tianPan = buildTianPan(yueJiang, shiBranch);

  // 四课
  const siKe = buildSiKe(riGan, riBranch, tianPan);

  // 三传
  const sanChuan = buildSanChuan(siKe, riGan, riBranch, tianPan);

  // 天将
  const tianJiang = buildTianJiang(riGan, shiBranch, tianPan);

  // 课体
  const keType = classifyKeType(siKe, sanChuan);

  // 吉凶
  const { auspiciousness, score } = assessAuspiciousness(sanChuan, tianJiang, riGan);

  const meta: LiuRenMeta = {
    engineVersion: '1.0.0',
    ruleSchool: '古法大六壬（贼克取传法）',
    warnings: ['大六壬结果基于起课时间而非出生时间，适用于即时问事占断'],
    uncertaintyNotes: [
      '当前只实现一个规则版本（古法贼克取传）',
      '月将取法为简化太阳过宫法，精度受限',
      '三传在伏吟/返吟等特殊格局使用简化规则',
      '其他门派版本（如毕法赋、课经集等）尚未接入',
    ],
  };

  const result: LiuRenResult = {
    chart: { tianPan, diPan: [...BRANCHES], yueJiang, shiBranch, riGan, riBranch },
    siKe,
    sanChuan,
    tianJiang,
    keType,
    auspiciousness,
    summary: buildSummary(keType, auspiciousness, sanChuan, tianJiang),
    meta,
  };

  return result;
}

// ═══════════════════════════════════════════════
// EngineOutput builder (for orchestrator)
// ═══════════════════════════════════════════════

export function buildLiuRenEngineOutput(si: StandardizedInput): { eo: EngineOutput; liurenResult: LiuRenResult } {
  const t0 = performance.now();
  const input: LiuRenInput = {
    queryTimeUtc: si.queryTimeUtc,
    birthYear: si.birthLocalDateTime.year,
    birthMonth: si.birthLocalDateTime.month,
    birthDay: si.birthLocalDateTime.day,
    birthHour: si.birthLocalDateTime.hour,
    timezoneOffsetMinutes: si.timezoneOffsetMinutesAtBirth,
  };
  const result = runLiuRen(input);
  const t1 = performance.now();

  const fateVector = mapToFateVector(result);

  const eo: EngineOutput = {
    engineName: 'liuren',
    engineNameCN: '大六壬',
    engineVersion: result.meta.engineVersion,
    sourceUrls: ['https://en.wikipedia.org/wiki/Da_Liu_Ren'],
    sourceGrade: 'B',
    ruleSchool: result.meta.ruleSchool,
    confidence: 0.58,
    computationTimeMs: Math.round(t1 - t0),
    rawInputSnapshot: { queryTimeUtc: si.queryTimeUtc, riGan: result.chart.riGan, shiBranch: result.chart.shiBranch },
    fateVector,
    normalizedOutput: {
      '四课': result.siKe.courses.map(c => `${c.upper}/${c.lower}`).join(' '),
      '三传': `${result.sanChuan.chu}→${result.sanChuan.zhong}→${result.sanChuan.mo}`,
      '天将': result.tianJiang.generals.slice(0, 4).map(g => g.name).join('、'),
      '日辰': `${result.chart.riGan}${result.chart.riBranch}`,
      '时辰': result.chart.shiBranch,
      '课体': result.keType,
      '吉凶': result.auspiciousness,
      '贵人': `${result.tianJiang.guiType}·${result.tianJiang.guiRen}`,
      '月将': result.chart.yueJiang,
    },
    warnings: result.meta.warnings,
    uncertaintyNotes: result.meta.uncertaintyNotes,
    timingBasis: 'query',
  };

  return { eo, liurenResult: result };
}
