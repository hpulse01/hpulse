/**
 * P4.10 — MayanResult → EngineOutput.
 */
import { normalizeConfidence01 } from '@/core/shared/confidence';
import type { EngineOutput, FateVector, ValidationFlags } from '../../types/prediction';
import type { MayanResult } from './types';
import { formatLongCount } from './longCount';
import { formatHaab } from './haab';

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(n)));

/** Tone 1..13 → archetypal energy weight. Higher tones intensify; 7 (resonant)
 *  is balanced. Fixed lookup → fully deterministic. */
const TONE_BASE: number[] = [55, 58, 60, 62, 65, 65, 70, 65, 65, 62, 60, 58, 70];

export function mayanToEngineOutput(result: MayanResult): EngineOutput {
  const trace: string[] = [];
  const base = TONE_BASE[result.tzolkin.tone - 1] ?? 60;
  trace.push(`base = ${base} (tone ${result.tzolkin.tone} ${result.tzolkin.sign})`);

  const dim = (label: string, v: number) => { const x = clamp(v); trace.push(`${label} = ${x}`); return x; };
  const fateVector: FateVector = {
    life:          dim('life',          base),
    wealth:        dim('wealth',        base),
    relation:      dim('relation',      base),
    health:        dim('health',        base),
    wisdom:        dim('wisdom',        base),
    spirit:        dim('spirit',        base + 5),
    socialStatus:  dim('socialStatus',  base),
    creativity:    dim('creativity',    base),
    luck:          dim('luck',          base),
    homeStability: dim('homeStability', base),
  };

  const validationFlags: ValidationFlags = {
    passed: [
      'deterministic_no_random',
      `tzolkin=${result.tzolkin.tone}_${result.tzolkin.sign}`,
      `long_count=${formatLongCount(result.longCount)}`,
      `haab=${formatHaab(result.haab)}`,
      `lord_of_night=${result.lordOfNight.name}`,
    ],
    failed: [],
    warnings: result.warnings.map((w) => `${w.code}: ${w.message}`),
  };

  return {
    engineName: 'mayan',
    engineNameCN: '玛雅历',
    engineVersion: 'P4.10-core',
    sourceUrls: ['GMT correlation (Goodman–Martínez–Thompson) JD 584283'],
    sourceGrade: result.sourceGrade,
    ruleSchool: 'Tzolkin (260-day) + Haab (365-day) + Calendar Round + Long Count (vigesimal except tun=18 uinal)',
    confidence: normalizeConfidence01(result.confidence),
    computationTimeMs: 0,
    rawInputSnapshot: { utcDateTime: result.input.utcDateTime },
    fateVector,
    normalizedOutput: {
      julianDay: String(result.julianDay),
      tzolkinTone: String(result.tzolkin.tone),
      tzolkinSign: result.tzolkin.sign,
      tzolkinPosition: String(result.tzolkin.position),
      longCount: formatLongCount(result.longCount),
      daysSinceEpoch: String(result.longCount.daysSinceEpoch),
      haab: formatHaab(result.haab),
      haabMonth: result.haab.month,
      haabDay: String(result.haab.day),
      haabDayOfYear: String(result.haab.dayOfYear),
      isWayeb: String(result.haab.isWayeb),
      lordOfNight: result.lordOfNight.name,
      calendarRound: result.calendarRound.designation,
      calendarRoundPosition: String(result.calendarRound.position),
      implementationStatus: result.implementationStatus,
    },
    warnings: result.warnings.map((w) => `${w.code}: ${w.message}`),
    uncertaintyNotes: [
      'GMT correlation (584283) used. Alternative correlations (e.g. Lounsbury 584285) shift the day by ±2.',
    ],
    timingBasis: 'birth',
    explanationTrace: [
      ...result.explanationTrace.map((s) => `[${s.rule}] ${s.detail}`),
      ...trace.map((t) => `[mayan.fateVector] ${t}`),
    ],
    completenessScore: result.completenessScore,
    validationFlags,
    timeWindows: [],
    aspectScores: {
      tzolkinTone: result.tzolkin.tone,
      tzolkinSignIndex: result.tzolkin.signIndex,
      tzolkinPosition: result.tzolkin.position,
      baktun: result.longCount.baktun,
      haabDayOfYear: result.haab.dayOfYear,
      lordOfNight: result.lordOfNight.number,
      calendarRoundPosition: result.calendarRound.position,
    },
    eventCandidates: [
      `Tzolkin: ${result.tzolkin.tone} ${result.tzolkin.sign} (${result.tzolkin.position}/260)`,
      `Long Count: ${formatLongCount(result.longCount)}`,
      `Haab: ${formatHaab(result.haab)}${result.haab.isWayeb ? ' (Wayeb)' : ''}`,
      `Calendar Round: ${result.calendarRound.designation}`,
      `Lord of the Night: ${result.lordOfNight.name}`,
    ],
  };
}
