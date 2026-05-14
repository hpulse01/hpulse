import { describe, it, expect } from 'vitest';
import { normalizeBirthTime } from '../../astro-time/normalizeBirthTime';
import { runTieban } from '../runTieban';

const SH = { geoLatitude: 31.2304, geoLongitude: 121.4737, timezoneIana: 'Asia/Shanghai' };

describe('runTieban — full pipeline', () => {
  it('produces a complete TiebanCalculation without family facts and warns about it', () => {
    const astro = normalizeBirthTime({
      birthLocalDateTime: { year: 1995, month: 6, day: 15, hour: 14, minute: 30 }, ...SH,
    });
    const r = runTieban(astro, 'male');
    expect(r.pillars.year).toBeTruthy();
    expect(r.base.theoreticalBase).toBeGreaterThanOrEqual(1);
    expect(r.quarter.candidates).toHaveLength(8);
    expect(r.verification).toBeUndefined();
    expect(r.warnings.some((w) => w.code === 'KAOKE_NOT_RUN')).toBe(true);
    // sourceGrade downgraded from A → C when 校时 absent
    expect(['B', 'C', 'D']).toContain(r.sourceGrade);
  });

  it('runs verification when facts are supplied and surfaces systemOffset', () => {
    const astro = normalizeBirthTime({
      birthLocalDateTime: { year: 1995, month: 6, day: 15, hour: 14, minute: 30 }, ...SH,
    });
    const r = runTieban(astro, 'male', {
      facts: { fatherZodiac: 5, motherZodiac: 7, parentsStatus: 'both_alive', siblingsCount: 2 },
    });
    expect(r.verification).toBeDefined();
    expect(typeof r.verification!.systemOffset).toBe('number');
  });

  it('is fully deterministic for identical input', () => {
    const astro = normalizeBirthTime({
      birthLocalDateTime: { year: 1985, month: 3, day: 20, hour: 8, minute: 0 }, ...SH,
    });
    const facts = { fatherZodiac: 3, motherZodiac: 8, parentsStatus: 'both_alive' as const, siblingsCount: 1 };
    const a = runTieban(astro, 'female', { facts });
    const b = runTieban(astro, 'female', { facts });
    expect(a.base.theoreticalBase).toBe(b.base.theoreticalBase);
    expect(a.verification!.systemOffset).toBe(b.verification!.systemOffset);
    expect(a.verification!.locked.clauseNumber).toBe(b.verification!.locked.clauseNumber);
  });
});
