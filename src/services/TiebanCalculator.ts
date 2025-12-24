/**
 * Iron Plate Divine Number (铁板神数) Calculator Service
 * 
 * This is a modular service structure designed for the Tieban Shenshu system.
 * The mathematical formulas are lineage-specific and can be refined by injecting
 * proprietary constants into the calculation functions.
 * 
 * WORKFLOW: Verification (Kao Ke) -> Calculation -> Projection
 */

import { Solar, Lunar } from 'lunar-typescript';

// Types for the calculator
export interface BirthData {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  gender: 'male' | 'female';
}

export interface GanZhi {
  yearGan: string;
  yearZhi: string;
  monthGan: string;
  monthZhi: string;
  dayGan: string;
  dayZhi: string;
  hourGan: string;
  hourZhi: string;
}

export interface KaoKeOption {
  clauseNumber: number;
  content: string;
  timeOffset: number; // in minutes
}

export interface DestinyResult {
  clauseNumber: number;
  content: string;
  category?: string;
}

// Heavenly Stems (天干)
const TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];

// Earthly Branches (地支)
const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

// Zodiac mapping for Kao Ke verification
const ZODIAC_NAMES = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];

/**
 * Convert Solar (Gregorian) date to Lunar date
 * Uses the lunar-typescript library for accurate conversion
 */
export function convertSolarToLunar(date: Date): {
  year: number;
  month: number;
  day: number;
  isLeapMonth: boolean;
  ganZhi: GanZhi;
} {
  const solar = Solar.fromDate(date);
  const lunar = solar.getLunar();
  
  return {
    year: lunar.getYear(),
    month: lunar.getMonth(),
    day: lunar.getDay(),
    isLeapMonth: lunar.getMonth() < 0, // Negative month indicates leap month
    ganZhi: {
      yearGan: lunar.getYearGan(),
      yearZhi: lunar.getYearZhi(),
      monthGan: lunar.getMonthGan(),
      monthZhi: lunar.getMonthZhi(),
      dayGan: lunar.getDayGan(),
      dayZhi: lunar.getDayZhi(),
      hourGan: lunar.getTimeGan(),
      hourZhi: lunar.getTimeZhi(),
    },
  };
}

/**
 * Get the Chinese hour (时辰) from Western hour
 * Each Chinese hour is 2 Western hours
 */
export function getChineseHour(hour: number): { index: number; name: string } {
  // 子时 (23:00-01:00), 丑时 (01:00-03:00), etc.
  const hourIndex = Math.floor(((hour + 1) % 24) / 2);
  return {
    index: hourIndex,
    name: DI_ZHI[hourIndex] + '时',
  };
}

/**
 * Calculate the base number from GanZhi pillars
 * 
 * PLACEHOLDER: This function needs proprietary mathematical constants.
 * The structure follows the traditional calculation method but the
 * actual formula coefficients should be injected based on lineage.
 * 
 * @param ganZhi - The four pillars of destiny
 * @param birthData - Original birth data for additional calculations
 * @returns The initial numerical score
 */
export function calculateBaseNumber(ganZhi: GanZhi, birthData: BirthData): number {
  // Get numerical values for each element
  const yearGanValue = TIAN_GAN.indexOf(ganZhi.yearGan) + 1;
  const yearZhiValue = DI_ZHI.indexOf(ganZhi.yearZhi) + 1;
  const monthGanValue = TIAN_GAN.indexOf(ganZhi.monthGan) + 1;
  const monthZhiValue = DI_ZHI.indexOf(ganZhi.monthZhi) + 1;
  const dayGanValue = TIAN_GAN.indexOf(ganZhi.dayGan) + 1;
  const dayZhiValue = DI_ZHI.indexOf(ganZhi.dayZhi) + 1;
  const hourGanValue = TIAN_GAN.indexOf(ganZhi.hourGan) + 1;
  const hourZhiValue = DI_ZHI.indexOf(ganZhi.hourZhi) + 1;

  // Gender modifier
  const genderMod = birthData.gender === 'male' ? 1 : 2;

  /**
   * PROPRIETARY FORMULA PLACEHOLDER
   * 
   * The actual Tieban Shenshu formula involves complex calculations
   * including Najia (纳甲) relationships, Wu Xing (五行) interactions,
   * and lineage-specific key numbers.
   * 
   * Current implementation: Simplified demonstration formula
   * Replace with authentic formula when available.
   */
  const baseNumber = (
    (yearGanValue * 1000) +
    (yearZhiValue * 100) +
    (monthGanValue * 10) +
    (monthZhiValue * 1) +
    (dayGanValue * 100) +
    (dayZhiValue * 10) +
    (hourGanValue * 1) +
    (hourZhiValue * genderMod)
  ) % 12000 + 1001; // Ensure within clause range

  return baseNumber;
}

