import { describe, it, expect } from 'vitest';
import { getActiveEngines } from '@/config/engineActivation';
import { getWeightsForQueryType } from '@/config/engineWeights';
import { buildTaiyiEngineOutput } from './taiyiAlgorithm';
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
  sourceMetadata: { provider: 'test', confidence: 1, normalizedLocationName: '北京', timezoneIana: 'Asia/Shanghai' },
};

describe('taiyi integration', () => {
  it('all queryTypes activate taiyi', () => {
    const types: QueryType[] = ['natalAnalysis', 'annualForecast', 'monthlyForecast', 'dailyForecast', 'instantDecision'];
    for (const qt of types) {
      expect(getActiveEngines(qt)).toContain('taiyi');
    }
  });

  it('权重归一化后总和为 1', () => {
    const types: QueryType[] = ['natalAnalysis', 'annualForecast', 'monthlyForecast', 'dailyForecast', 'instantDecision'];
    for (const qt of types) {
      const weights = getWeightsForQueryType(qt);
      const sum = weights.reduce((s, w) => s + w.weight, 0);
      expect(sum).toBeCloseTo(1.0, 5);
    }
  });

  it('buildTaiyiEngineOutput 返回完整 EngineOutput', () => {
    const { eo, taiyiResult } = buildTaiyiEngineOutput(MOCK_SI);
    expect(eo.engineName).toBe('taiyi');
    expect(eo.engineNameCN).toBe('太乙神数');
    expect(eo.fateVector.life).toBeGreaterThanOrEqual(5);
    expect(eo.fateVector.life).toBeLessThanOrEqual(95);
    expect(eo.normalizedOutput['局式']).toBeTruthy();
    expect(eo.normalizedOutput['太乙值位']).toBeTruthy();
    expect(eo.normalizedOutput['主算']).toBeTruthy();
    expect(eo.normalizedOutput['格局']).toBeTruthy();
    expect(eo.normalizedOutput['吉凶']).toBeTruthy();
    expect(eo.normalizedOutput['应期']).toBeTruthy();
    expect(taiyiResult.chart.palaces).toHaveLength(9);
  });

  it('相同 StandardizedInput → 相同 taiyi 输出', () => {
    const { eo: eo1 } = buildTaiyiEngineOutput(MOCK_SI);
    const { eo: eo2 } = buildTaiyiEngineOutput(MOCK_SI);
    expect(eo1.fateVector).toEqual(eo2.fateVector);
    expect(eo1.normalizedOutput).toEqual(eo2.normalizedOutput);
  });
});
