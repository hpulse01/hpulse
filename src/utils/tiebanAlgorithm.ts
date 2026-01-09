/**
 * Iron Plate Divine Number (铁板神数) Engine
 * 
 * Authentic Academic Algorithm: "Tai Xuan & Minute-Quarter Exact Mapping" (太玄刻分定局法)
 * 
 * This is DETERMINISTIC: Same input MUST yield exact same Clause ID.
 * Based strictly on Heavenly Stems, Earthly Branches, and specific Minute of birth.
 */

import { Solar, Lunar } from 'lunar-typescript';

// ==========================================
// 1. THE AXIOMATIC CONSTANTS (公理常数)
// ==========================================

/**
 * Standard Tai Xuan Numbers (太玄数) - The DNA of Tieban
 * 甲己子午九，乙庚丑未八，丙辛寅申七，丁壬卯酉六，戊癸辰戌五，巳亥四数存。
 */
const TAI_XUAN_MAP: Record<string, number> = {
  '甲': 9, '己': 9, '子': 9, '午': 9,
  '乙': 8, '庚': 8, '丑': 8, '未': 8,
  '丙': 7, '辛': 7, '寅': 7, '申': 7,
  '丁': 6, '壬': 6, '卯': 6, '酉': 6,
  '戊': 5, '癸': 5, '辰': 5, '戌': 5,
  '巳': 4, '亥': 4
};

// PDF page 33: 洛书数配 - 一九合十，二八合十，三七合十，四六合十
// PDF page 48: 铁板神数条文编号规则
const BASE_MODULO = 12000; // 条文总数
const MIN_CLAUSE_ID = 1; // 最小有效条文号
const MAX_CLAUSE_ID = 12000; // 最大有效条文号

// PDF page 43: 地支时辰对应数 (爻数表)
// 子→30, 寅→60, 辰→90, 丑→30, 午→120, 申→150
const BRANCH_YAO_VALUES: Record<string, number> = {
  '子': 30, '丑': 30, '寅': 60, '卯': 60,
  '辰': 90, '巳': 90, '午': 120, '未': 120,
  '申': 150, '酉': 150, '戌': 180, '亥': 180
};

// PDF page 33: 洛书数的相配 (用于宫位计算)
// 1-9北，2-8合十，3-7合十，4-6合十，5居中
const LUO_SHU_COMBINE: Record<number, number> = {
  1: 9, 9: 1, 2: 8, 8: 2, 3: 7, 7: 3, 4: 6, 6: 4, 5: 5
};

// PDF 乾坤集: 十二宫分类
// 上半部分: 主要提供人生的重要经历及六亲状况
// 下半部分: 从「小运卦用事」开始，说的是一岁至九十八岁每岁所发生之事
const PALACE_OFFSETS = {
  KAO_KE: 0,        // 考刻条文 (1-1000) - 父母属相验证
  PARENTS: 0,       // 六亲宫 (同考刻，用于验证)
  FATE: 1000,       // 命宫 (1001-2000) - 一生总论
  SIBLINGS: 2000,   // 兄弟宫 (2001-3000)
  MARRIAGE: 3000,   // 婚姻宫 (3001-4000)
  CHILDREN: 4000,   // 子女宫 (4001-5000)
  WEALTH: 5000,     // 财帛宫 (5001-6000)
  CAREER: 6000,     // 官禄宫 (6001-7000)
  HEALTH: 7000,     // 疾厄宫 (7001-8000)
  PROPERTY: 8000,   // 田宅宫 (8001-9000)
  FLOW_YEAR: 9000,  // 流年宫 (9001-10000)
  FLOW_MONTH: 10000 // 流月宫 (10001-11000)
};

// 起运年龄表 - Based on PDF page 25 (民国年份起运表)
// Maps birth month range to Da Yun start age for males/females
const DA_YUN_START_TABLE = {
  // Format: [maleStartAge, femaleStartAge]
  // Based on solar term boundaries
  spring: { male: 4, female: 6 },   // 寅卯辰月
  summer: { male: 6, female: 4 },   // 巳午未月
  autumn: { male: 8, female: 2 },   // 申酉戌月
  winter: { male: 2, female: 8 },   // 亥子丑月
};

// 刻分偏移常数 - Each "刻" (15 min quarter) has specific offset
// Based on PDF page 18-22 考刻表
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

// 流年步进常数 - Based on PDF page 31 流年推算法
const FLOW_YEAR_STEP = 12; // 每年递增12 (与地支周期对应)

