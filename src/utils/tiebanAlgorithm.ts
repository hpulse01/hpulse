/**
 * Iron Plate Divine Number (铁板神数) Engine v2.0
 * 
 * v2.0 升级内容：
 * - 完整十二宫系统（命宫/兄弟/夫妻/子女/财帛/疾厄/迁移/仆役/官禄/田宅/福德/父母）
 * - 洛书数和谐度分析
 * - 纳音五行深度关联（按宫位交叉分析）
 * - 三层输出标准化（rawParams → chartResult → analysisConclusion）
 * - 增强大运推算（纳音元素+喜忌交叉）
 * - 流年条文精细化（引入太玄乘数法）
 * - 宫位强弱评分体系
 * 
 * 规则版本: 太玄刻分定局法 v2.0
 * 参考: 铁板神数原典PDF、《邵子神数》
 */

import { Solar, Lunar } from 'lunar-typescript';

// ==========================================
// 1. THE AXIOMATIC CONSTANTS (公理常数)
// ==========================================

const TAI_XUAN_MAP: Record<string, number> = {
  '甲': 9, '己': 9, '子': 9, '午': 9,
  '乙': 8, '庚': 8, '丑': 8, '未': 8,
  '丙': 7, '辛': 7, '寅': 7, '申': 7,
  '丁': 6, '壬': 6, '卯': 6, '酉': 6,
  '戊': 5, '癸': 5, '辰': 5, '戌': 5,
  '巳': 4, '亥': 4
};

const BASE_MODULO = 12000;
const MIN_CLAUSE_ID = 1;
const MAX_CLAUSE_ID = 12000;

const BRANCH_YAO_VALUES: Record<string, number> = {
  '子': 30, '丑': 30, '寅': 60, '卯': 60,
  '辰': 90, '巳': 90, '午': 120, '未': 120,
  '申': 150, '酉': 150, '戌': 180, '亥': 180
};

const LUO_SHU_COMBINE: Record<number, number> = {
  1: 9, 9: 1, 2: 8, 8: 2, 3: 7, 7: 3, 4: 6, 6: 4, 5: 5
};

/** v2.0: 完整十二宫系统 */
const PALACE_OFFSETS = {
  KAO_KE: 0,        // 考刻条文 (1-1000)
  PARENTS: 0,       // 六亲宫 (同考刻)
  FATE: 1000,       // 命宫 (1001-2000)
  SIBLINGS: 2000,   // 兄弟宫 (2001-3000)
  MARRIAGE: 3000,   // 婚姻宫 (3001-4000)
  CHILDREN: 4000,   // 子女宫 (4001-5000)
  WEALTH: 5000,     // 财帛宫 (5001-6000)
  CAREER: 6000,     // 官禄宫 (6001-7000)
  HEALTH: 7000,     // 疾厄宫 (7001-8000)
  PROPERTY: 8000,   // 田宅宫 (8001-9000)
  FLOW_YEAR: 9000,  // 流年宫 (9001-10000)
  FLOW_MONTH: 10000,// 流月宫 (10001-11000)
  MIGRATION: 0,     // 迁移 (映射到命宫偏移)
  SERVANTS: 0,      // 仆役 (映射到兄弟偏移)
  FORTUNE: 0,       // 福德 (映射到财帛偏移)
};

/** v2.0: 十二宫名称与映射 */
const TWELVE_PALACES = [
  { name: '命宫', key: 'fate', offset: 1000, aspect: '一生总论' },
  { name: '兄弟宫', key: 'siblings', offset: 2000, aspect: '兄弟姐妹缘分' },
  { name: '夫妻宫', key: 'marriage', offset: 3000, aspect: '婚姻感情' },
  { name: '子女宫', key: 'children', offset: 4000, aspect: '子女缘分' },
  { name: '财帛宫', key: 'wealth', offset: 5000, aspect: '财运理财' },
  { name: '疾厄宫', key: 'health', offset: 7000, aspect: '健康疾病' },
  { name: '迁移宫', key: 'migration', offset: 1000, aspect: '出行迁徙', modifier: 137 },
  { name: '仆役宫', key: 'servants', offset: 2000, aspect: '人际交往', modifier: 251 },
  { name: '官禄宫', key: 'career', offset: 6000, aspect: '事业仕途' },
  { name: '田宅宫', key: 'property', offset: 8000, aspect: '房产不动产' },
  { name: '福德宫', key: 'fortune', offset: 5000, aspect: '福泽精神', modifier: 389 },
  { name: '父母宫', key: 'parents', offset: 0, aspect: '父母缘分' },
] as const;

const KE_SHIFT_TABLE = [
  { index: 0, offset: 0,   label: "一刻 (初刻)", timeRange: "0-15分" },
  { index: 1, offset: 15,  label: "二刻",       timeRange: "15-30分" },
  { index: 2, offset: 30,  label: "三刻",       timeRange: "30-45分" },
  { index: 3, offset: 45,  label: "四刻",       timeRange: "45-60分" },
  { index: 4, offset: 60,  label: "五刻",       timeRange: "60-75分" },
  { index: 5, offset: 75,  label: "六刻",       timeRange: "75-90分" },
  { index: 6, offset: 90,  label: "七刻",       timeRange: "90-105分" },
  { index: 7, offset: 105, label: "八刻 (末刻)", timeRange: "105-120分" },
];

const FLOW_YEAR_STEP = 12;
const QUARTER_LABELS = KE_SHIFT_TABLE.map(k => k.label);

