/**
 * P4.10 — Mayan Long Count computation.
 *
 *   1 baktun = 20 katun  = 144,000 kin
 *   1 katun  = 20 tun    =   7,200 kin
 *   1 tun    = 18 uinal  =     360 kin
 *   1 uinal  = 20 kin
 *   1 kin    = 1 day
 *
 * Note: tun is 18 uinal (NOT 20) — this is the only non-vigesimal step.
 */
import { MAYAN_EPOCH_JD } from './constants';
import type { LongCount } from './types';

export function longCountFromJulianDay(jd: number): LongCount {
  const days = Math.floor(jd) - MAYAN_EPOCH_JD;
  // For dates BEFORE the epoch we report negative components honestly rather
  // than inventing a piktun cycle. For all modern Gregorian dates `days` is
  // strongly positive, so this is just defensive.
  let remaining = days;
  const baktun = Math.floor(remaining / 144000); remaining -= baktun * 144000;
  const katun  = Math.floor(remaining / 7200);   remaining -= katun  * 7200;
  const tun    = Math.floor(remaining / 360);    remaining -= tun    * 360;
  const uinal  = Math.floor(remaining / 20);     remaining -= uinal  * 20;
  const kin    = remaining;
  return { baktun, katun, tun, uinal, kin, daysSinceEpoch: days };
}

export function formatLongCount(lc: LongCount): string {
  return `${lc.baktun}.${lc.katun}.${lc.tun}.${lc.uinal}.${lc.kin}`;
}
