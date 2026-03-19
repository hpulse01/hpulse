import { describe, it, expect } from 'vitest';
import { WesternAstrologyEngine } from './worldSystems/westernAstrology';
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

describe('WesternAstrologyEngine', () => {
  it('produces structured output with all key fields', () => {
    const report = WesternAstrologyEngine.calculate(MOCK_INPUT);
    expect(report.sunSign).toBeTruthy();
    expect(report.moonSign).toBeTruthy();
    expect(report.risingSign).toBeTruthy();
    expect(report.planets.length).toBeGreaterThan(0);
    expect(report.aspects).toBeDefined();
    expect(report.elementBalance).toBeDefined();
    expect(report.modalityBalance).toBeDefined();
    expect(report.dominantElement).toBeTruthy();
    expect(report.dominantModality).toBeTruthy();
    expect(report.patterns).toBeDefined();
    expect(report.mutualReceptions).toBeDefined();
    expect(report.singletons).toBeDefined();
    expect(report.lifeVectors).toBeDefined();
    expect(Object.keys(report.lifeVectors).length).toBeGreaterThanOrEqual(8);
  });

  it('lifeVectors values are in 5-95 range', () => {
    const report = WesternAstrologyEngine.calculate(MOCK_INPUT);
    for (const [, v] of Object.entries(report.lifeVectors)) {
      expect(v).toBeGreaterThanOrEqual(5);
      expect(v).toBeLessThanOrEqual(95);
    }
  });

  it('deterministic: same input produces same output', () => {
    const r1 = WesternAstrologyEngine.calculate(MOCK_INPUT);
    const r2 = WesternAstrologyEngine.calculate(MOCK_INPUT);
    expect(r1).toEqual(r2);
  });

  it('sensitive to input changes', () => {
    const r1 = WesternAstrologyEngine.calculate(MOCK_INPUT);
    const r2 = WesternAstrologyEngine.calculate({ ...MOCK_INPUT, day: 16 });
    // At least one life vector or sign should differ
    const differ = r1.sunSign !== r2.sunSign ||
      r1.moonSign !== r2.moonSign ||
      JSON.stringify(r1.lifeVectors) !== JSON.stringify(r2.lifeVectors);
    expect(differ).toBe(true);
  });

  it('metadata is populated', () => {
    expect(WesternAstrologyEngine.metadata.source_urls.length).toBeGreaterThan(0);
    expect(WesternAstrologyEngine.metadata.source_grade).toBe('A');
    expect(WesternAstrologyEngine.metadata.algorithm_version).toBeTruthy();
    expect(WesternAstrologyEngine.metadata.rule_school).toBeTruthy();
  });

  it('SystemEngineResult fields are populated in orchestrated output', () => {
    const si = QuantumPredictionEngine.buildStandardizedInput({
      year: MOCK_INPUT.year, month: MOCK_INPUT.month, day: MOCK_INPUT.day,
      hour: MOCK_INPUT.hour, minute: MOCK_INPUT.minute, gender: 'male',
      geoLatitude: MOCK_INPUT.geoLatitude, geoLongitude: MOCK_INPUT.geoLongitude,
      timezoneOffsetMinutes: MOCK_INPUT.timezoneOffsetMinutes,
    });
    const unified = QuantumPredictionEngine.orchestrate(si);
    const westernEo = unified.engineOutputs.find(eo => eo.engineName === 'western');
    expect(westernEo).toBeDefined();
    expect(westernEo!.explanationTrace.length).toBeGreaterThan(0);
    expect(westernEo!.completenessScore).toBeGreaterThanOrEqual(0);
    expect(westernEo!.validationFlags).toBeDefined();
    expect(westernEo!.validationFlags.passed.length).toBeGreaterThan(0);
    expect(westernEo!.timeWindows).toBeDefined();
    expect(westernEo!.aspectScores).toBeDefined();
    expect(Object.keys(westernEo!.aspectScores).length).toBeGreaterThan(0);
    expect(westernEo!.eventCandidates.length).toBeGreaterThan(0);
  });
});
