import { describe, it, expect } from 'vitest';
import { QuantumPredictionEngine } from './quantumPredictionEngine';
import type { StandardizedInput } from '@/types/prediction';

function makeInput(overrides?: Partial<StandardizedInput>): StandardizedInput {
  const base: StandardizedInput = {
    birthLocalDateTime: { year: 1990, month: 6, day: 15, hour: 14, minute: 30 },
    birthUtcDateTime: '1990-06-15T06:30:00.000Z',
    geoLatitude: 39.9042,
    geoLongitude: 116.4074,
    timezoneIana: 'Asia/Shanghai',
    timezoneOffsetMinutesAtBirth: 480,
    gender: 'male',
    normalizedLocationName: '北京',
    queryType: 'natalAnalysis',
    queryTimeUtc: '2025-01-01T00:00:00.000Z',
    sourceMetadata: {
      provider: 'test',
      confidence: 1,
      normalizedLocationName: '北京',
      timezoneIana: 'Asia/Shanghai',
    },
  };
  return { ...base, ...overrides };
}

describe('QuantumPredictionEngine.orchestrate', () => {
  it('returns a complete UnifiedPredictionResult', () => {
    const result = QuantumPredictionEngine.orchestrate(makeInput());
    expect(result.predictionId).toMatch(/^UPR-/);
    expect(result.activeEngines).toBeDefined();
    expect(result.skippedEngines).toBeDefined();
    expect(result.activationReasonSummary).toBeTruthy();
    expect(result.fusedFateVector).toBeDefined();
    expect(result.algorithmVersion).toBe('3.1.0');
  });

  it('natalAnalysis does NOT activate liuyao', () => {
    const result = QuantumPredictionEngine.orchestrate(makeInput({ queryType: 'natalAnalysis' }));
    expect(result.activeEngines).not.toContain('liuyao');
    expect(result.skippedEngines.some(s => s.engineName === 'liuyao')).toBe(true);
  });

  it('instantDecision activates liuyao', () => {
    const result = QuantumPredictionEngine.orchestrate(makeInput({ queryType: 'instantDecision' }));
    expect(result.activeEngines).toContain('liuyao');
  });

  it('deterministic: same natalAnalysis input → same fusedFateVector', () => {
    const input = makeInput({ queryType: 'natalAnalysis' });
    const r1 = QuantumPredictionEngine.orchestrate(input);
    const r2 = QuantumPredictionEngine.orchestrate(input);
    expect(r1.fusedFateVector).toEqual(r2.fusedFateVector);
    expect(r1.activeEngines).toEqual(r2.activeEngines);
  });

  it('different queryTypes activate different engine sets', () => {
    const natal = QuantumPredictionEngine.orchestrate(makeInput({ queryType: 'natalAnalysis' }));
    const daily = QuantumPredictionEngine.orchestrate(makeInput({ queryType: 'dailyForecast' }));
    expect(natal.activeEngines.sort()).not.toEqual(daily.activeEngines.sort());
  });

  it('weights sum to 1.0', () => {
    const result = QuantumPredictionEngine.orchestrate(makeInput());
    const sum = result.weightsUsed.reduce((s, w) => s + w.weight, 0);
    expect(sum).toBeCloseTo(1.0, 5);
  });

  it('preserves location metadata in input', () => {
    const result = QuantumPredictionEngine.orchestrate(makeInput());
    expect(result.input.normalizedLocationName).toBe('北京');
    expect(result.input.timezoneIana).toBe('Asia/Shanghai');
    expect(result.input.sourceMetadata.provider).toBe('test');
  });
});
