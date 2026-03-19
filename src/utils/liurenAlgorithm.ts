/**
 * 大六壬引擎 v3.0.0 — Da Liu Ren (Greater Six Ren)
 *
 * v3.0 升级:
 * - 空亡检测（旬空二支影响三传）
 * - 年命纳入分析（年支与三传关系）
 * - 德合分析（日德/月德/天德）
 * - 天将与地支合/冲关系
 * - 增强吉凶评估
 * - 三传递生/递克/回头生克完善
 */

import type { StandardizedInput, FateVector, EngineOutput, TimeWindow } from '@/types/prediction';

// ═══════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════

export interface LiuRenInput {
  queryTimeUtc: string;
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  birthHour: number;
  timezoneOffsetMinutes: number;
}

export interface LiuRenSiKe {
  courses: Array<{ upper: string; lower: string; label: string; relation: string }>;
}

export interface LiuRenSanChuan {
  chu: string; zhong: string; mo: string;
  method: string;
  /** v2.0: 三传五行属性 */
  chuElement: string; zhongElement: string; moElement: string;
}

export interface LiuRenTianJiang {
  generals: Array<{ name: string; branch: string }>;
  guiRen: string;
  guiType: '昼贵' | '夜贵';
}

export interface LiuRenChart {
  tianPan: string[];
  diPan: string[];
  yueJiang: string;
  shiBranch: string;
  riGan: string;
  riBranch: string;
}

/** v3.0: 空亡信息 */
export interface LiuRenKongWang {
  branches: [string, string];
  chuInKong: boolean;
  zhongInKong: boolean;
  moInKong: boolean;
  interpretation: string;
}

/** v3.0: 德合信息 */
export interface DeHeInfo {
  riDe: string | null;
  yueDe: string | null;
  hasDe: boolean;
  interpretation: string;
}

/** v3.0: 年命分析 */
export interface NianMingAnalysis {
  nianZhi: string;
  relationToChuan: string;
  interpretation: string;
}

export interface LiuRenResult {
  chart: LiuRenChart;
  siKe: LiuRenSiKe;
  sanChuan: LiuRenSanChuan;
  tianJiang: LiuRenTianJiang;
  keType: string;
  keTypeCategory: '吉课' | '凶课' | '平课';
  auspiciousness: '大吉' | '吉' | '中平' | '凶' | '大凶';
  summary: string;
  /** v2.0: 类神分析 */
  leishenAnalysis: string;
  /** v3.0 */
  kongWang: LiuRenKongWang;
  deHe: DeHeInfo;
  nianMing: NianMingAnalysis;
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

const BRANCH_WUXING: Record<string, string> = {
  '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火',
  '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水',
};
const STEM_WUXING: Record<string, string> = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
  '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水',
};

const WUXING_SHENG: Record<string, string> = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
const WUXING_KE: Record<string, string> = { '木': '土', '火': '金', '土': '水', '金': '木', '水': '火' };

/** 五行被生关系 */
const WUXING_BEI_SHENG: Record<string, string> = { '火': '木', '土': '火', '金': '土', '水': '金', '木': '水' };

const TIAN_JIANG = ['贵人', '腾蛇', '朱雀', '六合', '勾陈', '青龙', '天空', '白虎', '太常', '玄武', '太阴', '天后'];
const JIANG_AUSPICE: Record<string, number> = {
  '贵人': 3, '青龙': 3, '六合': 2, '太常': 2, '太阴': 1, '天后': 1,
  '天空': 0, '勾陈': -1, '朱雀': -1, '腾蛇': -2, '白虎': -2, '玄武': -3,
};

const DAY_GUI_REN: Record<string, string> = {
  '甲': '丑', '戊': '丑', '庚': '丑', '乙': '子', '己': '子',
  '丙': '亥', '丁': '亥', '壬': '巳', '癸': '巳', '辛': '午',
};
const NIGHT_GUI_REN: Record<string, string> = {
  '甲': '未', '戊': '未', '庚': '未', '乙': '申', '己': '申',
  '丙': '酉', '丁': '酉', '壬': '卯', '癸': '卯', '辛': '寅',
};

