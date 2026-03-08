import { describe, it, expect } from 'vitest';
import { getActiveEngines, getSkippedEngines } from '@/config/engineActivation';
import { getWeightsForQueryType } from '@/config/engineWeights';
import { buildLiuRenEngineOutput } from './liurenAlgorithm';
import type { StandardizedInput, QueryType } from '@/types/prediction';

const MOCK_SI: StandardizedInput = {
  birthLocalDateTime: { year: 1990, month: 5, day: 15, hour: 8, minute: 30 },
  birthUtcDateTime: '1990-05-15T00:30:00Z',
  geoLatitude: 39.9,
  geoLongitude: 116.4,
  timezoneIana: 'Asia/Shanghai',
  timezoneOffsetMinutesAtBirth: 480,
  gender: 'male',
  normalizedLocationName: '北京',
  queryType: 'instantDecision',
  queryTimeUtc: '2024-06-15T10:30:00Z',
  sourceMetadata: {
    provider: 'test',
    confidence: 1,
    normalizedLocationName: '北京',
    timezoneIana: 'Asia/Shanghai',
  },
};

describe('liuren integration', () => {
  it('instantDecision 激活 liuren', () => {
    const active = getActiveEngines('instantDecision');
    expect(active).toContain('liuren');
  });

  it('natalAnalysis 不激活 liuren', () => {
    const active = getActiveEngines('natalAnalysis');
    expect(active).not.toContain('liuren');
  });

  it('annualForecast 不激活 liuren', () => {
    const active = getActiveEngines('annualForecast');
    expect(active).not.toContain('liuren');
  });

  it('dailyForecast 激活 liuren', () => {
    const active = getActiveEngines('dailyForecast');
    expect(active).toContain('liuren');
  });

  it('monthlyForecast 激活 liuren', () => {
    const active = getActiveEngines('monthlyForecast');
    expect(active).toContain('liuren');
  });

  it('natalAnalysis skippedEngines 包含 liuren', () => {
    const skipped = getSkippedEngines('natalAnalysis');
    expect(skipped.find(s => s.engineName === 'liuren')).toBeDefined();
  });

  it('instantDecision 权重中包含 liuren 且权重较高', () => {
    const weights = getWeightsForQueryType('instantDecision');
    const lr = weights.find(w => w.engineName === 'liuren');
    expect(lr).toBeDefined();
    expect(lr!.weight).toBeGreaterThan(0.10);
  });

  it('权重归一化后总和为 1', () => {
    const types: QueryType[] = ['natalAnalysis', 'annualForecast', 'monthlyForecast', 'dailyForecast', 'instantDecision'];
    for (const qt of types) {
      const weights = getWeightsForQueryType(qt);
      const sum = weights.reduce((s, w) => s + w.weight, 0);
      expect(sum).toBeCloseTo(1.0, 5);
    }
  });

  it('buildLiuRenEngineOutput 返回完整 EngineOutput', () => {
    const { eo, liurenResult } = buildLiuRenEngineOutput(MOCK_SI);
    expect(eo.engineName).toBe('liuren');
    expect(eo.engineNameCN).toBe('大六壬');
    expect(eo.fateVector.life).toBeGreaterThanOrEqual(5);
    expect(eo.fateVector.life).toBeLessThanOrEqual(95);
    expect(eo.normalizedOutput['四课']).toBeTruthy();
    expect(eo.normalizedOutput['三传']).toBeTruthy();
    expect(eo.normalizedOutput['天将']).toBeTruthy();
    expect(eo.normalizedOutput['课体']).toBeTruthy();
    expect(eo.normalizedOutput['吉凶']).toBeTruthy();
    expect(eo.normalizedOutput['日辰']).toBeTruthy();
    expect(eo.normalizedOutput['时辰']).toBeTruthy();
    expect(liurenResult.siKe.courses).toHaveLength(4);
  });

  it('相同 StandardizedInput → 相同 liuren 输出', () => {
    const { eo: eo1 } = buildLiuRenEngineOutput(MOCK_SI);
    const { eo: eo2 } = buildLiuRenEngineOutput(MOCK_SI);
    expect(eo1.fateVector).toEqual(eo2.fateVector);
    expect(eo1.normalizedOutput).toEqual(eo2.normalizedOutput);
  });
});
