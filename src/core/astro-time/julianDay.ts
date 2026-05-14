/**
 * Julian Day computation (Gregorian calendar) from a UTC instant.
 *
 * Algorithm: Meeus, "Astronomical Algorithms" 2nd ed., chapter 7.
 * Pure deterministic function — no randomness, no I/O.
 */

/**
 * Convert a UTC Date to Julian Day (fractional, UT scale).
 *
 * Valid for any Gregorian calendar date after 1582-10-15.
 */
export function julianDayFromUtc(utc: Date): number {
  const y = utc.getUTCFullYear();
  const m = utc.getUTCMonth() + 1;
  const d = utc.getUTCDate();
  const h = utc.getUTCHours();
  const min = utc.getUTCMinutes();
  const s = utc.getUTCSeconds() + utc.getUTCMilliseconds() / 1000;

  let Y = y;
  let M = m;
  if (M <= 2) {
    Y -= 1;
    M += 12;
  }

  const A = Math.floor(Y / 100);
  const B = 2 - A + Math.floor(A / 4);

  const dayFraction = (h + min / 60 + s / 3600) / 24;

  const jd =
    Math.floor(365.25 * (Y + 4716)) +
    Math.floor(30.6001 * (M + 1)) +
    d +
    dayFraction +
    B -
    1524.5;

  return jd;
}

/**
 * Inverse: Julian Day → UTC Date (Gregorian).
 */
export function utcFromJulianDay(jd: number): Date {
  const jdPlus = jd + 0.5;
  const Z = Math.floor(jdPlus);
  const F = jdPlus - Z;

  let A = Z;
  if (Z >= 2299161) {
    const alpha = Math.floor((Z - 1867216.25) / 36524.25);
    A = Z + 1 + alpha - Math.floor(alpha / 4);
  }
  const B = A + 1524;
  const C = Math.floor((B - 122.1) / 365.25);
  const D = Math.floor(365.25 * C);
  const E = Math.floor((B - D) / 30.6001);

  const day = B - D - Math.floor(30.6001 * E) + F;
  const month = E < 14 ? E - 1 : E - 13;
  const year = month > 2 ? C - 4716 : C - 4715;

  const dayInt = Math.floor(day);
  const dayFrac = day - dayInt;
  const totalSeconds = Math.round(dayFrac * 86400);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  return new Date(Date.UTC(year, month - 1, dayInt, h, m, s));
}
