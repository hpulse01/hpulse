import { describe, it, expect } from 'vitest';
import { NumerologyEngine } from './worldSystems/numerology';
import QuantumPredictionEngine from './quantumPredictionEngine';

const MOCK_INPUT = {
  year: 1990,
  month: 6,
  day: 15,
};

describe('NumerologyEngine', () => {
  it('produces structured output with all key fields', () => {
    const report = NumerologyEngine.calculate(MOCK_INPUT);
    expect(report.lifePath).toBeGreaterThanOrEqual(1);
    expect(report.lifePathMeaning).toBeTruthy();
    expect(report.birthdayNumber).toBeGreaterThanOrEqual(1);
    expect(report.destinyExpression).toBeGreaterThanOrEqual(1);
    expect(report.maturityNumber).toBeGreaterThanOrEqual(1);
    expect(report.hiddenPassion).toBeGreaterThanOrEqual(0);
    expect(report.karmicDebts).toBeDefined();
    expect(typeof report.isMasterNumber).toBe('boolean');
    expect(report.pinnacles.length).toBe(4);
    expect(report.challenges.length).toBe(4);
    expect(report.lifePeriods.length).toBe(3);
    expect(report.personalYears.length).toBeGreaterThan(0);
    expect(report.bridgeNumbers.length).toBeGreaterThan(0);
    expect(report.missingNumbers).toBeDefined();
    expect(report.subconciousSelf).toBeGreaterThanOrEqual(1);
    expect(report.subconciousSelf).toBeLessThanOrEqual(9);
    expect(report.lifeVectors).toBeDefined();
    expect(Object.keys(report.lifeVectors).length).toBeGreaterThanOrEqual(8);
  });

  it('lifeVectors values are in 5-95 range', () => {
    const report = NumerologyEngine.calculate(MOCK_INPUT);
    for (const [, v] of Object.entries(report.lifeVectors)) {
      expect(v).toBeGreaterThanOrEqual(5);
      expect(v).toBeLessThanOrEqual(95);
    }
  });

  it('pinnacles and challenges cover a full lifespan', () => {
    const report = NumerologyEngine.calculate(MOCK_INPUT);
    const lastPinnacle = report.pinnacles[report.pinnacles.length - 1];
    expect(lastPinnacle.endAge).toBeGreaterThanOrEqual(80);
    const lastChallenge = report.challenges[report.challenges.length - 1];
    expect(lastChallenge.endAge).toBeGreaterThanOrEqual(80);
  });

  it('deterministic: same input produces same output', () => {
    const r1 = NumerologyEngine.calculate(MOCK_INPUT);
    const r2 = NumerologyEngine.calculate(MOCK_INPUT);
    expect(r1).toEqual(r2);
  });

  it('sensitive to input changes', () => {
    const r1 = NumerologyEngine.calculate(MOCK_INPUT);
    const r2 = NumerologyEngine.calculate({ ...MOCK_INPUT, day: 16 });
    const differ = r1.lifePath !== r2.lifePath ||
      r1.birthdayNumber !== r2.birthdayNumber ||
      JSON.stringify(r1.lifeVectors) !== JSON.stringify(r2.lifeVectors);
    expect(differ).toBe(true);
  });

  it('SystemEngineResult fields are populated in orchestrated output', () => {
    const si = QuantumPredictionEngine.buildStandardizedInput({
      year: MOCK_INPUT.year, month: MOCK_INPUT.month, day: MOCK_INPUT.day,
      hour: 14, minute: 30, gender: 'male',
      geoLatitude: 39.9042, geoLongitude: 116.4074,
      timezoneOffsetMinutes: 480,
    });
    const unified = QuantumPredictionEngine.orchestrate(si);
    const numEo = unified.engineOutputs.find(eo => eo.engineName === 'numerology');
    expect(numEo).toBeDefined();
    expect(numEo!.explanationTrace.length).toBeGreaterThan(0);
    expect(numEo!.completenessScore).toBeGreaterThanOrEqual(0);
    expect(numEo!.validationFlags).toBeDefined();
    expect(numEo!.validationFlags.passed.length).toBeGreaterThan(0);
    expect(numEo!.timeWindows).toBeDefined();
    expect(numEo!.aspectScores).toBeDefined();
    expect(Object.keys(numEo!.aspectScores).length).toBeGreaterThan(0);
    expect(numEo!.eventCandidates.length).toBeGreaterThan(0);
  });
});
