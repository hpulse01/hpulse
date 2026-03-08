/**
 * H-Pulse Quantum Mathematics Framework v1.0
 *
 * Implements the quantum mechanical formalism from the Notion specification:
 *   1. Wave function amplitude: Ψ(ω,t) = A·e^(-E(t)/kT)
 *   2. Partition function Z for normalization
 *   3. Fate potential: E_i(t) = -Σ W_s(t)·log P_s(ω_i|t)
 *   4. Deterministic collapse with seeded PRNG
 *   5. Probability distribution |c|² → Born rule
 */

import type { FateVector, FateDimension } from '@/types/prediction';
import { ALL_FATE_DIMENSIONS } from '@/types/prediction';

// ═══════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════

export interface QuantumAmplitude {
  /** Complex amplitude: real part */
  real: number;
  /** Complex amplitude: imaginary part */
  imag: number;
  /** |Ψ|² = probability */
  normSquared: number;
}

export interface WorldLineAmplitude {
  worldLineId: string;
  amplitude: QuantumAmplitude;
  fatePotential: number;
  probability: number;
  cumulativeProbability: number;
}

export interface QuantumCollapseConfig {
  /** Temperature parameter T — controls probability sharpness */
  temperature: number;
  /** Boltzmann constant analog kT */
  kT: number;
  /** Collapse seed for deterministic reproducibility */
  collapseSeed: bigint;
}

export interface CollapseDistribution {
  worldLines: WorldLineAmplitude[];
  partitionFunction: number;
  entropy: number;
  effectiveTemperature: number;
  collapsedIndex: number;
  collapseConfidence: number;
}

// ═══════════════════════════════════════════════
// 1. Deterministic Seeded PRNG (ChaCha20-inspired)
// ═══════════════════════════════════════════════

/**
 * Deterministic pseudo-random number generator.
 * Same seed always produces identical sequence.
 * Based on SplitMix64 for simplicity and speed in browser.
 */
export class DeterministicRNG {
  private state: bigint;

  constructor(seed: bigint) {
    this.state = seed;
  }

  /** Returns a deterministic float in [0, 1) */
  next(): number {
    this.state += 0x9e3779b97f4a7c15n;
    let z = this.state;
    z = (z ^ (z >> 30n)) * 0xbf58476d1ce4e5b9n;
    z = (z ^ (z >> 27n)) * 0x94d049bb133111ebn;
    z = z ^ (z >> 31n);
    // Convert to unsigned 32-bit then to float
    const u32 = Number(z & 0xFFFFFFFFn);
    return u32 / 0x100000000;
  }

  /** Weighted sample: returns index based on probability distribution */
  weightedSample(probabilities: number[]): number {
    const r = this.next();
    let cumulative = 0;
    for (let i = 0; i < probabilities.length; i++) {
      cumulative += probabilities[i];
      if (r < cumulative) return i;
    }
    return probabilities.length - 1;
  }
}

/**
 * Generate a deterministic collapse seed from birth data.
 * Same birth data → same seed → same collapse path.
 */
export function generateCollapseSeed(
  year: number, month: number, day: number,
  hour: number, minute: number, gender: 'male' | 'female',
  lat: number, lon: number,
): bigint {
  const genderBit = gender === 'male' ? 1n : 0n;
  const latBits = BigInt(Math.round(lat * 10000));
  const lonBits = BigInt(Math.round(lon * 10000));
  
  let seed = BigInt(year) * 13n + BigInt(month) * 7n + BigInt(day) * 3n;
  seed = seed * 100n + BigInt(hour);
  seed = seed * 100n + BigInt(minute);
  seed = (seed << 1n) | genderBit;
  seed = seed * 1000000n + (latBits < 0n ? -latBits + 900000n : latBits);
  seed = seed * 10000000n + (lonBits < 0n ? -lonBits + 9000000n : lonBits);
  
  // Mix bits for better distribution
  seed = (seed ^ (seed >> 33n)) * 0xff51afd7ed558ccdn;
  seed = (seed ^ (seed >> 33n)) * 0xc4ceb9fe1a85ec53n;
  seed = seed ^ (seed >> 33n);
  
  return seed & 0xFFFFFFFFFFFFFFFFn; // Clamp to u64
}

// ═══════════════════════════════════════════════
// 2. Fate Potential E_i(t) — 命理势能
// ═══════════════════════════════════════════════

export interface EngineSupport {
  engineName: string;
  weight: number;
  probability: number; // P_s(ω_i|t) — engine's support for this world line
}

