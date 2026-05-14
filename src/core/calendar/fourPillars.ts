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

  // Day-boundary adjustment: if zi-shi-23 policy AND the LOCAL hour at the
  // birth location is 23, treat 23:00–23:59 as the next day's 子时.
  // (We use Beijing wall-clock for the lunar/day tables, but the day-rollover
  //  decision must be made by the local clock at the birthplace.)
  const localHour = astro.localDateTime.hour;
  let effectiveUtc = utc;
  if (shouldAdvanceDayAt23(astro.dayBoundaryPolicy) && localHour === 23) {
    effectiveUtc = new Date(utc.getTime() + 60 * 60_000);
    trace.push({
      rule: 'dayBoundary.zi-shi-23',
      detail: '23:00–23:59 视为次日子时，日柱前移一日（按出生地本地时刻判断）。',
      data: { originalUtc: astro.utcDateTime, effectiveUtc: effectiveUtc.toISOString(), localHour },
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

  // Hour pillar: use LOCAL CIVIL HOUR at birthplace (matches lunar-typescript /
  // Tieban convention). True solar time correction is NOT applied to the hour
  // pillar by default — most schools and reference implementations use the
  // local clock hour. Fall back to Beijing civil hour only if local missing.
  let hourSource: 'localCivil' | 'beijingCivil' = 'beijingCivil';
  let hourForPillar: number = bj.getUTCHours();
  if (Number.isFinite(localHour)) {
    hourForPillar = localHour;
    hourSource = 'localCivil';
  }
  const hour = hourPillarOf(day.stem, hourForPillar);
  trace.push({
    rule: 'hourPillar.五鼠遁',
    detail: '由日干 + 时辰地支推时柱（五鼠遁），时辰按出生地民用时（local civil hour）取，与铁板/lunar-typescript 一致。',
    data: { dayStem: day.stem, hourForPillar, hourSource, hour: hour.ganzhi },
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
