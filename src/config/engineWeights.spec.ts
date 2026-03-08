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

  it('instantDecision includes liuyao and meihua with top weights', () => {
    const weights = getWeightsForQueryType('instantDecision');
    const ly = weights.find(w => w.engineName === 'liuyao');
    const mh = weights.find(w => w.engineName === 'meihua');
    expect(ly).toBeDefined();
    expect(mh).toBeDefined();
    // meihua and liuyao should be the two highest weights
    const sorted = [...weights].sort((a, b) => b.weight - a.weight);
    const topTwo = sorted.slice(0, 2).map(w => w.engineName);
    expect(topTwo).toContain('meihua');
    expect(topTwo).toContain('liuyao');
  });

  it('filtered weights re-normalize to 1.0', () => {
    const weights = getWeightsForQueryType('monthlyForecast', ['bazi', 'ziwei']);
    const sum = weights.reduce((s, w) => s + w.weight, 0);
    expect(sum).toBeCloseTo(1.0, 5);
    expect(weights).toHaveLength(2);
  });
});
