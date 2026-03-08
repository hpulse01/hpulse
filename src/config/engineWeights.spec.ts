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

  it('natalAnalysis includes all 13 engines with instant engines at low weight', () => {
    const weights = getWeightsForQueryType('natalAnalysis');
    expect(weights).toHaveLength(13);
    const taiyi = weights.find(w => w.engineName === 'taiyi')!;
    const bazi = weights.find(w => w.engineName === 'bazi')!;
    expect(bazi.weight).toBeGreaterThan(taiyi.weight);
  });

  it('instantDecision includes liuyao, meihua, qimen, liuren, and taiyi', () => {
    const weights = getWeightsForQueryType('instantDecision');
    expect(weights.find(w => w.engineName === 'liuyao')).toBeDefined();
    expect(weights.find(w => w.engineName === 'meihua')).toBeDefined();
    expect(weights.find(w => w.engineName === 'qimen')).toBeDefined();
    expect(weights.find(w => w.engineName === 'liuren')).toBeDefined();
    expect(weights.find(w => w.engineName === 'taiyi')).toBeDefined();
  });

  it('instantDecision: meihua/qimen/liuren weight > taiyi', () => {
    const weights = getWeightsForQueryType('instantDecision');
    const taiyi = weights.find(w => w.engineName === 'taiyi')!;
    expect(weights.find(w => w.engineName === 'meihua')!.weight).toBeGreaterThan(taiyi.weight);
    expect(weights.find(w => w.engineName === 'qimen')!.weight).toBeGreaterThan(taiyi.weight);
    expect(weights.find(w => w.engineName === 'liuren')!.weight).toBeGreaterThan(taiyi.weight);
  });

  it('annualForecast includes taiyi', () => {
    const weights = getWeightsForQueryType('annualForecast');
    expect(weights.find(w => w.engineName === 'taiyi')).toBeDefined();
  });

  it('filtered weights re-normalize to 1.0', () => {
    const weights = getWeightsForQueryType('monthlyForecast', ['bazi', 'ziwei']);
    const sum = weights.reduce((s, w) => s + w.weight, 0);
    expect(sum).toBeCloseTo(1.0, 5);
    expect(weights).toHaveLength(2);
  });
});
