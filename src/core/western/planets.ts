/**
 * P4.9 — Geocentric ecliptic longitudes via astronomy-engine.
 */
import { Body, GeoVector, Ecliptic } from 'astronomy-engine';
import type { PlanetName, PlanetPosition, ZodiacSign } from './types';
import { PLANETS, SIGNS } from './constants';

export function normalizeDeg(d: number): number {
  let x = d % 360;
  if (x < 0) x += 360;
  return x;
}

export function longitudeToSign(lonDeg: number): { sign: ZodiacSign; degreeInSign: number } {
  const lon = normalizeDeg(lonDeg);
  const idx = Math.floor(lon / 30);
  return { sign: SIGNS[idx], degreeInSign: lon - idx * 30 };
}

const BODY_MAP: Record<PlanetName, Body> = {
  Sun: Body.Sun,
  Moon: Body.Moon,
  Mercury: Body.Mercury,
  Venus: Body.Venus,
  Mars: Body.Mars,
  Jupiter: Body.Jupiter,
  Saturn: Body.Saturn,
  Uranus: Body.Uranus,
  Neptune: Body.Neptune,
  Pluto: Body.Pluto,
};

/** Compute geocentric apparent ecliptic longitude (tropical, of-date). */
export function planetLongitude(planet: PlanetName, dateUtc: Date): number {
  const v = GeoVector(BODY_MAP[planet], dateUtc, true /* aberration */);
  const e = Ecliptic(v);
  return normalizeDeg(e.elon);
}

export function computePlanetPositions(dateUtc: Date): PlanetPosition[] {
  return PLANETS.map((p) => {
    const lon = planetLongitude(p, dateUtc);
    const { sign, degreeInSign } = longitudeToSign(lon);
    return { planet: p, longitude: lon, sign, degreeInSign, house: null };
  });
}
