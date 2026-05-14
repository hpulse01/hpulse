/**
 * P4.10 — Mayan chart calculation entry point.
 */
import { julianDayFromUtc } from '../astro-time/julianDay';
import { tzolkinFromJulianDay } from './tzolkin';
import { longCountFromJulianDay, formatLongCount } from './longCount';
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

  // Haab (vague solar 365-day calendar), Lord of the Night (G1..G9), and
  // Calendar Round are intentionally NOT yet implemented.
  warnings.push({
    code: 'haab_not_implemented',
    message: 'Haab calendar and Calendar Round are not yet computed in this version.',
    level: 'info',
  });

  return {
    input,
    julianDay: jd,
    tzolkin: tz,
    longCount: lc,
    confidence: 75,
    completenessScore: 70,
    sourceGrade: 'B',
    implementationStatus: 'partial',
    warnings,
    explanationTrace: trace,
  };
}
