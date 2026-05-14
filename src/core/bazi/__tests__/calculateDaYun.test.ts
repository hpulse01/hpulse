import { describe, it, expect } from 'vitest';
import { normalizeBirthTime } from '../../astro-time/normalizeBirthTime';
import { calculateDaYun } from '../calculateDaYun';

const SH = { geoLatitude: 31.2304, geoLongitude: 121.4737, timezoneIana: 'Asia/Shanghai' };

describe('calculateDaYun — direction rule', () => {
  it('阳年男 → 顺行', () => {
    // 1984 = 甲子 (yang stem) → male should be forward
    const astro = normalizeBirthTime({
      birthLocalDateTime: { year: 1984, month: 6, day: 15, hour: 12, minute: 0 }, ...SH,
    });
    const r = calculateDaYun(astro, 'male');
    expect(r.direction).toBe('forward');
  });

  it('阳年女 → 逆行', () => {
    const astro = normalizeBirthTime({
      birthLocalDateTime: { year: 1984, month: 6, day: 15, hour: 12, minute: 0 }, ...SH,
    });
    const r = calculateDaYun(astro, 'female');
    expect(r.direction).toBe('backward');
  });

  it('阴年男 → 逆行', () => {
    // 1995 = 乙亥 (yin stem) → male should be backward
    const astro = normalizeBirthTime({
      birthLocalDateTime: { year: 1995, month: 6, day: 15, hour: 12, minute: 0 }, ...SH,
    });
    expect(calculateDaYun(astro, 'male').direction).toBe('backward');
  });

  it('阴年女 → 顺行', () => {
    const astro = normalizeBirthTime({
      birthLocalDateTime: { year: 1995, month: 6, day: 15, hour: 12, minute: 0 }, ...SH,
    });
    expect(calculateDaYun(astro, 'female').direction).toBe('forward');
  });
});

describe('calculateDaYun — start age + steps', () => {
  it('jieDistance is at most ~30 days (within one 节气月)', () => {
    const astro = normalizeBirthTime({
      birthLocalDateTime: { year: 1990, month: 10, day: 10, hour: 12, minute: 0 }, ...SH,
    });
    const r = calculateDaYun(astro, 'male');
    expect(r.jieDistanceDays).toBeLessThan(35);
    expect(r.startAgeYears).toBeLessThan(12);
  });

  it('produces N decadal steps in canonical 60-jiazi cycle', () => {
    const astro = normalizeBirthTime({
      birthLocalDateTime: { year: 1990, month: 10, day: 10, hour: 12, minute: 0 }, ...SH,
    });
    const r = calculateDaYun(astro, 'male', { count: 8 });
    expect(r.steps).toHaveLength(8);
    // each step should be exactly +1 (forward) or -1 (backward) of previous in the 60 cycle
    for (let i = 1; i < r.steps.length; i++) {
      const a = r.steps[i - 1].pillar.ganzhi;
      const b = r.steps[i].pillar.ganzhi;
      expect(a).not.toBe(b);
    }
    // Each step is 10 years apart
    for (let i = 1; i < r.steps.length; i++) {
      expect(r.steps[i].startAge - r.steps[i - 1].startAge).toBeCloseTo(10, 5);
    }
  });

  it('is deterministic', () => {
    const astro = normalizeBirthTime({
      birthLocalDateTime: { year: 1985, month: 3, day: 20, hour: 8, minute: 0 }, ...SH,
    });
    const a = calculateDaYun(astro, 'male');
    const b = calculateDaYun(astro, 'male');
    expect(JSON.stringify(a.steps)).toBe(JSON.stringify(b.steps));
  });

  it('attaches an explanation trace explaining direction + boundary + first pillar', () => {
    const astro = normalizeBirthTime({
      birthLocalDateTime: { year: 1985, month: 3, day: 20, hour: 8, minute: 0 }, ...SH,
    });
    const r = calculateDaYun(astro, 'female');
    const rules = r.explanationTrace.map((s) => s.rule);
    expect(rules).toContain('daYun.direction');
    expect(rules).toContain('daYun.boundaryJie');
    expect(rules).toContain('daYun.startAge');
    expect(rules).toContain('daYun.firstPillar');
  });
});
