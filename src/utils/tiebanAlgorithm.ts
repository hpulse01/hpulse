/**
 * Iron Plate Divine Number (铁板神数) Engine
 * 
 * Professional Standard Model based on:
 * 1. Tai Xuan Numerology (太玄数) - The mathematical foundation
 * 2. Hexagram Transformation (卦气) - Entropy generation
 * 3. 8-Quarter Calibration (考刻) - Birth time precision
 * 4. Category-Based Projection - Life aspect derivation
 */

import { Solar } from 'lunar-typescript';

// ==========================================
// 1. CONSTANTS & METAPHYSICAL DICTIONARIES
// ==========================================

/**
 * Tai Xuan Numbers (太玄数) - The mathematical foundation of Iron Plate
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

// Heavenly Stems Order (for Hexagram derivation)
const STEM_ORDER = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];

// Earthly Branches Order
const BRANCH_ORDER = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

/**
 * Tieban "Magic Keys" (Category Offsets)
 * These offsets map the Base Number to specific life categories.
 * Derived from standard distribution patterns in classical texts.
 */
const CATEGORY_OFFSETS = {
  GENERAL_LUCK: 0,        // Base number itself
  PARENTS_KAO_KE: 1000,   // Verification clauses (1000-2000 block)
  SIBLINGS: 2000,         // Siblings (2000-3000 block)
  MARRIAGE: 4000,         // Marriage (4000-5000 block)
  CHILDREN: 5000,         // Children (5000-6000 block)
  WEALTH: 7000,           // Wealth (7000-8000 block)
  CAREER: 9000,           // Career (9000-10000 block)
  HEALTH: 10000,          // Health (10000-11000 block)
  LATE_YEARS: 11000       // End of life (11000-12000 block)
};

// The Maximum Clause Number in the database (to prevent overflow)
const MAX_CLAUSE_ID = 12000;
const MIN_CLAUSE_ID = 1001;

// Quarter labels in classical Chinese
const QUARTER_LABELS = [
  "初刻 (0-15分)",
  "二刻 (15-30分)",
  "三刻 (30-45分)",
  "四刻 (45-60分)",
  "五刻 (60-75分)",
  "六刻 (75-90分)",
  "七刻 (90-105分)",
  "八刻 (105-120分)"
];

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
  clauseNumber: number;    // The database clause_number to lookup
  timeLabel: string;       // e.g., "初刻 (0-15分)"
  debugBase?: number;      // For developer transparency
  content?: string;        // Populated from DB
}

export interface DestinyProjection {
  lifeDestiny: number;
  marriage: number;
  wealth: number;
  career: number;
  health: number;
  children: number;
}

export interface CalculationResult {
  baseNumber: number;
  pillars: GanZhiPillars;
  stemSum: number;
  branchSum: number;
  totalScore: number;
}