const NA_YIN_TABLE: Record<string, string> = {
  '甲子': '海中金', '乙丑': '海中金', '丙寅': '炉中火', '丁卯': '炉中火',
  '戊辰': '大林木', '己巳': '大林木', '庚午': '路旁土', '辛未': '路旁土',
  '壬申': '剑锋金', '癸酉': '剑锋金', '甲戌': '山头火', '乙亥': '山头火',
  '丙子': '涧下水', '丁丑': '涧下水', '戊寅': '城头土', '己卯': '城头土',
  '庚辰': '白腊金', '辛巳': '白腊金', '壬午': '杨柳木', '癸未': '杨柳木',
  '甲申': '泉中水', '乙酉': '泉中水', '丙戌': '屋上土', '丁亥': '屋上土',
  '戊子': '霹雳火', '己丑': '霹雳火', '庚寅': '松柏木', '辛卯': '松柏木',
  '壬辰': '长流水', '癸巳': '长流水', '甲午': '砂中金', '乙未': '砂中金',
  '丙申': '山下火', '丁酉': '山下火', '戊戌': '平地木', '己亥': '平地木',
  '庚子': '壁上土', '辛丑': '壁上土', '壬寅': '金箔金', '癸卯': '金箔金',
  '甲辰': '覆灯火', '乙巳': '覆灯火', '丙午': '天河水', '丁未': '天河水',
  '戊申': '大驿土', '己酉': '大驿土', '庚戌': '钗钏金', '辛亥': '钗钏金',
  '壬子': '桑柘木', '癸丑': '桑柘木', '甲寅': '大溪水', '乙卯': '大溪水',
  '丙辰': '沙中土', '丁巳': '沙中土', '戊午': '天上火', '己未': '天上火',
  '庚申': '石榴木', '辛酉': '石榴木', '壬戌': '大海水', '癸亥': '大海水',
};

/** v2.0: 纳音五行提取 */
const NA_YIN_ELEMENT: Record<string, string> = {};
for (const [gz, ny] of Object.entries(NA_YIN_TABLE)) {
  const lastChar = ny.charAt(ny.length - 1);
  NA_YIN_ELEMENT[gz] = lastChar;
}

/** v2.0: 洛书九宫数 */
const LUO_SHU_GRID = [
  [4, 9, 2],
  [3, 5, 7],
  [8, 1, 6],
];

/** v3.0: 河图配数 */
const HE_TU_MAP: Record<string, number> = {
  '水': 1, '火': 2, '木': 3, '金': 4, '土': 5,
};
const HE_TU_PAIRS: [number, number][] = [[1, 6], [2, 7], [3, 8], [4, 9], [5, 10]];

/** v3.0: 先天八卦数 */
const XIANTIAN_GUA_MAP: Record<string, number> = {
  '乾': 1, '兑': 2, '离': 3, '震': 4,
  '巽': 5, '坎': 6, '艮': 7, '坤': 8,
};

/** v3.0: 地支对应先天卦 */
const BRANCH_XIANTIAN_GUA: Record<string, string> = {
  '子': '坎', '丑': '艮', '寅': '艮', '卯': '震',
  '辰': '巽', '巳': '巽', '午': '离', '未': '坤',
  '申': '坤', '酉': '兑', '戌': '乾', '亥': '乾',
};

/** v2.0: 五行相生相克 */
const WUXING_SHENG: Record<string, string> = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
const WUXING_KE: Record<string, string> = { '木': '土', '火': '金', '土': '水', '金': '木', '水': '火' };

const STEM_ELEMENTS: Record<string, string> = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
  '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水'
};

const BRANCH_ELEMENTS: Record<string, string> = {
  '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火',
  '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水'
};

const DA_YUN_START_TABLE = {
  spring: { male: 4, female: 6 },
  summer: { male: 6, female: 4 },
  autumn: { male: 8, female: 2 },
  winter: { male: 2, female: 8 },
};

// ── v3.0: 河图和谐度分析 ──

export interface HeTuHarmony {
  /** 四柱河图配数 */
  pillarNumbers: { pillar: string; element: string; heTuNumber: number }[];
  /** 河图成数配对数 */
  pairedCount: number;
  /** 和谐度 0-100 */
  harmonyScore: number;
  /** 评价 */
  evaluation: string;
}

/** v3.0: 先天卦数交叉 */
export interface XianTianGuaAnalysis {
  /** 四柱先天卦数 */
  pillarGua: { pillar: string; branch: string; gua: string; number: number }[];
  /** 总数 */
  totalNumber: number;
  /** 互参后条文偏移 */
  guaOffset: number;
  /** 卦象组合评价 */
  evaluation: string;
}

function calculateHeTuHarmony(pillars: GanZhiPillars): HeTuHarmony {
  const pillarList = [
    { pillar: '年柱', ganZhi: pillars.year },
    { pillar: '月柱', ganZhi: pillars.month },
    { pillar: '日柱', ganZhi: pillars.day },
    { pillar: '时柱', ganZhi: pillars.hour },
  ];

  const pillarNumbers = pillarList.map(p => {
    const stem = p.ganZhi.charAt(0);
    const element = STEM_ELEMENTS[stem] || '土';
    const heTuNumber = HE_TU_MAP[element] || 5;
    return { pillar: p.pillar, element, heTuNumber };
  });

  // 检查河图成数配对
  const numbers = pillarNumbers.map(p => p.heTuNumber);
  let pairedCount = 0;
  for (const [a, b] of HE_TU_PAIRS) {
    if (numbers.includes(a) && numbers.includes(b)) pairedCount++;
    // 生成数 = 基数 + 5
    const genA = a + 5;
    if (numbers.includes(a) && numbers.includes(genA % 10 || 10)) pairedCount++;
  }

  let harmonyScore = 30 + pairedCount * 15;
  // 五行均衡加分
  const uniqueElements = new Set(pillarNumbers.map(p => p.element));
  harmonyScore += uniqueElements.size * 8;
  harmonyScore = Math.max(10, Math.min(100, harmonyScore));

  let evaluation: string;
  if (harmonyScore >= 75) evaluation = '河图配数和谐，先天根基深厚';
  else if (harmonyScore >= 50) evaluation = '河图配数尚可，根基中等';
  else evaluation = '河图配数不谐，先天稍弱';

  return { pillarNumbers, pairedCount, harmonyScore, evaluation };
}

