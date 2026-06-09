/**
 * P5 — D9 Navamsa divisional chart.
 *
 * Each rashi (30°) is divided into nine 3°20' segments. The navamsa sign is
 * given by the classical continuous-count rule, equivalent to:
 *   navamsaIndex = (rashiIndex · 9 + floor(degInRashi / (30/9))) mod 12
 * which reproduces the movable/fixed/dual starting-sign scheme.
 */
import { RASHIS } from './constants';
import type { Rashi } from './types';

export const NAVAMSA_SPAN_DEG = 30 / 9;

export function navamsaRashiOf(siderealLonDeg: number): { rashi: Rashi; navamsaNumber: number } {
  let lon = siderealLonDeg % 360;
  if (lon < 0) lon += 360;
  const rashiIndex = Math.floor(lon / 30);
  const degInRashi = lon - rashiIndex * 30;
  const seg = Math.min(8, Math.floor(degInRashi / NAVAMSA_SPAN_DEG));
  const navIdx = (rashiIndex * 9 + seg) % 12;
  return { rashi: RASHIS[navIdx], navamsaNumber: seg + 1 };
}
