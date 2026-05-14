/**
 * P4.9 — Vedic chart calculation entry point.
 */
import { julianDayFromUtc } from '../astro-time/julianDay';
import { computePlanetPositions } from '../western/planets';
import { computeAscendant } from '../western/houses';
import { lahiriAyanamsaDeg, tropicalToSidereal } from './ayanamsa';
import { nakshatraOf } from './nakshatra';
import { computeVimshottariMahadasha } from './dasha';
import { RASHIS } from './constants';
import type {
  VedicChart, VedicInput, VedicWarning, ExplanationStep, SiderealPosition, Rashi,
} from './types';

function rashiOf(siderealLonDeg: number): { rashi: Rashi; degreeInRashi: number } {
  let lon = siderealLonDeg % 360;
  if (lon < 0) lon += 360;
  const idx = Math.floor(lon / 30);
  return { rashi: RASHIS[idx], degreeInRashi: lon - idx * 30 };
}

export function calculateVedicChart(input: VedicInput): VedicChart {
  const warnings: VedicWarning[] = [];
  const trace: ExplanationStep[] = [];

  const dateUtc = new Date(input.birthUtcDateTime);
  if (Number.isNaN(dateUtc.getTime())) {
    throw new Error(`vedic: invalid birthUtcDateTime "${input.birthUtcDateTime}"`);
  }
  const jd = julianDayFromUtc(dateUtc);
  const ayanamsa = lahiriAyanamsaDeg(jd);
  trace.push({
    rule: 'vedic.ayanamsa',
    detail: `Lahiri ayanamsa = ${ayanamsa.toFixed(6)}° at JD ${jd.toFixed(6)}`,
  });

  const tropPositions = computePlanetPositions(dateUtc);
  const planets: SiderealPosition[] = tropPositions.map((p) => {
    const sidLon = tropicalToSidereal(p.longitude, ayanamsa);
    const { rashi, degreeInRashi } = rashiOf(sidLon);
    const nk = nakshatraOf(sidLon);
    return {
      planet: p.planet,
      longitude: sidLon,
      rashi,
      degreeInRashi,
      nakshatra: nk.name,
      pada: nk.pada,
    };
  });
  trace.push({
    rule: 'vedic.planets',
    detail: `${planets.length} sidereal planet positions computed (tropical − ayanamsa)`,
  });

  let lagna: VedicChart['lagna'] = null;
  if (typeof input.geoLatitude === 'number' && typeof input.geoLongitude === 'number') {
    const tropAsc = computeAscendant(dateUtc, input.geoLatitude, input.geoLongitude);
    const sidLon = tropicalToSidereal(tropAsc.longitude, ayanamsa);
    const { rashi, degreeInRashi } = rashiOf(sidLon);
    lagna = { longitude: sidLon, rashi, degreeInRashi };
    trace.push({
      rule: 'vedic.lagna',
      detail: `Lagna sidereal = ${sidLon.toFixed(3)}° → ${rashi} ${degreeInRashi.toFixed(3)}°`,
    });
  } else {
    warnings.push({
      code: 'no_geo_lagna',
      message: 'geoLatitude/geoLongitude missing — Lagna cannot be computed.',
      level: 'warn',
    });
  }

  const moon = planets.find((p) => p.planet === 'Moon')!;
  const moonNk = nakshatraOf(moon.longitude);
  const moonNakshatra = { name: moonNk.name, pada: moonNk.pada, lord: moonNk.lord };
  trace.push({
    rule: 'vedic.moonNakshatra',
    detail: `Moon nakshatra = ${moonNk.name} pada ${moonNk.pada} (lord ${moonNk.lord})`,
  });

  const vimshottariMahadasha = computeVimshottariMahadasha(moon.longitude, input.birthUtcDateTime);
  trace.push({
    rule: 'vedic.vimshottari',
    detail: `Mahadasha periods: ${vimshottariMahadasha.length} entries starting with ${vimshottariMahadasha[0].lord} (${vimshottariMahadasha[0].years.toFixed(2)}y remaining)`,
  });

  // True Rahu/Ketu nodes, retrograde flags, divisional charts (vargas), and
  // Antardasha sub-periods are not implemented yet → partial.
  warnings.push({
    code: 'rahu_ketu_not_included',
    message: 'Rahu/Ketu lunar nodes are not included in this version.',
    level: 'info',
  });
  warnings.push({
    code: 'antardasha_not_implemented',
    message: 'Only Mahadasha (top-level Vimshottari) implemented; Antardasha/Pratyantar not yet.',
    level: 'info',
  });

  return {
    input,
    julianDay: jd,
    ayanamsaDeg: ayanamsa,
    ayanamsaSystem: 'Lahiri',
    planets,
    lagna,
    moonNakshatra,
    vimshottariMahadasha,
    confidence: lagna ? 65 : 55,
    completenessScore: lagna ? 70 : 55,
    sourceGrade: 'C',
    implementationStatus: 'partial',
    warnings,
    explanationTrace: trace,
  };
}
