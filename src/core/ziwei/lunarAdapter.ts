/**
 * P4.4 — Lunar adapter for Ziwei.
 *
 * Wraps `lunar-typescript` to extract the lunar context Ziwei needs from a
 * deterministic `ZiweiCoreInput`. No system clock, no randomness.
 */

import { Solar } from 'lunar-typescript';
import type { ExplanationStep, AstroWarning } from '../astro-time/types';
import type { ZiweiCoreInput, Branch, Stem } from './types';
import { HOUR_BRANCHES, HEAVENLY_STEMS } from './constants';

export interface ZiweiLunarContext {
  solarDate: { year: number; month: number; day: number };
  lunarDate: { year: number; month: number; day: number; isLeapMonth: boolean };
  lunarYear: number;
  lunarMonth: number; // 1..12 (always positive; leap noted separately)
  lunarDay: number;
  isLeapMonth: boolean;
  yearGan: Stem;
  yearZhi: Branch;
  yearGanZhi: string;
  monthGanZhi: string;
  dayGanZhi: string;
  hourBranch: Branch;
  hourBranchIndex: number;
  warnings: AstroWarning[];
  explanationTrace: ExplanationStep[];
}

function getHourBranchIndex(hour: number, _minute: number): number {
  // Classical 12-时辰: 23-1 子, 1-3 丑, ... Each shichen is 2 hours, 子时跨日.
  // Index: 0=子, 1=丑, ..., 11=亥
  return Math.floor(((hour + 1) % 24) / 2);
}

export function calculateZiweiLunarContext(input: ZiweiCoreInput): ZiweiLunarContext {
  const { year, month, day, hour, minute } = input.birthLocalDateTime;
  const trace: ExplanationStep[] = [];
  const warnings: AstroWarning[] = [];

  const solar = Solar.fromYmdHms(year, month, day, hour, minute, 0);
  const lunar = solar.getLunar();
  const lunarMonthRaw = lunar.getMonth();
  const lunarMonth = Math.abs(lunarMonthRaw);
  const lunarDay = lunar.getDay();
  const isLeapMonth = lunarMonthRaw < 0;

  trace.push({
    rule: 'ziwei.lunar.solar2lunar',
    detail: `公历 ${year}-${month}-${day} ${hour}:${minute} → 农历 ${lunar.getYear()}年${isLeapMonth ? '闰' : ''}${lunarMonth}月${lunarDay}日`,
    data: { lunarYear: lunar.getYear(), lunarMonth, lunarDay, isLeapMonth },
  });

  const hourBranchIndex = getHourBranchIndex(hour, minute);
  const hourBranch = HOUR_BRANCHES[hourBranchIndex];
  trace.push({
    rule: 'ziwei.lunar.hourBranch',
    detail: `时辰 ${hour}:${minute} → 时支 ${hourBranch} (index=${hourBranchIndex})`,
    data: { hour, minute, hourBranch, hourBranchIndex },
  });

  const policy = input.dayBoundaryPolicy ?? 'zi_hour';
  if (policy === 'midnight') {
    warnings.push({
      code: 'ZIWEI_DAY_BOUNDARY_MIDNIGHT_NOT_IMPLEMENTED',
      message: '本核心暂未实现 midnight 子时分割，使用经典 zi_hour（23 时换日）。',
      severity: 'warning',
    });
  }

  const yearGanRaw = lunar.getYearGan() as Stem;
  const yearZhiRaw = lunar.getYearZhi() as Branch;

  if (!HEAVENLY_STEMS.includes(yearGanRaw)) {
    warnings.push({
      code: 'ZIWEI_INVALID_YEAR_STEM',
      message: `lunar-typescript 返回了非法年干 ${yearGanRaw}`,
      severity: 'error',
    });
  }

  return {
    solarDate: { year, month, day },
    lunarDate: { year: lunar.getYear(), month: lunarMonth, day: lunarDay, isLeapMonth },
    lunarYear: lunar.getYear(),
    lunarMonth,
    lunarDay,
    isLeapMonth,
    yearGan: yearGanRaw,
    yearZhi: yearZhiRaw,
    yearGanZhi: lunar.getYearInGanZhi(),
    monthGanZhi: lunar.getMonthInGanZhi(),
    dayGanZhi: lunar.getDayInGanZhi(),
    hourBranch,
    hourBranchIndex,
    warnings,
    explanationTrace: trace,
  };
}
