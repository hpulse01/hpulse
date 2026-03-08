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

  it('natalAnalysis does not include liuren', () => {
    const weights = getWeightsForQueryType('natalAnalysis');
    expect(weights.find(w => w.engineName === 'liuren')).toBeUndefined();
  });

  it('instantDecision includes liuyao, meihua, qimen, and liuren with top weights', () => {
    const weights = getWeightsForQueryType('instantDecision');
    const ly = weights.find(w => w.engineName === 'liuyao');
    const mh = weights.find(w => w.engineName === 'meihua');
    const qm = weights.find(w => w.engineName === 'qimen');
    const lr = weights.find(w => w.engineName === 'liuren');
    expect(ly).toBeDefined();
    expect(mh).toBeDefined();
    expect(qm).toBeDefined();
    expect(lr).toBeDefined();
    const sorted = [...weights].sort((a, b) => b.weight - a.weight);
    const topFour = sorted.slice(0, 4).map(w => w.engineName);
    expect(topFour).toContain('meihua');
    expect(topFour).toContain('liuyao');
    expect(topFour).toContain('qimen');
    expect(topFour).toContain('liuren');
  });

  it('filtered weights re-normalize to 1.0', () => {
    const weights = getWeightsForQueryType('monthlyForecast', ['bazi', 'ziwei']);
    const sum = weights.reduce((s, w) => s + w.weight, 0);
    expect(sum).toBeCloseTo(1.0, 5);
    expect(weights).toHaveLength(2);
  });
});