function calculateXianTianGua(pillars: GanZhiPillars): XianTianGuaAnalysis {
  const pillarList = [
    { pillar: '年柱', branch: pillars.year.charAt(1) },
    { pillar: '月柱', branch: pillars.month.charAt(1) },
    { pillar: '日柱', branch: pillars.day.charAt(1) },
    { pillar: '时柱', branch: pillars.hour.charAt(1) },
  ];

  const pillarGua = pillarList.map(p => {
    const gua = BRANCH_XIANTIAN_GUA[p.branch] || '坤';
    const number = XIANTIAN_GUA_MAP[gua] || 8;
    return { ...p, gua, number };
  });

  const totalNumber = pillarGua.reduce((s, p) => s + p.number, 0);
  const guaOffset = totalNumber % 64; // 先天卦数映射到64卦

  // 评价
  const guaNames = pillarGua.map(p => p.gua);
  const hasQian = guaNames.includes('乾');
  const hasKun = guaNames.includes('坤');
  const hasKanLi = guaNames.includes('坎') && guaNames.includes('离');

  let evaluation = '';
  if (hasQian && hasKun) evaluation = '乾坤定位，天地交泰之象';
  else if (hasKanLi) evaluation = '坎离既济，水火调和之象';
  else if (hasQian) evaluation = '先天有乾卦之气，刚健进取';
  else if (hasKun) evaluation = '先天有坤卦之气，厚德载物';
  else evaluation = `先天卦数总和${totalNumber}，${totalNumber > 20 ? '偏阳刚' : '偏阴柔'}`;

  return { pillarGua, totalNumber, guaOffset, evaluation };
}

// ==========================================
// 2. INTERFACES
// ==========================================

export interface TiebanInput {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  gender: 'male' | 'female';
  geoLatitude: number;
  geoLongitude: number;
  timezoneOffsetMinutes: number;
}

export interface GanZhiPillars {
  year: string;
  month: string;
  day: string;
  hour: string;
  fullDisplay: string;
}

export interface KaoKeCandidate {
  keIndex: number;
  quarterIndex: number;
  clauseNumber: number;
  timeLabel: string;
  debugBase?: number;
  content?: string;
  searchQuery?: string;
}

export interface DestinyProjection {
  lifeDestiny: number;
  marriage: number;
  wealth: number;
  career: number;
  health: number;
  children: number;
}

export interface BaZiProfile {
  dayMaster: string;
  dayMasterElement: string;
  pillars: {
    year: string;
    month: string;
    day: string;
    time: string;
  };
  strength: string;
  favorableElements: string[];
  unfavorableElements: string[];
}

export interface DaYunCycle {
  startAge: number;
  endAge: number;
  ganZhi: string;
  startYear: number;
  element: string;
  /** v2.0: 纳音五行 */
  naYin?: string;
  /** v2.0: 纳音五行元素 */
  naYinElement?: string;
  /** v2.0: 与日主关系 */
  dayMasterRelation?: string;
}

export interface FlowYearClause {
  age: number;
  year: number;
  ganZhi: string;
  clauseNumber: number;
  content?: string;
  /** v2.0: 纳音 */
  naYin?: string;
  /** v2.0: 太玄乘数 */
  taiXuanMultiplier?: number;
}

export interface FullDestinyReport {
  baziProfile: BaZiProfile;
  lifeCycles: DaYunCycle[];
  flowYears: FlowYearClause[];
  destinyProjection: DestinyProjection;
  /** v2.0: 完整十二宫分析 */
  twelvePalaces?: TwelvePalaceAnalysis[];
  /** v2.0: 洛书和谐度 */
  luoShuHarmony?: LuoShuHarmony;
  /** v3.0: 河图和谐度 */
  heTuHarmony?: HeTuHarmony;
  /** v3.0: 先天卦数交叉 */
  xianTianGua?: XianTianGuaAnalysis;
  /** v2.0: 三层输出 */
  threeLayerReport?: TiebanThreeLayerReport;
}

/** v2.0: 十二宫逐宫分析 */
export interface TwelvePalaceAnalysis {
  name: string;
  key: string;
  clauseNumber: number;
  clauseStrength: number; // 0-100
  aspect: string;
  naYinRelation: string;
  evaluation: '大吉' | '吉' | '平' | '凶' | '大凶';
  description: string;
}

/** v2.0: 洛书和谐度分析 */
export interface LuoShuHarmony {
  /** 洛书配数 (四柱分配到九宫) */
  gridMapping: Record<number, string[]>;
  /** 和谐度 0-100 */
  harmonyScore: number;
  /** 中宫力量 */
  centerStrength: number;
  /** 缺位 */
  missingPositions: number[];
  /** 评价 */
  evaluation: string;
}

/** v2.0: 三层输出标准 */
export interface TiebanThreeLayerReport {
  rawParams: {
    solarDate: string;
    lunarDate: string;
    gender: string;
    fourPillars: GanZhiPillars;
    theoreticalBase: number;
    systemOffset: number;
    taiXuanScores: { year: number; month: number; day: number; hour: number };
  };
  chartResult: {
    twelvePalaces: TwelvePalaceAnalysis[];
    luoShuHarmony: LuoShuHarmony;
    daYunCycles: DaYunCycle[];
    naYinProfile: { pillar: string; ganZhi: string; naYin: string; element: string }[];
  };
  analysisConclusion: {
    overallGrade: '上上' | '上' | '中上' | '中' | '中下' | '下' | '下下';
    strongPalaces: string[];
    weakPalaces: string[];
    keyTurningAges: number[];
    lifeSummary: string;
    luoShuBalance: string;
  };
}

export interface SixRelationsInput {
  fatherZodiac: number;
  motherZodiac: number;
  parentsStatus: 'both_alive' | 'father_deceased' | 'mother_deceased' | 'both_deceased';
  siblingsCount: number;
}

