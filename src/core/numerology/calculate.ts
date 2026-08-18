/**
 * P4.10 — Numerology core calculations.
 */
import type {
  ExplanationStep,
  KarmicDebt,
  NumerologyInput,
  NumerologyResult,
  NumerologyWarning,
  PinnacleCycle,
} from './types';
import { PYTHAGOREAN_MAP, VOWELS, KARMIC_DEBT_NUMBERS, CHALDEAN_MAP } from './constants';
import { reduceToDigit, reduceToSingleDigit, sumDigits } from './reduce';

/**
 * Life Path: reduce month/day/year separately, then reduce their sum.
 * Keeping the unit reductions is material for Master/Karmic intermediate values.
 */
export function calculateLifePath(year: number, month: number, day: number): number {
  return reduceToDigit(lifePathTotal(year, month, day));
}

/** Personal Year: reduce(birthMonth + birthDay + referenceYear). */
export function calculatePersonalYear(birthMonth: number, birthDay: number, referenceYear: number): number {
  return reduceToDigit(sumDigits(birthMonth) + sumDigits(birthDay) + sumDigits(referenceYear));
}

type LetterPredicate = (ch: string, index: number, part: string) => boolean;

function splitNameParts(name: string): string[] {
  return name.toUpperCase().split(/[^A-Z]+/).filter(Boolean);
}

/**
 * Deterministic Decoz-style Y classification. Syllabic exceptions still
 * exist, so the result is surfaced as a documented product variant.
 */
export function isNumerologyVowel(ch: string, index: number, part: string): boolean {
  if (VOWELS.has(ch)) return true;
  if (ch !== 'Y') return false;

  const previous = part[index - 1];
  const next = part[index + 1];
  const isBasicVowel = (letter: string | undefined) => letter != null && VOWELS.has(letter);

  if (index === 0) return next != null && !isBasicVowel(next);
  if (index === part.length - 1) return previous != null && !isBasicVowel(previous);
  return !isBasicVowel(previous) && !isBasicVowel(next);
}

function letterValues(part: string, predicate: LetterPredicate): number[] {
  const out: number[] = [];
  for (let index = 0; index < part.length; index += 1) {
    const raw = part[index];
    if (PYTHAGOREAN_MAP[raw] != null && predicate(raw, index, part)) {
      out.push(PYTHAGOREAN_MAP[raw]);
    }
  }
  return out;
}

interface NameNumberComputation {
  value: number;
  partTotals: number[];
  reducedPartTotals: number[];
  combinedTotal: number;
}

function calculateNameNumber(name: string, predicate: LetterPredicate): NameNumberComputation {
  const partTotals = splitNameParts(name).map((part) =>
    letterValues(part, predicate).reduce((sum, value) => sum + value, 0));
  const reducedPartTotals = partTotals.map((total) => reduceToDigit(total));
  const combinedTotal = reducedPartTotals.reduce((sum, value) => sum + value, 0);
  return {
    value: combinedTotal === 0 ? 0 : reduceToDigit(combinedTotal),
    partTotals,
    reducedPartTotals,
    combinedTotal,
  };
}

function karmicDebtsFromName(name: string, predicate: LetterPredicate): number[] {
  const calculation = calculateNameNumber(name, predicate);
  return Array.from(new Set([...calculation.partTotals, calculation.combinedTotal]))
    .filter((total) => KARMIC_DEBT_NUMBERS.has(total));
}

/** Life Path intermediate total after separately reducing month/day/year. */
export function lifePathTotal(year: number, month: number, day: number): number {
  return reduceToDigit(month) + reduceToDigit(day) + reduceToDigit(year);
}

export function calculatePinnacles(
  year: number,
  month: number,
  day: number,
): [number, number, number, number] {
  const m = reduceToDigit(month);
  const d = reduceToDigit(day);
  const y = reduceToDigit(year);
  const first = reduceToDigit(m + d);
  const second = reduceToDigit(d + y);
  const third = reduceToDigit(first + second);
  const fourth = reduceToDigit(m + y);
  return [first, second, third, fourth];
}

