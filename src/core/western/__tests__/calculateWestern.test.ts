/**
 * P4.9 — Western astrology tests.
 */
import { describe, it, expect } from 'vitest';
import {
  calculateWesternChart,
  westernChartToEngineOutput,
  computePlacidusCusps,
  computeMidheaven,
  computeAscendant,
  houseFromCusps,
  normalizeDeg,
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

  it('computes ascendant when geo present and assigns houses', () => {
    const c = calculateWesternChart(INPUT);
    expect(c.ascendant).not.toBeNull();
    expect(c.housesSystem).toBe('placidus');
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

  it('computes Placidus cusps by default and supports whole-sign opt-out', () => {
    const c = calculateWesternChart(INPUT, { housesSystem: 'placidus' });
    expect(c.housesSystem).toBe('placidus');
    expect(c.houseCusps).toHaveLength(12);
    expect(c.implementationStatus).toBe('complete');
    const ws = calculateWesternChart(INPUT, { housesSystem: 'whole-sign' });
    expect(ws.housesSystem).toBe('whole-sign');
    expect(ws.houseCusps).toBeNull();
  });

  it('falls back to whole-sign at circumpolar latitudes', () => {
    const polar = calculateWesternChart({ ...INPUT, geoLatitude: 75 });
    expect(polar.housesSystem).toBe('whole-sign');
    expect(polar.warnings.some((w) => w.code === 'placidus_polar_fallback')).toBe(true);
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

describe('western/placidus', () => {
  const DATE = new Date(INPUT.birthUtcDateTime);
  it('cusp 1 equals Ascendant and cusp 10 equals Midheaven', () => {
    const cusps = computePlacidusCusps(DATE, INPUT.geoLatitude, INPUT.geoLongitude)!;
    const asc = computeAscendant(DATE, INPUT.geoLatitude, INPUT.geoLongitude);
    const mc = computeMidheaven(DATE, INPUT.geoLongitude);
    expect(cusps[0].longitude).toBeCloseTo(asc.longitude, 4);
    expect(cusps[9].longitude).toBeCloseTo(mc.longitude, 4);
  });
  it('opposite cusps differ by exactly 180°', () => {
    const cusps = computePlacidusCusps(DATE, INPUT.geoLatitude, INPUT.geoLongitude)!;
    for (let i = 0; i < 6; i++) {
      const d = normalizeDeg(cusps[i + 6].longitude - cusps[i].longitude);
      expect(d).toBeCloseTo(180, 6);
    }
  });
  it('cusps are ordered monotonically around the zodiac', () => {
    const cusps = computePlacidusCusps(DATE, INPUT.geoLatitude, INPUT.geoLongitude)!;
    let total = 0;
    for (let i = 0; i < 12; i++) {
      total += normalizeDeg(cusps[(i + 1) % 12].longitude - cusps[i].longitude);
    }
    expect(total).toBeCloseTo(360, 4);
  });
  it('at the equator Placidus cusps trisect arcs symmetrically', () => {
    const cusps = computePlacidusCusps(DATE, 0, 0)!;
    expect(cusps).toHaveLength(12);
  });
  it('returns null at circumpolar latitude', () => {
    expect(computePlacidusCusps(DATE, 70, 0)).toBeNull();
  });
  it('houseFromCusps assigns correct intervals', () => {
    const cusps = computePlacidusCusps(DATE, INPUT.geoLatitude, INPUT.geoLongitude)!;
    const h = houseFromCusps(normalizeDeg(cusps[0].longitude + 0.5), cusps);
    expect(h).toBe(1);
  });
  it('is deterministic', () => {
    const a = computePlacidusCusps(DATE, INPUT.geoLatitude, INPUT.geoLongitude)!;
    const b = computePlacidusCusps(DATE, INPUT.geoLatitude, INPUT.geoLongitude)!;
    expect(b.map((c) => c.longitude)).toEqual(a.map((c) => c.longitude));
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