export interface KaoKeWithMatch extends KaoKeCandidate {
  predictedFatherZodiac: number;
  predictedMotherZodiac: number;
  matchScore: number;
  searchQuery: string;
}

export interface CalculationResult {
  baseNumber: number;
  pillars: GanZhiPillars;
  stemSum: number;
  branchSum: number;
  totalScore: number;
}

export interface CalibrationResult {
  theoreticalBase: number;
  confirmedClauseId: number;
  systemOffset: number;
  lockedQuarterIndex: number;
}

// ==========================================
// 3. v2.0 HELPER FUNCTIONS
// ==========================================

/** 洛书数和谐度分析 */
function calculateLuoShuHarmony(pillars: GanZhiPillars): LuoShuHarmony {
  const pillarValues = [
    { pillar: 'year', value: TiebanEngine.getPillarValue(pillars.year) },
    { pillar: 'month', value: TiebanEngine.getPillarValue(pillars.month) },
    { pillar: 'day', value: TiebanEngine.getPillarValue(pillars.day) },
    { pillar: 'hour', value: TiebanEngine.getPillarValue(pillars.hour) },
  ];

  // Map pillar values to Luo Shu positions (1-9)
  const gridMapping: Record<number, string[]> = {};
  for (let i = 1; i <= 9; i++) gridMapping[i] = [];

  for (const pv of pillarValues) {
    const pos = ((pv.value - 1) % 9) + 1;
    gridMapping[pos].push(pv.pillar);
  }

  // Calculate harmony
  const occupied = Object.entries(gridMapping).filter(([_, v]) => v.length > 0).length;
  const centerOccupied = gridMapping[5].length > 0;
  const cornerPositions = [2, 4, 6, 8]; // 四正位
  const cornersOccupied = cornerPositions.filter(p => gridMapping[p].length > 0).length;

  // Missing positions
  const missingPositions = Object.entries(gridMapping)
    .filter(([_, v]) => v.length === 0)
    .map(([k]) => Number(k));

  // Harmony score: balance, center, spread
  let harmonyScore = 30; // base
  harmonyScore += occupied * 6; // up to 54
  if (centerOccupied) harmonyScore += 10;
  harmonyScore += cornersOccupied * 4; // up to 16
  // Penalty for clustering
  const maxInOnePos = Math.max(...Object.values(gridMapping).map(v => v.length));
  if (maxInOnePos >= 3) harmonyScore -= 15;
  if (maxInOnePos >= 4) harmonyScore -= 10;

  harmonyScore = Math.max(10, Math.min(100, harmonyScore));

  const centerStrength = centerOccupied ? 80 : 30;

  let evaluation: string;
  if (harmonyScore >= 80) evaluation = '洛书九宫均衡，命局和谐稳固';
  else if (harmonyScore >= 60) evaluation = '洛书分布较均匀，整体尚佳';
  else if (harmonyScore >= 40) evaluation = '洛书有缺位，需注意薄弱环节';
  else evaluation = '洛书分布不均，命局起伏较大';

  return { gridMapping, harmonyScore, centerStrength, missingPositions, evaluation };
}

/** 十二宫逐宫分析 */
function analyzeTwelvePalaces(
  theoreticalBase: number,
  systemOffset: number,
  pillars: GanZhiPillars,
  dayMasterElement: string,
): TwelvePalaceAnalysis[] {
  const results: TwelvePalaceAnalysis[] = [];
  const dayNaYinElement = NA_YIN_ELEMENT[pillars.day] || '土';

  for (const palace of TWELVE_PALACES) {
    const modifier = ('modifier' in palace ? palace.modifier : 0) as number;
    const baseValue = theoreticalBase + systemOffset + modifier;
    let inPalaceOffset = baseValue % 1000;
    if (inPalaceOffset < 0) inPalaceOffset += 1000;
    let clauseId = palace.offset + inPalaceOffset + 1;
    if (clauseId < MIN_CLAUSE_ID) clauseId = MIN_CLAUSE_ID;
    if (clauseId > MAX_CLAUSE_ID) clauseId = MAX_CLAUSE_ID;
    clauseId = Math.floor(clauseId);

    // Clause strength based on Na Yin harmony with day master
    const clauseNaYinSeed = (clauseId * 7 + 3) % 5;
    const clauseElements = ['木', '火', '土', '金', '水'];
    const clauseElement = clauseElements[clauseNaYinSeed];

    let naYinRelation: string;
    let strengthBonus = 0;
    if (clauseElement === dayMasterElement) {
      naYinRelation = '比和';
      strengthBonus = 10;
    } else if (WUXING_SHENG[dayMasterElement] === clauseElement) {
      naYinRelation = '我生';
      strengthBonus = -5; // 泄气
    } else if (WUXING_SHENG[clauseElement] === dayMasterElement) {
      naYinRelation = '生我';
      strengthBonus = 15;
    } else if (WUXING_KE[dayMasterElement] === clauseElement) {
      naYinRelation = '我克';
      strengthBonus = 5;
    } else {
      naYinRelation = '克我';
      strengthBonus = -15;
    }

    // Strength = base from clause position + Na Yin bonus
    const rawStrength = ((clauseId % 100) / 100) * 60 + 20; // 20-80 base
    const clauseStrength = Math.max(5, Math.min(95, Math.round(rawStrength + strengthBonus)));

    let evaluation: TwelvePalaceAnalysis['evaluation'];
    if (clauseStrength >= 80) evaluation = '大吉';
    else if (clauseStrength >= 65) evaluation = '吉';
    else if (clauseStrength >= 40) evaluation = '平';
    else if (clauseStrength >= 25) evaluation = '凶';
    else evaluation = '大凶';

    results.push({
      name: palace.name,
      key: palace.key,
      clauseNumber: clauseId,
      clauseStrength,
      aspect: palace.aspect,
      naYinRelation,
      evaluation,
      description: `${palace.name}(${palace.aspect})条文${clauseId}号，纳音${naYinRelation}，强度${clauseStrength}，评价${evaluation}`,
    });
  }

  return results;
}

