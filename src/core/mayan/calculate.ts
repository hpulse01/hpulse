/**
 * P4.10 — Mayan chart calculation entry point.
 */
import { julianDayFromUtc } from '../astro-time/julianDay';
import { tzolkinFromJulianDay } from './tzolkin';
import { longCountFromJulianDay, formatLongCount } from './longCount';
import {
  haabFromDaysSinceEpoch,
  lordOfNightFromDaysSinceEpoch,
  calendarRoundFromDaysSinceEpoch,
  formatHaab,
} from './haab';
import type { MayanInput, MayanResult, MayanWarning, ExplanationStep } from './types';

export function calculateMayan(input: MayanInput): MayanResult {
  const warnings: MayanWarning[] = [];
  const trace: ExplanationStep[] = [];

  const utc = new Date(input.utcDateTime);
  if (Number.isNaN(utc.getTime())) {
    throw new Error(`mayan: invalid utcDateTime "${input.utcDateTime}"`);
  }
  const jd = julianDayFromUtc(utc);
  trace.push({ rule: 'mayan.time', detail: `JD = ${jd.toFixed(6)} (UTC ${utc.toISOString()})` });

  const tz = tzolkinFromJulianDay(jd);
  trace.push({
    rule: 'mayan.tzolkin',
    detail: `Tzolkin = ${tz.tone} ${tz.sign} (signIndex=${tz.signIndex}, position ${tz.position}/260)`,
  });

  const lc = longCountFromJulianDay(jd);
  trace.push({
    rule: 'mayan.longCount',
    detail: `Long Count = ${formatLongCount(lc)} (days since GMT epoch ${lc.daysSinceEpoch})`,
  });

  if (lc.daysSinceEpoch < 0) {
    warnings.push({
      code: 'pre_epoch',
      message: 'Date is before Mayan epoch (4 Ahau, JD 584283); Long Count components are negative.',
      level: 'warn',
    });
  }

  const haab = haabFromDaysSinceEpoch(lc.daysSinceEpoch);
  trace.push({
    rule: 'mayan.haab',
    detail: `Haab = ${formatHaab(haab)} (monthIndex=${haab.monthIndex}, dayOfYear=${haab.dayOfYear}${haab.isWayeb ? ', Wayeb' : ''})`,
  });
  if (haab.isWayeb) {
    warnings.push({
      code: 'wayeb_day',
      message: 'Date falls within the 5 Wayeb days, classically considered inauspicious.',
      level: 'info',
    });
  }

  const lordOfNight = lordOfNightFromDaysSinceEpoch(lc.daysSinceEpoch);
  trace.push({ rule: 'mayan.lordOfNight', detail: `Lord of the Night = ${lordOfNight.name}` });

  const calendarRound = calendarRoundFromDaysSinceEpoch(lc.daysSinceEpoch, tz, haab);
  trace.push({
    rule: 'mayan.calendarRound',
    detail: `Calendar Round = ${calendarRound.designation} (position ${calendarRound.position}/${calendarRound.cycleDays})`,
  });

  return {
    input,
    julianDay: jd,
    tzolkin: tz,
    longCount: lc,
    haab,
    lordOfNight,
    calendarRound,
    confidence: 85,
    completenessScore: 92,
    sourceGrade: 'B',
    implementationStatus: 'complete',
    warnings,
    explanationTrace: trace,
  };
}
