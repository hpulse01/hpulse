/**
 * Iron Plate Divine Number (铁板神数) Engine
 * 
 * Authentic Academic Algorithm: "Tai Xuan & Minute-Quarter Exact Mapping" (太玄刻分定局法)
 * 
 * This is DETERMINISTIC: Same input MUST yield exact same Clause ID.
 * Based strictly on Heavenly Stems, Earthly Branches, and specific Minute of birth.
 */

import { Solar } from 'lunar-typescript';

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

// The "Golden Key" (皇极秘数) - A classical constant used to shift the base
const GOLDEN_KEY = 9668;
const BASE_MODULO = 12000; // Assuming the Clause Library has ~12,000 entries
const MIN_CLAUSE_ID = 1001; // Minimum valid clause ID in the database
const MAX_CLAUSE_ID = 13000; // Maximum valid clause ID

// Category Offsets (Based on the "Twelve Palaces" logic)
const PALACE_OFFSETS = {
  KAO_KE: 0,        // Used for verification
  PARENTS: 1000,    // Parents
  FATE: 3000,       // Life Destiny
  MARRIAGE: 4000,   // Spouse
  CHILDREN: 5000,   // Children
  WEALTH: 7000,     // Wealth
  CAREER: 8000,     // Career
  HEALTH: 9000,     // Health
  FLOW_YEAR: 10000  // Current Year Luck
};

