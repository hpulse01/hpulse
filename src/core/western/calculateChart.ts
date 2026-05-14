/**
 * P4.9 — Western chart calculation entry point.
 */
import { julianDayFromUtc } from '../astro-time/julianDay';
import { computePlanetPositions } from './planets';
import { computeAscendant, wholeSignHouse } from './houses';
import { detectAspects } from './aspects';
import type {
  WesternChart, WesternInput, WesternWarning, ExplanationStep,
} from './types';

export interface CalculateWesternOptions {
  /** Request Placidus houses; we will warn and fall back to whole-sign. */
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

  let ascendant: WesternChart['ascendant'] = null;
  if (typeof input.geoLatitude === 'number' && typeof input.geoLongitude === 'number') {
    ascendant = computeAscendant(dateUtc, input.geoLatitude, input.geoLongitude);
    trace.push({
      rule: 'western.ascendant',
      detail: `Asc = ${ascendant.longitude.toFixed(3)}° → ${ascendant.sign} ${ascendant.degreeInSign.toFixed(3)}°`,
    });
    for (const p of positions) {
      p.house = wholeSignHouse(p.sign, ascendant.sign);
    }
  } else {
    warnings.push({
      code: 'no_geo',
      message: 'geoLatitude/geoLongitude missing — cannot compute Ascendant or houses.',
      level: 'warn',
    });
  }

  if (opts.housesSystem === 'placidus') {
    warnings.push({
      code: 'placidus_not_implemented',
      message: 'Placidus house system is not implemented in P4.9; whole-sign houses returned instead.',
      level: 'warn',
    });
  }

  const aspects = detectAspects(positions);
  trace.push({
    rule: 'western.aspects',
    detail: `detected ${aspects.length} major aspects (orbs: conj/opp 8°, tri 7°, sq 6°, sex 4°)`,
  });

  const hasAsc = ascendant !== null;
  const completenessScore = hasAsc ? 80 : 60;
  const confidence = hasAsc ? 75 : 60;

  return {
    input,
    julianDay: jd,
    planets: positions,
    ascendant,
    housesSystem: 'whole-sign',
    aspects,
    confidence,
    completenessScore,
    sourceGrade: hasAsc ? 'B' : 'C',
    implementationStatus: 'partial',
    warnings,
    explanationTrace: trace,
  };
}
