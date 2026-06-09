/**
 * P4.9 — Whole-Sign house system + Ascendant calculation.
 * P5 — Placidus house cusps via iterative semi-arc solver.
 */
import { SiderealTime } from 'astronomy-engine';
import { OBLIQUITY_J2000_DEG, SIGNS } from './constants';
import { normalizeDeg, longitudeToSign } from './planets';
import type { ZodiacSign } from './types';

const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;

/**
 * Compute Ascendant ecliptic longitude (tropical) from UTC date and geographic
 * latitude/longitude. Standard astrological formula:
 *   Asc = atan2( -cos(RAMC), sin(ε)·tan(φ) + cos(ε)·sin(RAMC) )
 * Then normalize so Asc lies in the eastern semicircle from MC.
 */
export function computeAscendant(
  dateUtc: Date,
  geoLatitude: number,
  geoLongitude: number,
  obliquityDeg = OBLIQUITY_J2000_DEG,
): { longitude: number; sign: ZodiacSign; degreeInSign: number } {
  // SiderealTime returns Greenwich apparent sidereal time in hours.
  const gstHours = SiderealTime(dateUtc);
  // Local sidereal time in degrees.
  const lstDeg = normalizeDeg(gstHours * 15 + geoLongitude);
  const ramc = lstDeg * D2R;
  const eps = obliquityDeg * D2R;
  const phi = geoLatitude * D2R;

  const y = -Math.cos(ramc);
  const x = Math.sin(eps) * Math.tan(phi) + Math.cos(eps) * Math.sin(ramc);
  let asc = Math.atan2(y, x) * R2D;
  asc = normalizeDeg(asc);

  // Ensure Ascendant is in the eastern half: difference (asc - lst) mod 360
  // should be in (0, 180). If not, flip 180°.
  const diff = normalizeDeg(asc - lstDeg);
  if (diff < 0 || diff > 180) {
    asc = normalizeDeg(asc + 180);
  }

  const { sign, degreeInSign } = longitudeToSign(asc);
  return { longitude: asc, sign, degreeInSign };
}

/** Whole-sign house: house = ((signIndex - ascSignIndex) mod 12) + 1. */
export function wholeSignHouse(planetSign: ZodiacSign, ascSign: ZodiacSign): number {
  const ai = SIGNS.indexOf(ascSign);
  const pi = SIGNS.indexOf(planetSign);
  return ((pi - ai + 12) % 12) + 1;
}

/** Ecliptic longitude of a point on the ecliptic given its right ascension. */
function eclipticLongitudeFromRA(raDeg: number, eps: number): number {
  const ra = raDeg * D2R;
  const lon = Math.atan2(Math.sin(ra) / Math.cos(eps), Math.cos(ra)) * R2D;
  return normalizeDeg(lon);
}

/** Midheaven (MC) ecliptic longitude from RAMC. */
export function computeMidheaven(
  dateUtc: Date,
  geoLongitude: number,
  obliquityDeg = OBLIQUITY_J2000_DEG,
): { longitude: number; sign: ZodiacSign; degreeInSign: number } {
  const gstHours = SiderealTime(dateUtc);
  const ramcDeg = normalizeDeg(gstHours * 15 + geoLongitude);
  const lon = eclipticLongitudeFromRA(ramcDeg, obliquityDeg * D2R);
  const { sign, degreeInSign } = longitudeToSign(lon);
  return { longitude: lon, sign, degreeInSign };
}

export interface HouseCusp {
  house: number;
  longitude: number;
  sign: ZodiacSign;
  degreeInSign: number;
}

/**
 * Placidus house cusps via the classic iterative semi-arc method.
 *
 * Intermediate cusps trisect the semi-diurnal arc (cusps 11, 12) and the
 * semi-nocturnal arc (cusps 2, 3) in right ascension:
 *   cusp11 RA = RAMC + SA/3, cusp12 RA = RAMC + 2·SA/3,
 *   cusp2  RA = RAMC + 180 − 2·SN/3, cusp3 RA = RAMC + 180 − SN/3,
 * where SA = arccos(−tan φ · tan δ), SN = 180 − SA, and δ is the declination
 * of the cusp point (tan δ = tan ε · sin RA, exact for ecliptic points).
 * Solved by fixed-point iteration; remaining cusps are oppositions.
 *
 * Returns null for circumpolar latitudes (|φ| ≥ 90° − ε) where Placidus is
 * undefined — caller should fall back to whole-sign.
 */
