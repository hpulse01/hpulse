import { describe, it, expect } from 'vitest';
import { julianDayFromUtc, utcFromJulianDay } from '../julianDay';

describe('julianDay', () => {
  it('matches Meeus reference J2000.0 = 2451545.0 at 2000-01-01T12:00:00Z', () => {
    const jd = julianDayFromUtc(new Date(Date.UTC(2000, 0, 1, 12, 0, 0)));
    expect(jd).toBeCloseTo(2451545.0, 6);
  });

  it('matches Unix epoch JD = 2440587.5 at 1970-01-01T00:00:00Z', () => {
    const jd = julianDayFromUtc(new Date(Date.UTC(1970, 0, 1, 0, 0, 0)));
    expect(jd).toBeCloseTo(2440587.5, 6);
  });

  it('round-trips JD ↔ UTC within 1 second', () => {
    const original = new Date(Date.UTC(1987, 5, 19, 18, 37, 0));
    const jd = julianDayFromUtc(original);
    const back = utcFromJulianDay(jd);
    expect(Math.abs(back.getTime() - original.getTime())).toBeLessThan(1500);
  });

  it('is deterministic — same input, same output', () => {
    const d = new Date(Date.UTC(1990, 6, 12, 4, 30, 0));
    expect(julianDayFromUtc(d)).toBe(julianDayFromUtc(d));
  });
});