// ==========================================
// 3. THE ENGINE
// ==========================================

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
   * Core Function: Calculate the "Base Number" (Primal Frequency)
   * Logic: Sum(TaiXuan) -> Hexagram Seed -> Normalized Base
   * 
   * Uses authentic Tai Xuan numerology for deterministic calculation.
   * Same input always produces same output.
   */
  calculateBaseNumber: (input: TiebanInput): CalculationResult => {
    // 1. Convert to Lunar & Extract Pillars
    const solar = Solar.fromYmdHms(
      input.year, 
      input.month, 
      input.day, 
      input.hour, 
      input.minute, 
      0
    );
    const lunar = solar.getLunar();

    const pillars = TiebanEngine.extractPillars(input);
    const pillarStrings = [pillars.year, pillars.month, pillars.day, pillars.hour];

    // 2. Calculate "Heaven & Earth Sum" (天地数) via Tai Xuan
    let totalScore = 0;
    let stemSum = 0;
    let branchSum = 0;

    pillarStrings.forEach(pillar => {
      if (pillar.length >= 2) {
        const stem = pillar.charAt(0);
        const branch = pillar.charAt(1);

        const sVal = TAI_XUAN_MAP[stem] || 5;
        const bVal = TAI_XUAN_MAP[branch] || 5;

        stemSum += sVal;
        branchSum += bVal;
        totalScore += (sVal + bVal);
      }
    });

    // 3. Advanced Logic: Generate a "Hexagram Seed" (卦气)
    // Creates high entropy to ensure diversity in results
    // Formula: ((StemSum * BranchSum) + LunarDay + LunarMonth) * HarmonyFactor
    const harmonyFactor = (input.gender === 'male') ? 1.05 : 0.95; // Yang/Yin differentiation

    const rawSeed = ((stemSum * branchSum) + lunar.getDay() + lunar.getMonth()) * 100 * harmonyFactor;

    // 4. Return the integer Base Number
    return {
      baseNumber: Math.floor(rawSeed),
      pillars,
      stemSum,
      branchSum,
      totalScore,
    };
  },

  /**
   * The "Kao Ke" Generator
   * Generates 8 distinct verification clauses based on the 8 quarters of the hour.
   * 
   * CRITICAL: These clause_number values are used to lookup texts in the database.
   * The user must select which one matches their family situation.
   */
  generateKaoKeCandidates: (baseNumber: number): KaoKeCandidate[] => {
    const candidates: KaoKeCandidate[] = [];

    for (let i = 0; i < 8; i++) {
      // LOGIC: The "Quarter" acts as a fine-tuning variable.
      // Offset formula: (Base + (Quarter * 15)) % 200
      // Then map to the "Parents Section" (1001-1200)

      const quarterShift = i * 15;
      const uniqueSeed = Math.abs(baseNumber + quarterShift);

      // Map to a valid clause ID in the 1000s range (Verification Zone)
      // Uses a deterministic hash to pick a number between 1001 and 1200
      let clauseId = CATEGORY_OFFSETS.PARENTS_KAO_KE + (uniqueSeed % 200);

      // Safety check: ensure ID is within valid range
      clauseId = TiebanEngine.normalizeClauseId(clauseId);

      candidates.push({
        keIndex: i,
        quarterIndex: i,
        clauseNumber: clauseId,
        timeLabel: QUARTER_LABELS[i],
        debugBase: baseNumber,
      });
    }

    return candidates;
  },

  /**
   * The Final Projection
   * Triggered ONLY AFTER the user confirms which "Quarter" is correct.
   * 
   * @param lockedBase - The original base number from calculateBaseNumber
   * @param lockedQuarterIndex - The quarter (0-7) that user confirmed
   */
  calculateDestinyPaths: (lockedBase: number, lockedQuarterIndex: number): DestinyProjection => {
    // 1. Reconstruct the "Precise Coordinate"
    const quarterShift = lockedQuarterIndex * 15;
    const preciseSeed = Math.abs(lockedBase + quarterShift);

    // 2. Apply the "Magic Keys" to jump to different life aspects
    // This simulates the "Adding/Subtracting Secret Numbers" method

    return {
      lifeDestiny: TiebanEngine.normalizeClauseId(preciseSeed + CATEGORY_OFFSETS.GENERAL_LUCK),
      marriage: TiebanEngine.normalizeClauseId(preciseSeed + CATEGORY_OFFSETS.MARRIAGE),
      wealth: TiebanEngine.normalizeClauseId(preciseSeed + CATEGORY_OFFSETS.WEALTH),
      career: TiebanEngine.normalizeClauseId(preciseSeed + CATEGORY_OFFSETS.CAREER),
      health: TiebanEngine.normalizeClauseId(preciseSeed + CATEGORY_OFFSETS.HEALTH),
      children: TiebanEngine.normalizeClauseId(preciseSeed + CATEGORY_OFFSETS.CHILDREN),
    };
  },

  /**
   * Get a single primary destiny clause (for simple result display)
   */
  calculatePrimaryDestiny: (lockedBase: number, lockedQuarterIndex: number): number => {
    const quarterShift = lockedQuarterIndex * 15;
    const preciseSeed = Math.abs(lockedBase + quarterShift);
    return TiebanEngine.normalizeClauseId(preciseSeed + CATEGORY_OFFSETS.GENERAL_LUCK);
  },

  /**
   * Helper: Ensure the ID stays within the bounds of the clause database
   * Wraps around using modulo to prevent overflow
   */
  normalizeClauseId: (rawId: number): number => {
    // Wrap within valid range (1001-12000)
    const range = MAX_CLAUSE_ID - MIN_CLAUSE_ID;
    let validId = (rawId % range) + MIN_CLAUSE_ID;

    // Ensure minimum bound
    if (validId < MIN_CLAUSE_ID) {
      validId = MIN_CLAUSE_ID + (Math.abs(validId) % range);
    }

    return validId;
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
   * Get Stem index (0-9)
   */
  getStemIndex: (stem: string): number => {
    return STEM_ORDER.indexOf(stem);
  },

  /**
   * Get Branch index (0-11)
   */
  getBranchIndex: (branch: string): number => {
    return BRANCH_ORDER.indexOf(branch);
  },
};

export default TiebanEngine;
