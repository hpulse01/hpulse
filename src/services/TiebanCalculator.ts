/**
 * Iron Plate Divine Number (铁板神数) Calculator Service
 * 
 * Core algorithm implementing the Tieban Shenshu calculation system.
 * WORKFLOW: Input -> Base Number -> Kao Ke Verification -> Final Destiny
 */

import { Solar } from 'lunar-typescript';

// --- CONSTANTS (The "Keys" of Iron Plate) ---
// Magic constants based on lineage-specific formulas
const HEAVENLY_STEMS_MAP: Record<string, number> = {
  '甲': 6, '乙': 2, '丙': 8, '丁': 7, '戊': 1,
  '己': 9, '庚': 3, '辛': 4, '壬': 6, '癸': 2
};

const EARTHLY_BRANCHES_MAP: Record<string, number> = {
  '子': 1, '丑': 10, '寅': 3, '卯': 4, '辰': 5, '巳': 6,
  '午': 7, '未': 8, '申': 9, '酉': 10, '戌': 11, '亥': 12
};

// Offset for the 8 Quarters (刻分) in a 2-hour period
// Each quarter shifts the base number slightly to find the "Parents/Family" clause
const QUARTER_OFFSETS = [0, 15, 30, 45, 60, 75, 90, 105];

// Quarter labels in classical Chinese
const QUARTER_LABELS = [
  '初刻', '一刻', '二刻', '三刻', '四刻', '五刻', '六刻', '七刻'
];

// The "Verification Base" - clauses 1000-3000 are used for Kao Ke verification
const VERIFICATION_SECTION_START = 1000;

// Types
export interface TiebanInput {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  gender: 'male' | 'female';
}

export interface KaoKeCandidate {
  quarterIndex: number;    // 0-7, representing the 8 quarters of a Shichen
  clauseNumber: number;    // The ID to look up in DB
  timeLabel: string;       // e.g., "初刻 (0-15分)"
  content?: string;        // Populated after DB lookup
}

export interface GanZhiPillars {
  year: string;
  month: string;
  day: string;
  hour: string;
}

export interface DestinyResult {
  lifeDestiny: number;
  marriage: number;
  wealth: number;
  career: number;
  health: number;
}

export const TiebanService = {
  /**
   * Get the Four Pillars (四柱) from birth data
   */
  getGanZhiPillars: (input: TiebanInput): GanZhiPillars => {
    const solar = Solar.fromYmdHms(
      input.year, 
      input.month, 
      input.day, 
      input.hour, 
      input.minute, 
      0
    );
    const lunar = solar.getLunar();

    return {
      year: lunar.getYearInGanZhi(),
      month: lunar.getMonthInGanZhi(),
      day: lunar.getDayInGanZhi(),
      hour: lunar.getTimeInGanZhi(),
    };
  },

  /**
   * Format Four Pillars for display
   */
  formatPillars: (pillars: GanZhiPillars): string => {
    return `${pillars.year}年 ${pillars.month}月 ${pillars.day}日 ${pillars.hour}时`;
  },

  /**
   * Step 1: Calculate the "Base Number" from Birth Data
   * Uses Lunar conversion and Stem/Branch summation (Tai Xuan Shu method)
   */
  calculateBaseNumber: (input: TiebanInput): number => {
    const solar = Solar.fromYmdHms(
      input.year, 
      input.month, 
      input.day, 
      input.hour, 
      input.minute, 
      0
    );
    const lunar = solar.getLunar();

    const pillars = [
      lunar.getYearInGanZhi(),
      lunar.getMonthInGanZhi(),
      lunar.getDayInGanZhi(),
      lunar.getTimeInGanZhi()
    ];

    let totalScore = 0;

    // Summation Logic based on Stem/Branch values
    pillars.forEach(pillar => {
      const stem = pillar.charAt(0);
      const branch = pillar.charAt(1);
      const stemVal = HEAVENLY_STEMS_MAP[stem] || 0;
      const branchVal = EARTHLY_BRANCHES_MAP[branch] || 0;
      totalScore += (stemVal + branchVal);
    });

    // Gender modifier (乾坤 adjustment)
    const genderMod = input.gender === 'male' ? 1 : 2;

    // The result formula: (Sum * 50) + Month + Day + Gender modifier
    // This produces a base number that maps to clause sections
    const baseNumber = (totalScore * 50) + input.month + input.day + genderMod;

    return baseNumber;
  },

  /**
   * Step 2: Generate "Kao Ke" Options (Verification)
   * Creates 8 possibilities based on the 8 quarters (刻) of the hour.
   * The user selects which one matches their family situation.
   */
  generateKaoKeOptions: (baseNumber: number): KaoKeCandidate[] => {
    const candidates: KaoKeCandidate[] = [];

    for (let i = 0; i < 8; i++) {
      // FORMULA: Verification Start + (Base % 100) + Quarter Offset
      // This maps the time to a specific clause about parents/siblings
      let clauseNum = VERIFICATION_SECTION_START + (baseNumber % 100) + QUARTER_OFFSETS[i];

      // Wrap around if exceeding typical clause range (keep within 1000-13000)
      if (clauseNum > 13000) {
        clauseNum = 1000 + (clauseNum % 1000);
      }

      candidates.push({
        quarterIndex: i,
        clauseNumber: clauseNum,
        timeLabel: `${QUARTER_LABELS[i]} (${i * 15}-${(i + 1) * 15}分)`,
      });
    }

    return candidates;
  },

  /**
   * Step 3: Calculate Final Destiny (after Kao Ke verification)
   * Executed ONLY after user locks a specific quarter.
   * Returns clause numbers for different life aspects.
   */
  calculateFinalDestiny: (baseNumber: number, lockedQuarterIndex: number): DestinyResult => {
    // preciseBase is the calibrated coordinate after verification
    const preciseBase = baseNumber + QUARTER_OFFSETS[lockedQuarterIndex];

    // These multipliers and offsets shift the pointer to different life aspects
    // Each aspect uses a different section of the clause database
    return {
      lifeDestiny: (preciseBase * 12) % 12000 + 1000,
      marriage: (preciseBase * 12 + 4000) % 12000 + 1000,
      wealth: (preciseBase * 12 + 8000) % 12000 + 1000,
      career: (preciseBase * 12 + 2000) % 12000 + 1000,
      health: (preciseBase * 12 + 6000) % 12000 + 1000,
    };
  },

  /**
   * Get a single projected clause (for simple result display)
   */
  projectSingleDestiny: (baseNumber: number, lockedQuarterIndex: number): number => {
    const preciseBase = baseNumber + QUARTER_OFFSETS[lockedQuarterIndex];
    return (preciseBase * 12) % 12000 + 1000;
  },

  /**
   * Get the Chinese zodiac from birth year
   */
  getZodiac: (year: number): string => {
    const zodiacNames = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];
    const index = (year - 4) % 12;
    return zodiacNames[index >= 0 ? index : index + 12];
  },

  /**
   * Get the Chinese hour name (时辰)
   */
  getChineseHour: (hour: number): string => {
    const hourNames = [
      '子时', '丑时', '寅时', '卯时', '辰时', '巳时',
      '午时', '未时', '申时', '酉时', '戌时', '亥时'
    ];
    const index = Math.floor(((hour + 1) % 24) / 2);
    return hourNames[index];
  },
};

// Export types for use in components
export type { TiebanInput as BirthData };
