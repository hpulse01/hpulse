/**
 * P4.9 — Western chart calculation entry point.
 */
import { julianDayFromUtc } from '../astro-time/julianDay';
import { computePlanetPositions } from './planets';
import {
  computeAscendant, computeMidheaven, computePlacidusCusps, houseFromCusps, wholeSignHouse,
} from './houses';
import type { HouseCusp } from './houses';
import { detectAspects } from './aspects';
import type {
  WesternChart, WesternInput, WesternWarning, ExplanationStep,
} from './types';

export interface CalculateWesternOptions {
  /** House system. Defaults to Placidus (falls back to whole-sign at circumpolar latitudes). */
  housesSystem?: 'whole-sign' | 'placidus';
}

export function calculateWesternChart(
  input: WesternInput,
  opts: CalculateWesternOptions = {},
): WesternChart {
  const warnings: WesternWarning[] = [];
  const trace: ExplanationStep[] = [];

  const dateUtc = new Date(input.birthUtcDateTime);
  if (Number.isNaN(dateUtc.getTime())) {
    throw new Error(`western: invalid birthUtcDateTime "${input.birthUtcDateTime}"`);
  }
  const jd = julianDayFromUtc(dateUtc);
  trace.push({ rule: 'western.time', detail: `JD = ${jd.toFixed(6)} (UTC ${dateUtc.toISOString()})` });

  const positions = computePlanetPositions(dateUtc);
  trace.push({
    rule: 'western.planets',
    detail: `computed ${positions.length} planet longitudes (tropical, of-date, geocentric)`,
  });

  const requestedSystem = opts.housesSystem ?? 'placidus';
  let ascendant: WesternChart['ascendant'] = null;
  let midheaven: WesternChart['midheaven'] = null;
  let houseCusps: HouseCusp[] | null = null;
  let housesSystem: WesternChart['housesSystem'] = 'whole-sign';
  if (typeof input.geoLatitude === 'number' && typeof input.geoLongitude === 'number') {
    ascendant = computeAscendant(dateUtc, input.geoLatitude, input.geoLongitude);
    midheaven = computeMidheaven(dateUtc, input.geoLongitude);
    trace.push({
      rule: 'western.ascendant',
      detail: `Asc = ${ascendant.longitude.toFixed(3)}° → ${ascendant.sign} ${ascendant.degreeInSign.toFixed(3)}°`,
    });
    trace.push({
      rule: 'western.midheaven',
      detail: `MC = ${midheaven.longitude.toFixed(3)}° → ${midheaven.sign} ${midheaven.degreeInSign.toFixed(3)}°`,
    });
    if (requestedSystem === 'placidus') {
      houseCusps = computePlacidusCusps(dateUtc, input.geoLatitude, input.geoLongitude);
      if (houseCusps) {
        housesSystem = 'placidus';
        trace.push({
          rule: 'western.houses',
          detail: `Placidus cusps solved iteratively (semi-arc trisection); cusp1=${houseCusps[0].longitude.toFixed(3)}° cusp10=${houseCusps[9].longitude.toFixed(3)}°`,
        });
      } else {
        warnings.push({
          code: 'placidus_polar_fallback',
          message: 'Placidus undefined at circumpolar latitude — whole-sign houses returned instead.',
          level: 'warn',
        });
      }
    }
    for (const p of positions) {
      p.house = houseCusps ? houseFromCusps(p.longitude, houseCusps) : wholeSignHouse(p.sign, ascendant.sign);
    }
  } else {
    warnings.push({
      code: 'no_geo',
      message: 'geoLatitude/geoLongitude missing — cannot compute Ascendant or houses.',
      level: 'warn',
    });
  }

  const aspects = detectAspects(positions);
  trace.push({
    rule: 'western.aspects',
    detail: `detected ${aspects.length} major aspects (orbs: conj/opp 8°, tri 7°, sq 6°, sex 4°)`,
  });

  const hasAsc = ascendant !== null;
  const hasPlacidus = houseCusps !== null;
  const completenessScore = hasPlacidus ? 92 : hasAsc ? 80 : 60;
  const confidence = hasPlacidus ? 84 : hasAsc ? 75 : 60;

  return {
    input,
    julianDay: jd,
    planets: positions,
    ascendant,
    midheaven,
    housesSystem,
    houseCusps,
    aspects,
    confidence,
    completenessScore,
    sourceGrade: hasAsc ? 'B' : 'C',
    implementationStatus: hasPlacidus ? 'complete' : 'partial',
    warnings,
    explanationTrace: trace,
  };
}