/**
 * Calculate fate potential for a world line.
 * E_i(t) = -Σ W_s(t) · log P_s(ω_i|t)
 * 
 * Lower potential = more favorable (like physics: systems tend to lower energy)
 */
export function calculateFatePotential(engineSupports: EngineSupport[]): number {
  let potential = 0;
  for (const es of engineSupports) {
    const safeProb = Math.max(1e-10, Math.min(1 - 1e-10, es.probability));
    potential -= es.weight * Math.log(safeProb);
  }
  return potential;
}

// ═══════════════════════════════════════════════
// 3. Wave Function Amplitude — Ψ(ω,t)
// ═══════════════════════════════════════════════

/**
 * Calculate quantum amplitude for a world line.
 * Ψ(ω,t) = A · e^(-E(t)/kT)
 * 
 * Phase is determined by fate potential to create interference effects.
 */
export function calculateAmplitude(
  fatePotential: number,
  kT: number,
  phaseSeed: number = 0,
): QuantumAmplitude {
  const magnitude = Math.exp(-fatePotential / Math.max(0.01, kT));
  // Phase determined by potential → creates constructive/destructive interference
  const phase = (fatePotential * 2 * Math.PI + phaseSeed) % (2 * Math.PI);
  
  const real = magnitude * Math.cos(phase);
  const imag = magnitude * Math.sin(phase);
  const normSquared = real * real + imag * imag;
  
  return { real, imag, normSquared };
}

// ═══════════════════════════════════════════════
// 4. Partition Function Z — 配分函数
// ═══════════════════════════════════════════════

/**
 * Calculate partition function Z = Σ e^(-E_i/kT)
 * Ensures probability normalization (Born rule).
 */
export function calculatePartitionFunction(potentials: number[], kT: number): number {
  let Z = 0;
  for (const E of potentials) {
    Z += Math.exp(-E / Math.max(0.01, kT));
  }
  return Z;
}

/**
 * Calculate probability distribution from potentials.
 * P(ω_i) = |Ψ_i|² / Σ|Ψ_j|² = e^(-2E_i/kT) / Z²
 * Simplifies to Boltzmann: P_i = e^(-E_i/kT) / Z
 */
export function calculateProbabilityDistribution(
  potentials: number[], kT: number,
): number[] {
  const Z = calculatePartitionFunction(potentials, kT);
  if (Z === 0) {
    // Uniform distribution fallback
    return potentials.map(() => 1 / potentials.length);
  }
  return potentials.map(E => Math.exp(-E / Math.max(0.01, kT)) / Z);
}

// ═══════════════════════════════════════════════
// 5. Quantum Entropy — 信息熵
// ═══════════════════════════════════════════════

/**
 * Shannon entropy of the probability distribution.
 * High entropy = many equally likely outcomes (uncertainty)
 * Low entropy = one dominant outcome (certainty)
 */
export function calculateEntropy(probabilities: number[]): number {
  let H = 0;
  for (const p of probabilities) {
    if (p > 1e-15) H -= p * Math.log2(p);
  }
  return H;
}

/**
 * Collapse confidence: 1 - H/H_max
 * H_max = log2(N) for N outcomes
 */
export function calculateCollapseConfidence(probabilities: number[]): number {
  const H = calculateEntropy(probabilities);
  const Hmax = Math.log2(Math.max(2, probabilities.length));
  return Math.max(0, Math.min(1, 1 - H / Hmax));
}

// ═══════════════════════════════════════════════
// 6. Full Quantum Collapse Pipeline
// ═══════════════════════════════════════════════

export interface WorldLineInput {
  id: string;
  engineSupports: EngineSupport[];
  collapseWeight: number; // From world tree
  consensusCount: number;
}

/**
 * Effective temperature calculation.
 * Based on engine consensus — higher consensus → lower T → sharper distribution.
 */
function calculateEffectiveTemperature(worldLines: WorldLineInput[]): number {
  const avgConsensus = worldLines.reduce((s, w) => s + w.consensusCount, 0) / Math.max(1, worldLines.length);
  // Base temperature: 1.0
  // High consensus (many engines agree) → lower temp → more decisive
  // Low consensus → higher temp → more uncertain
  const T = Math.max(0.1, 1.5 - avgConsensus * 0.15);
  return T;
}

/**
 * Full quantum collapse pipeline:
 *   1. Calculate fate potentials E_i(t)
 *   2. Calculate amplitudes Ψ_i
 *   3. Compute probability distribution P_i = |Ψ_i|²/Z
 *   4. Deterministic weighted sampling
 */
