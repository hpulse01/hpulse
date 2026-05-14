import { describe, it, expect } from 'vitest';
import {
  calculateMayan, mayanToEngineOutput,
  tzolkinFromJulianDay, longCountFromJulianDay, formatLongCount,
  MAYAN_EPOCH_JD,
} from '../index';

describe('mayan/tzolkin calibration', () => {
  it('JD 584283 (epoch) = 4 Ahau', () => {
    const tz = tzolkinFromJulianDay(MAYAN_EPOCH_JD);
    expect(tz.tone).toBe(4);
    expect(tz.sign).toBe('Ahau');
  });
  it('cycle is 260 days', () => {
    const a = tzolkinFromJulianDay(2451545);
    const b = tzolkinFromJulianDay(2451545 + 260);
    expect(b).toEqual(a);
  });
  it('long count epoch = 0.0.0.0.0', () => {
    expect(formatLongCount(longCountFromJulianDay(MAYAN_EPOCH_JD))).toBe('0.0.0.0.0');
  });
  it('long count one tun later = 0.0.1.0.0 (360 days)', () => {
    expect(formatLongCount(longCountFromJulianDay(MAYAN_EPOCH_JD + 360))).toBe('0.0.1.0.0');
  });
});

describe('mayan/calculate', () => {
  it('deterministic', () => {
    const a = calculateMayan({ utcDateTime: '2000-01-01T12:00:00Z' });
    const b = calculateMayan({ utcDateTime: '2000-01-01T12:00:00Z' });
    expect(b.tzolkin).toEqual(a.tzolkin);
    expect(b.longCount).toEqual(a.longCount);
  });
  it('produces a valid EngineOutput', () => {
    const out = mayanToEngineOutput(calculateMayan({ utcDateTime: '2000-01-01T12:00:00Z' }));
    expect(out.engineName).toBe('mayan');
    expect(Object.keys(out.fateVector)).toHaveLength(10);
    expect(out.normalizedOutput.tzolkinSign).toBeDefined();
    expect(out.normalizedOutput.longCount).toMatch(/^\d+\.\d+\.\d+\.\d+\.\d+$/);
  });
});
