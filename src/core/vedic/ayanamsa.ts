/**
 * P4.9 — Lahiri (Chitrapaksha) ayanamsa.
 *
 * Reference: Indian Astronomical Ephemeris. Anchor: ayanamsa was 0 around
 * the spring equinox of 285 CE; precession ~ 50.2388475″ / Julian year.
 * We use a simple linear model anchored at J2000.0 = 23.85°.
 *
 *   ayanamsa(JD) = 23.85 + (JD − 2451545.0) / 365.25 × (50.2388475 / 3600)
 *
 * Accuracy is ~arcminute scale across modern centuries — sufficient for rashi
 * and nakshatra assignment but NOT for sub-degree research work. We mark
 * sourceGrade ≤ B and emit an uncertaintyNote.
 */
const LAHIRI_AT_J2000_DEG = 23.85;
const J2000_JD = 2451545.0;
const PRECESSION_ARCSEC_PER_YEAR = 50.2388475;
const ARCSEC_PER_DEG = 3600;

export function lahiriAyanamsaDeg(julianDay: number): number {
  const yearsSinceJ2000 = (julianDay - J2000_JD) / 365.25;
  return LAHIRI_AT_J2000_DEG + yearsSinceJ2000 * (PRECESSION_ARCSEC_PER_YEAR / ARCSEC_PER_DEG);
}

/** Convert a tropical longitude to sidereal by subtracting ayanamsa. */
export function tropicalToSidereal(tropicalLonDeg: number, ayanamsaDeg: number): number {
  let v = (tropicalLonDeg - ayanamsaDeg) % 360;
  if (v < 0) v += 360;
  return v;
}