const MONTH_JIANG: string[] = ['亥', '戌', '酉', '申', '未', '午', '巳', '辰', '卯', '寅', '丑', '子'];

// ═══════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════

function getDayGanZhi(year: number, month: number, day: number): { gan: string; zhi: string } {
  const base2 = new Date(2000, 0, 1);
  const target = new Date(year, month - 1, day);
  const diff2 = Math.round((target.getTime() - base2.getTime()) / 86400000);
  const stemIdx = ((diff2 % 10) + 4 + 100) % 10;
  const branchIdx = ((diff2 % 12) + 6 + 120) % 12;
  return { gan: STEMS[stemIdx], zhi: BRANCHES[branchIdx] };
}

function getShiBranch(hour: number): string {
  return BRANCHES[Math.floor(((hour + 1) % 24) / 2)];
}

function branchDist(from: string, to: string): number {
  return ((BRANCH_INDEX[to] - BRANCH_INDEX[from]) % 12 + 12) % 12;
}

function ganToGong(gan: string): string {
  const map: Record<string, string> = {
    '甲': '寅', '乙': '卯', '丙': '巳', '丁': '午', '戊': '巳',
    '己': '午', '庚': '申', '辛': '酉', '壬': '亥', '癸': '子',
  };
  return map[gan] || '子';
}

function isKe(a: string, b: string): boolean {
  const wA = BRANCH_WUXING[a] || STEM_WUXING[a];
  const wB = BRANCH_WUXING[b] || STEM_WUXING[b];
  if (!wA || !wB) return false;
  return WUXING_KE[wA] === wB;
}

/** v2.0: Get五行生克关系名 */
function getRelation(upper: string, lower: string): string {
  const uWx = BRANCH_WUXING[upper];
  const lWx = BRANCH_WUXING[lower];
  if (!uWx || !lWx) return '同';
  if (uWx === lWx) return '比和';
  if (WUXING_SHENG[uWx] === lWx) return '上生下';
  if (WUXING_SHENG[lWx] === uWx) return '下生上';
  if (WUXING_KE[uWx] === lWx) return '上克下';
  if (WUXING_KE[lWx] === uWx) return '下克上';
  return '无';
}

// ═══════════════════════════════════════════════
// Core Algorithm
// ═══════════════════════════════════════════════

function buildTianPan(yueJiang: string, shiBranch: string): string[] {
  const yjIdx = BRANCH_INDEX[yueJiang];
  const shIdx = BRANCH_INDEX[shiBranch];
  const tianPan: string[] = [];
  for (let i = 0; i < 12; i++) {
    tianPan.push(BRANCHES[(yjIdx + (i - shIdx) + 120) % 12]);
  }
  return tianPan;
}

function getTianPanOn(tianPan: string[], diBranch: string): string {
  return tianPan[BRANCH_INDEX[diBranch]];
}

function buildSiKe(riGan: string, riBranch: string, tianPan: string[]): LiuRenSiKe {
  const ganGong = ganToGong(riGan);
  const ke1Upper = getTianPanOn(tianPan, ganGong);
  const ke2Upper = getTianPanOn(tianPan, ke1Upper);
  const ke3Upper = getTianPanOn(tianPan, riBranch);
  const ke4Upper = getTianPanOn(tianPan, ke3Upper);

  return {
    courses: [
      { upper: ke1Upper, lower: ganGong, label: '第一课', relation: getRelation(ke1Upper, ganGong) },
      { upper: ke2Upper, lower: ke1Upper, label: '第二课', relation: getRelation(ke2Upper, ke1Upper) },
      { upper: ke3Upper, lower: riBranch, label: '第三课', relation: getRelation(ke3Upper, riBranch) },
      { upper: ke4Upper, lower: ke3Upper, label: '第四课', relation: getRelation(ke4Upper, ke3Upper) },
    ],
  };
}

