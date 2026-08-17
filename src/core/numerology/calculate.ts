/**
 * P4.10 — Numerology core calculations.
 */
import type { NumerologyInput, NumerologyResult, NumerologyWarning, ExplanationStep, KarmicDebt } from './types';
import { PYTHAGOREAN_MAP, VOWELS, KARMIC_DEBT_NUMBERS, CHALDEAN_MAP } from './constants';
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

/** Unreduced total used for Karmic Debt detection. */
function nameTotal(name: string, predicate: (ch: string) => boolean): number {
  return letterValues(name, predicate).reduce((a, b) => a + b, 0);
}

/** Life Path unreduced total (sum of all date digits). */
export function lifePathTotal(year: number, month: number, day: number): number {
  return sumDigits(year) + sumDigits(month) + sumDigits(day);
}

/** Chaldean Destiny number: Chaldean letter values, reduced (masters preserved). */
export function calculateChaldeanDestiny(name: string): number {
  let total = 0;
  for (const raw of name.toUpperCase()) {
    const v = CHALDEAN_MAP[raw];
    if (v != null) total += v;
  }
  if (total === 0) return 0;
  return reduceToDigit(total);
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
      detail: `Destiny=${destiny}, SoulUrge=${soulUrge}, Personality=${personality} from explicitly supplied spelling (${Array.from(cleanedName).length} characters)`,
    });
  } else {
    warnings.push({
      code: 'no_name',
      message: 'fullName not provided (or no Latin letters) — Destiny / SoulUrge / Personality skipped, NOT fabricated.',
      level: 'warn',
    });
    trace.push({ rule: 'numerology.name', detail: 'skipped (no fullName)' });
  }

  const birthday = reduceToDigit(input.birthDay);
  trace.push({ rule: 'numerology.birthday', detail: `Birthday = reduce(${input.birthDay}) = ${birthday}` });

  // Karmic Debt: flag 13/14/16/19 appearing as UNREDUCED core totals.
  const karmicDebts: KarmicDebt[] = [];
  const lpTotal = lifePathTotal(input.birthYear, input.birthMonth, input.birthDay);
  if (KARMIC_DEBT_NUMBERS.has(lpTotal)) karmicDebts.push({ source: 'lifePath', number: lpTotal });
  if (KARMIC_DEBT_NUMBERS.has(input.birthDay)) karmicDebts.push({ source: 'birthday', number: input.birthDay });
  if (hasName) {
    const destTotal = nameTotal(cleanedName, () => true);
    const soulTotal = nameTotal(cleanedName, (ch) => VOWELS.has(ch));
    const persTotal = nameTotal(cleanedName, (ch) => !VOWELS.has(ch));
    if (KARMIC_DEBT_NUMBERS.has(destTotal)) karmicDebts.push({ source: 'destiny', number: destTotal });
    if (KARMIC_DEBT_NUMBERS.has(soulTotal)) karmicDebts.push({ source: 'soulUrge', number: soulTotal });
    if (KARMIC_DEBT_NUMBERS.has(persTotal)) karmicDebts.push({ source: 'personality', number: persTotal });
  }
  trace.push({
    rule: 'numerology.karmicDebt',
    detail: karmicDebts.length > 0
      ? `Karmic Debts: ${karmicDebts.map((k) => `${k.number}(${k.source})`).join(', ')}`
      : 'No karmic debt numbers (13/14/16/19) in unreduced totals',
  });

  const maturity = destiny != null ? reduceToDigit(lifePath + destiny) : null;
  const chaldeanDestiny = hasName ? calculateChaldeanDestiny(cleanedName) : null;
  if (hasName) {
    trace.push({
      rule: 'numerology.extended',
      detail: `Maturity = reduce(${lifePath}+${destiny}) = ${maturity}; Chaldean Destiny = ${chaldeanDestiny}`,
    });
  }

  const completenessScore = hasName ? 95 : 60;
  const confidence = hasName ? 82 : 58;

  return {
    input,
    lifePath,
    destiny,
    soulUrge,
    personality,
    personalYear,
    referenceYear,
    birthday,
    maturity,
    karmicDebts,
    chaldeanDestiny,
    confidence,
    completenessScore,
    sourceGrade: hasName ? 'B' : 'C',
    implementationStatus: hasName ? 'complete' : 'partial',
    warnings,
    explanationTrace: trace,
  };
}