export function calculateChallenges(
  year: number,
  month: number,
  day: number,
): [number, number, number, number] {
  // Challenge calculations explicitly reduce Master numbers as well.
  const m = reduceToSingleDigit(month);
  const d = reduceToSingleDigit(day);
  const y = reduceToSingleDigit(year);
  const first = Math.abs(m - d);
  const second = Math.abs(d - y);
  const third = Math.abs(first - second);
  const fourth = Math.abs(m - y);
  return [first, second, third, fourth];
}

export function buildPinnacleCycles(
  pinnacles: [number, number, number, number],
  lifePath: number,
): PinnacleCycle[] {
  const firstEnd = 36 - reduceToSingleDigit(lifePath);
  const secondEnd = firstEnd + 9;
  const thirdEnd = secondEnd + 9;
  return [
    { index: 1, number: pinnacles[0], startAge: 0, endAgeInclusive: firstEnd },
    { index: 2, number: pinnacles[1], startAge: firstEnd + 1, endAgeInclusive: secondEnd },
    { index: 3, number: pinnacles[2], startAge: secondEnd + 1, endAgeInclusive: thirdEnd },
    { index: 4, number: pinnacles[3], startAge: thirdEnd + 1, endAgeInclusive: null },
  ];
}

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

function validateGregorianDate(year: number, month: number, day: number): void {
  if (!Number.isInteger(year) || year < 1 || year > 9999) {
    throw new Error('numerology: birthYear must be an integer in 1..9999');
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error('numerology: birthMonth must be an integer in 1..12');
  }
  if (!Number.isInteger(day) || day < 1 || day > daysInMonth(year, month)) {
    throw new Error('numerology: birthDay is not valid for the Gregorian month');
  }
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
  return calculateNameNumber(name, () => true).value;
}

export function calculateSoulUrge(name: string): number {
  return calculateNameNumber(name, isNumerologyVowel).value;
}

export function calculatePersonality(name: string): number {
  return calculateNameNumber(name, (ch, index, part) => !isNumerologyVowel(ch, index, part)).value;
}

