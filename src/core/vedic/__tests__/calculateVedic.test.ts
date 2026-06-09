/**
 * P4.9 — Vedic astrology tests.
 */
import { describe, it, expect } from 'vitest';
import {
  calculateVedicChart, vedicChartToEngineOutput,
  lahiriAyanamsaDeg, nakshatraOf, NAKSHATRAS, RASHIS,
  meanLunarNodeTropicalDeg, navamsaRashiOf,
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
    // First period is partial (balance of birth nakshatra) → total = 120 - traversed.
    expect(total).toBeGreaterThan(100);
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

describe('vedic/nodes', () => {
  it('mean node at J2000 ≈ 125.04°', () => {
    expect(meanLunarNodeTropicalDeg(2451545.0)).toBeCloseTo(125.04452, 3);
  });
  it('Rahu and Ketu are 180° apart and included in chart', () => {
    const c = calculateVedicChart(INPUT);
    const diff = (c.nodes.ketu.longitude - c.nodes.rahu.longitude + 360) % 360;
    expect(diff).toBeCloseTo(180, 6);
    expect(RASHIS).toContain(c.nodes.rahu.rashi);
    expect(NAKSHATRAS).toContain(c.nodes.rahu.nakshatra);
  });
});

describe('vedic/navamsa', () => {
  it('0° Mesha → Mesha navamsa, last segment of Mesha → Dhanu', () => {
    expect(navamsaRashiOf(0).rashi).toBe('Mesha');
    expect(navamsaRashiOf(0).navamsaNumber).toBe(1);
    expect(navamsaRashiOf(29.99).rashi).toBe('Dhanu');
    expect(navamsaRashiOf(29.99).navamsaNumber).toBe(9);
  });
  it('0° Vrishabha → Makara navamsa (movable/fixed/dual rule emerges)', () => {
    expect(navamsaRashiOf(30).rashi).toBe('Makara');
  });
  it('chart planets and lagna include navamsaRashi', () => {
    const c = calculateVedicChart(INPUT);
    for (const p of c.planets) expect(RASHIS).toContain(p.navamsaRashi);
    expect(RASHIS).toContain(c.lagna!.navamsaRashi);
  });
});

describe('vedic/antardasha', () => {
  it('every mahadasha has antardashas starting with its own lord', () => {
    const c = calculateVedicChart(INPUT);
    for (let i = 1; i < c.vimshottariMahadasha.length; i++) {
      const d = c.vimshottariMahadasha[i];
      expect(d.antardashas).toHaveLength(9);
      expect(d.antardashas![0].lord).toBe(d.lord);
      expect(d.antardashas![0].startUtc).toBe(d.startUtc);
      const total = d.antardashas!.reduce((s, a) => s + a.years, 0);
      expect(total).toBeCloseTo(d.years, 6);
      for (let j = 1; j < 9; j++) {
        expect(d.antardashas![j].startUtc).toBe(d.antardashas![j - 1].endUtc);
      }
    }
  });
  it('birth mahadasha antardashas drop pre-birth sub-periods', () => {
    const c = calculateVedicChart(INPUT);
    const first = c.vimshottariMahadasha[0];
    expect(first.antardashas!.length).toBeGreaterThan(0);
    expect(first.antardashas!.length).toBeLessThanOrEqual(9);
    const birthMs = new Date(INPUT.birthUtcDateTime).getTime();
    for (const a of first.antardashas!) {
      expect(new Date(a.endUtc).getTime()).toBeGreaterThan(birthMs);
    }
    const lastEnd = first.antardashas![first.antardashas!.length - 1].endUtc;
    expect(Math.abs(new Date(lastEnd).getTime() - new Date(first.endUtc).getTime())).toBeLessThan(1000);
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
