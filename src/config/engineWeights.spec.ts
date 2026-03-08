import { describe, it, expect } from 'vitest';
import { getWeightsForQueryType } from './engineWeights';
import type { QueryType } from '@/types/prediction';

const QUERY_TYPES: QueryType[] = ['natalAnalysis', 'annualForecast', 'monthlyForecast', 'dailyForecast', 'instantDecision'];

describe('engineWeights', () => {
  it.each(QUERY_TYPES)('weights for %s sum to ~1.0', (qt) => {
    const weights = getWeightsForQueryType(qt);
    const sum = weights.reduce((s, w) => s + w.weight, 0);
    expect(sum).toBeCloseTo(1.0, 5);
  });

  it('natalAnalysis does not include liuyao', () => {
    const weights = getWeightsForQueryType('natalAnalysis');
    expect(weights.find(w => w.engineName === 'liuyao')).toBeUndefined();
  });

  it('instantDecision includes liuyao with highest weight', () => {
    const weights = getWeightsForQueryType('instantDecision');
    const ly = weights.find(w => w.engineName === 'liuyao');
    expect(ly).toBeDefined();
    const maxWeight = Math.max(...weights.map(w => w.weight));
    expect(ly!.weight).toBe(maxWeight);
  });

  it('filtered weights re-normalize to 1.0', () => {
    const weights = getWeightsForQueryType('monthlyForecast', ['bazi', 'ziwei']);
    const sum = weights.reduce((s, w) => s + w.weight, 0);
    expect(sum).toBeCloseTo(1.0, 5);
    expect(weights).toHaveLength(2);
  });
});
