import { describe, it, expect } from 'vitest';
import { VedicAstrologyEngine } from './worldSystems/vedicAstrology';
import QuantumPredictionEngine from './quantumPredictionEngine';

const MOCK_INPUT = {
  year: 1990,
  month: 6,
  day: 15,
  hour: 14,
  minute: 30,
  timezoneOffsetMinutes: 480,
  geoLatitude: 39.9042,
  geoLongitude: 116.4074,
};

describe('VedicAstrologyEngine', () => {
  it('produces structured output with all key fields', () => {
    const report = VedicAstrologyEngine.calculate(MOCK_INPUT);
    expect(report.rashiSign).toBeTruthy();
    expect(report.rashiSignCN).toBeTruthy();
    expect(report.moonNakshatra).toBeDefined();
    expect(report.moonNakshatra.name).toBeTruthy();
    expect(report.moonNakshatra.nameCN).toBeTruthy();
    expect(report.moonNakshatra.ruler).toBeTruthy();
    expect(report.moonNakshatra.pada).toBeGreaterThanOrEqual(1);
    expect(report.moonNakshatra.pada).toBeLessThanOrEqual(4);
    expect(report.lagna).toBeTruthy();
    expect(report.dashas.length).toBeGreaterThan(0);
    expect(report.yogas.length).toBeGreaterThan(0);
    expect(report.ayanamsaUsed).toBeGreaterThan(0);
    expect(report.moonSiderealLongitude).toBeGreaterThanOrEqual(0);
    expect(report.sunSiderealLongitude).toBeGreaterThanOrEqual(0);
    expect(report.kujaDosha).toBeDefined();
    expect(report.kujaDosha.severity).toBeTruthy();
    expect(report.sadeSati).toBeDefined();
    expect(report.sadeSati.phase).toBeTruthy();
    expect(report.lifeVectors).toBeDefined();
    expect(Object.keys(report.lifeVectors).length).toBeGreaterThanOrEqual(8);
  });

  it('lifeVectors values are in 5-95 range', () => {
    const report = VedicAstrologyEngine.calculate(MOCK_INPUT);
    for (const [, v] of Object.entries(report.lifeVectors)) {
      expect(v).toBeGreaterThanOrEqual(5);
      expect(v).toBeLessThanOrEqual(95);
    }
  });

  it('dashas cover a full lifespan', () => {
    const report = VedicAstrologyEngine.calculate(MOCK_INPUT);
    const totalYears = report.dashas.reduce((s, d) => s + d.years, 0);
    expect(totalYears).toBeGreaterThanOrEqual(80);
  });

  it('deterministic: same input produces same output', () => {
    const r1 = VedicAstrologyEngine.calculate(MOCK_INPUT);
    const r2 = VedicAstrologyEngine.calculate(MOCK_INPUT);
    expect(r1).toEqual(r2);
  });

  it('sensitive to input changes', () => {
    const r1 = VedicAstrologyEngine.calculate(MOCK_INPUT);
    const r2 = VedicAstrologyEngine.calculate({ ...MOCK_INPUT, day: 16 });
    const differ = r1.rashiSign !== r2.rashiSign ||
      r1.moonNakshatra.name !== r2.moonNakshatra.name ||
      JSON.stringify(r1.lifeVectors) !== JSON.stringify(r2.lifeVectors);
    expect(differ).toBe(true);
  });

  it('metadata is populated', () => {
    expect(VedicAstrologyEngine.metadata.source_urls.length).toBeGreaterThan(0);
    expect(VedicAstrologyEngine.metadata.source_grade).toBe('A');
    expect(VedicAstrologyEngine.metadata.algorithm_version).toBeTruthy();
    expect(VedicAstrologyEngine.metadata.rule_school).toBeTruthy();
  });

  it('SystemEngineResult fields are populated in orchestrated output', () => {
    const si = QuantumPredictionEngine.buildStandardizedInput({
      year: MOCK_INPUT.year, month: MOCK_INPUT.month, day: MOCK_INPUT.day,
      hour: MOCK_INPUT.hour, minute: MOCK_INPUT.minute, gender: 'male',
      geoLatitude: MOCK_INPUT.geoLatitude, geoLongitude: MOCK_INPUT.geoLongitude,
      timezoneOffsetMinutes: MOCK_INPUT.timezoneOffsetMinutes,
    });
    const unified = QuantumPredictionEngine.orchestrate(si);
    const vedicEo = unified.engineOutputs.find(eo => eo.engineName === 'vedic');
    expect(vedicEo).toBeDefined();
    expect(vedicEo!.explanationTrace.length).toBeGreaterThan(0);
    expect(vedicEo!.completenessScore).toBeGreaterThanOrEqual(0);
    expect(vedicEo!.validationFlags).toBeDefined();
    expect(vedicEo!.validationFlags.passed.length).toBeGreaterThan(0);
    expect(vedicEo!.timeWindows).toBeDefined();
    expect(vedicEo!.timeWindows.length).toBeGreaterThan(0);
    expect(vedicEo!.aspectScores).toBeDefined();
    expect(Object.keys(vedicEo!.aspectScores).length).toBeGreaterThan(0);
    expect(vedicEo!.eventCandidates.length).toBeGreaterThan(0);
  });
});
