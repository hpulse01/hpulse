/**
 * P4.9 — Whole-Sign house system + Ascendant calculation.
 *
 * Placidus is intentionally NOT implemented — would require iterative
 * semi-arc solver. We surface a warning when callers ask for it.
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
