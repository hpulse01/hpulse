import { describe, expect, it } from 'vitest';
import { computeDynamicWeights, rankedWeights } from '../calculator';
import { ALL_ENGINES, type EngineId } from '../types';

describe('computeDynamicWeights', () => {
  it('returns normalized weights that sum to 1 when no engines are degraded', () => {
    const result = computeDynamicWeights({
      ageYears: 35,
      event: 'general',
      granularity: 'year',
    });
    const sum = ALL_ENGINES.reduce((s, id) => s + result.weights[id], 0);
    expect(sum).toBeCloseTo(1, 10);
    expect(result.degradedEngines).toEqual([]);
    expect(result.lifeStage).toBe('prime');
  });

  it('assigns 0 weight to degraded engines and renormalizes the rest', () => {
    const degraded: EngineId[] = ['mayan', 'kabbalah'];
    const result = computeDynamicWeights({
      ageYears: 35,
      event: 'general',
      granularity: 'year',
      degradedEngines: degraded,
    });
    expect(result.weights.mayan).toBe(0);
    expect(result.weights.kabbalah).toBe(0);
    const sum = ALL_ENGINES.reduce((s, id) => s + result.weights[id], 0);
    expect(sum).toBeCloseTo(1, 10);
    expect(result.degradedEngines).toEqual(degraded);
  });

  it('maps age to correct life stage', () => {
    expect(computeDynamicWeights({ ageYears: 5, event: 'general', granularity: 'year' }).lifeStage).toBe('childhood');
    expect(computeDynamicWeights({ ageYears: 20, event: 'general', granularity: 'year' }).lifeStage).toBe('youth');
    expect(computeDynamicWeights({ ageYears: 35, event: 'general', granularity: 'year' }).lifeStage).toBe('prime');
    expect(computeDynamicWeights({ ageYears: 50, event: 'general', granularity: 'year' }).lifeStage).toBe('middle');
    expect(computeDynamicWeights({ ageYears: 70, event: 'general', granularity: 'year' }).lifeStage).toBe('elder');
  });

  it('is deterministic: same input yields byte-identical output', () => {
    const opts = { ageYears: 28, event: 'crisis' as const, granularity: 'hour' as const };
    const a = computeDynamicWeights(opts);
    const b = computeDynamicWeights(opts);
    expect(a).toEqual(b);
  });

  it('dominant engine is deterministic and has the highest weight', () => {
    const result = computeDynamicWeights({
      ageYears: 35,
      event: 'career',
      granularity: 'year',
    });
    const maxWeight = Math.max(...ALL_ENGINES.map(id => result.weights[id]));
    expect(result.weights[result.dominant]).toBe(maxWeight);
  });

  it('includes matrixVersion in output', () => {
    const result = computeDynamicWeights({
      ageYears: 35,
      event: 'general',
      granularity: 'year',
    });
    expect(result.matrixVersion).toBe('wmat-1.1.0');
  });

  it('handles all engines degraded gracefully', () => {
    const result = computeDynamicWeights({
      ageYears: 35,
      event: 'general',
      granularity: 'year',
      degradedEngines: [...ALL_ENGINES],
    });
    for (const id of ALL_ENGINES) expect(result.weights[id]).toBe(0);
  });
});

describe('rankedWeights', () => {
  it('returns engines sorted descending by weight with deterministic tie-break', () => {
    const w = computeDynamicWeights({
      ageYears: 35,
      event: 'career',
      granularity: 'year',
    });
    const ranked = rankedWeights(w);
    expect(ranked).toHaveLength(ALL_ENGINES.length);
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i - 1][1]).toBeGreaterThanOrEqual(ranked[i][1]);
    }
  });

  it('is deterministic', () => {
    const w = computeDynamicWeights({ ageYears: 35, event: 'general', granularity: 'day' });
    expect(rankedWeights(w)).toEqual(rankedWeights(w));
  });
});
