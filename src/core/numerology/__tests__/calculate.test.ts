import { describe, it, expect } from 'vitest';
import {
  calculateNumerology, numerologyToEngineOutput,
  calculateLifePath, calculatePersonalYear, reduceToDigit,
  calculateChaldeanDestiny, lifePathTotal,
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
    // 1990-05-14: 1+9+9+0 + 5 + 1+4 = 19 + 5 + 5 = 29 → 11 (master)
    expect(calculateLifePath(1990, 5, 14)).toBe(11);
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
    // lifePathTotal 19 case: 1962-01-? → e.g. 1900-09-? : pick 1903-02-04 → 1+9+0+3+2+4 = 19
    const debt = calculateNumerology({ birthYear: 1903, birthMonth: 2, birthDay: 4, referenceYear: 2026 });
    expect(lifePathTotal(1903, 2, 4)).toBe(19);
    expect(debt.karmicDebts.some((k) => k.source === 'lifePath' && k.number === 19)).toBe(true);
  });
  it('produces a valid EngineOutput', () => {
    const out = numerologyToEngineOutput(calculateNumerology(INPUT));
    expect(out.engineName).toBe('numerology');
    expect(Object.keys(out.fateVector)).toHaveLength(10);
    expect(out.eventCandidates.length).toBeGreaterThan(0);
  });
});
