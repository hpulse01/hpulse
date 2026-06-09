/**
 * P5 — Mean lunar nodes (Rahu / Ketu).
 *
 * Mean ascending node longitude (Meeus, Astronomical Algorithms ch. 47):
 *   Ω = 125.04452 − 1934.136261·T + 0.0020708·T² + T³/450000  (degrees)
 * where T is Julian centuries from J2000.0. Rahu = Ω; Ketu = Ω + 180°.
 */
import { normalizeDeg } from '../western/planets';

export function meanLunarNodeTropicalDeg(jd: number): number {
  const T = (jd - 2451545.0) / 36525;
  const omega = 125.04452 - 1934.136261 * T + 0.0020708 * T * T + (T * T * T) / 450000;
  return normalizeDeg(omega);
}

export function meanRahuKetuTropicalDeg(jd: number): { rahu: number; ketu: number } {
  const rahu = meanLunarNodeTropicalDeg(jd);
  return { rahu, ketu: normalizeDeg(rahu + 180) };
}
