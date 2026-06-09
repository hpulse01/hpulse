import { describe, it, expect } from 'vitest';
import {
  calculateMayan, mayanToEngineOutput,
  tzolkinFromJulianDay, longCountFromJulianDay, formatLongCount,
  MAYAN_EPOCH_JD,
  haabFromDaysSinceEpoch, lordOfNightFromDaysSinceEpoch,
  calendarRoundFromDaysSinceEpoch, CALENDAR_ROUND_DAYS,
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

describe('mayan/haab calibration', () => {
  it('epoch (daysSinceEpoch=0) = 8 Cumku, G9', () => {
    const h = haabFromDaysSinceEpoch(0);
    expect(h.day).toBe(8);
    expect(h.month).toBe('Cumku');
    expect(lordOfNightFromDaysSinceEpoch(0).name).toBe('G9');
  });
  it('2012-12-21 (13.0.0.0.0) = 4 Ahau 3 Kankin, G9', () => {
    const days = 1872000;
    const h = haabFromDaysSinceEpoch(days);
    expect(h.day).toBe(3);
    expect(h.month).toBe('Kankin');
    expect(lordOfNightFromDaysSinceEpoch(days).name).toBe('G9');
    const r = calculateMayan({ utcDateTime: '2012-12-21T12:00:00Z' });
    expect(r.tzolkin.tone).toBe(4);
    expect(r.tzolkin.sign).toBe('Ahau');
    expect(r.haab.day).toBe(3);
    expect(r.haab.month).toBe('Kankin');
    expect(r.calendarRound.designation).toBe('4 Ahau 3 Kankin');
  });
  it('haab cycle is 365 days; calendar round is 18980 days', () => {
    expect(haabFromDaysSinceEpoch(365)).toEqual(haabFromDaysSinceEpoch(0));
    expect(CALENDAR_ROUND_DAYS).toBe(18980);
    const a = calendarRoundFromDaysSinceEpoch(0, tzolkinFromJulianDay(MAYAN_EPOCH_JD), haabFromDaysSinceEpoch(0));
    expect(a.designation).toBe('4 Ahau 8 Cumku');
  });
  it('wayeb days flagged', () => {
    const h = haabFromDaysSinceEpoch(365 - 348 - 5); // dayOfYear 360 → Wayeb 0
    expect(h.isWayeb).toBe(true);
    expect(h.month).toBe('Wayeb');
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
