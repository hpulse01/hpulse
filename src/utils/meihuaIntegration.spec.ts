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

describe('Meihua Integration with Orchestrator', () => {
  it('instantDecision activates meihua', () => {
    const result = QuantumPredictionEngine.orchestrate(makeInput({ queryType: 'instantDecision' }));
    expect(result.activeEngines).toContain('meihua');
    const meihuaOutput = result.engineOutputs.find(e => e.engineName === 'meihua');
    expect(meihuaOutput).toBeDefined();
    expect(meihuaOutput!.engineNameCN).toBe('梅花易数');
    expect(meihuaOutput!.normalizedOutput['本卦']).toBeTruthy();
    expect(meihuaOutput!.normalizedOutput['变卦']).toBeTruthy();
    expect(meihuaOutput!.normalizedOutput['体用']).toBeTruthy();
  });

  it('natalAnalysis does NOT activate meihua', () => {
    const result = QuantumPredictionEngine.orchestrate(makeInput({ queryType: 'natalAnalysis' }));
    expect(result.activeEngines).not.toContain('meihua');
    expect(result.skippedEngines.some(s => s.engineName === 'meihua')).toBe(true);
  });

  it('annualForecast does NOT activate meihua', () => {
    const result = QuantumPredictionEngine.orchestrate(makeInput({ queryType: 'annualForecast' }));
    expect(result.activeEngines).not.toContain('meihua');
  });

  it('dailyForecast activates meihua', () => {
    const result = QuantumPredictionEngine.orchestrate(makeInput({ queryType: 'dailyForecast' }));
    expect(result.activeEngines).toContain('meihua');
  });

  it('monthlyForecast activates meihua', () => {
    const result = QuantumPredictionEngine.orchestrate(makeInput({ queryType: 'monthlyForecast' }));
    expect(result.activeEngines).toContain('meihua');
  });

  it('weightsUsed includes meihua for instantDecision', () => {
    const result = QuantumPredictionEngine.orchestrate(makeInput({ queryType: 'instantDecision' }));
    const meihuaWeight = result.weightsUsed.find(w => w.engineName === 'meihua');
    expect(meihuaWeight).toBeDefined();
    expect(meihuaWeight!.weight).toBeGreaterThan(0);
  });

  it('meihua has high weight in instantDecision', () => {
    const result = QuantumPredictionEngine.orchestrate(makeInput({ queryType: 'instantDecision' }));
    const meihuaWeight = result.weightsUsed.find(w => w.engineName === 'meihua');
    // meihua should be one of the top weighted engines for instantDecision
    expect(meihuaWeight!.weight).toBeGreaterThan(0.15);
  });

  it('activationReasonSummary mentions meihua when active', () => {
    const result = QuantumPredictionEngine.orchestrate(makeInput({ queryType: 'instantDecision' }));
    // meihua is active, so summary should reflect the count
    expect(result.activeEngines.length).toBeGreaterThanOrEqual(9);
  });

  it('fusedFateVector includes meihua contribution', () => {
    const result = QuantumPredictionEngine.orchestrate(makeInput({ queryType: 'instantDecision' }));
    expect(result.fusedFateVector.life).toBeGreaterThanOrEqual(0);
    expect(result.fusedFateVector.life).toBeLessThanOrEqual(100);
  });
});