export function computePlacidusCusps(
  dateUtc: Date,
  geoLatitude: number,
  geoLongitude: number,
  obliquityDeg = OBLIQUITY_J2000_DEG,
): HouseCusp[] | null {
  if (Math.abs(geoLatitude) >= 90 - obliquityDeg) return null;

  const eps = obliquityDeg * D2R;
  const phi = geoLatitude * D2R;
  const gstHours = SiderealTime(dateUtc);
  const ramcDeg = normalizeDeg(gstHours * 15 + geoLongitude);

  const semiArcFor = (raDeg: number): number => {
    const delta = Math.atan(Math.tan(eps) * Math.sin(raDeg * D2R));
    const cosArg = -Math.tan(phi) * Math.tan(delta);
    if (cosArg <= -1 || cosArg >= 1) return Number.NaN;
    return Math.acos(cosArg) * R2D; // semi-diurnal arc in degrees
  };

  // [startOffsetDeg, solver] per intermediate cusp
  const solveCusp = (startOffset: number, raFromArc: (sa: number) => number): number | null => {
    let ra = normalizeDeg(ramcDeg + startOffset);
    for (let i = 0; i < 30; i++) {
      const sa = semiArcFor(ra);
      if (Number.isNaN(sa)) return null;
      const next = normalizeDeg(raFromArc(sa));
      if (Math.abs(normalizeDeg(next - ra + 180) - 180) < 1e-7) { ra = next; break; }
      ra = next;
    }
    return ra;
  };

  const ra11 = solveCusp(30, (sa) => ramcDeg + sa / 3);
  const ra12 = solveCusp(60, (sa) => ramcDeg + (2 * sa) / 3);
  const ra2 = solveCusp(120, (sa) => ramcDeg + 180 - (2 * (180 - sa)) / 3);
  const ra3 = solveCusp(150, (sa) => ramcDeg + 180 - (180 - sa) / 3);
  if (ra11 == null || ra12 == null || ra2 == null || ra3 == null) return null;

  const asc = computeAscendant(dateUtc, geoLatitude, geoLongitude, obliquityDeg).longitude;
  const mc = eclipticLongitudeFromRA(ramcDeg, eps);

  const lons: Record<number, number> = {
    1: asc,
    10: mc,
    11: eclipticLongitudeFromRA(ra11, eps),
    12: eclipticLongitudeFromRA(ra12, eps),
    2: eclipticLongitudeFromRA(ra2, eps),
    3: eclipticLongitudeFromRA(ra3, eps),
  };
  lons[4] = normalizeDeg(lons[10] + 180);
  lons[5] = normalizeDeg(lons[11] + 180);
  lons[6] = normalizeDeg(lons[12] + 180);
  lons[7] = normalizeDeg(lons[1] + 180);
  lons[8] = normalizeDeg(lons[2] + 180);
  lons[9] = normalizeDeg(lons[3] + 180);

  const cusps: HouseCusp[] = [];
  for (let h = 1; h <= 12; h++) {
    const { sign, degreeInSign } = longitudeToSign(lons[h]);
    cusps.push({ house: h, longitude: lons[h], sign, degreeInSign });
  }
  return cusps;
}

/** House number for an ecliptic longitude given 12 cusp longitudes (any quadrant system). */
export function houseFromCusps(longitude: number, cusps: HouseCusp[]): number {
  for (let i = 0; i < 12; i++) {
    const start = cusps[i].longitude;
    const end = cusps[(i + 1) % 12].longitude;
    const span = normalizeDeg(end - start);
    const off = normalizeDeg(longitude - start);
    if (off < span || span === 0) return cusps[i].house;
  }
  return 12;
}
