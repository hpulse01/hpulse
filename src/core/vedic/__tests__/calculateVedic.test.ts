/**
 * P4.9 — Vedic astrology tests.
 */
import { describe, it, expect } from 'vitest';
import {
  calculateVedicChart, vedicChartToEngineOutput,
  lahiriAyanamsaDeg, nakshatraOf, NAKSHATRAS, RASHIS,
} from '../index';

const INPUT = {
  birthUtcDateTime: '2000-01-01T12:00:00.000Z',
  geoLatitude: 28.6139,
  geoLongitude: 77.2090,
  timezoneIana: 'Asia/Kolkata',
};

describe('vedic/ayanamsa', () => {
  it('Lahiri at J2000 ≈ 23.85°', () => {
    expect(lahiriAyanamsaDeg(2451545.0)).toBeCloseTo(23.85, 4);
  });
  it('grows monotonically with time', () => {
    expect(lahiriAyanamsaDeg(2470000)).toBeGreaterThan(lahiriAyanamsaDeg(2451545));
  });
});

describe('vedic/nakshatra', () => {
  it('27 nakshatras, 4 padas each', () => {
    expect(NAKSHATRAS).toHaveLength(27);
    const nk = nakshatraOf(0);
    expect(nk.name).toBe('Ashwini');
    expect(nk.pada).toBe(1);
    expect(nakshatraOf(359.99).name).toBe('Revati');
  });
});

describe('vedic/calculateChart', () => {
  it('produces sidereal positions, lagna, mahadasha', () => {
    const c = calculateVedicChart(INPUT);
    expect(c.planets).toHaveLength(10);
    expect(c.ayanamsaSystem).toBe('Lahiri');
    expect(c.ayanamsaDeg).toBeGreaterThan(23);
    expect(c.lagna).not.toBeNull();
    expect(c.moonNakshatra).not.toBeNull();
    expect(c.vimshottariMahadasha).toHaveLength(9);

    for (const p of c.planets) {
      expect(p.longitude).toBeGreaterThanOrEqual(0);
      expect(p.longitude).toBeLessThan(360);
      expect(RASHIS).toContain(p.rashi);
      expect(NAKSHATRAS).toContain(p.nakshatra);
      expect(p.pada).toBeGreaterThanOrEqual(1);
      expect(p.pada).toBeLessThanOrEqual(4);
    }
  });

  it('is deterministic', () => {
    const a = calculateVedicChart(INPUT);
    const b = calculateVedicChart(INPUT);
    expect(b.planets.map((p) => p.longitude)).toEqual(a.planets.map((p) => p.longitude));
    expect(b.vimshottariMahadasha[0].lord).toBe(a.vimshottariMahadasha[0].lord);
  });

  it('mahadasha periods are contiguous and total ~120 years', () => {
    const c = calculateVedicChart(INPUT);
    const periods = c.vimshottariMahadasha;
    for (let i = 1; i < periods.length; i++) {
      expect(periods[i].startUtc).toBe(periods[i - 1].endUtc);
    }
    const total = periods.reduce((s, p) => s + p.years, 0);
    expect(total).toBeGreaterThan(110);
    expect(total).toBeLessThanOrEqual(120);
  });

  it('skips lagna without geo and warns', () => {
    const c = calculateVedicChart({
      birthUtcDateTime: INPUT.birthUtcDateTime,
      timezoneIana: 'UTC',
    });
    expect(c.lagna).toBeNull();
    expect(c.warnings.some((w) => w.code === 'no_geo_lagna')).toBe(true);
  });
});

describe('vedic/toEngineOutput', () => {
  it('produces a valid EngineOutput', () => {
    const out = vedicChartToEngineOutput(calculateVedicChart(INPUT));
    expect(out.engineName).toBe('vedic');
    expect(out.timingBasis).toBe('birth');
    expect(Object.keys(out.fateVector)).toHaveLength(10);
    expect(out.normalizedOutput.ayanamsaSystem).toBe('Lahiri');
    expect(out.uncertaintyNotes.length).toBeGreaterThan(0);
    expect(out.eventCandidates.length).toBeGreaterThan(0);
  });
});
