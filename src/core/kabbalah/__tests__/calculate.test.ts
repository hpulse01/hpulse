import { describe, it, expect } from 'vitest';
import {
  calculateKabbalah, kabbalahToEngineOutput,
  gematria, isHebrewInput, sephirahFromNumber, SEPHIROT,
  TREE_PATHS, pathFromLetter, pathFromNumber,
} from '../index';

describe('kabbalah/gematria', () => {
  it('detects Hebrew', () => {
    expect(isHebrewInput('שלום')).toBe(true);
    expect(isHebrewInput('Shalom')).toBe(false);
  });
  it('computes Hebrew gematria', () => {
    // שלום: ש(300) + ל(30) + ו(6) + ם(40) = 376
    const g = gematria('שלום');
    expect(g.total).toBe(376);
    // 500..900 final-letter Gadol variant: final mem ם = 600.
    expect(g.gadol).toBe(936);
    expect(g.source).toBe('hebrew');
  });
  it('uses 500..900 only for explicit Hebrew final forms', () => {
    const finals = gematria('ךםןףץ');
    expect(finals.total).toBe(280);
    expect(finals.gadol).toBe(3500);
    expect(finals.letters.map((letter) => letter.gadolValue)).toEqual([500, 600, 700, 800, 900]);

    const baseForms = gematria('כמנפצ');
    expect(baseForms.gadol).toBe(baseForms.total);
  });
  it('falls back to transliteration for Latin input', () => {
    const g = gematria('John');
    expect(g.source).toBe('transliterated');
    expect(g.total).toBeGreaterThan(0);
    expect(g.gadol).toBe(g.total);
  });
  it('computes extended gematria (katan, siduri)', () => {
    const g = gematria('שלום');
    // katan: ש 300→3, ל 30→3, ו 6, ם 40→4 = 16
    expect(g.katan).toBe(16);
    // siduri: ש=21, ל=12, ו=6, ם(מ)=13 = 52
    expect(g.siduri).toBe(52);
  });
});

describe('kabbalah/paths', () => {
  it('has all 22 paths numbered 11..32', () => {
    expect(TREE_PATHS).toHaveLength(22);
    expect(TREE_PATHS[0].number).toBe(11);
    expect(TREE_PATHS[21].number).toBe(32);
  });
  it('maps letters (incl. final forms) to paths', () => {
    expect(pathFromLetter('א')?.letterName).toBe('Aleph');
    expect(pathFromLetter('ם')?.letterName).toBe('Mem');
  });
  it('maps numbers to paths deterministically', () => {
    expect(pathFromNumber(1).number).toBe(11);
    expect(pathFromNumber(22).number).toBe(32);
    expect(pathFromNumber(23).number).toBe(11);
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
  it('derives primary path from name first letter', () => {
    const r = calculateKabbalah(FULL);
    // שלום first letter ש → path 31 (Shin)
    expect(r.primaryPath?.number).toBe(31);
    expect(r.primaryPath?.letterName).toBe('Shin');
    expect(r.implementationStatus).toBe('partial');
  });
  it('falls back path from birth-date number without name', () => {
    const r = calculateKabbalah({ birthYear: 1990, birthMonth: 5, birthDay: 14 });
    expect(r.primaryPath).not.toBeNull();
    expect(r.implementationStatus).toBe('partial');
  });
  it('produces a valid EngineOutput', () => {
    const out = kabbalahToEngineOutput(calculateKabbalah(FULL));
    expect(out.engineName).toBe('kabbalah');
    expect(Object.keys(out.fateVector)).toHaveLength(10);
    expect(out.normalizedOutput.pathNumber).toBe('31');
    expect(out.normalizedOutput.gematriaGadol).toBe('936');
    expect(out.aspectScores?.gematriaGadol).toBe(936);
    expect(out.rawInputSnapshot).not.toHaveProperty('name');
    expect(out.rawInputSnapshot).toMatchObject({
      hasName: true,
      nameScript: 'hebrew',
      gematriaLetterCount: 4,
    });
  });
});
