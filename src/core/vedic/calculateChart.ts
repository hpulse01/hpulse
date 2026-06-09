/**
 * P4.9 — Vedic chart calculation entry point.
 */
import { julianDayFromUtc } from '../astro-time/julianDay';
import { computePlanetPositions } from '../western/planets';
import { computeAscendant } from '../western/houses';
import { lahiriAyanamsaDeg, tropicalToSidereal } from './ayanamsa';
import { nakshatraOf } from './nakshatra';
import { computeVimshottariMahadasha } from './dasha';
import { meanRahuKetuTropicalDeg } from './nodes';
import { navamsaRashiOf } from './navamsa';
import { RASHIS } from './constants';
import type {
  VedicChart, VedicInput, VedicWarning, ExplanationStep, SiderealPosition, NodePosition, Rashi,
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
      navamsaRashi: navamsaRashiOf(sidLon).rashi,
    };
  });
  trace.push({
    rule: 'vedic.planets',
    detail: `${planets.length} sidereal planet positions computed (tropical − ayanamsa)`,
  });

  const { rahu: rahuTrop, ketu: ketuTrop } = meanRahuKetuTropicalDeg(jd);
  const makeNode = (node: 'Rahu' | 'Ketu', tropLon: number): NodePosition => {
    const sidLon = tropicalToSidereal(tropLon, ayanamsa);
    const { rashi, degreeInRashi } = rashiOf(sidLon);
    const nk = nakshatraOf(sidLon);
    return {
      node, longitude: sidLon, rashi, degreeInRashi,
      nakshatra: nk.name, pada: nk.pada, navamsaRashi: navamsaRashiOf(sidLon).rashi,
    };
  };
  const nodes = { rahu: makeNode('Rahu', rahuTrop), ketu: makeNode('Ketu', ketuTrop) };
  trace.push({
    rule: 'vedic.nodes',
    detail: `Mean nodes: Rahu ${nodes.rahu.rashi} ${nodes.rahu.degreeInRashi.toFixed(3)}°, Ketu ${nodes.ketu.rashi} ${nodes.ketu.degreeInRashi.toFixed(3)}°`,
  });

  let lagna: VedicChart['lagna'] = null;
  if (typeof input.geoLatitude === 'number' && typeof input.geoLongitude === 'number') {
    const tropAsc = computeAscendant(dateUtc, input.geoLatitude, input.geoLongitude);
    const sidLon = tropicalToSidereal(tropAsc.longitude, ayanamsa);
    const { rashi, degreeInRashi } = rashiOf(sidLon);
    lagna = { longitude: sidLon, rashi, degreeInRashi, navamsaRashi: navamsaRashiOf(sidLon).rashi };
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

  warnings.push({
    code: 'mean_nodes',
    message: 'Rahu/Ketu use the MEAN lunar node; true-node oscillation (±1.5°) not modelled.',
    level: 'info',
  });

  return {
    input,
    julianDay: jd,
    ayanamsaDeg: ayanamsa,
    ayanamsaSystem: 'Lahiri',
    planets,
    nodes,
    lagna,
    moonNakshatra,
    vimshottariMahadasha,
    confidence: lagna ? 78 : 60,
    completenessScore: lagna ? 88 : 65,
    sourceGrade: lagna ? 'B' : 'C',
    implementationStatus: lagna ? 'complete' : 'partial',
    warnings,
    explanationTrace: trace,
  };
}
