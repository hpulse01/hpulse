import { describe, it, expect } from 'vitest';
import {
  calculateNumerology, numerologyToEngineOutput,
  calculateLifePath, calculatePersonalYear, reduceToDigit,
  calculateChaldeanDestiny, calculatePinnacles, calculateChallenges,
  buildPinnacleCycles, calculateDestiny, calculateSoulUrge,
  calculatePersonality, isNumerologyVowel, lifePathTotal,
} from '../index';

const INPUT = {
  birthYear: 1990, birthMonth: 5, birthDay: 14,
  fullName: 'John Smith',
  referenceYear: 2026,
};

describe('numerology/reduce', () => {
  it('reduces normally', () => {
    expect(reduceToDigit(28)).toBe(1);
    expect(reduceToDigit(9)).toBe(9);
  });
  it('preserves master numbers', () => {
    expect(reduceToDigit(11)).toBe(11);
    expect(reduceToDigit(22)).toBe(22);
    expect(reduceToDigit(33)).toBe(33);
  });
});

describe('numerology/calculate', () => {
  it('Life Path stable', () => {
    // 1990-05-14: reduce units separately: year=1, month=5, day=5; 1+5+5=11.
    expect(calculateLifePath(1990, 5, 14)).toBe(11);
  });
  it('preserves the correct Life Path intermediate total for Karmic Debt', () => {
    // 1998-10-15: month=1, day=6, year=9; total=16 → 7 (not raw digit sum 34).
    expect(lifePathTotal(1998, 10, 15)).toBe(16);
    const r = calculateNumerology({ birthYear: 1998, birthMonth: 10, birthDay: 15, referenceYear: 2026 });
    expect(r.lifePath).toBe(7);
    expect(r.karmicDebts).toContainEqual({ source: 'lifePath', number: 16 });
  });
  it('Personal Year stable', () => {
    // digits: 5 + (1+4) + (2+0+2+6) = 20 → 2
    expect(calculatePersonalYear(5, 14, 2026)).toBe(2);
  });
  it('full pipeline deterministic', () => {
    const a = calculateNumerology(INPUT);
    const b = calculateNumerology(INPUT);
    expect(b.lifePath).toBe(a.lifePath);
    expect(b.destiny).toBe(a.destiny);
    expect(b.soulUrge).toBe(a.soulUrge);
    expect(b.personality).toBe(a.personality);
  });
  it('reduces first/middle/last name parts before the final total', () => {
    // AB=3; HI=17→8; 3+8=11. A flat all-letter sum would incorrectly give 20→2.
    expect(calculateDestiny('AB HI')).toBe(11);
  });
  it('classifies Y by the cited positional rule', () => {
    expect(isNumerologyVowel('Y', 0, 'YVONNE')).toBe(true);
    expect(isNumerologyVowel('Y', 0, 'YOLANDA')).toBe(false);
    expect(isNumerologyVowel('Y', 3, 'MARY')).toBe(true);
    expect(isNumerologyVowel('Y', 6, 'MALONEY')).toBe(false);
    expect(isNumerologyVowel('Y', 1, 'KYLE')).toBe(true);
    expect(calculateSoulUrge('Mary')).toBe(8); // A(1) + vowel Y(7)
    expect(calculatePersonality('Mary')).toBe(4); // M(4) + R(9) = 13 → 4
  });
  it('fails closed for unsupported name letters instead of dropping them', () => {
    const r = calculateNumerology({
      birthYear: 1990,
      birthMonth: 5,
      birthDay: 14,
      fullName: 'José',
      referenceYear: 2026,
    });
    expect(r.destiny).toBeNull();
    expect(r.soulUrge).toBeNull();
    expect(r.personality).toBeNull();
    expect(r.warnings.some((warning) => warning.code === 'unsupported_name_letters')).toBe(true);
  });
  it('warns and skips name numbers when fullName missing', () => {
    const r = calculateNumerology({ birthYear: 1990, birthMonth: 5, birthDay: 14, referenceYear: 2026 });
    expect(r.destiny).toBeNull();
    expect(r.soulUrge).toBeNull();
    expect(r.personality).toBeNull();
    expect(r.warnings.some((w) => w.code === 'no_name')).toBe(true);
    expect(r.implementationStatus).toBe('partial');
  });
  it('computes birthday / maturity / chaldean destiny', () => {
    const r = calculateNumerology(INPUT);
    // birthday: reduce(14) = 5
    expect(r.birthday).toBe(5);
    // maturity: reduce(lifePath 11 + destiny)
    expect(r.maturity).toBe(reduceToDigit(11 + (r.destiny ?? 0)));
    // Chaldean: JOHN SMITH = 1+7+5+5 + 3+4+1+4+5 = 35 → 8
    expect(calculateChaldeanDestiny('John Smith')).toBe(8);
    expect(r.chaldeanDestiny).toBe(8);
  });
  it('detects karmic debt numbers from unreduced totals', () => {
    // 1990-05-14 lifePath total = 29 (no debt), but birthDay 14 is karmic debt
    const r = calculateNumerology(INPUT);
    expect(r.karmicDebts.some((k) => k.source === 'birthday' && k.number === 14)).toBe(true);
    // 1975-01-31: 1+9+7+5 + 1 + 3+1 = 27 → no LP debt; birthDay 31 → none
    const clean = calculateNumerology({ birthYear: 1975, birthMonth: 1, birthDay: 31, referenceYear: 2026 });
    expect(clean.karmicDebts).toHaveLength(0);
    // 1900-09-09: month=9, day=9, year=1 → intermediate Life Path total 19.
    const debt = calculateNumerology({ birthYear: 1900, birthMonth: 9, birthDay: 9, referenceYear: 2026 });
    expect(lifePathTotal(1900, 9, 9)).toBe(19);
    expect(debt.karmicDebts.some((k) => k.source === 'lifePath' && k.number === 19)).toBe(true);
  });
  it('computes the cited Pinnacle and Challenge example', () => {
    expect(calculatePinnacles(1949, 5, 15)).toEqual([11, 11, 22, 1]);
    expect(calculateChallenges(1949, 5, 15)).toEqual([1, 1, 0, 0]);
    expect(buildPinnacleCycles([11, 11, 22, 1], 7)).toEqual([
      { index: 1, number: 11, startAge: 0, endAgeInclusive: 29 },
      { index: 2, number: 11, startAge: 30, endAgeInclusive: 38 },
      { index: 3, number: 22, startAge: 39, endAgeInclusive: 47 },
      { index: 4, number: 1, startAge: 48, endAgeInclusive: null },
    ]);
  });
  it('rejects impossible Gregorian dates', () => {
    expect(() => calculateNumerology({
      birthYear: 2025,
      birthMonth: 2,
      birthDay: 29,
      referenceYear: 2026,
    })).toThrow(/not valid/);
    expect(() => calculateNumerology({
      birthYear: 2024,
      birthMonth: 2,
      birthDay: 29,
      referenceYear: 2026,
    })).not.toThrow();
  });
  it('produces a valid EngineOutput', () => {
    const out = numerologyToEngineOutput(calculateNumerology(INPUT));
    expect(out.engineName).toBe('numerology');
    expect(Object.keys(out.fateVector)).toHaveLength(10);
    expect(out.eventCandidates.length).toBeGreaterThan(0);
    expect(out.rawInputSnapshot).not.toHaveProperty('fullName');
    expect(out.rawInputSnapshot).toMatchObject({
      hasName: true,
      nameCharacterCount: 10,
    });
    expect(out.normalizedOutput.hasName).toBe('true');
    expect(JSON.parse(String(out.normalizedOutput.pinnacleCycles))).toHaveLength(4);
    expect(JSON.parse(String(out.normalizedOutput.challenges))).toHaveLength(4);
    expect(out.normalizedOutput.implementationStatus).toBe('partial');
    expect(JSON.stringify(out)).not.toContain(INPUT.fullName);
  });
});
