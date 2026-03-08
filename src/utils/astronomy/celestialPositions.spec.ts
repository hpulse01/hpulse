import { describe, it, expect } from 'vitest';
import { runVerification, getCelestialSnapshot } from './celestialPositions';

describe('P0 astronomy verification', () => {
  it('all strict verification cases pass', () => {
    const cases = runVerification();
    const failed = cases.filter((c) => !c.pass);
    expect(failed, JSON.stringify(failed, null, 2)).toHaveLength(0);
  });

  it('J2000 reference is stable within 0.1°', () => {
    const s = getCelestialSnapshot(2000, 1, 1, 12, 0, 51.5074, -0.1278);
    const expected = 280.3772;
    const diff = Math.min(Math.abs(s.sun.longitude - expected), 360 - Math.abs(s.sun.longitude - expected));
    expect(diff).toBeLessThanOrEqual(0.1);
  });

  it('ASC and MC return finite values', () => {
    const s = getCelestialSnapshot(1990, 7, 15, 6, 30, 39.9042, 116.4074);
    expect(Number.isFinite(s.ascendantLongitude)).toBe(true);
    expect(Number.isFinite(s.mcLongitude)).toBe(true);
    expect(s.ascendantLongitude).toBeGreaterThanOrEqual(0);
    expect(s.ascendantLongitude).toBeLessThan(360);
    expect(s.mcLongitude).toBeGreaterThanOrEqual(0);
    expect(s.mcLongitude).toBeLessThan(360);
  });
});
