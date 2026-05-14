import { describe, it, expect } from 'vitest';
import { normalizeBirthTime } from '../normalizeBirthTime';

describe('normalizeBirthTime', () => {
  const baseInput = {
    birthLocalDateTime: { year: 1995, month: 6, day: 15, hour: 14, minute: 30 },
    geoLatitude: 31.2304,
    geoLongitude: 121.4737,
    timezoneIana: 'Asia/Shanghai',
  };

  it('produces UTC = local − offset for non-DST zones', () => {
    const r = normalizeBirthTime(baseInput);
    expect(r.offsetMinutes).toBe(8 * 60);
    // 1995-06-15 14:30 +08:00 = 06:30 UTC (China dropped DST after 1991)
    expect(r.utcDateTime).toBe('1995-06-15T06:30:00.000Z');
  });

  it('correctly resolves historical China DST (1990-06-15 was UTC+9)', () => {
    const r = normalizeBirthTime({
      ...baseInput,
      birthLocalDateTime: { year: 1990, month: 6, day: 15, hour: 14, minute: 30 },
    });
    expect(r.offsetMinutes).toBe(9 * 60);
  });

  it('produces a deterministic output for identical input', () => {
    const a = normalizeBirthTime(baseInput);
    const b = normalizeBirthTime(baseInput);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('computes a true solar time within ±20 minutes of mean (EoT range)', () => {
    const r = normalizeBirthTime(baseInput);
    expect(Math.abs(r.solarTimeCorrectionMinutes)).toBeLessThan(20);
  });

  it('flags missing coordinates with an error-level warning', () => {
    const r = normalizeBirthTime({
      ...baseInput,
      geoLatitude: NaN,
      geoLongitude: NaN,
    });
    expect(r.warnings.some((w) => w.code === 'GEO_MISSING')).toBe(true);
    expect(r.sourceGrade).toBe('D');
  });

  it('flags missing timezone with an error-level warning', () => {
    const r = normalizeBirthTime({ ...baseInput, timezoneIana: '' });
    expect(r.warnings.some((w) => w.code === 'TZ_MISSING')).toBe(true);
  });

  it('records explanation steps for UTC derivation, JD, and solar time', () => {
    const r = normalizeBirthTime(baseInput);
    const rules = r.explanationTrace.map((s) => s.rule);
    expect(rules).toContain('utcFromLocal');
    expect(rules).toContain('julianDayFromUtc');
    expect(rules).toContain('trueSolarTime');
  });
});
