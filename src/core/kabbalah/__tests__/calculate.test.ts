import { describe, it, expect } from 'vitest';
import {
  calculateKabbalah, kabbalahToEngineOutput,
  gematria, isHebrewInput, sephirahFromNumber, SEPHIROT,
} from '../index';

describe('kabbalah/gematria', () => {
  it('detects Hebrew', () => {
    expect(isHebrewInput('שלום')).toBe(true);
    expect(isHebrewInput('Shalom')).toBe(false);
  });
  it('computes Hebrew gematria', () => {
    // שלום: ש(300) + ל(30) + ו(6) + ם(40) = 376
    expect(gematria('שלום').total).toBe(376);
    expect(gematria('שלום').source).toBe('hebrew');
  });
  it('falls back to transliteration for Latin input', () => {
    const g = gematria('John');
    expect(g.source).toBe('transliterated');
    expect(g.total).toBeGreaterThan(0);
  });
});

describe('kabbalah/treeOfLife', () => {
  it('all 10 sephirot present', () => {
    expect(SEPHIROT).toHaveLength(10);
  });
  it('maps numbers to sephirah deterministically', () => {
    expect(sephirahFromNumber(1).name).toBe('Keter');
    expect(sephirahFromNumber(10).name).toBe('Malkuth');
    expect(sephirahFromNumber(11).name).toBe('Keter');
    expect(sephirahFromNumber(376).name).toBe(sephirahFromNumber(376).name);
  });
});

describe('kabbalah/calculate', () => {
  const FULL = { name: 'שלום', birthYear: 1990, birthMonth: 5, birthDay: 14 };
  it('with Hebrew name → high grade, derivedFromName=true', () => {
    const r = calculateKabbalah(FULL);
    expect(r.derivedFromName).toBe(true);
    expect(r.gematria?.source).toBe('hebrew');
    expect(r.sourceGrade).toBe('B');
    expect(r.primarySephirah).not.toBeNull();
  });
  it('without name → warning, fallback to birth date, derivedFromName=false', () => {
    const r = calculateKabbalah({ birthYear: 1990, birthMonth: 5, birthDay: 14 });
    expect(r.derivedFromName).toBe(false);
    expect(r.gematria).toBeNull();
    expect(r.warnings.some((w) => w.code === 'no_name')).toBe(true);
    expect(r.confidence).toBeLessThan(50);
    expect(r.sourceGrade).toBe('D');
    expect(r.primarySephirah).not.toBeNull(); // birth-date fallback
  });
  it('latin name → transliterated warning', () => {
    const r = calculateKabbalah({ name: 'John', birthYear: 1990, birthMonth: 5, birthDay: 14 });
    expect(r.gematria?.source).toBe('transliterated');
    expect(r.warnings.some((w) => w.code === 'latin_transliteration')).toBe(true);
    expect(r.derivedFromName).toBe(true);
  });
  it('deterministic', () => {
    const a = calculateKabbalah(FULL);
    const b = calculateKabbalah(FULL);
    expect(b.gematria?.total).toBe(a.gematria?.total);
    expect(b.primarySephirah?.name).toBe(a.primarySephirah?.name);
  });
  it('produces a valid EngineOutput', () => {
    const out = kabbalahToEngineOutput(calculateKabbalah(FULL));
    expect(out.engineName).toBe('kabbalah');
    expect(Object.keys(out.fateVector)).toHaveLength(10);
  });
});
