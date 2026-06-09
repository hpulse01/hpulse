/**
 * P4.9 — Vimshottari Mahadasha computation.
 * P5 — Antardasha (bhukti) sub-periods added.
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

/**
 * Antardasha sub-periods of one Mahadasha. The sequence starts with the
 * Mahadasha lord itself; each bhukti lasts mahaYears · (lordYears / 120).
 */
export function computeAntardasha(
  mahaLord: DashaLord,
  mahaStartMs: number,
  mahaYears: number,
): DashaPeriod[] {
  const startIdx = VIMSHOTTARI_SEQUENCE.indexOf(mahaLord);
  const subs: DashaPeriod[] = [];
  let cursorMs = mahaStartMs;
  for (let i = 0; i < 9; i++) {
    const lord: DashaLord = VIMSHOTTARI_SEQUENCE[(startIdx + i) % 9];
    const years = (mahaYears * VIMSHOTTARI_YEARS[lord]) / 120;
    const endMs = cursorMs + years * TROPICAL_YEAR_DAYS * MS_PER_DAY;
    subs.push({
      lord,
      startUtc: new Date(cursorMs).toISOString(),
      endUtc: new Date(endMs).toISOString(),
      years,
    });
    cursorMs = endMs;
  }
  return subs;
}

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
  // Antardashas are computed from the THEORETICAL Mahadasha start (before
  // birth) so bhukti boundaries are astrologically correct; sub-periods
  // ending before birth are dropped.
  let cursorMs = startMs;
  const fullYears = VIMSHOTTARI_YEARS[lord];
  const theoreticalStartMs = startMs - traversedFraction * fullYears * TROPICAL_YEAR_DAYS * MS_PER_DAY;
  const firstEnd = cursorMs + remainingYears * TROPICAL_YEAR_DAYS * MS_PER_DAY;
  periods.push({
    lord,
    startUtc: new Date(cursorMs).toISOString(),
    endUtc: new Date(firstEnd).toISOString(),
    years: remainingYears,
    antardashas: computeAntardasha(lord, theoreticalStartMs, fullYears)
      .filter((s) => new Date(s.endUtc).getTime() > startMs),
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
      antardashas: computeAntardasha(nextLord, cursorMs, dur),
    });
    cursorMs = endMs;
  }

  return periods;
}