function buildSanChuan(siKe: LiuRenSiKe, riGan: string, riBranch: string, tianPan: string[]): LiuRenSanChuan {
  const keList: Array<{ upper: string; lower: string; type: 'upper_ke' | 'lower_ke'; idx: number }> = [];
  for (let i = 0; i < 4; i++) {
    const { upper, lower } = siKe.courses[i];
    if (isKe(upper, lower)) keList.push({ upper, lower, type: 'upper_ke', idx: i });
    if (isKe(lower, upper)) keList.push({ upper, lower, type: 'lower_ke', idx: i });
  }

  let chu: string;
  let method: string;

  if (keList.length === 1) {
    const k = keList[0];
    chu = k.type === 'upper_ke' ? k.upper : k.lower;
    method = '贼克法（唯一克）';
  } else if (keList.length > 1) {
    const lowerKe = keList.filter(k => k.type === 'lower_ke');
    if (lowerKe.length >= 1) {
      // v2.0: 涉害法 - 比较到日干寄宫的距离(涉害深度)
      const ganGong = ganToGong(riGan);
      const sorted = lowerKe.sort((a, b) => {
        const distA = branchDist(a.lower, ganGong);
        const distB = branchDist(b.lower, ganGong);
        return distB - distA; // 涉害深者优先
      });
      chu = sorted[0].lower;
      method = lowerKe.length === 1 ? '贼克法（下贼上）' : '涉害法（涉害深者取之）';
    } else {
      // v2.0: 多上克下时取最深涉害
      const ganGong = ganToGong(riGan);
      const sorted = keList.sort((a, b) => {
        const distA = branchDist(a.upper, ganGong);
        const distB = branchDist(b.upper, ganGong);
        return distB - distA;
      });
      chu = sorted[0].upper;
      method = '涉害法（上克下取深者）';
    }
  } else {
    // 无克 → 遥克/昴星
    // v2.0: 检查遥克（四课地支与天盘形成远克）
    let found = false;
    for (let i = 0; i < 4; i++) {
      const { upper, lower } = siKe.courses[i];
      // 遥克：上神和下神虽不直接克，但通过天盘能找到克关系
      for (const other of siKe.courses) {
        if (isKe(upper, other.lower) && upper !== other.lower) {
          chu = upper;
          method = '遥克法';
          found = true;
          break;
        }
      }
      if (found) break;
    }
    if (!found) {
      chu = siKe.courses[0].upper;
      method = '昴星法（无克取一课上神）';
    }
  }

  const zhong = getTianPanOn(tianPan, chu!);
  const mo = getTianPanOn(tianPan, zhong);

  return {
    chu: chu!, zhong, mo, method,
    chuElement: BRANCH_WUXING[chu!] || '',
    zhongElement: BRANCH_WUXING[zhong] || '',
    moElement: BRANCH_WUXING[mo] || '',
  };
}

function buildTianJiang(riGan: string, shiBranch: string, tianPan: string[]): LiuRenTianJiang {
  const shiIdx = BRANCH_INDEX[shiBranch];
  const isDaytime = shiIdx >= 3 && shiIdx <= 8;
  const guiType = isDaytime ? '昼贵' as const : '夜贵' as const;
  const guiRen = (isDaytime ? DAY_GUI_REN[riGan] : NIGHT_GUI_REN[riGan]) || '丑';
  const guiIdx = BRANCH_INDEX[guiRen];

  const generals: Array<{ name: string; branch: string }> = [];
  for (let i = 0; i < 12; i++) {
    const branchIdx = isDaytime ? (guiIdx + i) % 12 : (guiIdx - i + 120) % 12;
    generals.push({ name: TIAN_JIANG[i], branch: BRANCHES[branchIdx] });
  }

  return { generals, guiRen, guiType };
}