export function quantumCollapsePipeline(
  worldLines: WorldLineInput[],
  collapseSeed: bigint,
  temperatureOverride?: number,
): CollapseDistribution {
  if (worldLines.length === 0) {
    return {
      worldLines: [],
      partitionFunction: 0,
      entropy: 0,
      effectiveTemperature: 1.0,
      collapsedIndex: -1,
      collapseConfidence: 0,
    };
  }

  // 1. Calculate effective temperature
  const T = temperatureOverride ?? calculateEffectiveTemperature(worldLines);
  const kT = T; // Using natural units where k=1

  // 2. Calculate fate potentials
  const potentials = worldLines.map(wl => {
    const basePotential = calculateFatePotential(wl.engineSupports);
    // Incorporate collapse weight from tree (engine consensus bonus)
    const consensusBonus = wl.consensusCount * 0.05;
    return basePotential - Math.log(Math.max(1e-10, wl.collapseWeight)) - consensusBonus;
  });

  // 3. Calculate amplitudes
  const amplitudes = potentials.map((E, i) =>
    calculateAmplitude(E, kT, i * 0.618033988749895) // Golden ratio phase offset
  );

  // 4. Probability distribution (Born rule: P_i = |Ψ_i|²/Z)
  const normSquareds = amplitudes.map(a => a.normSquared);
  const Z = normSquareds.reduce((s, ns) => s + ns, 0);
  const probabilities = Z > 0 ? normSquareds.map(ns => ns / Z) : normSquareds.map(() => 1 / worldLines.length);

  // 5. Entropy and confidence
  const entropy = calculateEntropy(probabilities);
  const collapseConfidence = calculateCollapseConfidence(probabilities);

  // 6. Deterministic collapse
  const rng = new DeterministicRNG(collapseSeed);
  const collapsedIndex = rng.weightedSample(probabilities);

  // 7. Build result
  let cumulativeProb = 0;
  const worldLineAmplitudes: WorldLineAmplitude[] = worldLines.map((wl, i) => {
    cumulativeProb += probabilities[i];
    return {
      worldLineId: wl.id,
      amplitude: amplitudes[i],
      fatePotential: potentials[i],
      probability: probabilities[i],
      cumulativeProbability: cumulativeProb,
    };
  });

  return {
    worldLines: worldLineAmplitudes,
    partitionFunction: Z,
    entropy,
    effectiveTemperature: T,
    collapsedIndex,
    collapseConfidence,
  };
}

// ═══════════════════════════════════════════════
// 7. FateVector Quantum Coherence
// ═══════════════════════════════════════════════

/**
 * Calculate quantum coherence across engines for a specific dimension.
 * High coherence = engines agree, low coherence = engines diverge.
 */
export function calculateDimensionCoherence(
  values: number[], weights: number[],
): number {
  if (values.length < 2) return 1.0;
  
  let weightedMean = 0;
  let totalWeight = 0;
  for (let i = 0; i < values.length; i++) {
    const w = weights[i] ?? 1;
    weightedMean += values[i] * w;
    totalWeight += w;
  }
  weightedMean /= Math.max(totalWeight, 1e-10);
  
  // Weighted variance
  let weightedVariance = 0;
  for (let i = 0; i < values.length; i++) {
    const w = weights[i] ?? 1;
    weightedVariance += w * (values[i] - weightedMean) ** 2;
  }
  weightedVariance /= Math.max(totalWeight, 1e-10);
  
  // Coherence: 1 - normalized std deviation
  const stdDev = Math.sqrt(weightedVariance);
  // Normalize: max possible std dev for [0,100] range is 50
  return Math.max(0, Math.min(1, 1 - stdDev / 50));
}

/**
 * Calculate full FateVector coherence across all dimensions.
 */
export function calculateFateVectorCoherence(
  engineFateVectors: FateVector[],
  engineWeights: number[],
): Record<FateDimension, number> & { overall: number } {
  const coherences: Record<string, number> = {};
  let totalCoherence = 0;
  
  for (const dim of ALL_FATE_DIMENSIONS) {
    const values = engineFateVectors.map(fv => fv[dim]);
    coherences[dim] = calculateDimensionCoherence(values, engineWeights);
    totalCoherence += coherences[dim];
  }
  
  return {
    life: coherences.life,
    wealth: coherences.wealth,
    relation: coherences.relation,
    health: coherences.health,
    wisdom: coherences.wisdom,
    spirit: coherences.spirit,
    overall: totalCoherence / ALL_FATE_DIMENSIONS.length,
  };
}
