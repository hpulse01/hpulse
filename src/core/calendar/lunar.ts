/**
 * Lunar date conversion wrapper.
 *
 * Wraps lunar-typescript so callers pass a UTC instant + offset and get back
 * a normalized lunar record. All date math goes through Beijing-time conversion
 * because lunar-typescript's tables are anchored there.
 */

import { Solar } from 'lunar-typescript';

const BEIJING_OFFSET_MIN = 8 * 60;

export interface LunarDate {
  lunarYear: number;
  lunarMonth: number;     // 1..12, negative for leap month convention not used
  lunarDay: number;
  isLeapMonth: boolean;
  zodiac: string;         // 鼠/牛/...
  yearGanzhi: string;     // by 立春 boundary
  monthGanzhi: string;    // by 节 boundary
  dayGanzhi: string;
  hourGanzhi: string;
}

function utcToBeijingComponents(utc: Date) {
  const ms = utc.getTime() + BEIJING_OFFSET_MIN * 60_000;
  const d = new Date(ms);
  return {
    y: d.getUTCFullYear(),
    m: d.getUTCMonth() + 1,
    d: d.getUTCDate(),
    h: d.getUTCHours(),
    mi: d.getUTCMinutes(),
    s: d.getUTCSeconds(),
  };
}

/**
 * Convert a UTC instant to its lunar / ganzhi representation in Beijing time.
 * For non-Chinese localities, downstream code should already account for the
 * fact that solar terms are astronomical events (universal) — Beijing wall
 * clock is just a consistent reference frame.
 */
export function lunarFromUtc(utc: Date): LunarDate {
  const c = utcToBeijingComponents(utc);
  const solar = Solar.fromYmdHms(c.y, c.m, c.d, c.h, c.mi, c.s);
  const lunar = solar.getLunar();
  return {
    lunarYear: lunar.getYear(),
    lunarMonth: lunar.getMonth(),
    lunarDay: lunar.getDay(),
    isLeapMonth: lunar.getMonth() < 0,
    zodiac: lunar.getYearShengXiao(),
    yearGanzhi: lunar.getYearInGanZhiExact(),
    monthGanzhi: lunar.getMonthInGanZhiExact(),
    dayGanzhi: lunar.getDayInGanZhiExact(),
    hourGanzhi: lunar.getTimeInGanZhi(),
  };
}
