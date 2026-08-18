/**
 * P4.10 — NumerologyResult → EngineOutput.
 */
import { normalizeConfidence01 } from '@/core/shared/confidence';
import type { EngineOutput, FateVector, ValidationFlags } from '../../types/prediction';
import type { NumerologyResult } from './types';

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(n)));

/** Map a single-digit number (1..9) or master number to a 0..100 base score.
 *  Higher digits aren't "better" — this is a fixed lookup so output stays deterministic
 *  and reproducible across runs. */
const NUMBER_BASE: Record<number, number> = {
  1: 60, 2: 55, 3: 65, 4: 50, 5: 70, 6: 65, 7: 55, 8: 75, 9: 60,
  11: 78, 22: 82, 33: 85,
};

const baseFor = (n: number | null) => (n == null ? 50 : NUMBER_BASE[n] ?? 50);

export function numerologyToEngineOutput(result: NumerologyResult): EngineOutput {
  const trace: string[] = [];
  const lp = baseFor(result.lifePath);
  const py = baseFor(result.personalYear);
  trace.push(`lifePathBase=${lp} (LP=${result.lifePath}), personalYearBase=${py} (PY=${result.personalYear})`);

  const dest = baseFor(result.destiny);
  const soul = baseFor(result.soulUrge);
  const pers = baseFor(result.personality);

  const dim = (label: string, v: number) => { const x = clamp(v); trace.push(`${label} = ${x}`); return x; };
  const fateVector: FateVector = {
    life:          dim('life',          (lp + dest) / 2),
    wealth:        dim('wealth',        (baseFor(result.lifePath === 8 ? 8 : null) + dest) / 2 + (result.lifePath === 8 ? 5 : 0)),
    relation:      dim('relation',      (soul + dest) / 2),
    health:        dim('health',        lp),
    wisdom:        dim('wisdom',        (lp + soul) / 2 + (result.lifePath === 7 ? 5 : 0)),
    spirit:        dim('spirit',        soul + (result.lifePath === 11 ? 5 : 0)),
    socialStatus:  dim('socialStatus',  pers + (result.lifePath === 22 ? 5 : 0)),
    creativity:    dim('creativity',    (dest + pers) / 2 + (result.lifePath === 3 ? 5 : 0)),
    luck:          dim('luck',          py),
    homeStability: dim('homeStability', (lp + pers) / 2 + (result.lifePath === 6 ? 5 : 0)),
  };

  const validationFlags: ValidationFlags = {
    passed: [
      'deterministic_no_random',
      `lifePath=${result.lifePath}`,
      `personalYear=${result.personalYear}`,
      result.destiny != null ? 'name_numbers_computed' : 'name_numbers_skipped',
    ],
    failed: result.destiny == null ? ['name_numbers_unavailable'] : [],
    warnings: result.warnings.map((w) => `${w.code}: ${w.message}`),
  };

  const eventCandidates: string[] = [
    `Life Path = ${result.lifePath}`,
    `Personal Year (${result.referenceYear}) = ${result.personalYear}`,
  ];
  if (result.destiny != null) eventCandidates.push(`Destiny = ${result.destiny}`);
  if (result.soulUrge != null) eventCandidates.push(`Soul Urge = ${result.soulUrge}`);
  if (result.personality != null) eventCandidates.push(`Personality = ${result.personality}`);
  eventCandidates.push(`Birthday = ${result.birthday}`);
  if (result.maturity != null) eventCandidates.push(`Maturity = ${result.maturity}`);
  if (result.chaldeanDestiny != null) eventCandidates.push(`Chaldean Destiny = ${result.chaldeanDestiny}`);
  for (const k of result.karmicDebts) eventCandidates.push(`Karmic Debt ${k.number} (${k.source})`);

  return {
    engineName: 'numerology',
    engineNameCN: '数字命理',
    engineVersion: 'P4.10-core',
    sourceUrls: ['Pythagorean numerology (classical letter→digit table)'],
    sourceGrade: result.sourceGrade,
    ruleSchool: 'Pythagorean (A=1..I=9), Y-as-consonant variant, master numbers 11/22/33 preserved',
    confidence: normalizeConfidence01(result.confidence),
    computationTimeMs: 0,
    rawInputSnapshot: {
      birthYear: result.input.birthYear,
      birthMonth: result.input.birthMonth,
      birthDay: result.input.birthDay,
      hasName: result.destiny != null,
      nameCharacterCount: result.input.fullName
        ? Array.from(result.input.fullName.trim()).length
        : 0,
      referenceYear: result.referenceYear,
    },
    fateVector,
    normalizedOutput: {
      hasName: String(result.destiny != null),
      lifePath: String(result.lifePath),
      destiny: result.destiny != null ? String(result.destiny) : '-',
      soulUrge: result.soulUrge != null ? String(result.soulUrge) : '-',
      personality: result.personality != null ? String(result.personality) : '-',
      personalYear: String(result.personalYear),
      referenceYear: String(result.referenceYear),
      birthday: String(result.birthday),
      maturity: result.maturity != null ? String(result.maturity) : '-',
      chaldeanDestiny: result.chaldeanDestiny != null ? String(result.chaldeanDestiny) : '-',
      karmicDebts: result.karmicDebts.length > 0
        ? result.karmicDebts.map((k) => `${k.number}(${k.source})`).join(', ')
        : 'none',
      implementationStatus: result.implementationStatus,
    },
    warnings: result.warnings.map((w) => `${w.code}: ${w.message}`),
    uncertaintyNotes: [
      'Y is treated as a consonant for determinism. Some traditions count it as a vowel when adjacent to consonants — that variant is not modelled here.',
      'Primary numbers use the Pythagorean table; the Chaldean Destiny number is provided as a secondary cross-check (Chaldean 1..8, no 9).',
      result.destiny == null
        ? 'Name-based numbers (Destiny / Soul Urge / Personality) require fullName.'
        : 'Name-based numbers reflect the EXACT spelling provided; alternative spellings yield different values.',
    ],
    timingBasis: 'birth',
    explanationTrace: [
      ...result.explanationTrace.map((s) => `[${s.rule}] ${s.detail}`),
      ...trace.map((t) => `[numerology.fateVector] ${t}`),
    ],
    completenessScore: result.completenessScore,
    validationFlags,
    timeWindows: [],
    aspectScores: {
      lifePath: result.lifePath,
      personalYear: result.personalYear,
      destiny: result.destiny ?? 0,
      soulUrge: result.soulUrge ?? 0,
      personality: result.personality ?? 0,
      birthday: result.birthday,
      maturity: result.maturity ?? 0,
      karmicDebtCount: result.karmicDebts.length,
    },
    eventCandidates,
  };
}
