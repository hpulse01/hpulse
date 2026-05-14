/**
 * P4.9 — Vimshottari Mahadasha computation (basic, top-level only).
 *
 * Algorithm:
 *  1. Compute Moon's nakshatra and how far it has traversed.
 *  2. The current Mahadasha lord = nakshatra lord; remaining balance =
 *     (1 - traversedFraction) * lord.years.
 *  3. Birth falls inside that period; subsequent periods follow the
 *     cyclic VIMSHOTTARI_SEQUENCE.
 *
 * We emit the birth Mahadasha plus the next 8 (full 9-lord cycle = 120y).
 */
import { NAKSHATRA_SPAN_DEG, VIMSHOTTARI_SEQUENCE, VIMSHOTTARI_YEARS, TROPICAL_YEAR_DAYS } from './constants';
import { nakshatraOf } from './nakshatra';
import type { DashaLord, DashaPeriod } from './types';

const MS_PER_DAY = 86400_000;

export function computeVimshottariMahadasha(
  moonSiderealLonDeg: number,
  birthUtcDateTime: string,
): DashaPeriod[] {
  const nk = nakshatraOf(moonSiderealLonDeg);
  const lord = nk.lord;
  const traversedFraction = nk.posInNakshatra / NAKSHATRA_SPAN_DEG;
  const remainingYears = (1 - traversedFraction) * VIMSHOTTARI_YEARS[lord];

  const startMs = new Date(birthUtcDateTime).getTime();
  if (Number.isNaN(startMs)) {
    throw new Error(`vedic dasha: invalid birthUtcDateTime "${birthUtcDateTime}"`);
  }

  const periods: DashaPeriod[] = [];
  // Birth period (partial) — start at birth, end after `remainingYears`.
  let cursorMs = startMs;
  const firstEnd = cursorMs + remainingYears * TROPICAL_YEAR_DAYS * MS_PER_DAY;
  periods.push({
    lord,
    startUtc: new Date(cursorMs).toISOString(),
    endUtc: new Date(firstEnd).toISOString(),
    years: remainingYears,
  });
  cursorMs = firstEnd;

  // Following 8 lords in sequence, each full duration.
  const startIdx = VIMSHOTTARI_SEQUENCE.indexOf(lord);
  for (let i = 1; i <= 8; i++) {
    const nextLord: DashaLord = VIMSHOTTARI_SEQUENCE[(startIdx + i) % 9];
    const dur = VIMSHOTTARI_YEARS[nextLord];
    const endMs = cursorMs + dur * TROPICAL_YEAR_DAYS * MS_PER_DAY;
    periods.push({
      lord: nextLord,
      startUtc: new Date(cursorMs).toISOString(),
      endUtc: new Date(endMs).toISOString(),
      years: dur,
    });
    cursorMs = endMs;
  }

  return periods;
}
