/**
 * P4.9 — Nakshatra & pada from sidereal longitude.
 */
import { NAKSHATRAS, NAKSHATRA_LORDS, NAKSHATRA_SPAN_DEG, PADA_SPAN_DEG } from './constants';
import type { DashaLord, NakshatraName } from './types';

export function nakshatraOf(siderealLonDeg: number): {
  name: NakshatraName;
  pada: number;
  lord: DashaLord;
  index: number;
  /** Position within nakshatra in degrees [0, 13.333…). */
  posInNakshatra: number;
} {
  let lon = siderealLonDeg % 360;
  if (lon < 0) lon += 360;
  const index = Math.floor(lon / NAKSHATRA_SPAN_DEG);
  const posInNakshatra = lon - index * NAKSHATRA_SPAN_DEG;
  const pada = Math.min(4, Math.floor(posInNakshatra / PADA_SPAN_DEG) + 1);
  return {
    name: NAKSHATRAS[index],
    pada,
    lord: NAKSHATRA_LORDS[index],
    index,
    posInNakshatra,
  };
}