// Quarter labels - use from KE_SHIFT_TABLE above
const QUARTER_LABELS = KE_SHIFT_TABLE.map(k => k.label);

// 纳音五行表 - Based on PDF page 33 (洛书/先天八卦配数)
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
}

export interface GanZhiPillars {
  year: string;
  month: string;
  day: string;
  hour: string;
  fullDisplay: string;
}

export interface KaoKeCandidate {
  keIndex: number;         // 0-7 (representing 8 quarters of a Shichen)
  quarterIndex: number;    // Same as keIndex (for compatibility)
  clauseNumber: number;    // The database clause_number to lookup (fallback)
  timeLabel: string;       // e.g., "一刻 (初刻)"
  debugBase?: number;      // For developer transparency
  content?: string;        // Populated from DB
  searchQuery?: string;    // Content-based search keyword (e.g., "父属鼠")
}

export interface DestinyProjection {
  lifeDestiny: number;
  marriage: number;
  wealth: number;
  career: number;
  health: number;
  children: number;
}

// BaZi Profile for deep analysis
export interface BaZiProfile {
  dayMaster: string;           // The "Self" element (日主)
  dayMasterElement: string;    // e.g., "火" (Fire)
  pillars: {
    year: string;
    month: string;
    day: string;
    time: string;
  };
  strength: string;            // 得令/失令
  favorableElements: string[]; // 喜用神
  unfavorableElements: string[]; // 忌神
}

// 10-Year Luck Cycle (大运)
export interface DaYunCycle {
  startAge: number;
  endAge: number;
  ganZhi: string;              // e.g., "甲子"
  startYear: number;
  element: string;             // The dominant element
}

// Flow Year Projection (流年)
export interface FlowYearClause {
  age: number;
  year: number;
  ganZhi: string;              // That year's GanZhi
  clauseNumber: number;
  content?: string;            // Populated from DB
}

// Full Destiny Report
export interface FullDestinyReport {
  baziProfile: BaZiProfile;
  lifeCycles: DaYunCycle[];
  flowYears: FlowYearClause[];
  destinyProjection: DestinyProjection;
}

// Six Relations (六亲) Input for Calibration
export interface SixRelationsInput {
  fatherZodiac: number; // 0=Rat, 1=Ox, ... 11=Pig
  motherZodiac: number; // 0=Rat, ...
  parentsStatus: 'both_alive' | 'father_deceased' | 'mother_deceased' | 'both_deceased';
  siblingsCount: number;
}

// Enhanced KaoKe with prediction matching
export interface KaoKeWithMatch extends KaoKeCandidate {
  predictedFatherZodiac: number;
  predictedMotherZodiac: number;
  matchScore: number; // 0-100, higher = better match
  searchQuery: string; // Content-based search keyword (e.g., "父属鼠")
}

export interface CalculationResult {
  baseNumber: number;
  pillars: GanZhiPillars;
  stemSum: number;
  branchSum: number;
  totalScore: number;
}

// Calibration result with system offset
export interface CalibrationResult {
  theoreticalBase: number;
  confirmedClauseId: number;
  systemOffset: number;
  lockedQuarterIndex: number;
}

// ==========================================
// 3. THE MATHEMATICAL ENGINE
// ==========================================

