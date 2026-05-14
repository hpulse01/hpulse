/**
 * P4.9 — Western astrology tests.
 */
import { describe, it, expect } from 'vitest';
import {
  calculateWesternChart,
  westernChartToEngineOutput,
  PLANETS,
  longitudeToSign,
  angularSeparation,
} from '../index';

const INPUT = {
  birthUtcDateTime: '2000-01-01T12:00:00.000Z',
  geoLatitude: 51.4779,
  geoLongitude: -0.0015,
  timezoneIana: 'UTC',
};

describe('western/calculateChart', () => {
  it('produces a planet position for every supported body', () => {
    const c = calculateWesternChart(INPUT);
    expect(c.planets).toHaveLength(PLANETS.length);
    for (const p of c.planets) {
      expect(p.longitude).toBeGreaterThanOrEqual(0);
      expect(p.longitude).toBeLessThan(360);
      expect(p.degreeInSign).toBeGreaterThanOrEqual(0);
      expect(p.degreeInSign).toBeLessThan(30);
      expect(p.sign).toBeDefined();
    }
  });

  it('computes ascendant when geo present and assigns whole-sign houses', () => {
    const c = calculateWesternChart(INPUT);
    expect(c.ascendant).not.toBeNull();
    expect(c.housesSystem).toBe('whole-sign');
    for (const p of c.planets) {
      expect(p.house).toBeGreaterThanOrEqual(1);
      expect(p.house).toBeLessThanOrEqual(12);
    }
  });

  it('is deterministic for the same input', () => {
    const a = calculateWesternChart(INPUT);
    const b = calculateWesternChart(INPUT);
    expect(b.planets.map((p) => p.longitude)).toEqual(a.planets.map((p) => p.longitude));
    expect(b.aspects.length).toBe(a.aspects.length);
  });

  it('warns and falls back when placidus requested', () => {
    const c = calculateWesternChart(INPUT, { housesSystem: 'placidus' });
    expect(c.warnings.some((w) => w.code === 'placidus_not_implemented')).toBe(true);
    expect(c.housesSystem).toBe('whole-sign');
  });

  it('Sun on 2000-01-01T12:00Z is in Capricorn', () => {
    const c = calculateWesternChart(INPUT);
    const sun = c.planets.find((p) => p.planet === 'Sun')!;
    expect(sun.sign).toBe('Capricorn');
  });

  it('detected aspects have orb within tolerance', () => {
    const c = calculateWesternChart(INPUT);
    for (const a of c.aspects) {
      expect(a.orbDeg).toBeGreaterThanOrEqual(0);
      expect(a.orbDeg).toBeLessThanOrEqual(8);
    }
  });
});

describe('western/utils', () => {
  it('longitudeToSign at boundaries', () => {
    expect(longitudeToSign(0).sign).toBe('Aries');
    expect(longitudeToSign(29.999).sign).toBe('Aries');
    expect(longitudeToSign(30).sign).toBe('Taurus');
    expect(longitudeToSign(359.5).sign).toBe('Pisces');
  });

  it('angularSeparation symmetric', () => {
    expect(angularSeparation(10, 350)).toBeCloseTo(20, 6);
    expect(angularSeparation(170, 10)).toBeCloseTo(160, 6);
  });
});

describe('western/toEngineOutput', () => {
  it('produces a valid EngineOutput', () => {
    const out = westernChartToEngineOutput(calculateWesternChart(INPUT));
    expect(out.engineName).toBe('western');
    expect(out.timingBasis).toBe('birth');
    expect(Object.keys(out.fateVector)).toHaveLength(10);
    expect(out.explanationTrace.length).toBeGreaterThan(0);
    expect(out.eventCandidates.length).toBeGreaterThan(0);
  });
});
