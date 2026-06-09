/**
 * Haab (365-day vague solar calendar), Lord of the Night (G1..G9),
 * and Calendar Round position.
 *
 * Calibration anchors (GMT correlation, JD 584283 = Long Count 0.0.0.0.0):
 *   - Haab at epoch = 8 Cumku  → day-of-haab-year = 17*20 + 8 = 348
 *   - Lord of the Night at epoch = G9
 *   - 2012-12-21 (13.0.0.0.0, daysSinceEpoch 1,872,000) = 4 Ahau 3 Kankin, G9
 */
import type { HaabDay, LordOfNight, CalendarRound, TzolkinDay } from './types';

export const HAAB_MONTHS = [
  'Pop', 'Uo', 'Zip', 'Zotz', 'Tzec', 'Xul', 'Yaxkin', 'Mol', 'Chen',
  'Yax', 'Zac', 'Ceh', 'Mac', 'Kankin', 'Muan', 'Pax', 'Kayab', 'Cumku',
  'Wayeb',
] as const;

/** Day-of-haab-year (0..364) at the Long Count epoch (8 Cumku). */
const EPOCH_HAAB_DAY_OF_YEAR = 17 * 20 + 8; // 348

/** Lord of the Night index (0-based, G9 = 8) at the Long Count epoch. */
const EPOCH_LORD_OF_NIGHT_INDEX = 8;

/** Calendar Round length: lcm(260, 365) = 18,980 days (~52 years). */
export const CALENDAR_ROUND_DAYS = 18980;

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

export function haabFromDaysSinceEpoch(daysSinceEpoch: number): HaabDay {
  const dayOfYear = mod(EPOCH_HAAB_DAY_OF_YEAR + daysSinceEpoch, 365);
  const monthIndex = Math.floor(dayOfYear / 20); // 0..18 (18 = Wayeb, 5 days)
  const day = dayOfYear - monthIndex * 20;       // 0..19 (0..4 in Wayeb)
  return {
    day,
    month: HAAB_MONTHS[monthIndex],
    monthIndex,
    dayOfYear,
    isWayeb: monthIndex === 18,
  };
}

export function lordOfNightFromDaysSinceEpoch(daysSinceEpoch: number): LordOfNight {
  const index = mod(daysSinceEpoch + EPOCH_LORD_OF_NIGHT_INDEX, 9);
  return { number: index + 1, name: `G${index + 1}` };
}

export function calendarRoundFromDaysSinceEpoch(
  daysSinceEpoch: number,
  tzolkin: TzolkinDay,
  haab: HaabDay,
): CalendarRound {
  const position = mod(daysSinceEpoch, CALENDAR_ROUND_DAYS) + 1;
  return {
    position,
    cycleDays: CALENDAR_ROUND_DAYS,
    designation: `${tzolkin.tone} ${tzolkin.sign} ${haab.day} ${haab.month}`,
  };
}

export function formatHaab(h: HaabDay): string {
  return `${h.day} ${h.month}`;
}