/**
 * Generate Kao Ke verification options
 * 
 * Returns past-fact clauses for user verification based on time offsets.
 * The user must select the option that matches their actual situation
 * to calibrate the exact birth time (刻分).
 * 
 * @param baseNumber - The calculated base number
 * @returns Array of KaoKe options with clause numbers
 */
export function getKaoKeOptions(baseNumber: number): number[] {
  /**
   * PROPRIETARY FORMULA PLACEHOLDER
   * 
   * In authentic Tieban Shenshu, Kao Ke clauses are derived from
   * specific calculation tables that map birth data to verification
   * questions about:
   * - Parent's zodiac signs
   * - Sibling count and positions
   * - Marriage status
   * - Past life events
   * 
   * Current implementation: Generate related clause numbers
   * for demonstration purposes.
   */
  
  const offsets = [-30, -15, 0, 15, 30]; // Time calibration offsets in minutes
  
  return offsets.map((offset, index) => {
    // Generate clause numbers based on offset
    // This should be replaced with authentic lookup tables
    const adjustedNumber = ((baseNumber + offset + index * 7) % 12000) + 1001;
    return adjustedNumber;
  });
}

/**
 * Project destiny result based on locked base number
 * 
 * After Kao Ke verification locks the correct time coordinate,
 * this function calculates the final destiny clause.
 * 
 * @param lockedBaseNumber - The verified base number
 * @param offset - Additional offset for specific life aspects
 * @returns The destiny clause number
 */
export function projectDestiny(lockedBaseNumber: number, offset: number = 0): number {
  /**
   * PROPRIETARY FORMULA PLACEHOLDER
   * 
   * The destiny projection involves:
   * - Year pillars interaction with current fate periods
   * - Major life events mapping
   * - Specific aspect calculations (wealth, marriage, career, etc.)
   * 
   * Current implementation: Simplified projection
   */
  
  const projectedNumber = ((lockedBaseNumber + offset) % 12000) + 1001;
  return projectedNumber;
}

/**
 * Find nearest valid clause number
 * 
 * If a calculated clause number doesn't exist in the database,
 * search for nearby valid numbers.
 * 
 * @param targetNumber - The calculated clause number
 * @param validNumbers - Set of valid clause numbers from database
 * @param searchRadius - How far to search (default: 10)
 * @returns The nearest valid clause number or null
 */
export function findNearestClause(
  targetNumber: number,
  validNumbers: Set<number>,
  searchRadius: number = 10
): number | null {
  // Check exact match first
  if (validNumbers.has(targetNumber)) {
    return targetNumber;
  }

  // Search in expanding radius
  for (let offset = 1; offset <= searchRadius; offset++) {
    if (validNumbers.has(targetNumber + offset)) {
      return targetNumber + offset;
    }
    if (validNumbers.has(targetNumber - offset)) {
      return targetNumber - offset;
    }
  }

  return null;
}

/**
 * Get zodiac sign from year
 */
export function getZodiac(year: number): string {
  const index = (year - 4) % 12;
  return ZODIAC_NAMES[index >= 0 ? index : index + 12];
}

/**
 * Format GanZhi for display
 */
export function formatGanZhi(ganZhi: GanZhi): string {
  return `${ganZhi.yearGan}${ganZhi.yearZhi}年 ${ganZhi.monthGan}${ganZhi.monthZhi}月 ${ganZhi.dayGan}${ganZhi.dayZhi}日 ${ganZhi.hourGan}${ganZhi.hourZhi}时`;
}
