/**
 * 节气 (24 Solar Terms) lookup, wrapping lunar-typescript so the rest of
 * the codebase has a single deterministic entry point.
 *
 * Terms are returned as { name, utc } pairs. Names use traditional Chinese.
 *
 * Important: lunar-typescript's `Solar` is interpreted as Beijing time
 * (UTC+8) for ganzhi / jieqi tables. We pass year-month-day-hour-minute-second
 * already converted to that wall-clock; for term lookups we convert back to
 * a UTC instant.
 */

import { Solar } from 'lunar-typescript';

const BEIJING_OFFSET_MIN = 8 * 60;

export interface SolarTerm {
  name: string;
  utc: Date;
}

/**
 * Get all 24 solar terms whose Beijing date falls inside `year`.
 * The lunar library returns each term as a Solar timestamp in Beijing time.
 */
export function solarTermsForYear(year: number): SolarTerm[] {
  // Build a Beijing noon Solar to anchor the year (avoid edge-of-year drift).
  const anchor = Solar.fromYmdHms(year, 6, 1, 12, 0, 0);
  const lunar = anchor.getLunar();
  const table = lunar.getJieQiTable();
  const result: SolarTerm[] = [];
  for (const [name, sol] of Object.entries(table)) {
    const beijingMs = Date.UTC(
      sol.getYear(),
      sol.getMonth() - 1,
      sol.getDay(),
      sol.getHour(),
      sol.getMinute(),
      sol.getSecond(),
    );
    const utc = new Date(beijingMs - BEIJING_OFFSET_MIN * 60_000);
    if (utc.getUTCFullYear() === year) {
      result.push({ name, utc });
    }
  }
  result.sort((a, b) => a.utc.getTime() - b.utc.getTime());
  return result;
}

/**
 * Find the most recent solar term <= `utc`, scanning current and previous year.
 */
export function previousSolarTerm(utc: Date): SolarTerm {
  const year = utc.getUTCFullYear();
  const candidates = [...solarTermsForYear(year - 1), ...solarTermsForYear(year), ...solarTermsForYear(year + 1)];
  let best: SolarTerm | undefined;
  for (const t of candidates) {
    if (t.utc.getTime() <= utc.getTime()) {
      if (!best || t.utc.getTime() > best.utc.getTime()) best = t;
    }
  }
  if (!best) throw new Error('No previous solar term found');
  return best;
}

/** Find the next solar term strictly after `utc`. */
export function nextSolarTerm(utc: Date): SolarTerm {
  const year = utc.getUTCFullYear();
  const candidates = [...solarTermsForYear(year - 1), ...solarTermsForYear(year), ...solarTermsForYear(year + 1)];
  let best: SolarTerm | undefined;
  for (const t of candidates) {
    if (t.utc.getTime() > utc.getTime()) {
      if (!best || t.utc.getTime() < best.utc.getTime()) best = t;
    }
  }
  if (!best) throw new Error('No next solar term found');
  return best;
}
