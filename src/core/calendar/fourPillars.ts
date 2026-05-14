/**
 * 四柱 (Four Pillars) — year, month, day, hour ganzhi.
 *
 * Backed by lunar-typescript's exact-jieqi calculations:
 *   - 年柱 advances at 立春 (NOT lunar new year).
 *   - 月柱 advances at each 节 (节气月, not civil month).
 *   - 日柱 advances per the configured day-boundary policy.
 *   - 时柱 derives from day stem via 五鼠遁.
 *
 * Returns explanationTrace describing each step.
 */

import { lunarFromUtc } from './lunar';
import { hourPillarOf, shouldAdvanceDayAt23 } from './chineseHour';
import { parseGanzhi, type Pillar } from './ganzhi';
import { previousSolarTerm } from './solarTerms';
import type { ExplanationStep, NormalizedAstroTime } from '../astro-time/types';

export interface FourPillars {
  year: Pillar;
  month: Pillar;
  day: Pillar;
  hour: Pillar;
  explanationTrace: ExplanationStep[];
}

const BEIJING_OFFSET_MIN = 8 * 60;

/**
 * Compute four pillars from a fully-normalized astro time.
 *
 * `astro.utcDateTime` drives all calculations. Day-boundary policy controls
 * 子时 day rollover.
 */
export function fourPillarsFromAstro(astro: NormalizedAstroTime): FourPillars {
  const trace: ExplanationStep[] = [];
  const utc = new Date(astro.utcDateTime);

  // Beijing wall clock for lunar tables.
  const beijingMs = utc.getTime() + BEIJING_OFFSET_MIN * 60_000;
  const bj = new Date(beijingMs);

  // Day-boundary adjustment: if zi-shi-23, treat 23:00–23:59 as the next day's 子时.
  let effectiveUtc = utc;
  if (shouldAdvanceDayAt23(astro.dayBoundaryPolicy) && bj.getUTCHours() === 23) {
    effectiveUtc = new Date(utc.getTime() + 60 * 60_000);
    trace.push({
      rule: 'dayBoundary.zi-shi-23',
      detail: '23:00–23:59 视为次日子时，日柱前移一日。',
      data: { originalUtc: astro.utcDateTime, effectiveUtc: effectiveUtc.toISOString() },
    });
  }

  const lunar = lunarFromUtc(effectiveUtc);
  trace.push({
    rule: 'lunarFromUtc',
    detail: '使用 lunar-typescript exact-jieqi 表生成年/月/日柱（立春切年，节气切月）。',
    data: { ...lunar },
  });

  const year = parseGanzhi(lunar.yearGanzhi);
  const month = parseGanzhi(lunar.monthGanzhi);
  const day = parseGanzhi(lunar.dayGanzhi);

  // Hour pillar from day stem + civil hour at Beijing wall clock of the original (NOT advanced) time.
  const civilHour = bj.getUTCHours();
  const hour = hourPillarOf(day.stem, civilHour);
  trace.push({
    rule: 'hourPillar.五鼠遁',
    detail: '由日干 + 时辰地支推时柱（五鼠遁）。',
    data: { dayStem: day.stem, civilHour, hour: hour.ganzhi },
  });

  // Append upstream solar-term context for transparency.
  try {
    const prevTerm = previousSolarTerm(utc);
    trace.push({
      rule: 'solarTerm.previous',
      detail: `最近节气：${prevTerm.name} @ ${prevTerm.utc.toISOString()}`,
      data: { name: prevTerm.name, utc: prevTerm.utc.toISOString() },
    });
  } catch (e) {
    trace.push({
      rule: 'solarTerm.lookupFailed',
      detail: '节气查询失败（不影响柱位结果）。',
      data: { error: (e as Error).message },
    });
  }

  return { year, month, day, hour, explanationTrace: trace };
}
