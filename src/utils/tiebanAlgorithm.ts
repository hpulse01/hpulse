/**
 * Tieban Shenshu (铁板神数) Algorithm Engine
 * 
 * CRITICAL LOGIC:
 * 1. Strict Indexing: clause_number MUST match database clause_number column
 * 2. Verification Flow: generateKaoKeCandidates FIRST, then user selection, then calculateDestinyPaths
 * 3. Error Margin: Fallback to ID±1 for missing clauses
 */

import { Solar } from 'lunar-typescript';

// ==================== CONSTANTS ====================

// Heavenly Stems (天干) numerical values
const HEAVENLY_STEMS_MAP: Record<string, number> = {
  '甲': 6, '乙': 2, '丙': 8, '丁': 7, '戊': 1,
  '己': 9, '庚': 3, '辛': 4, '壬': 6, '癸': 2
};

// Earthly Branches (地支) numerical values
const EARTHLY_BRANCHES_MAP: Record<string, number> = {
  '子': 1, '丑': 10, '寅': 3, '卯': 4, '辰': 5, '巳': 6,
  '午': 7, '未': 8, '申': 9, '酉': 10, '戌': 11, '亥': 12
};

// 8 Quarters (刻分) offsets within a 2-hour period (时辰)
const QUARTER_OFFSETS = [0, 15, 30, 45, 60, 75, 90, 105];

// Quarter labels in classical Chinese
const QUARTER_LABELS = [
  '初刻 (0-15分)',
  '一刻 (15-30分)',
  '二刻 (30-45分)',
  '三刻 (45-60分)',
  '四刻 (60-75分)',
  '五刻 (75-90分)',
  '六刻 (90-105分)',
  '七刻 (105-120分)'
];

// Verification section: clauses 1001-3000 typically used for Kao Ke
const VERIFICATION_SECTION_START = 1001;
const CLAUSE_MIN = 1001;
const CLAUSE_MAX = 13000;

// Destiny aspect offsets (maps to different sections of the clause database)
const DESTINY_OFFSETS = {
  lifeDestiny: 0,
  career: 2000,
  marriage: 4000,
  health: 6000,
  wealth: 8000,
  children: 10000,
};

// ==================== TYPES ====================

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
  keIndex: number;           // 0-7, the quarter index
  clauseNumber: number;      // The clause_number to lookup in DB
  timeLabel: string;         // Display label e.g. "初刻 (0-15分)"
  content?: string;          // To be populated from DB
}

export interface DestinyPath {
  aspect: string;            // e.g. "lifeDestiny", "marriage"
  aspectLabel: string;       // Chinese label
  clauseNumber: number;      // The clause_number to lookup in DB
  content?: string;          // To be populated from DB
}

export interface CalculationResult {
  baseNumber: number;
  pillars: GanZhiPillars;
  lockedKeIndex?: number;
  preciseNumber?: number;
}

// ==================== ENGINE ====================