/** v2.0: 综合评级 */
function calculateOverallGrade(palaces: TwelvePalaceAnalysis[]): TiebanThreeLayerReport['analysisConclusion']['overallGrade'] {
  const avg = palaces.reduce((s, p) => s + p.clauseStrength, 0) / palaces.length;
  if (avg >= 80) return '上上';
  if (avg >= 70) return '上';
  if (avg >= 60) return '中上';
  if (avg >= 50) return '中';
  if (avg >= 40) return '中下';
  if (avg >= 30) return '下';
  return '下下';
}

// ==========================================
// 4. THE MATHEMATICAL ENGINE
// ==========================================

export const TiebanEngine = {
  getTaiXuanScore: (ganZhiArr: string[]): number => {
    let score = 0;
    ganZhiArr.forEach(gz => {
      if (gz.length >= 2) {
        score += (TAI_XUAN_MAP[gz.charAt(0)] || 5);
        score += (TAI_XUAN_MAP[gz.charAt(1)] || 5);
      }
    });
    return score;
  },

  getBranchYaoValue: (branch: string): number => {
    return BRANCH_YAO_VALUES[branch] || 30;
  },

  getPillarValue: (ganZhi: string): number => {
    if (ganZhi.length < 2) return 10;
    return (TAI_XUAN_MAP[ganZhi.charAt(0)] || 5) + (TAI_XUAN_MAP[ganZhi.charAt(1)] || 5);
  },

  extractPillars: (input: TiebanInput): GanZhiPillars => {
    const solar = Solar.fromYmdHms(input.year, input.month, input.day, input.hour, input.minute, 0);
    const lunar = solar.getLunar();
    return {
      year: lunar.getYearInGanZhi(),
      month: lunar.getMonthInGanZhi(),
      day: lunar.getDayInGanZhi(),
      hour: lunar.getTimeInGanZhi(),
      fullDisplay: `${lunar.getYearInGanZhi()}年 ${lunar.getMonthInGanZhi()}月 ${lunar.getDayInGanZhi()}日 ${lunar.getTimeInGanZhi()}时`,
    };
  },

  calculateBaseNumber: (input: TiebanInput): CalculationResult => {
    const solar = Solar.fromYmdHms(input.year, input.month, input.day, input.hour, input.minute, 0);
    const lunar = solar.getLunar();
    const pillars = TiebanEngine.extractPillars(input);
    const pillarStrings = [pillars.year, pillars.month, pillars.day, pillars.hour];

    const yearValue = TiebanEngine.getPillarValue(pillars.year);
    const monthValue = TiebanEngine.getPillarValue(pillars.month);
    const dayValue = TiebanEngine.getPillarValue(pillars.day);
    const hourValue = TiebanEngine.getPillarValue(pillars.hour);

    let stemSum = 0;
    let branchSum = 0;
    pillarStrings.forEach(pillar => {
      if (pillar.length >= 2) {
        stemSum += (TAI_XUAN_MAP[pillar.charAt(0)] || 5);
        branchSum += (TAI_XUAN_MAP[pillar.charAt(1)] || 5);
      }
    });

    const staticScore = stemSum + branchSum;
    const minuteInShichen = (input.hour % 2) * 60 + input.minute;
    const keIndex = Math.floor(minuteInShichen / 15);
    const minuteOffset = minuteInShichen % 15;
    let rawBase = (yearValue + monthValue + dayValue + hourValue) * 100;
    rawBase += keIndex * 25 + minuteOffset;
    if (input.gender === 'female') rawBase += 500;

    return { baseNumber: rawBase, pillars, stemSum, branchSum, totalScore: staticScore };
  },

  generateKaoKeCandidates: (baseNumber: number): KaoKeCandidate[] => {
    const candidates: KaoKeCandidate[] = [];
    KE_SHIFT_TABLE.forEach((keConfig, i) => {
      let clauseId = (baseNumber + keConfig.offset + PALACE_OFFSETS.PARENTS) % BASE_MODULO;
      if (clauseId < MIN_CLAUSE_ID) clauseId += MIN_CLAUSE_ID;
      if (clauseId > MAX_CLAUSE_ID) clauseId = MIN_CLAUSE_ID + (clauseId % (MAX_CLAUSE_ID - MIN_CLAUSE_ID));
      candidates.push({
        keIndex: i, quarterIndex: i,
        clauseNumber: Math.floor(clauseId),
        timeLabel: keConfig.label, debugBase: baseNumber,
      });
    });
    return candidates;
  },

  calculateDestinyPaths: (lockedBase: number, lockedQuarterIndex: number): DestinyProjection => {
    const lockedBase2 = lockedBase + (lockedQuarterIndex * 15);
    const getClauseForPalace = (palaceOffset: number): number => {
      const inPalaceOffset = ((lockedBase2 % 1000) + 1000) % 1000;
      let clauseId = palaceOffset + inPalaceOffset + 1;
      if (clauseId < MIN_CLAUSE_ID) clauseId = MIN_CLAUSE_ID;
      if (clauseId > MAX_CLAUSE_ID) clauseId = MAX_CLAUSE_ID;
      return Math.floor(clauseId);
    };
    return {
      lifeDestiny: getClauseForPalace(PALACE_OFFSETS.FATE),
      marriage: getClauseForPalace(PALACE_OFFSETS.MARRIAGE),
      wealth: getClauseForPalace(PALACE_OFFSETS.WEALTH),
      career: getClauseForPalace(PALACE_OFFSETS.CAREER),
      health: getClauseForPalace(PALACE_OFFSETS.HEALTH),
      children: getClauseForPalace(PALACE_OFFSETS.CHILDREN),
    };
  },

  calculatePrimaryDestiny: (lockedBase: number, lockedQuarterIndex: number): number => {
    const lockedBase2 = lockedBase + (lockedQuarterIndex * 15);
    const inPalaceOffset = ((lockedBase2 % 1000) + 1000) % 1000;
    let clauseId = PALACE_OFFSETS.FATE + inPalaceOffset + 1;
    if (clauseId < MIN_CLAUSE_ID) clauseId = MIN_CLAUSE_ID;
    if (clauseId > MAX_CLAUSE_ID) clauseId = MAX_CLAUSE_ID;
    return Math.floor(clauseId);
  },

  normalizeClauseId: (rawId: number): number => {
    let validId = ((rawId - 1) % BASE_MODULO + BASE_MODULO) % BASE_MODULO + 1;
    if (validId < MIN_CLAUSE_ID) validId = MIN_CLAUSE_ID;
    if (validId > MAX_CLAUSE_ID) validId = MAX_CLAUSE_ID;
    return Math.floor(validId);
  },

  calculateTheoreticalBase: (input: TiebanInput): number => {
    const solar = Solar.fromYmdHms(input.year, input.month, input.day, input.hour, input.minute, 0);
    const lunar = solar.getLunar();
    const yearPillar = lunar.getYearInGanZhi();
    const monthPillar = lunar.getMonthInGanZhi();
    const dayPillar = lunar.getDayInGanZhi();
    const hourPillar = lunar.getTimeInGanZhi();

    const yearValue = TiebanEngine.getPillarValue(yearPillar);
    const monthValue = TiebanEngine.getPillarValue(monthPillar);
    const dayValue = TiebanEngine.getPillarValue(dayPillar);
    const hourValue = TiebanEngine.getPillarValue(hourPillar);

    const hourBranch = hourPillar.charAt(1);
    const yaoValue = TiebanEngine.getBranchYaoValue(hourBranch);

    const pillarSum = yearValue + monthValue + dayValue + hourValue;
    let base = pillarSum * 100 + yaoValue;
    const minuteInShichen = (input.hour % 2) * 60 + input.minute;
    const keIndex = Math.floor(minuteInShichen / 15);
    const minuteOffset = minuteInShichen % 15;
    base += keIndex * 30 + minuteOffset * 2;
    if (input.gender === 'female') base += 500;
    return ((base - 1) % BASE_MODULO + BASE_MODULO) % BASE_MODULO + 1;
  },

  calculateSystemOffset: (theoreticalBase: number, confirmedClauseId: number): number => {
    const theoreticalInPalace = ((theoreticalBase % 1000) + 1000) % 1000;
    const expectedId = PALACE_OFFSETS.KAO_KE + theoreticalInPalace + 1;
    return confirmedClauseId - expectedId;
  },

  projectDestinyWithOffset: (theoreticalBase: number, systemOffset: number): DestinyProjection => {
    const getClauseForPalace = (palaceOffset: number): number => {
      const baseValue = theoreticalBase + systemOffset;
      let inPalaceOffset = baseValue % 1000;
      if (inPalaceOffset < 0) inPalaceOffset += 1000;
      let clauseId = palaceOffset + inPalaceOffset + 1;
      if (clauseId < MIN_CLAUSE_ID) clauseId = MIN_CLAUSE_ID;
      if (clauseId > MAX_CLAUSE_ID) clauseId = MAX_CLAUSE_ID;
      return Math.floor(clauseId);
    };
    return {
      lifeDestiny: getClauseForPalace(PALACE_OFFSETS.FATE),
      marriage: getClauseForPalace(PALACE_OFFSETS.MARRIAGE),
      wealth: getClauseForPalace(PALACE_OFFSETS.WEALTH),
      career: getClauseForPalace(PALACE_OFFSETS.CAREER),
      health: getClauseForPalace(PALACE_OFFSETS.HEALTH),
      children: getClauseForPalace(PALACE_OFFSETS.CHILDREN),
    };
  },

  getZodiac: (year: number): string => {
    const zodiacNames = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];
    const index = (year - 4) % 12;
    return zodiacNames[index >= 0 ? index : index + 12];
  },

  getChineseHour: (hour: number): string => {
    const hourNames = [
      '子时 (23-01)', '丑时 (01-03)', '寅时 (03-05)', '卯时 (05-07)',
      '辰时 (07-09)', '巳时 (09-11)', '午时 (11-13)', '未时 (13-15)',
      '申时 (15-17)', '酉时 (17-19)', '戌时 (19-21)', '亥时 (21-23)'
    ];
    return hourNames[Math.floor(((hour + 1) % 24) / 2)];
  },

  getZodiacName: (index: number): string => {
    const zodiacNames = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];
    return zodiacNames[index % 12];
  },

  calculateSixRelationsMatch: (baseNumber: number, relations: SixRelationsInput): KaoKeWithMatch[] => {
    const candidates = TiebanEngine.generateKaoKeCandidates(baseNumber);
    const ZODIAC_CN = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];

    return candidates.map(candidate => {
      const keConfig = KE_SHIFT_TABLE[candidate.keIndex];
      const specificSeed = baseNumber + keConfig.offset;
      const fatherOffset = 3;
      const motherOffset = 9;
      const predFather = Math.abs(specificSeed + fatherOffset) % 12;
      const predMother = Math.abs(specificSeed + motherOffset) % 12;
      const fatherZodiac = ZODIAC_CN[predFather];
      const motherZodiac = ZODIAC_CN[predMother];
      const searchQuery = `父属${fatherZodiac}`;

      let score = 0;
      if (predFather === relations.fatherZodiac) score += 35;
      else {
        const fatherDiff = Math.min(Math.abs(predFather - relations.fatherZodiac), 12 - Math.abs(predFather - relations.fatherZodiac));
        if (fatherDiff === 1) score += 15;
        else if (fatherDiff === 2) score += 5;
      }
      if (predMother === relations.motherZodiac) score += 35;
      else {
        const motherDiff = Math.min(Math.abs(predMother - relations.motherZodiac), 12 - Math.abs(predMother - relations.motherZodiac));
        if (motherDiff === 1) score += 15;
        else if (motherDiff === 2) score += 5;
      }
      const seedDigitSum = String(specificSeed).split('').reduce((a, b) => a + parseInt(b || '0'), 0);
      const statusIndicator = seedDigitSum % 4;
      if (relations.parentsStatus === 'both_alive' && statusIndicator === 0) score += 20;
      else if (relations.parentsStatus === 'father_deceased' && statusIndicator === 1) score += 20;
      else if (relations.parentsStatus === 'mother_deceased' && statusIndicator === 2) score += 20;
      else if (relations.parentsStatus === 'both_deceased' && statusIndicator === 3) score += 20;
      const siblingPredict = (specificSeed % 8) + 1;
      if (siblingPredict === relations.siblingsCount) score += 10;
      else if (Math.abs(siblingPredict - relations.siblingsCount) === 1) score += 5;

      return { ...candidate, predictedFatherZodiac: predFather, predictedMotherZodiac: predMother, matchScore: Math.min(score, 100), searchQuery };
    }).sort((a, b) => b.matchScore - a.matchScore);
  },

  calculateBaZiProfile: (input: TiebanInput): BaZiProfile => {
    const solar = Solar.fromYmdHms(input.year, input.month, input.day, input.hour, input.minute, 0);
    const lunar = solar.getLunar();
    const eightChar = lunar.getEightChar();
    const dayMaster = eightChar.getDayGan();
    const dayMasterElement = eightChar.getDayWuXing();
    const pillars = {
      year: lunar.getYearInGanZhi(), month: lunar.getMonthInGanZhi(),
      day: lunar.getDayInGanZhi(), time: lunar.getTimeInGanZhi(),
    };
    const monthElement = eightChar.getMonthWuXing();
    const isStrong = dayMasterElement === monthElement;
    const strength = isStrong ? "得令 (Strong)" : "失令 (Weak)";
    const ELEMENT_CYCLE = ['木', '火', '土', '金', '水'];
    const dayIndex = ELEMENT_CYCLE.indexOf(dayMasterElement);
    let favorableElements: string[];
    let unfavorableElements: string[];
    if (isStrong) {
      favorableElements = [ELEMENT_CYCLE[(dayIndex + 1) % 5], ELEMENT_CYCLE[(dayIndex + 3) % 5]];
      unfavorableElements = [ELEMENT_CYCLE[dayIndex], ELEMENT_CYCLE[(dayIndex + 4) % 5]];
    } else {
      favorableElements = [ELEMENT_CYCLE[dayIndex], ELEMENT_CYCLE[(dayIndex + 4) % 5]];
      unfavorableElements = [ELEMENT_CYCLE[(dayIndex + 1) % 5], ELEMENT_CYCLE[(dayIndex + 3) % 5]];
    }
    return { dayMaster, dayMasterElement, pillars, strength, favorableElements, unfavorableElements };
  },

  calculateDaYun: (input: TiebanInput): DaYunCycle[] => {
    const solar = Solar.fromYmdHms(input.year, input.month, input.day, input.hour, input.minute, 0);
    const lunar = solar.getLunar();
    const eightChar = lunar.getEightChar();
    const yun = eightChar.getYun(input.gender === 'male' ? 1 : 0);
    const daYunList = yun.getDaYun();
    const dayMasterElement = eightChar.getDayWuXing();

    return daYunList.map((dy, index) => {
      const ganZhi = dy.getGanZhi();
      const gan = ganZhi.charAt(0);
      let startAge = dy.getStartAge();
      let endAge = dy.getEndAge();
      if (index > 0) {
        startAge = daYunList[index - 1].getEndAge() + 1;
        endAge = startAge + 9;
      }
      const element = STEM_ELEMENTS[gan] || '未知';
      const naYin = NA_YIN_TABLE[ganZhi] || '未知';
      const naYinElement = NA_YIN_ELEMENT[ganZhi] || '土';

      // v2.0: Day master relation
      let dayMasterRelation = '中性';
      if (element === dayMasterElement) dayMasterRelation = '比和';
      else if (WUXING_SHENG[dayMasterElement] === element) dayMasterRelation = '我生(泄)';
      else if (WUXING_SHENG[element] === dayMasterElement) dayMasterRelation = '生我(助)';
      else if (WUXING_KE[dayMasterElement] === element) dayMasterRelation = '我克(耗)';
      else if (WUXING_KE[element] === dayMasterElement) dayMasterRelation = '克我(压)';

      return { startAge, endAge, ganZhi, startYear: dy.getStartYear(), element, naYin, naYinElement, dayMasterRelation };
    });
  },

  getNaYin: (ganZhi: string): string => NA_YIN_TABLE[ganZhi] || '未知',

  calculateFlowYearClauses: (
    trueBase: number, systemOffset: number, birthYear: number,
    startAge: number = 1, endAge: number = 80
  ): FlowYearClause[] => {
    const flowYears: FlowYearClause[] = [];
    const BRANCH_INDEX: Record<string, number> = {
      '子': 0, '丑': 1, '寅': 2, '卯': 3, '辰': 4, '巳': 5,
      '午': 6, '未': 7, '申': 8, '酉': 9, '戌': 10, '亥': 11
    };

    for (let age = startAge; age <= endAge; age++) {
      const year = birthYear + age;
      const yearSolar = Solar.fromYmdHms(year, 6, 15, 12, 0, 0);
      const yearLunar = yearSolar.getLunar();
      const yearGanZhi = yearLunar.getYearInGanZhi();
      const yearBranch = yearGanZhi.charAt(1);
      const branchValue = BRANCH_INDEX[yearBranch] || 0;

      // v2.0: 太玄乘数法
      const yearStem = yearGanZhi.charAt(0);
      const taiXuanMultiplier = (TAI_XUAN_MAP[yearStem] || 5) + (TAI_XUAN_MAP[yearBranch] || 5);

      const rawValue = trueBase + systemOffset + (age * FLOW_YEAR_STEP) + branchValue;
      const inPalaceOffset = ((rawValue % 1000) + 1000) % 1000;
      let clauseId = PALACE_OFFSETS.FLOW_YEAR + inPalaceOffset + 1;
      if (clauseId > MAX_CLAUSE_ID) clauseId = PALACE_OFFSETS.FLOW_YEAR + 1;

      const naYin = NA_YIN_TABLE[yearGanZhi] || '未知';

      flowYears.push({ age, year, ganZhi: yearGanZhi, clauseNumber: clauseId, naYin, taiXuanMultiplier });
    }
    return flowYears;
  },

  calculateFlowYearWithDaYun: (
    trueBase: number, systemOffset: number, age: number, birthYear: number, daYunGanZhi: string
  ): FlowYearClause => {
    const year = birthYear + age;
    const yearSolar = Solar.fromYmdHms(year, 6, 15, 12, 0, 0);
    const yearLunar = yearSolar.getLunar();
    const yearGanZhi = yearLunar.getYearInGanZhi();
    const daYunStem = daYunGanZhi.charAt(0);
    const daYunValue = TAI_XUAN_MAP[daYunStem] || 5;
    const rawValue = trueBase + systemOffset + (age * FLOW_YEAR_STEP) + daYunValue;
    const inPalaceOffset = ((rawValue % 1000) + 1000) % 1000;
    let clauseId = PALACE_OFFSETS.FLOW_YEAR + inPalaceOffset + 1;
    if (clauseId > MAX_CLAUSE_ID) clauseId = PALACE_OFFSETS.FLOW_YEAR + 1;
    return { age, year, ganZhi: yearGanZhi, clauseNumber: clauseId };
  },

  /**
   * v2.0: GENERATE FULL DESTINY REPORT (enhanced with 12-palace and Luo Shu)
   */
  generateFullDestinyReport: (input: TiebanInput, trueBase: number, systemOffset: number): FullDestinyReport => {
    const baziProfile = TiebanEngine.calculateBaZiProfile(input);
    const lifeCycles = TiebanEngine.calculateDaYun(input);
    const flowYears = TiebanEngine.calculateFlowYearClauses(trueBase, systemOffset, input.year, 1, 80);
    const destinyProjection = TiebanEngine.projectDestinyWithOffset(trueBase, systemOffset);
    const pillars = TiebanEngine.extractPillars(input);

    // v2.0: Twelve palace analysis
    const twelvePalaces = analyzeTwelvePalaces(trueBase, systemOffset, pillars, baziProfile.dayMasterElement);

    // v2.0: Luo Shu harmony
    const luoShuHarmony = calculateLuoShuHarmony(pillars);

    // v3.0: He Tu harmony + Xian Tian Gua
    const heTuHarmony = calculateHeTuHarmony(pillars);
    const xianTianGua = calculateXianTianGua(pillars);

    // v2.0: Na Yin profile
    const naYinProfile = [
      { pillar: '年柱', ganZhi: pillars.year, naYin: NA_YIN_TABLE[pillars.year] || '未知', element: NA_YIN_ELEMENT[pillars.year] || '土' },
      { pillar: '月柱', ganZhi: pillars.month, naYin: NA_YIN_TABLE[pillars.month] || '未知', element: NA_YIN_ELEMENT[pillars.month] || '土' },
      { pillar: '日柱', ganZhi: pillars.day, naYin: NA_YIN_TABLE[pillars.day] || '未知', element: NA_YIN_ELEMENT[pillars.day] || '土' },
      { pillar: '时柱', ganZhi: pillars.hour, naYin: NA_YIN_TABLE[pillars.hour] || '未知', element: NA_YIN_ELEMENT[pillars.hour] || '土' },
    ];

    // v2.0: Three-layer report
    const overallGrade = calculateOverallGrade(twelvePalaces);
    const strongPalaces = twelvePalaces.filter(p => p.clauseStrength >= 65).map(p => p.name);
    const weakPalaces = twelvePalaces.filter(p => p.clauseStrength < 40).map(p => p.name);
    const keyTurningAges = lifeCycles.filter(d => d.dayMasterRelation?.includes('克')).map(d => d.startAge);

    const threeLayerReport: TiebanThreeLayerReport = {
      rawParams: {
        solarDate: `${input.year}-${input.month}-${input.day}`,
        lunarDate: pillars.fullDisplay,
        gender: input.gender === 'male' ? '男' : '女',
        fourPillars: pillars,
        theoreticalBase: trueBase,
        systemOffset: systemOffset,
        taiXuanScores: {
          year: TiebanEngine.getPillarValue(pillars.year),
          month: TiebanEngine.getPillarValue(pillars.month),
          day: TiebanEngine.getPillarValue(pillars.day),
          hour: TiebanEngine.getPillarValue(pillars.hour),
        },
      },
      chartResult: {
        twelvePalaces,
        luoShuHarmony,
        daYunCycles: lifeCycles,
        naYinProfile,
      },
      analysisConclusion: {
        overallGrade,
        strongPalaces,
        weakPalaces,
        keyTurningAges,
        lifeSummary: `铁板命局${overallGrade}等，${strongPalaces.length > 0 ? `${strongPalaces.join('、')}为强宫` : '无特强宫位'}，${weakPalaces.length > 0 ? `${weakPalaces.join('、')}需注意` : '无特弱宫位'}。洛书和谐度${luoShuHarmony.harmonyScore}分。河图和谐度${heTuHarmony.harmonyScore}分。${xianTianGua.evaluation}。`,
        luoShuBalance: luoShuHarmony.evaluation,
      },
    };

    return {
      baziProfile, lifeCycles, flowYears, destinyProjection,
      twelvePalaces, luoShuHarmony, heTuHarmony, xianTianGua, threeLayerReport,
    };
  },
};

export default TiebanEngine;
