/**
 * P4.9 — Vedic constants: rashis, nakshatras, Vimshottari dasha lords.
 */
import type { Rashi, NakshatraName, DashaLord } from './types';

export const RASHIS: Rashi[] = [
  'Mesha', 'Vrishabha', 'Mithuna', 'Karka',
  'Simha', 'Kanya', 'Tula', 'Vrischika',
  'Dhanu', 'Makara', 'Kumbha', 'Meena',
];

export const NAKSHATRAS: NakshatraName[] = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira',
  'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha', 'Magha',
  'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati',
  'Vishakha', 'Anuradha', 'Jyeshtha', 'Mula', 'Purva Ashadha',
  'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
  'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
];

/** Each nakshatra spans 360°/27 = 13°20'. */
export const NAKSHATRA_SPAN_DEG = 360 / 27;
/** Each pada spans NAKSHATRA_SPAN_DEG / 4. */
export const PADA_SPAN_DEG = NAKSHATRA_SPAN_DEG / 4;

/** Vimshottari dasha lord sequence (cyclic). */
export const VIMSHOTTARI_SEQUENCE: DashaLord[] = [
  'Ketu', 'Venus', 'Sun', 'Moon', 'Mars',
  'Rahu', 'Jupiter', 'Saturn', 'Mercury',
];

/** Vimshottari dasha durations in years (sums to 120). */
export const VIMSHOTTARI_YEARS: Record<DashaLord, number> = {
  Ketu: 7, Venus: 20, Sun: 6, Moon: 10, Mars: 7,
  Rahu: 18, Jupiter: 16, Saturn: 19, Mercury: 17,
};

/** Nakshatra lord cycle (also length 27, repeating Ketu→…→Mercury 3 times). */
export const NAKSHATRA_LORDS: DashaLord[] = NAKSHATRAS.map(
  (_, i) => VIMSHOTTARI_SEQUENCE[i % 9],
);

/** Tropical year (days). */
export const TROPICAL_YEAR_DAYS = 365.2422;
