/**
 * P4.9 — VedicChart → EngineOutput.
 */
import type { EngineOutput, FateVector, ValidationFlags } from '../../types/prediction';
import type { VedicChart } from './types';

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(n)));

export function vedicChartToEngineOutput(chart: VedicChart): EngineOutput {
  const trace: string[] = [];
  const base = 50;
  trace.push(`base = ${base} (sidereal Lahiri, ayanamsa=${chart.ayanamsaDeg.toFixed(4)}°)`);

  const moon = chart.planets.find((p) => p.planet === 'Moon')!;
  const sun = chart.planets.find((p) => p.planet === 'Sun')!;
  const jupiter = chart.planets.find((p) => p.planet === 'Jupiter');
  const venus = chart.planets.find((p) => p.planet === 'Venus');
  const saturn = chart.planets.find((p) => p.planet === 'Saturn');

  const dim = (label: string, v: number) => { const x = clamp(v); trace.push(`${label} = ${x}`); return x; };
  const fateVector: FateVector = {
    life:          dim('life',          base + (chart.lagna ? 5 : 0)),
    wealth:        dim('wealth',        base + (jupiter ? 6 : 0)),
    relation:      dim('relation',      base + (venus ? 6 : 0)),
    health:        dim('health',        base - (saturn ? 3 : 0)),
    wisdom:        dim('wisdom',        base + (jupiter ? 5 : 0)),
    spirit:        dim('spirit',        base + 4),
    socialStatus:  dim('socialStatus',  base + (sun ? 4 : 0)),
    creativity:    dim('creativity',    base + (venus ? 3 : 0)),
    luck:          dim('luck',          base + (jupiter ? 4 : 0)),
    homeStability: dim('homeStability', base + (moon ? 4 : 0)),
  };

  const validationFlags: ValidationFlags = {
    passed: [
      'deterministic_no_random',
      `ayanamsa_lahiri=${chart.ayanamsaDeg.toFixed(4)}`,
      `planet_count=${chart.planets.length}`,
      chart.lagna ? 'lagna_computed' : 'lagna_skipped',
      `mahadasha_count=${chart.vimshottariMahadasha.length}`,
    ],
    failed: chart.lagna ? [] : ['lagna_unavailable'],
    warnings: chart.warnings.map((w) => `${w.code}: ${w.message}`),
  };

  const eventCandidates: string[] = [];
  for (const p of chart.planets) {
    eventCandidates.push(
      `${p.planet} @ ${p.rashi} ${p.degreeInRashi.toFixed(2)}° / ${p.nakshatra} pada ${p.pada}`,
    );
  }
  if (chart.lagna) {
    eventCandidates.push(`Lagna ${chart.lagna.rashi} ${chart.lagna.degreeInRashi.toFixed(2)}° (D9: ${chart.lagna.navamsaRashi})`);
  }
  eventCandidates.push(`Rahu @ ${chart.nodes.rahu.rashi} ${chart.nodes.rahu.degreeInRashi.toFixed(2)}° / ${chart.nodes.rahu.nakshatra}`);
  eventCandidates.push(`Ketu @ ${chart.nodes.ketu.rashi} ${chart.nodes.ketu.degreeInRashi.toFixed(2)}° / ${chart.nodes.ketu.nakshatra}`);
  for (const d of chart.vimshottariMahadasha) {
    eventCandidates.push(`Mahadasha ${d.lord} ${d.startUtc.slice(0, 10)} → ${d.endUtc.slice(0, 10)} (${d.years.toFixed(2)}y)`);
  }
  const firstAntar = chart.vimshottariMahadasha[0]?.antardashas ?? [];
  for (const s of firstAntar.slice(0, 3)) {
    eventCandidates.push(`Antardasha ${chart.vimshottariMahadasha[0].lord}/${s.lord} ${s.startUtc.slice(0, 10)} → ${s.endUtc.slice(0, 10)}`);
  }

  return {
    engineName: 'vedic',
    engineNameCN: '吠陀占星',
    engineVersion: 'P4.9-core',
    sourceUrls: [
      'astronomy-engine (Don Cross, MIT) — geocentric of-date positions',
      'Lahiri ayanamsa (Indian Astronomical Ephemeris linear model, J2000 anchor)',
    ],
    sourceGrade: chart.sourceGrade,
    ruleSchool: 'Sidereal zodiac (Lahiri / Chitrapaksha), 27 nakshatras, Vimshottari Mahadasha+Antardasha, mean nodes, D9 Navamsa',
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
      ayanamsaDeg: chart.ayanamsaDeg.toFixed(6),
      ayanamsaSystem: chart.ayanamsaSystem,
      lagnaRashi: chart.lagna?.rashi ?? '-',
      lagnaDeg: chart.lagna ? chart.lagna.degreeInRashi.toFixed(3) : '-',
      moonNakshatra: chart.moonNakshatra?.name ?? '-',
      moonPada: String(chart.moonNakshatra?.pada ?? '-'),
      currentMahadashaLord: chart.vimshottariMahadasha[0]?.lord ?? '-',
      currentAntardashaLord: chart.vimshottariMahadasha[0]?.antardashas?.[0]?.lord ?? '-',
      rahu: `${chart.nodes.rahu.rashi} ${chart.nodes.rahu.degreeInRashi.toFixed(3)}°`,
      ketu: `${chart.nodes.ketu.rashi} ${chart.nodes.ketu.degreeInRashi.toFixed(3)}°`,
      lagnaNavamsa: chart.lagna?.navamsaRashi ?? '-',
      moonNavamsa: chart.planets.find((p) => p.planet === 'Moon')?.navamsaRashi ?? '-',
      implementationStatus: chart.implementationStatus,
    },
    warnings: chart.warnings.map((w) => `${w.code}: ${w.message}`),
    uncertaintyNotes: [
      'Lahiri ayanamsa uses linear precession model (J2000 anchor, 50.2388475″/yr) — accurate to ~arcminute, not arcsecond.',
      'Rahu/Ketu use the mean lunar node; true-node oscillation (±1.5°) not modelled.',
      'Mahadasha + Antardasha computed; Pratyantar/Sukshma sub-periods pending.',
      'D9 Navamsa computed; other vargas (D10 Dasamsa, etc.) not implemented.',
    ],
    timingBasis: 'birth',
    explanationTrace: [
      ...chart.explanationTrace.map((s) => `[${s.rule}] ${s.detail}`),
      ...trace.map((t) => `[vedic.fateVector] ${t}`),
    ],
    completenessScore: chart.completenessScore,
    validationFlags,
    timeWindows: [],
    aspectScores: {
      ayanamsaDeg: Number(chart.ayanamsaDeg.toFixed(4)),
      mahadashaCount: chart.vimshottariMahadasha.length,
      antardashaCount: chart.vimshottariMahadasha.reduce((n, d) => n + (d.antardashas?.length ?? 0), 0),
      rahuLongitude: Number(chart.nodes.rahu.longitude.toFixed(3)),
    },
    eventCandidates,
  };
}
