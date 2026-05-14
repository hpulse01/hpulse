/**
 * P4.9 — Vedic Astrology types.
 */
import type { StandardizedInput } from '../../types/prediction';
import type { PlanetName } from '../western/types';

export type Rashi =
  | 'Mesha' | 'Vrishabha' | 'Mithuna' | 'Karka'
  | 'Simha' | 'Kanya' | 'Tula' | 'Vrischika'
  | 'Dhanu' | 'Makara' | 'Kumbha' | 'Meena';

export type NakshatraName =
  | 'Ashwini' | 'Bharani' | 'Krittika' | 'Rohini' | 'Mrigashira'
  | 'Ardra' | 'Punarvasu' | 'Pushya' | 'Ashlesha' | 'Magha'
  | 'Purva Phalguni' | 'Uttara Phalguni' | 'Hasta' | 'Chitra' | 'Swati'
  | 'Vishakha' | 'Anuradha' | 'Jyeshtha' | 'Mula' | 'Purva Ashadha'
  | 'Uttara Ashadha' | 'Shravana' | 'Dhanishta' | 'Shatabhisha'
  | 'Purva Bhadrapada' | 'Uttara Bhadrapada' | 'Revati';

export type DashaLord =
  | 'Ketu' | 'Venus' | 'Sun' | 'Moon' | 'Mars'
  | 'Rahu' | 'Jupiter' | 'Saturn' | 'Mercury';

export interface SiderealPosition {
  planet: PlanetName;
  /** Sidereal ecliptic longitude in degrees [0, 360). */
  longitude: number;
  rashi: Rashi;
  /** Degrees within rashi [0, 30). */
  degreeInRashi: number;
  nakshatra: NakshatraName;
  /** 1..4. */
  pada: number;
}

export interface DashaPeriod {
  lord: DashaLord;
  /** Start ISO UTC. */
  startUtc: string;
  /** End ISO UTC. */
  endUtc: string;
  /** Duration in years (Vimshottari fixed). */
  years: number;
}

export interface VedicWarning {
  code: string; message: string; level: 'info' | 'warn' | 'error';
}

export interface ExplanationStep {
  rule: string; detail: string; data?: Record<string, unknown>;
}

export interface VedicInput extends Partial<StandardizedInput> {
  birthUtcDateTime: string;
  geoLatitude?: number;
  geoLongitude?: number;
  timezoneIana: string;
}

export interface VedicChart {
  input: VedicInput;
  julianDay: number;
  ayanamsaDeg: number;
  ayanamsaSystem: 'Lahiri';
  planets: SiderealPosition[];
  lagna: { longitude: number; rashi: Rashi; degreeInRashi: number } | null;
  moonNakshatra: { name: NakshatraName; pada: number; lord: DashaLord } | null;
  vimshottariMahadasha: DashaPeriod[];
  confidence: number;
  completenessScore: number;
  sourceGrade: 'A' | 'B' | 'C' | 'D';
  implementationStatus: 'complete' | 'partial' | 'needs_source_validation';
  warnings: VedicWarning[];
  explanationTrace: ExplanationStep[];
}
