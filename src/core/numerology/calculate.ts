/**
 * P4.10 — Numerology core calculations.
 */
import type { NumerologyInput, NumerologyResult, NumerologyWarning, ExplanationStep } from './types';
import { PYTHAGOREAN_MAP, VOWELS } from './constants';
import { reduceToDigit, sumDigits } from './reduce';

/** Life Path: reduce sum of all date digits. */
export function calculateLifePath(year: number, month: number, day: number): number {
  const total = sumDigits(year) + sumDigits(month) + sumDigits(day);
  return reduceToDigit(total);
}

/** Personal Year: reduce(birthMonth + birthDay + referenceYear). */
export function calculatePersonalYear(birthMonth: number, birthDay: number, referenceYear: number): number {
  return reduceToDigit(sumDigits(birthMonth) + sumDigits(birthDay) + sumDigits(referenceYear));
}

function letterValues(name: string, predicate: (ch: string) => boolean): number[] {
  const out: number[] = [];
  for (const raw of name.toUpperCase()) {
    if (PYTHAGOREAN_MAP[raw] != null && predicate(raw)) {
      out.push(PYTHAGOREAN_MAP[raw]);
    }
  }
  return out;
}

export function calculateDestiny(name: string): number {
  const vals = letterValues(name, () => true);
  if (vals.length === 0) return 0;
  return reduceToDigit(vals.reduce((a, b) => a + b, 0));
}

export function calculateSoulUrge(name: string): number {
  const vals = letterValues(name, (ch) => VOWELS.has(ch));
  if (vals.length === 0) return 0;
  return reduceToDigit(vals.reduce((a, b) => a + b, 0));
}

export function calculatePersonality(name: string): number {
  const vals = letterValues(name, (ch) => !VOWELS.has(ch));
  if (vals.length === 0) return 0;
  return reduceToDigit(vals.reduce((a, b) => a + b, 0));
}

export function calculateNumerology(input: NumerologyInput): NumerologyResult {
  const warnings: NumerologyWarning[] = [];
  const trace: ExplanationStep[] = [];

  if (!Number.isInteger(input.birthYear) || !Number.isInteger(input.birthMonth) || !Number.isInteger(input.birthDay)) {
    throw new Error('numerology: birthYear/Month/Day must be integers');
  }
  if (input.birthMonth < 1 || input.birthMonth > 12 || input.birthDay < 1 || input.birthDay > 31) {
    throw new Error('numerology: birthMonth/Day out of range');
  }

  const lifePath = calculateLifePath(input.birthYear, input.birthMonth, input.birthDay);
  trace.push({
    rule: 'numerology.lifePath',
    detail: `LifePath = reduce(${input.birthYear}+${input.birthMonth}+${input.birthDay} digits) = ${lifePath}`,
  });

  let referenceYear = input.referenceYear;
  if (referenceYear == null) {
    if (input.queryTimeUtc) {
      const d = new Date(input.queryTimeUtc);
      if (Number.isNaN(d.getTime())) {
        throw new Error(`numerology: invalid queryTimeUtc "${input.queryTimeUtc}"`);
      }
      referenceYear = d.getUTCFullYear();
    } else {
      referenceYear = input.birthYear;
      warnings.push({
        code: 'no_reference_year',
        message: 'No referenceYear or queryTimeUtc supplied — Personal Year defaults to birth year.',
        level: 'info',
      });
    }
  }
  const personalYear = calculatePersonalYear(input.birthMonth, input.birthDay, referenceYear);
  trace.push({
    rule: 'numerology.personalYear',
    detail: `PersonalYear(${referenceYear}) = reduce(${input.birthMonth}+${input.birthDay}+${referenceYear} digits) = ${personalYear}`,
  });

  let destiny: number | null = null;
  let soulUrge: number | null = null;
  let personality: number | null = null;

  const cleanedName = (input.fullName ?? '').trim();
  const hasName = cleanedName.length > 0 && /[A-Za-z]/.test(cleanedName);

  if (hasName) {
    destiny = calculateDestiny(cleanedName);
    soulUrge = calculateSoulUrge(cleanedName);
    personality = calculatePersonality(cleanedName);
    trace.push({
      rule: 'numerology.name',
      detail: `Destiny=${destiny}, SoulUrge=${soulUrge}, Personality=${personality} from "${cleanedName}"`,
    });
  } else {
    warnings.push({
      code: 'no_name',
      message: 'fullName not provided (or no Latin letters) — Destiny / SoulUrge / Personality skipped, NOT fabricated.',
      level: 'warn',
    });
    trace.push({ rule: 'numerology.name', detail: 'skipped (no fullName)' });
  }

  const completenessScore = hasName ? 90 : 55;
  const confidence = hasName ? 80 : 55;

  return {
    input,
    lifePath,
    destiny,
    soulUrge,
    personality,
    personalYear,
    referenceYear,
    confidence,
    completenessScore,
    sourceGrade: hasName ? 'B' : 'C',
    implementationStatus: hasName ? 'complete' : 'partial',
    warnings,
    explanationTrace: trace,
  };
}
