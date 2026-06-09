/**
 * P4.9 — Western Astrology types.
 */
import type { StandardizedInput } from '../../types/prediction';

export type ZodiacSign =
  | 'Aries' | 'Taurus' | 'Gemini' | 'Cancer'
  | 'Leo' | 'Virgo' | 'Libra' | 'Scorpio'
  | 'Sagittarius' | 'Capricorn' | 'Aquarius' | 'Pisces';

export type PlanetName =
  | 'Sun' | 'Moon' | 'Mercury' | 'Venus' | 'Mars'
  | 'Jupiter' | 'Saturn' | 'Uranus' | 'Neptune' | 'Pluto';

export type AspectName = 'conjunction' | 'opposition' | 'trine' | 'square' | 'sextile';

export interface PlanetPosition {
  planet: PlanetName;
  /** Geocentric tropical ecliptic longitude in degrees [0, 360). */
  longitude: number;
  /** Sign occupied. */
  sign: ZodiacSign;
  /** Degrees within sign [0, 30). */
  degreeInSign: number;
  /** Whole-sign house number 1..12. Null if no birth Asc available. */
  house: number | null;
}

export interface AspectHit {
  a: PlanetName;
  b: PlanetName;
  aspect: AspectName;
  exactDeg: number;        // 0/60/90/120/180
  separationDeg: number;   // actual separation
  orbDeg: number;          // |sep - exact|
}

export interface WesternWarning {
  code: string; message: string; level: 'info' | 'warn' | 'error';
}

export interface ExplanationStep {
  rule: string; detail: string; data?: Record<string, unknown>;
}

export interface WesternInput extends Partial<StandardizedInput> {
  birthUtcDateTime: string;
  geoLatitude: number;
  geoLongitude: number;
  timezoneIana: string;
}

export interface WesternChart {
  input: WesternInput;
  julianDay: number;
  planets: PlanetPosition[];
  ascendant: { longitude: number; sign: ZodiacSign; degreeInSign: number } | null;
  midheaven: { longitude: number; sign: ZodiacSign; degreeInSign: number } | null;
  housesSystem: 'whole-sign' | 'placidus';
  houseCusps: { house: number; longitude: number; sign: ZodiacSign; degreeInSign: number }[] | null;
  aspects: AspectHit[];
  confidence: number;
  completenessScore: number;
  sourceGrade: 'A' | 'B' | 'C' | 'D';
  implementationStatus: 'complete' | 'partial' | 'needs_source_validation';
  warnings: WesternWarning[];
  explanationTrace: ExplanationStep[];
}
