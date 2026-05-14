/**
 * P4.9 — Western Astrology constants.
 */
import type { ZodiacSign, PlanetName, AspectName } from './types';

export const SIGNS: ZodiacSign[] = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

export const PLANETS: PlanetName[] = [
  'Sun', 'Moon', 'Mercury', 'Venus', 'Mars',
  'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto',
];

export interface AspectDef {
  name: AspectName;
  exactDeg: number;
  defaultOrbDeg: number;
}

/** Major (Ptolemaic) aspects only. */
export const ASPECTS: AspectDef[] = [
  { name: 'conjunction', exactDeg: 0,   defaultOrbDeg: 8 },
  { name: 'opposition',  exactDeg: 180, defaultOrbDeg: 8 },
  { name: 'trine',       exactDeg: 120, defaultOrbDeg: 7 },
  { name: 'square',      exactDeg: 90,  defaultOrbDeg: 6 },
  { name: 'sextile',     exactDeg: 60,  defaultOrbDeg: 4 },
];

/** Obliquity of the ecliptic at J2000.0 (degrees). */
export const OBLIQUITY_J2000_DEG = 23.4392911;
