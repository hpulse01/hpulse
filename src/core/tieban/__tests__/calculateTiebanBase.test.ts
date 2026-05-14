import { describe, it, expect } from 'vitest';
import { normalizeBirthTime } from '../../astro-time/normalizeBirthTime';
import { calculateTiebanBase } from '../calculateTiebanBase';

const SH = { geoLatitude: 31.2304, geoLongitude: 121.4737, timezoneIana: 'Asia/Shanghai' };

describe('calculateTiebanBase', () => {
  it('produces base in [1, 12000]', () => {
    const astro = normalizeBirthTime({
      birthLocalDateTime: { year: 1995, month: 6, day: 15, hour: 14, minute: 30 }, ...SH,
    });
    const r = calculateTiebanBase(astro, 'male');
    expect(r.theoreticalBase).toBeGreaterThanOrEqual(1);
    expect(r.theoreticalBase).toBeLessThanOrEqual(12000);
  });

  it('female adds 500 to genderShift component', () => {
    const astro = normalizeBirthTime({
      birthLocalDateTime: { year: 1995, month: 6, day: 15, hour: 14, minute: 30 }, ...SH,
    });
    const male = calculateTiebanBase(astro, 'male');
    const female = calculateTiebanBase(astro, 'female');
    expect(male.genderShift).toBe(0);
    expect(female.genderShift).toBe(500);
  });

  it('rawQuarterIndex matches minute mapping', () => {
    // hour=14 → minuteInShichen = (14%2)*60 + 30 = 90 → quarter 6
    const astro = normalizeBirthTime({
      birthLocalDateTime: { year: 1995, month: 6, day: 15, hour: 14, minute: 30 }, ...SH,
    });
    const r = calculateTiebanBase(astro, 'male');
    expect(r.rawQuarterIndex).toBe(6);
    expect(r.minuteOffset).toBe(0);
  });

  it('is fully deterministic', () => {
    const astro = normalizeBirthTime({
      birthLocalDateTime: { year: 1990, month: 10, day: 10, hour: 10, minute: 7 }, ...SH,
    });
    const a = calculateTiebanBase(astro, 'male');
    const b = calculateTiebanBase(astro, 'male');
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('attaches a complete trace (pillarValues + yao + quarter + gender + formula)', () => {
    const astro = normalizeBirthTime({
      birthLocalDateTime: { year: 2000, month: 1, day: 1, hour: 12, minute: 0 }, ...SH,
    });
    const r = calculateTiebanBase(astro, 'female');
    const rules = r.explanationTrace.map((s) => s.rule);
    expect(rules).toContain('tieban.base.pillarValues');
    expect(rules).toContain('tieban.base.yaoValue');
    expect(rules).toContain('tieban.base.quarter');
    expect(rules).toContain('tieban.base.gender');
    expect(rules).toContain('tieban.base.formula');
  });
});