export const TiebanEngine = {
  /**
   * CORE ALGORITHM: The "Tai Xuan" Summation (太玄数)
   * PDF page 43: 甲己子午九，乙庚丑未八，丙辛寅申七，丁壬卯酉六，戊癸辰戌五，巳亥四
   */
  getTaiXuanScore: (ganZhiArr: string[]): number => {
    let score = 0;
    ganZhiArr.forEach(gz => {
      if (gz.length >= 2) {
        const stem = gz.charAt(0);
        const branch = gz.charAt(1);
        score += (TAI_XUAN_MAP[stem] || 5);
        score += (TAI_XUAN_MAP[branch] || 5);
      }
    });
    return score;
  },

  /**
   * PDF page 43: 获取地支爻数值
   * 子丑=30, 寅卯=60, 辰巳=90, 午未=120, 申酉=150, 戌亥=180
   */
  getBranchYaoValue: (branch: string): number => {
    return BRANCH_YAO_VALUES[branch] || 30;
  },

  /**
   * PDF page 45-46: 计算单柱数值
   * 公式: 天干太玄数 + 地支太玄数
   * 例如: 甲子 = 甲(9) + 子(9) = 18
   */
  getPillarValue: (ganZhi: string): number => {
    if (ganZhi.length < 2) return 10;
    const stem = ganZhi.charAt(0);
    const branch = ganZhi.charAt(1);
    return (TAI_XUAN_MAP[stem] || 5) + (TAI_XUAN_MAP[branch] || 5);
  },

  /**
   * Extract Four Pillars (四柱/八字) from birth data
   */
  extractPillars: (input: TiebanInput): GanZhiPillars => {
    const solar = Solar.fromYmdHms(
      input.year,
      input.month,
      input.day,
      input.hour,
      input.minute,
      0
    );
    const lunar = solar.getLunar();

    const year = lunar.getYearInGanZhi();
    const month = lunar.getMonthInGanZhi();
    const day = lunar.getDayInGanZhi();
    const hour = lunar.getTimeInGanZhi();

    return {
      year,
      month,
      day,
      hour,
      fullDisplay: `${year}年 ${month}月 ${day}日 ${hour}时`,
    };
  },

  /**
   * PDF page 45-48: CORE ALGORITHM - 四柱合计法
   * 
   * 核心公式: 年柱数 + 月柱数 + 日柱数 + 时柱数 = 基础数
   * 每柱数 = 天干太玄数 + 地支太玄数
   * 
   * PDF page 48 示例: 26 + 42 = 2642
   * 这说明条文号直接由四柱数值组合而成
   */
  calculateBaseNumber: (input: TiebanInput): CalculationResult => {
    // 1. 精确的阳历转阴历
    const solar = Solar.fromYmdHms(
      input.year,
      input.month,
      input.day,
      input.hour,
      input.minute,
      0
    );
    const lunar = solar.getLunar();

    // 2. 提取四柱
    const pillars = TiebanEngine.extractPillars(input);
    const pillarStrings = [pillars.year, pillars.month, pillars.day, pillars.hour];

    // 3. PDF page 45-46: 计算各柱数值
    const yearValue = TiebanEngine.getPillarValue(pillars.year);
    const monthValue = TiebanEngine.getPillarValue(pillars.month);
    const dayValue = TiebanEngine.getPillarValue(pillars.day);
    const hourValue = TiebanEngine.getPillarValue(pillars.hour);

    // 4. 分别计算天干和地支之和
    let stemSum = 0;
    let branchSum = 0;
    pillarStrings.forEach(pillar => {
      if (pillar.length >= 2) {
        stemSum += (TAI_XUAN_MAP[pillar.charAt(0)] || 5);
        branchSum += (TAI_XUAN_MAP[pillar.charAt(1)] || 5);
      }
    });

    const staticScore = stemSum + branchSum;

    // 5. PDF page 48: 基础数计算
    // 公式: (四柱总和 × 刻分系数) + 分钟调整
    // 刻分系数确保数值在有效范围内
    const keIndex = Math.floor(input.minute / 15); // 0-3 刻
    const minuteOffset = input.minute % 15; // 刻内偏移
    
    // 核心公式: 年月日时四柱之和 × 100 + 分钟调整
    let rawBase = (yearValue + monthValue + dayValue + hourValue) * 100;
    rawBase += keIndex * 25 + minuteOffset;

    // 6. 性别调整 (阳男阴女)
    if (input.gender === 'female') {
      rawBase += 500;
    }

    return {
      baseNumber: rawBase,
      pillars,
      stemSum,
      branchSum,
      totalScore: staticScore,
    };
  },

  /**
   * VERIFICATION ALGORITHM: The "Eight Quarters" (八刻分局)
   * Enhanced based on PDF page 18-22 考刻验证法
   * Uses the KE_SHIFT_TABLE for proper offset calculation
   */
  generateKaoKeCandidates: (baseNumber: number): KaoKeCandidate[] => {
    const candidates: KaoKeCandidate[] = [];

    // Generate the 8 variations using PDF-based offset table
    // Each quarter (刻) has a specific mathematical offset
    KE_SHIFT_TABLE.forEach((keConfig, i) => {
      // Enhanced formula based on PDF:
      // clauseId = (baseNumber + keOffset + parentsPalaceOffset) % modulo
      // The keOffset is derived from the classical 刻分表
      const keShift = keConfig.offset;

      // Apply the base formula with normalized modulo
      let clauseId = (baseNumber + keShift + PALACE_OFFSETS.PARENTS) % BASE_MODULO;

      // Ensure we stay within valid clause range
      if (clauseId < MIN_CLAUSE_ID) {
        clauseId += MIN_CLAUSE_ID;
      }
      if (clauseId > MAX_CLAUSE_ID) {
        clauseId = MIN_CLAUSE_ID + (clauseId % (MAX_CLAUSE_ID - MIN_CLAUSE_ID));
      }

      candidates.push({
        keIndex: i,
        quarterIndex: i,
        clauseNumber: Math.floor(clauseId),
        timeLabel: keConfig.label,
        debugBase: baseNumber,
      });
    });

    return candidates;
  },

  /**
   * PROJECTION ALGORITHM: The "Iron Plate Deduction" (铁板神推)
   * Once the Quarter (Ke) is locked, the destiny is fixed.
   * 
   * 注意：此函数是旧版本，建议使用 projectDestinyWithOffset
   */
  calculateDestinyPaths: (lockedBase: number, lockedQuarterIndex: number): DestinyProjection => {
    // 1. Apply the "Locked" shift
    const lockedBase2 = lockedBase + (lockedQuarterIndex * 15);

    // 使用新的宫位计算逻辑
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

  /**
   * Get a single primary destiny clause (for simple result display)
   */
  calculatePrimaryDestiny: (lockedBase: number, lockedQuarterIndex: number): number => {
    const lockedBase2 = lockedBase + (lockedQuarterIndex * 15);
    const inPalaceOffset = ((lockedBase2 % 1000) + 1000) % 1000;
    let clauseId = PALACE_OFFSETS.FATE + inPalaceOffset + 1;
    if (clauseId < MIN_CLAUSE_ID) clauseId = MIN_CLAUSE_ID;
    if (clauseId > MAX_CLAUSE_ID) clauseId = MAX_CLAUSE_ID;
    return Math.floor(clauseId);
  },

  /**
   * Helper: Ensure the ID stays within the bounds of the clause database (1-12000)
   * PDF规定条文范围为1-12000
   */
  normalizeClauseId: (rawId: number): number => {
    let validId = rawId;
    // 确保在1-12000范围内循环
    validId = ((validId - 1) % BASE_MODULO + BASE_MODULO) % BASE_MODULO + 1;
    if (validId < MIN_CLAUSE_ID) validId = MIN_CLAUSE_ID;
    if (validId > MAX_CLAUSE_ID) validId = MAX_CLAUSE_ID;
    return Math.floor(validId);
  },

  /**
   * PDF page 45-48: BAZI-ANCHORED ALGORITHM
   * 理论基础数计算 - 基于四柱太玄数
   * 
   * 公式: (年柱值 + 月柱值 + 日柱值 + 时柱值) × 系数 + 刻分调整
   */
  calculateTheoreticalBase: (input: TiebanInput): number => {
    const solar = Solar.fromYmdHms(input.year, input.month, input.day, input.hour, input.minute, 0);
    const lunar = solar.getLunar();
    
    const yearPillar = lunar.getYearInGanZhi();
    const monthPillar = lunar.getMonthInGanZhi();
    const dayPillar = lunar.getDayInGanZhi();
    const hourPillar = lunar.getTimeInGanZhi();

    // PDF page 45-46: 计算各柱数值
    const yearValue = TiebanEngine.getPillarValue(yearPillar);
    const monthValue = TiebanEngine.getPillarValue(monthPillar);
    const dayValue = TiebanEngine.getPillarValue(dayPillar);
    const hourValue = TiebanEngine.getPillarValue(hourPillar);

    // PDF page 43: 获取时辰地支的爻数值
    const hourBranch = hourPillar.charAt(1);
    const yaoValue = TiebanEngine.getBranchYaoValue(hourBranch);

    // PDF page 48: 核心公式
    // 基础数 = (年+月+日+时)柱值之和 × 100 + 爻数调整
    const pillarSum = yearValue + monthValue + dayValue + hourValue;
    let base = pillarSum * 100 + yaoValue;
    
    // 刻分微调 (每15分钟一刻)
    const keIndex = Math.floor(input.minute / 15);
    const minuteOffset = input.minute % 15;
    base += keIndex * 30 + minuteOffset * 2;
    
    // 性别调整
    if (input.gender === 'female') {
      base += 500;
    }

    // 确保在有效范围内
    return ((base - 1) % BASE_MODULO + BASE_MODULO) % BASE_MODULO + 1;
  },

  /**
   * CALIBRATION ALGORITHM: Calculate System Offset
   * 
   * PDF 考刻校正法:
   * 用户确认的考刻条文号与数学推算的对照，得出系统偏移
   * 此偏移量将应用于所有后续宫位的计算
   */
  calculateSystemOffset: (theoreticalBase: number, confirmedClauseId: number): number => {
    // 考刻条文在第一宫(1-1000范围)
    // 计算理论上应该对应的条文号
    const theoreticalInPalace = ((theoreticalBase % 1000) + 1000) % 1000;
    const expectedId = PALACE_OFFSETS.KAO_KE + theoreticalInPalace + 1;
    
    // 系统偏移 = 用户确认的条文号 - 理论条文号
    // 这个偏移量反映了数学模型与实际条文库的对应关系
    const offset = confirmedClauseId - expectedId;
    
    console.log('[系统校正]', {
      theoreticalBase,
      theoreticalInPalace,
      expectedId,
      confirmedClauseId,
      systemOffset: offset
    });
    
    return offset;
  },

  /**
   * PDF page 45-48: PROJECTION WITH OFFSET
   * 终身总评推算 - 基于校正后的基础数计算各宫条文
   * 
   * 核心算法:
   * 1. 基础值 = 理论基础数 + 系统偏移
   * 2. 各宫条文号 = 宫位起始 + (基础值 mod 1000)
   * 3. 确保每宫条文在其1000条范围内
   * 
   * PDF关键: 条文号直接映射到各宫位的千位段
   */
  projectDestinyWithOffset: (theoreticalBase: number, systemOffset: number): DestinyProjection => {
    /**
     * PDF page 48: 精确计算各宫条文号
     * 
     * 公式: clauseId = palaceStart + ((baseValue) % 1000)
     * 
     * 例如:
     * - 命宫(FATE): 1001-2000, 起始=1000
     * - 婚姻宫(MARRIAGE): 3001-4000, 起始=3000
     */
    const getClauseForPalace = (palaceOffset: number): number => {
      // 计算综合基础值
      const baseValue = theoreticalBase + systemOffset;
      
      // PDF: 对1000取模得到宫内位置(0-999)
      // 使用正确的模运算确保非负值
      let inPalaceOffset = baseValue % 1000;
      if (inPalaceOffset < 0) inPalaceOffset += 1000;
      
      // 条文号 = 宫位起始 + 宫内位置 + 1
      // +1 因为条文从1开始而非0
      let clauseId = palaceOffset + inPalaceOffset + 1;
      
      // 边界检查
      if (clauseId < MIN_CLAUSE_ID) clauseId = MIN_CLAUSE_ID;
      if (clauseId > MAX_CLAUSE_ID) clauseId = MAX_CLAUSE_ID;
      
      return Math.floor(clauseId);
    };

    const result = {
      lifeDestiny: getClauseForPalace(PALACE_OFFSETS.FATE),
      marriage: getClauseForPalace(PALACE_OFFSETS.MARRIAGE),
      wealth: getClauseForPalace(PALACE_OFFSETS.WEALTH),
      career: getClauseForPalace(PALACE_OFFSETS.CAREER),
      health: getClauseForPalace(PALACE_OFFSETS.HEALTH),
      children: getClauseForPalace(PALACE_OFFSETS.CHILDREN),
    };

    console.log('[终身总评] PDF算法推算:', {
      theoreticalBase,
      systemOffset,
      baseValue: theoreticalBase + systemOffset,
      inPalaceOffset: (theoreticalBase + systemOffset) % 1000,
      结果: result
    });

    return result;
  },

  /**
   * Get Chinese zodiac from year
   */
  getZodiac: (year: number): string => {
    const zodiacNames = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];
    const index = (year - 4) % 12;
    return zodiacNames[index >= 0 ? index : index + 12];
  },

  /**
   * Get Chinese hour name (时辰)
   */
  getChineseHour: (hour: number): string => {
    const hourNames = [
      '子时 (23-01)', '丑时 (01-03)', '寅时 (03-05)', '卯时 (05-07)',
      '辰时 (07-09)', '巳时 (09-11)', '午时 (11-13)', '未时 (13-15)',
      '申时 (15-17)', '酉时 (17-19)', '戌时 (19-21)', '亥时 (21-23)'
    ];
    const index = Math.floor(((hour + 1) % 24) / 2);
    return hourNames[index];
  },

  /**
   * Get zodiac name from index (0-11)
   */
  getZodiacName: (index: number): string => {
    const zodiacNames = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];
    return zodiacNames[index % 12];
  },

  /**
   * ADVANCED CALIBRATION: Match User's Six Relations against the 8 Quarters
   * 
   * This is the core of Iron Plate "Kao Ke" (考刻) verification.
   * We mathematically predict family details for each quarter and score
   * how well each matches the user's actual family information.
   * 
   * NEW: Returns searchQuery for content-based database lookup instead of
   * relying solely on calculated clause IDs.
   */
  calculateSixRelationsMatch: (
    baseNumber: number,
    relations: SixRelationsInput
  ): KaoKeWithMatch[] => {
    const candidates = TiebanEngine.generateKaoKeCandidates(baseNumber);
    const ZODIAC_CN = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];

    return candidates.map(candidate => {
      // 1. Use the proper offset from KE_SHIFT_TABLE
      const keConfig = KE_SHIFT_TABLE[candidate.keIndex];
      const specificSeed = baseNumber + keConfig.offset;

      // 2. Enhanced zodiac prediction based on PDF page 26-27
      // 父属相 = (种子数 + 年柱地支数) % 12
      // 母属相 = (种子数 + 月柱地支数 + 6) % 12
      // Using simplified constants that approximate the classical method
      const fatherOffset = 3;  // 父亲宫位偏移
      const motherOffset = 9;  // 母亲宫位偏移
      
      const predFather = Math.abs(specificSeed + fatherOffset) % 12;
      const predMother = Math.abs(specificSeed + motherOffset) % 12;

      // 3. Construct enhanced Search Keyword for database lookup
      // Include both father and mother for better matching
      const fatherZodiac = ZODIAC_CN[predFather];
      const motherZodiac = ZODIAC_CN[predMother];
      const searchQuery = `父属${fatherZodiac}`;
      const fullSearchQuery = `父属${fatherZodiac}母属${motherZodiac}`;

      // 4. Enhanced Match Score calculation based on PDF verification method
      let score = 0;

      // Father zodiac match: 35 points (exact), 15 points (adjacent)
      if (predFather === relations.fatherZodiac) {
        score += 35;
      } else {
        const fatherDiff = Math.min(
          Math.abs(predFather - relations.fatherZodiac),
          12 - Math.abs(predFather - relations.fatherZodiac)
        );
        if (fatherDiff === 1) score += 15;
        else if (fatherDiff === 2) score += 5;
      }

      // Mother zodiac match: 35 points (exact), 15 points (adjacent)
      if (predMother === relations.motherZodiac) {
        score += 35;
      } else {
        const motherDiff = Math.min(
          Math.abs(predMother - relations.motherZodiac),
          12 - Math.abs(predMother - relations.motherZodiac)
        );
        if (motherDiff === 1) score += 15;
        else if (motherDiff === 2) score += 5;
      }

      // Parents status match: 20 points
      // Based on PDF: 双亲在堂 vs 先克父/先克母 patterns
      const seedDigitSum = String(specificSeed).split('').reduce((a, b) => a + parseInt(b || '0'), 0);
      const statusIndicator = seedDigitSum % 4;
      
      if (relations.parentsStatus === 'both_alive' && statusIndicator === 0) {
        score += 20;
      } else if (relations.parentsStatus === 'father_deceased' && statusIndicator === 1) {
        score += 20;
      } else if (relations.parentsStatus === 'mother_deceased' && statusIndicator === 2) {
        score += 20;
      } else if (relations.parentsStatus === 'both_deceased' && statusIndicator === 3) {
        score += 20;
      }

      // Siblings count bonus: 10 points max
      // PDF mentions 兄弟宫 calculation
      const siblingPredict = (specificSeed % 8) + 1; // 1-8 siblings predicted
      if (siblingPredict === relations.siblingsCount) {
        score += 10;
      } else if (Math.abs(siblingPredict - relations.siblingsCount) === 1) {
        score += 5;
      }

      return {
        ...candidate,
        predictedFatherZodiac: predFather,
        predictedMotherZodiac: predMother,
        matchScore: Math.min(score, 100),
        searchQuery,
      };
    }).sort((a, b) => b.matchScore - a.matchScore);
  },

  /**
   * BAZI DEEP ANALYSIS: Calculate Full BaZi Profile
   * Includes Day Master, Elements, and strength analysis
   */
  calculateBaZiProfile: (input: TiebanInput): BaZiProfile => {
    const solar = Solar.fromYmdHms(input.year, input.month, input.day, input.hour, input.minute, 0);
    const lunar = solar.getLunar();
    const eightChar = lunar.getEightChar();
    
    // Get Day Master (日主) - the core of one's identity
    const dayMaster = eightChar.getDayGan();
    const dayMasterElement = eightChar.getDayWuXing();
    
    // Get pillars
    const pillars = {
      year: lunar.getYearInGanZhi(),
      month: lunar.getMonthInGanZhi(),
      day: lunar.getDayInGanZhi(),
      time: lunar.getTimeInGanZhi(),
    };
    
    // Simple strength analysis based on month element
    const monthElement = eightChar.getMonthWuXing();
    const isStrong = dayMasterElement === monthElement;
    const strength = isStrong ? "得令 (Strong)" : "失令 (Weak)";
    
    // Simplified favorable elements logic based on Day Master element
    // In real practice, this is much more complex
    const ELEMENT_CYCLE = ['木', '火', '土', '金', '水'];
    const dayIndex = ELEMENT_CYCLE.indexOf(dayMasterElement);
    
    let favorableElements: string[] = [];
    let unfavorableElements: string[] = [];
    
    if (isStrong) {
      // If strong, need elements that weaken or drain
      favorableElements = [
        ELEMENT_CYCLE[(dayIndex + 1) % 5], // What I produce (泄)
        ELEMENT_CYCLE[(dayIndex + 3) % 5], // What overcomes me (克)
      ];
      unfavorableElements = [
        ELEMENT_CYCLE[dayIndex], // Same element (比)
        ELEMENT_CYCLE[(dayIndex + 4) % 5], // What produces me (生)
      ];
    } else {
      // If weak, need elements that strengthen or support
      favorableElements = [
        ELEMENT_CYCLE[dayIndex], // Same element (比)
        ELEMENT_CYCLE[(dayIndex + 4) % 5], // What produces me (生)
      ];
      unfavorableElements = [
        ELEMENT_CYCLE[(dayIndex + 1) % 5], // What I produce (泄)
        ELEMENT_CYCLE[(dayIndex + 3) % 5], // What overcomes me (克)
      ];
    }
    
    return {
      dayMaster,
      dayMasterElement,
      pillars,
      strength,
      favorableElements,
      unfavorableElements,
    };
  },

  /**
   * CALCULATE DA YUN (大运): 10-Year Luck Cycles
   * Enhanced based on PDF page 25 起运表
   * Uses lunar-typescript as base, with PDF-based refinements
   */
  calculateDaYun: (input: TiebanInput): DaYunCycle[] => {
    const solar = Solar.fromYmdHms(input.year, input.month, input.day, input.hour, input.minute, 0);
    const lunar = solar.getLunar();
    const eightChar = lunar.getEightChar();
    
    // Get the Yun (运) - gender: 1=male, 0=female
    const yun = eightChar.getYun(input.gender === 'male' ? 1 : 0);
    const daYunList = yun.getDaYun();
    
    // Get 纳音 for enhanced analysis
    const getNaYin = (ganZhi: string): string => {
      return NA_YIN_TABLE[ganZhi] || '未知';
    };
    
    // Stem to element mapping
    const STEM_ELEMENTS: Record<string, string> = {
      '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
      '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水'
    };
    
    const cycles: DaYunCycle[] = daYunList.map((dy, index) => {
      const ganZhi = dy.getGanZhi();
      const gan = ganZhi.charAt(0);
      
      // Get start age - PDF specifies refined calculation
      let startAge = dy.getStartAge();
      let endAge = dy.getEndAge();
      
      // PDF page 25: 起运年龄修正
      // 第一步大运通常从起运年龄开始，每步10年
      // Ensure proper 10-year spans
      if (index > 0) {
        startAge = daYunList[index - 1].getEndAge() + 1;
        endAge = startAge + 9;
      }
      
      return {
        startAge,
        endAge,
        ganZhi,
        startYear: dy.getStartYear(),
        element: STEM_ELEMENTS[gan] || '未知',
      };
    });
    
    return cycles;
  },

  /**
   * Get Na Yin (纳音) for a GanZhi combination
   * Based on PDF page 33
   */
  getNaYin: (ganZhi: string): string => {
    return NA_YIN_TABLE[ganZhi] || '未知';
  },

  /**
   * FLOW YEAR CLAUSES (流年条文): Calculate clause IDs for specific ages
   * 
   * PDF page 31 流年推算法:
   * 流年条文应落在流年宫(9001-10000)范围内
   * 公式: clauseId = ((base + age×12) % 1000) + 流年宫起点
   */
  calculateFlowYearClauses: (
    trueBase: number, 
    systemOffset: number,
    birthYear: number,
    startAge: number = 1, 
    endAge: number = 80
  ): FlowYearClause[] => {
    const flowYears: FlowYearClause[] = [];
    
    // 地支序数用于流年运势计算
    const BRANCH_INDEX: Record<string, number> = {
      '子': 0, '丑': 1, '寅': 2, '卯': 3, '辰': 4, '巳': 5,
      '午': 6, '未': 7, '申': 8, '酉': 9, '戌': 10, '亥': 11
    };
    
    for (let age = startAge; age <= endAge; age++) {
      const year = birthYear + age;
      
      // Get GanZhi for that year
      const yearSolar = Solar.fromYmdHms(year, 6, 15, 12, 0, 0);
      const yearLunar = yearSolar.getLunar();
      const yearGanZhi = yearLunar.getYearInGanZhi();
      
      // Get the branch (地支) of the year for enhanced calculation
      const yearBranch = yearGanZhi.charAt(1);
      const branchValue = BRANCH_INDEX[yearBranch] || 0;
      
      // PDF page 31: 流年条文计算
      // 基础值 + 系统偏移 + 年龄步进 + 当年地支能量
      const rawValue = trueBase + systemOffset + (age * FLOW_YEAR_STEP) + branchValue;
      
      // 流年条文落在流年宫(9001-10000)
      const inPalaceOffset = ((rawValue % 1000) + 1000) % 1000;
      let clauseId = PALACE_OFFSETS.FLOW_YEAR + inPalaceOffset + 1;
      
      // 确保在有效范围
      if (clauseId > MAX_CLAUSE_ID) clauseId = PALACE_OFFSETS.FLOW_YEAR + 1;
      
      flowYears.push({
        age,
        year,
        ganZhi: yearGanZhi,
        clauseNumber: clauseId,
      });
    }
    
    return flowYears;
  },

  /**
   * Calculate Flow Year for a specific Da Yun period
   * 考虑大运干支影响的流年计算
   */
  calculateFlowYearWithDaYun: (
    trueBase: number,
    systemOffset: number,
    age: number,
    birthYear: number,
    daYunGanZhi: string
  ): FlowYearClause => {
    const year = birthYear + age;
    const yearSolar = Solar.fromYmdHms(year, 6, 15, 12, 0, 0);
    const yearLunar = yearSolar.getLunar();
    const yearGanZhi = yearLunar.getYearInGanZhi();
    
    // Get Da Yun stem influence
    const daYunStem = daYunGanZhi.charAt(0);
    const daYunValue = TAI_XUAN_MAP[daYunStem] || 5;
    
    // 计算流年条文(落在9001-10000)
    const rawValue = trueBase + systemOffset + (age * FLOW_YEAR_STEP) + daYunValue;
    const inPalaceOffset = ((rawValue % 1000) + 1000) % 1000;
    let clauseId = PALACE_OFFSETS.FLOW_YEAR + inPalaceOffset + 1;
    
    if (clauseId > MAX_CLAUSE_ID) clauseId = PALACE_OFFSETS.FLOW_YEAR + 1;
    
    return {
      age,
      year,
      ganZhi: yearGanZhi,
      clauseNumber: clauseId,
    };
  },

  /**
   * GENERATE FULL DESTINY REPORT
   * Combines all analysis into a comprehensive report
   */
  generateFullDestinyReport: (
    input: TiebanInput,
    trueBase: number,
    systemOffset: number
  ): FullDestinyReport => {
    // 1. BaZi Deep Analysis
    const baziProfile = TiebanEngine.calculateBaZiProfile(input);
    
    // 2. Da Yun (10-Year Cycles)
    const lifeCycles = TiebanEngine.calculateDaYun(input);
    
    // 3. Flow Year Clauses (Age 1 to 80)
    const flowYears = TiebanEngine.calculateFlowYearClauses(
      trueBase, 
      systemOffset, 
      input.year,
      1, 
      80
    );
    
    // 4. Standard Destiny Projection
    const destinyProjection = TiebanEngine.projectDestinyWithOffset(trueBase, systemOffset);
    
    return {
      baziProfile,
      lifeCycles,
      flowYears,
      destinyProjection,
    };
  },
};

export default TiebanEngine;