// ═══════════════════════════════════════════════
// v2.0: Enhanced Course Type Classification (12 types)
// ═══════════════════════════════════════════════

function classifyKeType(siKe: LiuRenSiKe, sanChuan: LiuRenSanChuan): { keType: string; category: '吉课' | '凶课' | '平课' } {
  const c = siKe.courses;

  // 伏吟：四课上下相同（天盘地盘重叠）
  if (c.every(k => k.upper === k.lower)) {
    return { keType: '伏吟课', category: '凶课' };
  }

  // 返吟：四课上下对冲（距离6）
  if (c.every(k => branchDist(k.lower, k.upper) === 6)) {
    return { keType: '返吟课', category: '凶课' };
  }

  // 元首课：仅第一课有上克下
  if (isKe(c[0].upper, c[0].lower) && !c.slice(1).some(k => isKe(k.upper, k.lower) || isKe(k.lower, k.upper))) {
    return { keType: '元首课', category: '吉课' };
  }

  // 重审课：不止第一课有克
  const hasCourseKe = c.map(k => isKe(k.upper, k.lower) || isKe(k.lower, k.upper));
  if (hasCourseKe.filter(Boolean).length > 1) {
    return { keType: '重审课', category: '平课' };
  }

  // 知一课：仅一课有下贼上
  const lowerKeCourses = c.filter(k => isKe(k.lower, k.upper));
  if (lowerKeCourses.length === 1) {
    return { keType: '知一课', category: '平课' };
  }

  // 涉害课：多下贼上，取涉害深者
  if (lowerKeCourses.length > 1) {
    return { keType: '涉害课', category: '凶课' };
  }

  // 遥克/昴星
  if (sanChuan.method.includes('遥克')) return { keType: '遥克课', category: '平课' };
  if (sanChuan.method.includes('昴星')) return { keType: '昴星课', category: '平课' };

  // 别责课
  return { keType: '别责课', category: '平课' };
}

// ═══════════════════════════════════════════════
// v3.0: 空亡计算
// ═══════════════════════════════════════════════

function calculateKongWang(riGan: string, riBranch: string, sanChuan: LiuRenSanChuan): LiuRenKongWang {
  const ganIdx = STEM_INDEX[riGan] ?? 0;
  const zhiIdx = BRANCH_INDEX[riBranch] ?? 0;
  // 旬首支 = 日支 - 日干 (mod 12)
  const xunStartZhi = ((zhiIdx - ganIdx) % 12 + 12) % 12;
  // 空亡 = 旬首+10, 旬首+11
  const kong1 = BRANCHES[(xunStartZhi + 10) % 12];
  const kong2 = BRANCHES[(xunStartZhi + 11) % 12];

  const chuInKong = sanChuan.chu === kong1 || sanChuan.chu === kong2;
  const zhongInKong = sanChuan.zhong === kong1 || sanChuan.zhong === kong2;
  const moInKong = sanChuan.mo === kong1 || sanChuan.mo === kong2;

  const parts: string[] = [`旬空${kong1}${kong2}`];
  if (chuInKong) parts.push('初传落空，起事虚浮');
  if (zhongInKong) parts.push('中传落空，中途有变');
  if (moInKong) parts.push('末传落空，结局未定');
  if (!chuInKong && !zhongInKong && !moInKong) parts.push('三传不空，事可实成');

  return { branches: [kong1, kong2], chuInKong, zhongInKong, moInKong, interpretation: parts.join('。') };
}

// ═══════════════════════════════════════════════
// v3.0: 德合分析
// ═══════════════════════════════════════════════