export const TiebanEngine = {
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
   * STEP 1: Calculate Base Number from birth data
   * Uses Stem/Branch summation method
   */
  calculateBaseNumber: (input: TiebanInput): CalculationResult => {
    const pillars = TiebanEngine.extractPillars(input);
    
    const pillarStrings = [pillars.year, pillars.month, pillars.day, pillars.hour];
    
    let totalScore = 0;

    // Sum the numerical values of all stems and branches
    pillarStrings.forEach(pillar => {
      if (pillar.length >= 2) {
        const stem = pillar.charAt(0);
        const branch = pillar.charAt(1);
        const stemVal = HEAVENLY_STEMS_MAP[stem] || 0;
        const branchVal = EARTHLY_BRANCHES_MAP[branch] || 0;
        totalScore += stemVal + branchVal;
      }
    });

    // Gender modifier (乾命/坤命)
    const genderMod = input.gender === 'male' ? 1 : 2;

    // Base formula: (Sum * 50) + Month + Day + Gender modifier
    const baseNumber = (totalScore * 50) + input.month + input.day + genderMod;

    return {
      baseNumber,
      pillars,
    };
  },

  /**
   * STEP 2: Generate Kao Ke (考刻) Candidates
   * 
   * CRITICAL: These clause_number values MUST exist in the database.
   * Returns 8 candidates for the 8 quarters of the hour.
   * The user must select which one matches their family situation.
   */
  generateKaoKeCandidates: (baseNumber: number): KaoKeCandidate[] => {
    const candidates: KaoKeCandidate[] = [];

    for (let i = 0; i < 8; i++) {
      // FORMULA: Base clause + (baseNumber % 100) + quarter offset
      // This maps to verification clauses (typically about parents/siblings)
      let clauseNumber = VERIFICATION_SECTION_START + (baseNumber % 100) + QUARTER_OFFSETS[i];

      // Ensure within valid clause range
      clauseNumber = TiebanEngine.normalizeClauseNumber(clauseNumber);

      candidates.push({
        keIndex: i,
        clauseNumber,
        timeLabel: QUARTER_LABELS[i],
      });
    }

    return candidates;
  },

  /**
   * STEP 3: Calculate Destiny Paths (ONLY after user locks a keIndex)
   * 
   * CRITICAL: This should NEVER be called before user verification!
   * 
   * @param baseNumber - The initial base number
   * @param lockedKeIndex - The quarter index user selected (0-7)
   */
  calculateDestinyPaths: (baseNumber: number, lockedKeIndex: number): DestinyPath[] => {
    // Calculate the precise number with locked quarter
    const preciseNumber = baseNumber + QUARTER_OFFSETS[lockedKeIndex];

    const aspectLabels: Record<string, string> = {
      lifeDestiny: '命运总论',
      career: '事业前程',
      marriage: '婚姻姻缘',
      health: '健康寿元',
      wealth: '财运财富',
      children: '子嗣儿女',
    };

    const paths: DestinyPath[] = [];

    for (const [aspect, offset] of Object.entries(DESTINY_OFFSETS)) {
      // FORMULA: (preciseNumber * 12 + aspectOffset) % 12000 + 1001
      let clauseNumber = ((preciseNumber * 12) + offset) % 12000 + CLAUSE_MIN;
      
      // Normalize to valid range
      clauseNumber = TiebanEngine.normalizeClauseNumber(clauseNumber);

      paths.push({
        aspect,
        aspectLabel: aspectLabels[aspect] || aspect,
        clauseNumber,
      });
    }

    return paths;
  },

  /**
   * Get a single primary destiny clause (for simple result display)
   */
  calculatePrimaryDestiny: (baseNumber: number, lockedKeIndex: number): number => {
    const preciseNumber = baseNumber + QUARTER_OFFSETS[lockedKeIndex];
    let clauseNumber = ((preciseNumber * 12) % 12000) + CLAUSE_MIN;
    return TiebanEngine.normalizeClauseNumber(clauseNumber);
  },

  /**
   * Normalize clause number to valid range [1001, 13000]
   */
  normalizeClauseNumber: (num: number): number => {
    if (num < CLAUSE_MIN) {
      return CLAUSE_MIN + (num % 1000);
    }
    if (num > CLAUSE_MAX) {
      return CLAUSE_MIN + ((num - CLAUSE_MIN) % (CLAUSE_MAX - CLAUSE_MIN));
    }
    return num;
  },

  /**
   * Find fallback clause number if target doesn't exist
   * Tries ±1, ±2, up to ±10
   * 
   * @param targetNumber - The calculated clause number
   * @param existingNumbers - Set of valid clause numbers from database
   * @param maxOffset - Maximum offset to search (default: 10)
   */
  findFallbackClause: (
    targetNumber: number,
    existingNumbers: Set<number>,
    maxOffset: number = 10
  ): number | null => {
    // Try exact match first
    if (existingNumbers.has(targetNumber)) {
      return targetNumber;
    }

    // Try alternating offsets: +1, -1, +2, -2, ...
    for (let offset = 1; offset <= maxOffset; offset++) {
      if (existingNumbers.has(targetNumber + offset)) {
        return targetNumber + offset;
      }
      if (existingNumbers.has(targetNumber - offset)) {
        return targetNumber - offset;
      }
    }

    return null;
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
};

export default TiebanEngine;
