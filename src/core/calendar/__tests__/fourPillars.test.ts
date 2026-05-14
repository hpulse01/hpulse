import { describe, it, expect } from 'vitest';
import { normalizeBirthTime } from '../../astro-time/normalizeBirthTime';
import { fourPillarsFromAstro } from '../fourPillars';

describe('fourPillarsFromAstro', () => {
  it('switches year pillar at 立春, not at lunar new year', () => {
    // 1990-02-01 is BEFORE 立春 (Feb 4). Year pillar should still be 己巳 (1989).
    const before = normalizeBirthTime({
      birthLocalDateTime: { year: 1990, month: 2, day: 1, hour: 12, minute: 0 },
      geoLatitude: 31.23, geoLongitude: 121.47, timezoneIana: 'Asia/Shanghai',
    });
    const fpBefore = fourPillarsFromAstro(before);
    expect(fpBefore.year.ganzhi).toBe('己巳');

    // 1990-02-10 is AFTER 立春. Year pillar must be 庚午.
    const after = normalizeBirthTime({
      birthLocalDateTime: { year: 1990, month: 2, day: 10, hour: 12, minute: 0 },
      geoLatitude: 31.23, geoLongitude: 121.47, timezoneIana: 'Asia/Shanghai',
    });
    const fpAfter = fourPillarsFromAstro(after);
    expect(fpAfter.year.ganzhi).toBe('庚午');
  });

  it('hour pillar derives from day stem (五鼠遁)', () => {
    const r = normalizeBirthTime({
      birthLocalDateTime: { year: 1990, month: 6, day: 15, hour: 14, minute: 30 },
      geoLatitude: 31.23, geoLongitude: 121.47, timezoneIana: 'Asia/Shanghai',
    });
    const fp = fourPillarsFromAstro(r);
    // 14:30 → 未时
    expect(fp.hour.branch).toBe('未');
  });

  it('is deterministic for identical input', () => {
    const r = normalizeBirthTime({
      birthLocalDateTime: { year: 1985, month: 3, day: 20, hour: 8, minute: 15 },
      geoLatitude: 39.9, geoLongitude: 116.4, timezoneIana: 'Asia/Shanghai',
    });
    const a = fourPillarsFromAstro(r);
    const b = fourPillarsFromAstro(r);
    expect(a.year.ganzhi).toBe(b.year.ganzhi);
    expect(a.month.ganzhi).toBe(b.month.ganzhi);
    expect(a.day.ganzhi).toBe(b.day.ganzhi);
    expect(a.hour.ganzhi).toBe(b.hour.ganzhi);
  });

  it('attaches an explanationTrace', () => {
    const r = normalizeBirthTime({
      birthLocalDateTime: { year: 2000, month: 1, day: 1, hour: 0, minute: 0 },
      geoLatitude: 31.23, geoLongitude: 121.47, timezoneIana: 'Asia/Shanghai',
    });
    const fp = fourPillarsFromAstro(r);
    expect(fp.explanationTrace.length).toBeGreaterThan(0);
    expect(fp.explanationTrace.some((s) => s.rule === 'lunarFromUtc')).toBe(true);
  });
});
