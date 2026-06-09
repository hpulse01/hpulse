import { describe, it, expect } from 'vitest';
import {
  DeterministicRNG,
  generateCollapseSeed,
  calculateAmplitude,
  calculatePartitionFunction,
  calculateProbabilityDistribution,
  calculateEntropy,
  calculateCollapseConfidence,
  quantumCollapsePipeline,
  annealedCollapse,
  monteCarloPathIntegral,
  calculateFateVectorCoherence,
  type WorldLineInput,
} from '@/utils/quantumMath';

const mkWorldLines = (n: number): WorldLineInput[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `wl-${i}`,
    engineSupports: [
      { engineName: 'bazi', weight: 0.3, probability: 0.3 + 0.05 * i },
      { engineName: 'ziwei', weight: 0.2, probability: 0.6 - 0.04 * i },
    ],
    collapseWeight: 0.2 + 0.1 * i,
    consensusCount: (i % 4) + 1,
  }));

describe('quantumMath determinism', () => {
  it('DeterministicRNG is reproducible for the same seed', () => {
    const a = new DeterministicRNG(42n);
    const b = new DeterministicRNG(42n);
    for (let i = 0; i < 100; i++) expect(a.next()).toBe(b.next());
  });

  it('generateCollapseSeed is a pure function of birth data', () => {
    const s1 = generateCollapseSeed(1990, 5, 17, 8, 30, 'male', 31.23, 121.47);
    const s2 = generateCollapseSeed(1990, 5, 17, 8, 30, 'male', 31.23, 121.47);
    const s3 = generateCollapseSeed(1990, 5, 17, 8, 31, 'male', 31.23, 121.47);
    expect(s1).toBe(s2);
    expect(s1).not.toBe(s3);
  });

  it('quantumCollapsePipeline is deterministic for identical inputs', () => {
    const wl = mkWorldLines(6);
    const seed = generateCollapseSeed(1985, 11, 2, 14, 0, 'female', 39.9, 116.4);
    const r1 = quantumCollapsePipeline(wl, seed);
    const r2 = quantumCollapsePipeline(wl, seed);
    expect(r1).toEqual(r2);
  });

  it('annealedCollapse is deterministic for identical inputs', () => {
    const wl = mkWorldLines(5);
    const seed = 123456789n;
    expect(annealedCollapse(wl, seed)).toEqual(annealedCollapse(wl, seed));
  });

  it('monteCarloPathIntegral is deterministic for identical inputs', () => {
    const wl = mkWorldLines(4);
    const seed = 987654321n;
    expect(monteCarloPathIntegral(wl, seed)).toEqual(monteCarloPathIntegral(wl, seed));
  });
});

describe('Born rule consistency', () => {
  it('|Ψ|² matches Boltzmann weight e^(-E/kT)', () => {
    const kT = 1.0;
    for (const E of [0.1, 0.5, 1.0, 2.5]) {
      const psi = calculateAmplitude(E, kT);
      expect(psi.normSquared).toBeCloseTo(Math.exp(-E / kT), 10);
    }
  });

  it('probability distribution is normalized and matches |Ψ|²/Z', () => {
    const kT = 0.8;
    const potentials = [0.2, 0.7, 1.5, 3.0];
    const probs = calculateProbabilityDistribution(potentials, kT);
    expect(probs.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
    const Z = calculatePartitionFunction(potentials, kT);
    potentials.forEach((E, i) => {
      const psi = calculateAmplitude(E, kT);
      expect(probs[i]).toBeCloseTo(psi.normSquared / Z, 10);
    });
  });

  it('lower fate potential ⇒ higher probability', () => {
    const probs = calculateProbabilityDistribution([0.1, 1.0, 2.0], 1.0);
    expect(probs[0]).toBeGreaterThan(probs[1]);
    expect(probs[1]).toBeGreaterThan(probs[2]);
  });
});

describe('entropy and confidence', () => {
  it('uniform distribution has maximal entropy and zero-ish confidence', () => {
    const uniform = [0.25, 0.25, 0.25, 0.25];
    expect(calculateEntropy(uniform)).toBeCloseTo(2, 10);
    expect(calculateCollapseConfidence(uniform)).toBeCloseTo(0, 10);
  });

  it('deterministic distribution has zero entropy and full confidence', () => {
    const certain = [1, 0, 0, 0];
    expect(calculateEntropy(certain)).toBeCloseTo(0, 10);
    expect(calculateCollapseConfidence(certain)).toBeCloseTo(1, 10);
  });
});

describe('calculateFateVectorCoherence', () => {
  it('identical fate vectors yield maximal coherence', () => {
    const fv = { life: 70, wealth: 60, relation: 50, health: 80, wisdom: 65, spirit: 55, socialStatus: 45, creativity: 75, luck: 60, homeStability: 50 };
    const res = calculateFateVectorCoherence([fv, { ...fv }, { ...fv }], [1, 1, 1]);
    expect(res.overall).toBeGreaterThan(0.95);
  });

  it('divergent fate vectors yield lower coherence than identical ones', () => {
    const a = { life: 90, wealth: 90, relation: 90, health: 90, wisdom: 90, spirit: 90, socialStatus: 90, creativity: 90, luck: 90, homeStability: 90 };
    const b = { life: 10, wealth: 10, relation: 10, health: 10, wisdom: 10, spirit: 10, socialStatus: 10, creativity: 10, luck: 10, homeStability: 10 };
    const same = calculateFateVectorCoherence([a, { ...a }], [1, 1]);
    const diff = calculateFateVectorCoherence([a, b], [1, 1]);
    expect(diff.overall).toBeLessThan(same.overall);
  });
});
