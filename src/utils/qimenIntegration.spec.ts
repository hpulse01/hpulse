import { describe, it, expect } from 'vitest';
import { QuantumPredictionEngine } from './quantumPredictionEngine';
import type { StandardizedInput } from '@/types/prediction';

function makeInput(overrides?: Partial<StandardizedInput>): StandardizedInput {
  return {
    birthLocalDateTime: { year: 1990, month: 6, day: 15, hour: 14, minute: 30 },
    birthUtcDateTime: '1990-06-15T06:30:00.000Z',
    geoLatitude: 39.9042,
    geoLongitude: 116.4074,
    timezoneIana: 'Asia/Shanghai',
    timezoneOffsetMinutesAtBirth: 480,
    gender: 'male',
    normalizedLocationName: '北京',
    queryType: 'instantDecision',
    queryTimeUtc: '2025-03-15T10:30:00.000Z',
    sourceMetadata: {
      provider: 'test',
      confidence: 1,
      normalizedLocationName: '北京',
      timezoneIana: 'Asia/Shanghai',
    },
    ...overrides,
  };
}

describe('Qimen Integration with Orchestrator', () => {
  it('instantDecision activates qimen', () => {
    const result = QuantumPredictionEngine.orchestrate(makeInput({ queryType: 'instantDecision' }));
    expect(result.activeEngines).toContain('qimen');
    const qimenOutput = result.engineOutputs.find(e => e.engineName === 'qimen');
    expect(qimenOutput).toBeDefined();
    expect(qimenOutput!.engineNameCN).toBe('奇门遁甲');
    expect(qimenOutput!.normalizedOutput['遁局']).toBeTruthy();
    expect(qimenOutput!.normalizedOutput['值符']).toBeTruthy();
    expect(qimenOutput!.normalizedOutput['值使']).toBeTruthy();
  });

  it('natalAnalysis does NOT activate qimen', () => {
    const result = QuantumPredictionEngine.orchestrate(makeInput({ queryType: 'natalAnalysis' }));
    expect(result.activeEngines).not.toContain('qimen');
    expect(result.skippedEngines.some(s => s.engineName === 'qimen')).toBe(true);
  });

  it('annualForecast does NOT activate qimen', () => {
    const result = QuantumPredictionEngine.orchestrate(makeInput({ queryType: 'annualForecast' }));
    expect(result.activeEngines).not.toContain('qimen');
  });

  it('dailyForecast activates qimen', () => {
    const result = QuantumPredictionEngine.orchestrate(makeInput({ queryType: 'dailyForecast' }));
    expect(result.activeEngines).toContain('qimen');
  });

  it('monthlyForecast activates qimen', () => {
    const result = QuantumPredictionEngine.orchestrate(makeInput({ queryType: 'monthlyForecast' }));
    expect(result.activeEngines).toContain('qimen');
  });

  it('weightsUsed includes qimen for instantDecision', () => {
    const result = QuantumPredictionEngine.orchestrate(makeInput({ queryType: 'instantDecision' }));
    const qimenWeight = result.weightsUsed.find(w => w.engineName === 'qimen');
    expect(qimenWeight).toBeDefined();
    expect(qimenWeight!.weight).toBeGreaterThan(0);
  });

  it('unifiedResult contains qimen output', () => {
    const result = QuantumPredictionEngine.orchestrate(makeInput({ queryType: 'instantDecision' }));
    const qo = result.engineOutputs.find(e => e.engineName === 'qimen');
    expect(qo).toBeDefined();
    expect(qo!.fateVector.life).toBeGreaterThanOrEqual(5);
    expect(qo!.fateVector.life).toBeLessThanOrEqual(95);
  });

  it('weights still sum to 1.0 with qimen', () => {
    const result = QuantumPredictionEngine.orchestrate(makeInput({ queryType: 'instantDecision' }));
    const sum = result.weightsUsed.reduce((s, w) => s + w.weight, 0);
    expect(sum).toBeCloseTo(1.0, 5);
  });
});
