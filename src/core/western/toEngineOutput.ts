/**
 * P4.9 — WesternChart → EngineOutput.
 */
import type { EngineOutput, FateVector, ValidationFlags } from '../../types/prediction';
import type { WesternChart, AspectHit } from './types';

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(n)));

const ASPECT_WEIGHT: Record<AspectHit['aspect'], number> = {
  conjunction: 0,   // neutral; depends on planets
  trine: +6,
  sextile: +3,
  square: -5,
  opposition: -4,
};

export function westernChartToEngineOutput(chart: WesternChart): EngineOutput {
  const trace: string[] = [];
  let base = 50;
  for (const a of chart.aspects) {
    base += ASPECT_WEIGHT[a.aspect] ?? 0;
  }
  base = clamp(base);
  trace.push(`base = ${base} (${chart.aspects.length} aspects weighted)`);

  const sun = chart.planets.find((p) => p.planet === 'Sun');
  const moon = chart.planets.find((p) => p.planet === 'Moon');
  const venus = chart.planets.find((p) => p.planet === 'Venus');
  const jupiter = chart.planets.find((p) => p.planet === 'Jupiter');
  const saturn = chart.planets.find((p) => p.planet === 'Saturn');

  const dim = (label: string, v: number) => { const x = clamp(v); trace.push(`${label} = ${x}`); return x; };
  const fateVector: FateVector = {
    life:          dim('life',          base + (sun ? 5 : 0)),
    wealth:        dim('wealth',        base + (jupiter ? 6 : 0) + (venus ? 2 : 0)),
    relation:      dim('relation',      base + (venus ? 8 : 0)),
    health:        dim('health',        base - (saturn ? 3 : 0)),
    wisdom:        dim('wisdom',        base + (jupiter ? 4 : 0)),
    spirit:        dim('spirit',        base + (moon ? 3 : 0)),
    socialStatus:  dim('socialStatus',  base + (sun ? 4 : 0) + (saturn ? 2 : 0)),
    creativity:    dim('creativity',    base + (venus ? 4 : 0)),
    luck:          dim('luck',          base + (jupiter ? 5 : 0)),
    homeStability: dim('homeStability', base + (moon ? 5 : 0)),
  };

  const validationFlags: ValidationFlags = {
    passed: [
      'deterministic_no_random',
      `planet_count=${chart.planets.length}`,
      chart.ascendant ? 'ascendant_computed' : 'ascendant_skipped',
      `aspect_count=${chart.aspects.length}`,
    ],
    failed: chart.ascendant ? [] : ['ascendant_unavailable'],
    warnings: chart.warnings.map((w) => `${w.code}: ${w.message}`),
  };

  const eventCandidates: string[] = [];
  for (const p of chart.planets) {
    eventCandidates.push(
      `${p.planet} @ ${p.sign} ${p.degreeInSign.toFixed(2)}° (lon=${p.longitude.toFixed(2)}°, house=${p.house ?? '-'})`,
    );
  }
  if (chart.ascendant) {
    eventCandidates.push(`Asc ${chart.ascendant.sign} ${chart.ascendant.degreeInSign.toFixed(2)}°`);
  }
  for (const a of chart.aspects) {
    eventCandidates.push(`${a.a} ${a.aspect} ${a.b} (orb ${a.orbDeg.toFixed(2)}°)`);
  }

  return {
    engineName: 'western',
    engineNameCN: '西方占星',
    engineVersion: 'P4.9-core',
    sourceUrls: ['astronomy-engine (Don Cross, MIT) — geocentric of-date positions'],
    sourceGrade: chart.sourceGrade,
    ruleSchool: 'Tropical zodiac, Whole-Sign houses, Ptolemaic major aspects',
    confidence: chart.confidence,
    computationTimeMs: 0,
    rawInputSnapshot: {
      birthUtcDateTime: chart.input.birthUtcDateTime,
      timezoneIana: chart.input.timezoneIana,
      geoLatitude: chart.input.geoLatitude,
      geoLongitude: chart.input.geoLongitude,
    },
    fateVector,
    normalizedOutput: {
      julianDay: String(chart.julianDay),
      ascendantSign: chart.ascendant?.sign ?? '-',
      ascendantDeg: chart.ascendant ? chart.ascendant.degreeInSign.toFixed(3) : '-',
      housesSystem: chart.housesSystem,
      planetCount: String(chart.planets.length),
      aspectCount: String(chart.aspects.length),
      implementationStatus: chart.implementationStatus,
    },
    warnings: chart.warnings.map((w) => `${w.code}: ${w.message}`),
    uncertaintyNotes: [
      'Whole-Sign houses only; Placidus / Koch / Regiomontanus not implemented.',
      'Mean obliquity J2000 used in Ascendant; nutation in obliquity not applied.',
      'Minor aspects (quincunx, semi-square, etc.) not detected.',
    ],
    timingBasis: 'birth',
    explanationTrace: [
      ...chart.explanationTrace.map((s) => `[${s.rule}] ${s.detail}`),
      ...trace.map((t) => `[western.fateVector] ${t}`),
    ],
    completenessScore: chart.completenessScore,
    validationFlags,
    timeWindows: [],
    aspectScores: {
      majorAspectCount: chart.aspects.length,
      harmoniousCount: chart.aspects.filter((a) => a.aspect === 'trine' || a.aspect === 'sextile').length,
      challengingCount: chart.aspects.filter((a) => a.aspect === 'square' || a.aspect === 'opposition').length,
    },
    eventCandidates,
  };
}