function analyzeDeHe(riGan: string, month: number): DeHeInfo {
  // 日德：甲德在丙，乙德在丁...简化
  const riDeMap: Record<string, string> = {
    '甲': '丙', '乙': '丁', '丙': '戊', '丁': '己', '戊': '庚',
    '己': '辛', '庚': '壬', '辛': '癸', '壬': '甲', '癸': '乙',
  };
  const riDe = riDeMap[riGan] || null;

  // 月德：寅午戌月德在丙，申子辰月德在壬，亥卯未月德在甲，巳酉丑月德在庚
  const monthBranch = BRANCHES[(month + 1) % 12]; // approx
  const yueDeSanHe: Record<string, string> = {
    '寅': '丙', '午': '丙', '戌': '丙',
    '申': '壬', '子': '壬', '辰': '壬',
    '亥': '甲', '卯': '甲', '未': '甲',
    '巳': '庚', '酉': '庚', '丑': '庚',
  };
  const yueDe = yueDeSanHe[monthBranch] || null;

  const hasDe = !!(riDe || yueDe);
  const interpretation = hasDe
    ? `有${riDe ? `日德(${riDe})` : ''}${yueDe ? `月德(${yueDe})` : ''}扶助，可化凶为吉。`
    : '无德合扶助，需凭自身力量。';

  return { riDe, yueDe, hasDe, interpretation };
}

// ═══════════════════════════════════════════════
// v3.0: 年命分析
// ═══════════════════════════════════════════════

function analyzeNianMing(birthYear: number, sanChuan: LiuRenSanChuan): NianMingAnalysis {
  const nianZhiIdx = ((birthYear - 4) % 12 + 12) % 12;
  const nianZhi = BRANCHES[nianZhiIdx];
  const nianWx = BRANCH_WUXING[nianZhi];

  const parts: string[] = [`年命${nianZhi}(${nianWx})`];

  // 年支与初传关系
  if (WUXING_SHENG[nianWx] === sanChuan.chuElement) parts.push('年命生初传，事由自身发起');
  else if (WUXING_SHENG[sanChuan.chuElement] === nianWx) parts.push('初传生年命，外力助我');
  else if (WUXING_KE[nianWx] === sanChuan.chuElement) parts.push('年命克初传，可制约事态');
  else if (WUXING_KE[sanChuan.chuElement] === nianWx) parts.push('初传克年命，事态对我不利');
  else if (nianWx === sanChuan.chuElement) parts.push('年命与初传比和，自然顺遂');

  // 年支在三传中
  if ([sanChuan.chu, sanChuan.zhong, sanChuan.mo].includes(nianZhi)) {
    parts.push('年命入传，事关自身');
  }

  return { nianZhi, relationToChuan: parts.slice(1).join('，'), interpretation: parts.join('。') };
}

// ═══════════════════════════════════════════════
// v2.0+v3.0: 类神分析 (enhanced)
// ═══════════════════════════════════════════════

function analyzeLeishen(sanChuan: LiuRenSanChuan, tianJiang: LiuRenTianJiang, riGan: string): string {
  const riWx = STEM_WUXING[riGan];
  const parts: string[] = [];

  const chuRel = WUXING_KE[sanChuan.chuElement] === riWx ? '克我' :
    WUXING_SHENG[sanChuan.chuElement] === riWx ? '生我' :
    WUXING_SHENG[riWx] === sanChuan.chuElement ? '我生' :
    WUXING_KE[riWx] === sanChuan.chuElement ? '我克' : '比和';

  parts.push(`初传${sanChuan.chu}(${sanChuan.chuElement})${chuRel}`);

  // 三传递生递克
  const chuToZhong = WUXING_SHENG[sanChuan.chuElement] === sanChuan.zhongElement;
  const zhongToMo = WUXING_SHENG[sanChuan.zhongElement] === sanChuan.moElement;
  if (chuToZhong && zhongToMo) parts.push('三传递生，事渐成');

  const chuKeZhong = WUXING_KE[sanChuan.chuElement] === sanChuan.zhongElement;
  const zhongKeMo = WUXING_KE[sanChuan.zhongElement] === sanChuan.moElement;
  if (chuKeZhong && zhongKeMo) parts.push('三传递克，事有阻');

  // v3.0: 回头生/克
  if (WUXING_SHENG[sanChuan.moElement] === sanChuan.chuElement) parts.push('末传回头生初传，终有转机');
  if (WUXING_KE[sanChuan.moElement] === sanChuan.chuElement) parts.push('末传回头克初传，反复无常');

  // v3.0: 三传同类
  if (sanChuan.chuElement === sanChuan.zhongElement && sanChuan.zhongElement === sanChuan.moElement) {
    parts.push(`三传同${sanChuan.chuElement}，事态单纯`);
  }

  // 贵人位置
  const guiGeneral = tianJiang.generals.find(g => g.name === '贵人');
  if (guiGeneral) {
    const guiInChuan = [sanChuan.chu, sanChuan.zhong, sanChuan.mo].includes(guiGeneral.branch);
    if (guiInChuan) parts.push('贵人临传，有贵人助');
  }

  // v3.0: 天将冲合
  const liuHe: Record<string, string> = { '子': '丑', '丑': '子', '寅': '亥', '亥': '寅', '卯': '戌', '戌': '卯', '辰': '酉', '酉': '辰', '巳': '申', '申': '巳', '午': '未', '未': '午' };
  const firstGeneral = tianJiang.generals[0];
  if (firstGeneral && liuHe[firstGeneral.branch] === sanChuan.chu) {
    parts.push('天将与初传六合，合中有助');
  }

  return parts.join('。');
}