export function calculateNumerology(input: NumerologyInput): NumerologyResult {
  const warnings: NumerologyWarning[] = [];
  const trace: ExplanationStep[] = [];

  validateGregorianDate(input.birthYear, input.birthMonth, input.birthDay);

  const lpTotal = lifePathTotal(input.birthYear, input.birthMonth, input.birthDay);
  const lifePath = calculateLifePath(input.birthYear, input.birthMonth, input.birthDay);
  trace.push({
    rule: 'numerology.lifePath',
    detail: `LifePath = reduce(reduce(${input.birthMonth}) + reduce(${input.birthDay}) + reduce(${input.birthYear})) = reduce(${lpTotal}) = ${lifePath}`,
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
  if (!Number.isInteger(referenceYear) || referenceYear < 1 || referenceYear > 9999) {
    throw new Error('numerology: referenceYear must be an integer in 1..9999');
  }
  const personalYear = calculatePersonalYear(input.birthMonth, input.birthDay, referenceYear);
  trace.push({
    rule: 'numerology.personalYear',
    detail: `PersonalYear(${referenceYear}) = reduce(${input.birthMonth}+${input.birthDay}+${referenceYear} digits) = ${personalYear}`,
  });

  const pinnacles = calculatePinnacles(input.birthYear, input.birthMonth, input.birthDay);
  const pinnacleCycles = buildPinnacleCycles(pinnacles, lifePath);
  trace.push({
    rule: 'numerology.pinnacles',
    detail: `Pinnacles=${pinnacles.join('/')} with conventional inclusive age windows ${pinnacleCycles.map((cycle) => `${cycle.startAge}-${cycle.endAgeInclusive ?? '+'}`).join(', ')}`,
  });

  const challenges = calculateChallenges(input.birthYear, input.birthMonth, input.birthDay);
  trace.push({
    rule: 'numerology.challenges',
    detail: `Challenges=${challenges.join('/')} (1st, 2nd, Main, 4th); no exact age boundaries assigned because challenge periods are described as fluid and overlapping`,
  });

  let destiny: number | null = null;
  let soulUrge: number | null = null;
  let personality: number | null = null;

  const cleanedName = (input.fullName ?? '').trim().normalize('NFC');
  const unsupportedLetterCount = Array.from(cleanedName)
    .filter((character) => /\p{L}/u.test(character) && !/[A-Za-z]/.test(character))
    .length;
  const hasAsciiLetters = /[A-Za-z]/.test(cleanedName);
  const hasName = cleanedName.length > 0 && hasAsciiLetters && unsupportedLetterCount === 0;

  if (hasName) {
    const destinyCalculation = calculateNameNumber(cleanedName, () => true);
    const soulCalculation = calculateNameNumber(cleanedName, isNumerologyVowel);
    const personalityCalculation = calculateNameNumber(
      cleanedName,
      (ch, index, part) => !isNumerologyVowel(ch, index, part),
    );
    destiny = destinyCalculation.value;
    soulUrge = soulCalculation.value;
    personality = personalityCalculation.value;
    trace.push({
      rule: 'numerology.name',
      detail: `Destiny=${destiny}, SoulUrge=${soulUrge}, Personality=${personality}; name parts reduced separately (${splitNameParts(cleanedName).length} parts, ${Array.from(cleanedName).length} characters); contextual Y rule applied`,
    });
  } else {
    if (unsupportedLetterCount > 0) {
      warnings.push({
        code: 'unsupported_name_letters',
        message: `Name contains ${unsupportedLetterCount} letter(s) outside the declared A–Z numerology table. Name-derived numbers were skipped rather than silently dropping characters; provide an explicit unaccented A–Z transliteration.`,
        level: 'warn',
      });
      trace.push({
        rule: 'numerology.name',
        detail: `skipped (${unsupportedLetterCount} unsupported non-A–Z letters; no silent transliteration)`,
      });
    } else {
      warnings.push({
        code: 'no_name',
        message: 'fullName not provided (or no A–Z letters) — Destiny / SoulUrge / Personality skipped, NOT fabricated.',
        level: 'warn',
      });
      trace.push({ rule: 'numerology.name', detail: 'skipped (no fullName)' });
    }
  }

  const birthday = reduceToDigit(input.birthDay);
  trace.push({ rule: 'numerology.birthday', detail: `Birthday = reduce(${input.birthDay}) = ${birthday}` });

  // Karmic Debt: flag 13/14/16/19 appearing as UNREDUCED core totals.
  const karmicDebts: KarmicDebt[] = [];
  if (KARMIC_DEBT_NUMBERS.has(lpTotal)) karmicDebts.push({ source: 'lifePath', number: lpTotal });
  if (KARMIC_DEBT_NUMBERS.has(input.birthDay)) karmicDebts.push({ source: 'birthday', number: input.birthDay });
  if (hasName) {
    for (const number of karmicDebtsFromName(cleanedName, () => true)) {
      karmicDebts.push({ source: 'destiny', number });
    }
    for (const number of karmicDebtsFromName(cleanedName, isNumerologyVowel)) {
      karmicDebts.push({ source: 'soulUrge', number });
    }
    for (const number of karmicDebtsFromName(
      cleanedName,
      (ch, index, part) => !isNumerologyVowel(ch, index, part),
    )) {
      karmicDebts.push({ source: 'personality', number });
    }
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
    pinnacleCycles,
    challenges,
    confidence,
    completenessScore,
    sourceGrade: hasName ? 'B' : 'C',
    implementationStatus: 'partial',
    warnings,
    explanationTrace: trace,
  };
}