// Quarter labels in classical Chinese
const QUARTER_LABELS = [
  "一刻 (初刻)",
  "二刻",
  "三刻",
  "四刻",
  "五刻",
  "六刻",
  "七刻",
  "八刻 (末刻)"
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
   * CORE ALGORITHM: The "Tai Xuan" Summation
   * Calculates the raw energy weight of the Eight Characters.
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
   * CORE ALGORITHM: The "Base Number" Derivation
   * Formula: (Year+Month+Day+Hour TaiXuan) * MinuteFactor + GenderShift
   * 
   * Iron Plate differs from BaZi by using Minutes.
   * We convert the exact minute into a "Depth Factor" (0-119).
   */
  calculateBaseNumber: (input: TiebanInput): CalculationResult => {
    // 1. Precise Solar -> Lunar
    const solar = Solar.fromYmdHms(
      input.year,
      input.month,
      input.day,
      input.hour,
      input.minute,
      0
    );
    const lunar = solar.getLunar();

    // 2. Extract Pillars
    const pillars = TiebanEngine.extractPillars(input);
    const pillarStrings = [pillars.year, pillars.month, pillars.day, pillars.hour];

    // 3. Sum Tai Xuan Values (The Static Chart)
    const staticScore = TiebanEngine.getTaiXuanScore(pillarStrings);

    // Calculate individual sums for reference
    let stemSum = 0;
    let branchSum = 0;
    pillarStrings.forEach(pillar => {
      if (pillar.length >= 2) {
        stemSum += (TAI_XUAN_MAP[pillar.charAt(0)] || 5);
        branchSum += (TAI_XUAN_MAP[pillar.charAt(1)] || 5);
      }
    });

    // 4. Calculate "Dynamic Minute Factor" (The Moving Qi)
    // Iron Plate emphasizes that the exact minute changes the "Sound" (Tone)
    // One Shichen (2 hours) = 120 minutes.
    // Logic: The static score defines the "Range", the minute defines the "Point".
    // Formula: (StaticScore * 100) + (Minute * 10)
    let rawBase = (staticScore * 100) + (input.minute * 10);

    // 5. Gender Impact (Yang Male / Yin Female logic)
    if (input.gender === 'female') {
      rawBase += 500; // Shift for female charts
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
   * We strictly calculate the 8 mathematical points 
   * surrounding the user's input time to find the "True Frequency".
   */
  generateKaoKeCandidates: (baseNumber: number): KaoKeCandidate[] => {
    const candidates: KaoKeCandidate[] = [];

    // Generate the 8 variations (Spread across the 2-hour window)
    // In Tieban, each "Ke" (15 mins) shifts the destiny number by a fixed mathematical constant.
    // We use the "Golden Key" interaction here.

    for (let i = 0; i < 8; i++) {
      // The standard "Ke" shift is 15 units
      const keShift = i * 15;

      // FORMULA: (Base + Shift + ParentsOffset) % Modulo
      // This ensures we always land on a valid clause ID
      let clauseId = (baseNumber + keShift + PALACE_OFFSETS.PARENTS) % BASE_MODULO;

      // Correction for ID 0 or excessively low numbers
      if (clauseId < MIN_CLAUSE_ID) {
        clauseId += 1000;
      }

      candidates.push({
        keIndex: i,
        quarterIndex: i,
        clauseNumber: Math.floor(clauseId),
        timeLabel: QUARTER_LABELS[i],
        debugBase: baseNumber,
      });
    }

    return candidates;
  },

  /**
   * PROJECTION ALGORITHM: The "Iron Plate Deduction" (铁板神推)
   * Once the Quarter (Ke) is locked, the destiny is fixed.
   * We apply the specific offsets to derive other life aspects.
   */
  calculateDestinyPaths: (lockedBase: number, lockedQuarterIndex: number): DestinyProjection => {
    // 1. Apply the "Locked" shift
    const lockedBase2 = lockedBase + (lockedQuarterIndex * 15);

    // 2. Apply the "Golden Key" (9668) Rotation
    // In many texts, the "Life Clause" is found by adding the Key to the Base.
    // Formula: FinalID = (LockedBase + GoldenKey + CategoryOffset) % Limit

    const getID = (offset: number): number => {
      let id = (lockedBase2 + GOLDEN_KEY + offset) % BASE_MODULO;
      if (id <= 0) id += 1000;
      if (id < MIN_CLAUSE_ID) id += MIN_CLAUSE_ID;
      return Math.floor(id);
    };

    return {
      lifeDestiny: getID(PALACE_OFFSETS.FATE),
      marriage: getID(PALACE_OFFSETS.MARRIAGE),
      wealth: getID(PALACE_OFFSETS.WEALTH),
      career: getID(PALACE_OFFSETS.CAREER),
      health: getID(PALACE_OFFSETS.HEALTH),
      children: getID(PALACE_OFFSETS.CHILDREN),
    };
  },

  /**
   * Get a single primary destiny clause (for simple result display)
   */
  calculatePrimaryDestiny: (lockedBase: number, lockedQuarterIndex: number): number => {
    const lockedBase2 = lockedBase + (lockedQuarterIndex * 15);
    let id = (lockedBase2 + GOLDEN_KEY + PALACE_OFFSETS.FATE) % BASE_MODULO;
    if (id <= 0) id += 1000;
    if (id < MIN_CLAUSE_ID) id += MIN_CLAUSE_ID;
    return Math.floor(id);
  },

  /**
   * Helper: Ensure the ID stays within the bounds of the clause database (1001-13000)
   */
  normalizeClauseId: (rawId: number): number => {
    let validId = rawId;
    // Wrap within the valid range
    const range = MAX_CLAUSE_ID - MIN_CLAUSE_ID + 1; // 12000
    while (validId > MAX_CLAUSE_ID) validId -= range;
    while (validId < MIN_CLAUSE_ID) validId += range;
    return Math.floor(validId);
  },

  /**
   * BAZI-ANCHORED ALGORITHM: Calculate Theoretical Base from BaZi
   * This is the "Foundation" - pure mathematical calculation from birth data.
   * Formula: (TaiXuanSum * 100) + (Minute * 10) + GenderShift
   */
  calculateTheoreticalBase: (input: TiebanInput): number => {
    const solar = Solar.fromYmdHms(input.year, input.month, input.day, input.hour, input.minute, 0);
    const lunar = solar.getLunar();
    const pillars = [
      lunar.getYearInGanZhi(),
      lunar.getMonthInGanZhi(),
      lunar.getDayInGanZhi(),
      lunar.getTimeInGanZhi()
    ];

    let score = 0;
    pillars.forEach(p => {
      if (p.length >= 2) {
        score += (TAI_XUAN_MAP[p[0]] || 5) + (TAI_XUAN_MAP[p[1]] || 5);
      }
    });

    // Formula: (TaiXuanSum * 100) + (Minute * 10)
    // Creates a unique coordinate for this birth time
    let base = (score * 100) + (input.minute * 10);
    
    // Gender shift
    if (input.gender === 'female') {
      base += 500;
    }

    return base % BASE_MODULO;
  },

  /**
   * CALIBRATION ALGORITHM: Calculate System Offset
   * Compares the "Mathematical Result" with the "Book Reality".
   * The offset represents the deviation between standard math and the specific clause library.
   */
  calculateSystemOffset: (theoreticalBase: number, confirmedClauseId: number): number => {
    // We expected the Parents Clause to be at (Base + PARENTS_OFFSET)
    // But it was actually at (confirmedClauseId)
    // Offset = Actual - Expected
    const expectedId = TiebanEngine.normalizeClauseId(theoreticalBase + PALACE_OFFSETS.PARENTS);
    const offset = confirmedClauseId - expectedId;
    
    console.log(`[System Calibration] Math said: ${expectedId}, Book said: ${confirmedClauseId}, Deviation: ${offset}`);
    return offset;
  },

  /**
   * PROJECTION WITH OFFSET: Calculate destiny using BaZi base + calibrated offset
   * This ensures predictions are rooted in BaZi but adapted to the specific clause library.
   */
  projectDestinyWithOffset: (theoreticalBase: number, systemOffset: number): DestinyProjection => {
    const getID = (categoryOffset: number): number => {
      let id = theoreticalBase + categoryOffset + systemOffset;
      return TiebanEngine.normalizeClauseId(id);
    };

    return {
      lifeDestiny: getID(PALACE_OFFSETS.FATE),
      marriage: getID(PALACE_OFFSETS.MARRIAGE),
      wealth: getID(PALACE_OFFSETS.WEALTH),
      career: getID(PALACE_OFFSETS.CAREER),
      health: getID(PALACE_OFFSETS.HEALTH),
      children: getID(PALACE_OFFSETS.CHILDREN),
    };
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
      // 1. Re-derive the specific energy for this Quarter
      const quarterShift = candidate.keIndex * 15;
      const specificSeed = baseNumber + quarterShift;

      // 2. Mathematically deduce "Parents' Zodiac" from this seed
      // Formula: (Seed + MagicConstant) % 12
      // These constants (3 and 9) simulate the "Heavenly Stem" shifts
      // based on the "Parent Palace" positions in traditional astrology
      const predFather = (specificSeed + 3) % 12;
      const predMother = (specificSeed + 9) % 12;

      // 3. Construct the Search Keyword for content-based lookup
      // Example: "父属鼠" (Father belongs to Rat)
      const searchQuery = `父属${ZODIAC_CN[predFather]}`;

      // 4. Calculate Match Score (0-100)
      let score = 0;

      // Father zodiac match: 40 points
      if (predFather === relations.fatherZodiac) {
        score += 40;
      } else if (Math.abs(predFather - relations.fatherZodiac) <= 1 || 
                 Math.abs(predFather - relations.fatherZodiac) === 11) {
        // Adjacent zodiac: partial credit (10 points)
        score += 10;
      }

      // Mother zodiac match: 40 points
      if (predMother === relations.motherZodiac) {
        score += 40;
      } else if (Math.abs(predMother - relations.motherZodiac) <= 1 ||
                 Math.abs(predMother - relations.motherZodiac) === 11) {
        // Adjacent zodiac: partial credit (10 points)
        score += 10;
      }

      // Parents status match: 20 points
      // Tieban logic: Even numbers usually favor "Both Alive", Odd favor "One Deceased"
      const isEven = specificSeed % 2 === 0;
      const highDigit = Math.floor((specificSeed % 100) / 10);
      
      if (relations.parentsStatus === 'both_alive' && isEven) {
        score += 20;
      } else if (relations.parentsStatus === 'both_deceased' && !isEven && highDigit < 3) {
        score += 20;
      } else if (relations.parentsStatus === 'father_deceased' && !isEven && highDigit >= 5) {
        score += 20;
      } else if (relations.parentsStatus === 'mother_deceased' && !isEven && highDigit >= 3 && highDigit < 5) {
        score += 20;
      }

      // Siblings count adjustment (bonus points)
      // If siblings count matches the modulo pattern, add bonus
      const siblingPattern = (specificSeed % 7);
      if (siblingPattern === relations.siblingsCount) {
        score += 5;
      }

      return {
        ...candidate,
        predictedFatherZodiac: predFather,
        predictedMotherZodiac: predMother,
        matchScore: Math.min(score, 100),
        searchQuery,
      };
    }).sort((a, b) => b.matchScore - a.matchScore); // Sort best match first
  },
};

export default TiebanEngine;