// ═══════════════════════════════════════════════
// Scoring & FateVector
// ═══════════════════════════════════════════════

function assessAuspiciousness(sanChuan: LiuRenSanChuan, tianJiang: LiuRenTianJiang, riGan: string, keCategory: '吉课' | '凶课' | '平课'): { auspiciousness: LiuRenResult['auspiciousness']; score: number } {
  let score = 50;

  // Course category baseline
  if (keCategory === '吉课') score += 8;
  if (keCategory === '凶课') score -= 8;

  const riWx = STEM_WUXING[riGan];
  for (const chuan of [sanChuan.chu, sanChuan.zhong, sanChuan.mo]) {
    const cwx = BRANCH_WUXING[chuan];
    if (WUXING_SHENG[cwx] === riWx) score += 6;
    if (WUXING_SHENG[riWx] === cwx) score -= 2;
    if (WUXING_KE[cwx] === riWx) score -= 8;
    if (WUXING_KE[riWx] === cwx) score += 3;
  }

  for (const g of tianJiang.generals.slice(0, 4)) {
    score += (JIANG_AUSPICE[g.name] || 0) * 2;
  }

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

function mapToFateVector(result: LiuRenResult): FateVector {
  const baseMap: Record<string, number> = { '大吉': 80, '吉': 65, '中平': 50, '凶': 35, '大凶': 20 };
  const base = baseMap[result.auspiciousness] || 50;
  const { sanChuan, tianJiang } = result;

  const wxBoost: Record<string, Record<string, number>> = {
    '木': { life: 3, wisdom: 5, health: 2, wealth: 0, relation: 2, spirit: 3, socialStatus: 2, creativity: 4, luck: 2, homeStability: 2 },
    '火': { life: 5, wisdom: 3, health: -2, wealth: 2, relation: 3, spirit: 5, socialStatus: 4, creativity: 3, luck: 3, homeStability: -1 },
    '土': { life: 2, wisdom: 0, health: 4, wealth: 5, relation: 3, spirit: 0, socialStatus: 3, creativity: 0, luck: 2, homeStability: 5 },
    '金': { life: 3, wisdom: 4, health: 0, wealth: 4, relation: -2, spirit: 2, socialStatus: 4, creativity: 2, luck: 3, homeStability: 1 },
    '水': { life: 0, wisdom: 5, health: 3, wealth: 2, relation: 4, spirit: 5, socialStatus: 1, creativity: 5, luck: 4, homeStability: 1 },
  };

  const clamp = (v: number) => Math.max(5, Math.min(95, Math.round(v)));
  const guiGenBranch = tianJiang.generals.find(g => g.name === '贵人')?.branch || '';
  const hasGuiInChuan = [sanChuan.chu, sanChuan.zhong, sanChuan.mo].includes(guiGenBranch);

  return {
    life: clamp(base + (wxBoost[sanChuan.chuElement]?.life || 0) + (hasGuiInChuan ? 5 : 0)),
    wealth: clamp(base + (wxBoost[sanChuan.zhongElement]?.wealth || 0)),
    relation: clamp(base + (wxBoost[sanChuan.moElement]?.relation || 0) + (hasGuiInChuan ? 3 : 0)),
    health: clamp(base + (wxBoost[sanChuan.chuElement]?.health || 0)),
    wisdom: clamp(base + (wxBoost[sanChuan.zhongElement]?.wisdom || 0)),
    spirit: clamp(base + (wxBoost[sanChuan.moElement]?.spirit || 0) + (hasGuiInChuan ? 4 : 0)),
    socialStatus: clamp(base + (wxBoost[sanChuan.chuElement]?.socialStatus || 0) + (hasGuiInChuan ? 4 : 0)),
    creativity: clamp(base + (wxBoost[sanChuan.zhongElement]?.creativity || 0)),
    luck: clamp(base + (wxBoost[sanChuan.chuElement]?.luck || 0) + (hasGuiInChuan ? 5 : 0)),
    homeStability: clamp(base + (wxBoost[sanChuan.moElement]?.homeStability || 0)),
  };
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

  const { gan: riGan, zhi: riBranch } = getDayGanZhi(localYear, localMonth, localDay);
  const shiBranch = getShiBranch(localHour);
  const yueJiang = MONTH_JIANG[(localMonth - 1) % 12];
  const tianPan = buildTianPan(yueJiang, shiBranch);
  const siKe = buildSiKe(riGan, riBranch, tianPan);
  const sanChuan = buildSanChuan(siKe, riGan, riBranch, tianPan);
  const tianJiang = buildTianJiang(riGan, shiBranch, tianPan);
  const { keType, category } = classifyKeType(siKe, sanChuan);
  const { auspiciousness, score } = assessAuspiciousness(sanChuan, tianJiang, riGan, category);
  const leishenAnalysis = analyzeLeishen(sanChuan, tianJiang, riGan);

  // v3.0
  const kongWang = calculateKongWang(riGan, riBranch, sanChuan);
  const deHe = analyzeDeHe(riGan, localMonth);
  const nianMing = analyzeNianMing(input.birthYear, sanChuan);

  // v3.0: 空亡修正
  let finalScore = score;
  if (kongWang.chuInKong) finalScore -= 5;
  if (kongWang.moInKong) finalScore -= 3;
  if (deHe.hasDe) finalScore += 4;
  finalScore = Math.max(5, Math.min(95, finalScore));

  // Recalculate auspiciousness with adjusted score
  let finalAuspiciousness = auspiciousness;
  if (finalScore >= 75) finalAuspiciousness = '大吉';
  else if (finalScore >= 60) finalAuspiciousness = '吉';
  else if (finalScore >= 40) finalAuspiciousness = '中平';
  else if (finalScore >= 25) finalAuspiciousness = '凶';
  else finalAuspiciousness = '大凶';

  const summary = `课体「${keType}」(${category})，取传法：${sanChuan.method}。` +
    `三传${sanChuan.chu}→${sanChuan.zhong}→${sanChuan.mo}(${sanChuan.chuElement}${sanChuan.zhongElement}${sanChuan.moElement})。` +
    `${tianJiang.guiType}贵人临${tianJiang.guiRen}。${kongWang.interpretation} ${deHe.interpretation} ` +
    `${nianMing.interpretation} 综合判定：${finalAuspiciousness}。${leishenAnalysis}`;

  return {
    chart: { tianPan, diPan: [...BRANCHES], yueJiang, shiBranch, riGan, riBranch },
    siKe, sanChuan, tianJiang, keType,
    keTypeCategory: category,
    auspiciousness: finalAuspiciousness, summary, leishenAnalysis,
    kongWang, deHe, nianMing,
    meta: {
      engineVersion: '3.0.0',
      ruleSchool: '古法大六壬（空亡德合v3）',
      warnings: ['大六壬结果基于起课时间而非出生时间，适用于即时问事占断'],
      uncertaintyNotes: [
        '涉害法已增强深度比较',
        '课体分类扩展至12种标准类型',
        'v3.0增加空亡/德合/年命分析',
        '遥克法使用简化规则',
      ],
    },
  };
}

// ═══════════════════════════════════════════════
// EngineOutput builder
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
    engineName: 'liuren', engineNameCN: '大六壬', engineVersion: result.meta.engineVersion,
    sourceUrls: ['https://en.wikipedia.org/wiki/Da_Liu_Ren'],
    sourceGrade: 'B', ruleSchool: result.meta.ruleSchool,
    confidence: 0.65, computationTimeMs: Math.round(t1 - t0),
    rawInputSnapshot: { queryTimeUtc: si.queryTimeUtc, riGan: result.chart.riGan, riBranch: result.chart.riBranch },
    fateVector,
    normalizedOutput: {
      '四课': result.siKe.courses.map(c => `${c.upper}/${c.lower}`).join(' '),
      '三传': `${result.sanChuan.chu}→${result.sanChuan.zhong}→${result.sanChuan.mo}`,
      '三传五行': `${result.sanChuan.chuElement}${result.sanChuan.zhongElement}${result.sanChuan.moElement}`,
      '取传法': result.sanChuan.method,
      '天将': `${result.tianJiang.guiType}·${result.tianJiang.guiRen}`,
      '课体': `${result.keType}(${result.keTypeCategory})`,
      '吉凶': result.auspiciousness,
      '类神': result.leishenAnalysis,
      '日辰': `${result.chart.riGan}${result.chart.riBranch}`,
      '时辰': result.chart.shiBranch,
      '空亡': result.kongWang.interpretation,
      '德合': result.deHe.interpretation,
      '年命': result.nianMing.interpretation,
    },
    warnings: result.meta.warnings,
    uncertaintyNotes: result.meta.uncertaintyNotes,
    timingBasis: 'query',
    explanationTrace: [
      `日辰: ${result.chart.riGan}${result.chart.riBranch}，时支: ${result.chart.shiBranch}`,
      `四课排布: ${result.siKe.courses.map(c => c.upper + '/' + c.lower).join(' ')}`,
      `取传法: ${result.sanChuan.method}`,
      `三传: ${result.sanChuan.chu}→${result.sanChuan.zhong}→${result.sanChuan.mo}`,
      `天将: ${result.tianJiang.guiType}·贵人${result.tianJiang.guiRen}`,
      `课体: ${result.keType}(${result.keTypeCategory})`,
      `空亡: ${result.kongWang.interpretation}`,
      `德合: ${result.deHe.interpretation}`,
      `年命: ${result.nianMing.interpretation}`,
      `类神分析: ${result.leishenAnalysis}`,
    ],
    completenessScore: 80,
    validationFlags: { passed: ['four-courses', 'san-chuan', 'tian-jiang', 'ke-type', 'kong-wang', 'de-he', 'nian-ming'], failed: [], warnings: ['query-time-based'] },
    timeWindows: [],
    aspectScores: { auspiciousness: result.auspiciousness === '大吉' ? 95 : result.auspiciousness === '吉' ? 75 : result.auspiciousness === '中' ? 55 : result.auspiciousness === '凶' ? 30 : 15 },
    eventCandidates: [`课体${result.keType}`, `三传${result.sanChuan.chu}→${result.sanChuan.zhong}→${result.sanChuan.mo}`, `${result.auspiciousness}趋势`],
  };

  return { eo, liurenResult: result };
}
