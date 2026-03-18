/**
 * H-Pulse Quantum Mathematics Framework v2.0
 *
 * v2.0 升级:
 *   - Quantum decoherence time-decay model (量子退相干时间衰减)
 *   - Adaptive simulated annealing for temperature scheduling (自适应模拟退火)
 *   - Monte Carlo path integral for confidence interval estimation (蒙特卡洛路径积分)
 *   - Cross-engine entanglement detection (跨引擎纠缠检测)
 *   - Rényi entropy for multi-scale uncertainty measurement
 *
 * v1.0 原有功能:
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

// ═══════════════════════════════════════════════
// 8. Quantum Decoherence Time-Decay (量子退相干模型)
//
// 随着预测时间跨度增大，引擎预测的确定性指数衰减。
// Γ(t) = Γ_0 · e^{-t/τ_d}
//   Γ_0 = 初始相干度
//   τ_d = 退相干时间常数 (年)
//   t = 预测跨度 (从出生/查询到目标时间)
// ═══════════════════════════════════════════════

export interface DecoherenceConfig {
  /** Initial coherence Γ₀ (0-1). Default: 0.95 */
  initialCoherence: number;
  /** Decoherence time constant τ_d (years). Default: 30 */
  timeConstant: number;
  /** Minimum coherence floor (never fully decohere). Default: 0.15 */
  floor: number;
}

const DEFAULT_DECOHERENCE: DecoherenceConfig = {
  initialCoherence: 0.95,
  timeConstant: 30,
  floor: 0.15,
};

/**
 * Calculate decoherence factor at a given time span.
 * Γ(t) = max(floor, Γ₀ · e^{-t/τ_d})
 *
 * Physically: near-term predictions are coherent (high certainty),
 * far-future predictions decohere (uncertainty increases).
 */
export function calculateDecoherence(
  yearsAhead: number,
  config: DecoherenceConfig = DEFAULT_DECOHERENCE,
): number {
  const { initialCoherence, timeConstant, floor } = config;
  const decayed = initialCoherence * Math.exp(-yearsAhead / timeConstant);
  return Math.max(floor, decayed);
}

/**
 * Apply decoherence to a fate potential.
 * Decoherent potentials spread out (increase uncertainty → increase effective energy).
 * E_decoherent(t) = E(t) / Γ(t)
 */
export function applyDecoherence(
  fatePotential: number,
  yearsAhead: number,
  config?: DecoherenceConfig,
): number {
  const gamma = calculateDecoherence(yearsAhead, config);
  return fatePotential / Math.max(0.01, gamma);
}

/**
 * Calculate decoherence-adjusted probability distribution.
 * Far-future predictions → flatter distribution (more uniform).
 */
export function decoherentProbabilities(
  potentials: number[],
  kT: number,
  yearsAhead: number,
  config?: DecoherenceConfig,
): number[] {
  const gamma = calculateDecoherence(yearsAhead, config);
  // Effective temperature increases with decoherence
  const effectiveKT = kT / Math.max(0.01, gamma);
  return calculateProbabilityDistribution(potentials, effectiveKT);
}

// ═══════════════════════════════════════════════
// 9. Adaptive Simulated Annealing (自适应模拟退火)
//
// 不使用固定温度 T，而是通过退火调度逐步降温：
//   T(k) = T_initial · α^k
// 允许在高温阶段探索更多路径，低温阶段锁定最优路径。
// ═══════════════════════════════════════════════

export interface AnnealingSchedule {
  /** Initial temperature. Default: 2.0 */
  initialTemp: number;
  /** Cooling rate α ∈ (0,1). Default: 0.85 */
  coolingRate: number;
  /** Final (frozen) temperature. Default: 0.1 */
  finalTemp: number;
  /** Number of annealing steps. Default: 10 */
  steps: number;
}

const DEFAULT_ANNEALING: AnnealingSchedule = {
  initialTemp: 2.0,
  coolingRate: 0.85,
  finalTemp: 0.1,
  steps: 10,
};

/**
 * Generate temperature schedule for annealing.
 * Returns array of temperatures from hot → cold.
 */
export function generateAnnealingSchedule(config: AnnealingSchedule = DEFAULT_ANNEALING): number[] {
  const temps: number[] = [];
  let T = config.initialTemp;
  for (let k = 0; k < config.steps; k++) {
    temps.push(Math.max(config.finalTemp, T));
    T *= config.coolingRate;
  }
  return temps;
}

/**
 * Annealed quantum collapse: run collapse at each temperature step,
 * track which world line is selected most frequently, and return
 * the consensus winner along with stability metrics.
 *
 * This reveals whether the collapse is robust (same winner at all temps)
 * or sensitive (winner changes with temperature).
 */
export function annealedCollapse(
  worldLines: WorldLineInput[],
  collapseSeed: bigint,
  schedule?: AnnealingSchedule,
): {
  winnerIndex: number;
  stability: number; // 0-1, fraction of steps that agree with winner
  temperatureProfile: number[];
  selectionsPerStep: number[];
  confidence: number;
} {
  if (worldLines.length === 0) {
    return { winnerIndex: -1, stability: 0, temperatureProfile: [], selectionsPerStep: [], confidence: 0 };
  }

  const temps = generateAnnealingSchedule(schedule);
  const selections: number[] = [];
  const rng = new DeterministicRNG(collapseSeed);

  for (const T of temps) {
    const result = quantumCollapsePipeline(worldLines, collapseSeed + BigInt(Math.round(T * 1000)), T);
    selections.push(result.collapsedIndex);
  }

  // Count votes for each world line
  const votes = new Map<number, number>();
  for (const sel of selections) {
    votes.set(sel, (votes.get(sel) || 0) + 1);
  }

  // Winner = most selected world line across all temperatures
  let winnerIndex = 0;
  let maxVotes = 0;
  for (const [idx, count] of votes) {
    if (count > maxVotes) {
      maxVotes = count;
      winnerIndex = idx;
    }
  }

  const stability = maxVotes / temps.length;

  // Final confidence: product of stability and last-step confidence
  const finalResult = quantumCollapsePipeline(worldLines, collapseSeed, temps[temps.length - 1]);
  const confidence = stability * finalResult.collapseConfidence;

  return {
    winnerIndex,
    stability,
    temperatureProfile: temps,
    selectionsPerStep: selections,
    confidence: Math.min(0.99, confidence),
  };
}

// ═══════════════════════════════════════════════
// 10. Monte Carlo Path Integral (蒙特卡洛路径积分)
//
// 通过多次随机扰动后重新坍缩，估算坍缩结果的置信区间。
// 这回答了关键问题："如果引擎输出有微小波动，结果会变吗？"
// ═══════════════════════════════════════════════

export interface MonteCarloConfig {
  /** Number of Monte Carlo samples. Default: 100 */
  numSamples: number;
  /** Perturbation magnitude (fraction of original). Default: 0.05 */
  perturbationScale: number;
}

export interface MonteCarloResult {
  /** Point estimate (mode of MC distribution) */
  modeIndex: number;
  /** Probability of the mode path being selected */
  modeProbability: number;
  /** Selection frequency for each world line across MC trials */
  selectionFrequency: Map<number, number>;
  /** Top 3 most frequently selected paths */
  topPaths: Array<{ index: number; frequency: number }>;
  /** Effective confidence: fraction of MC trials that agree */
  mcConfidence: number;
  /** Is the collapse stable (> 60% agreement)? */
  isStable: boolean;
}

/**
 * Monte Carlo path integral: perturb engine supports slightly and re-collapse
 * many times to estimate the robustness of the collapse.
 *
 * If most trials converge to the same world line → high confidence.
 * If trials scatter across many world lines → the collapse is sensitive.
 */
export function monteCarloPathIntegral(
  worldLines: WorldLineInput[],
  collapseSeed: bigint,
  temperature?: number,
  config: MonteCarloConfig = { numSamples: 100, perturbationScale: 0.05 },
): MonteCarloResult {
  if (worldLines.length === 0) {
    return {
      modeIndex: -1, modeProbability: 0,
      selectionFrequency: new Map(), topPaths: [],
      mcConfidence: 0, isStable: false,
    };
  }

  const rng = new DeterministicRNG(collapseSeed + 0xDEADBEEFn);
  const selectionFrequency = new Map<number, number>();

  for (let trial = 0; trial < config.numSamples; trial++) {
    // Perturb each world line's engine supports
    const perturbedLines: WorldLineInput[] = worldLines.map(wl => ({
      ...wl,
      engineSupports: wl.engineSupports.map(es => ({
        ...es,
        probability: Math.max(0.01, Math.min(0.99,
          es.probability + (rng.next() - 0.5) * 2 * config.perturbationScale
        )),
        weight: Math.max(0.01, es.weight + (rng.next() - 0.5) * 2 * config.perturbationScale * 0.5),
      })),
      collapseWeight: Math.max(0.01,
        wl.collapseWeight * (1 + (rng.next() - 0.5) * 2 * config.perturbationScale)
      ),
    }));

    // Use a different seed for each trial (but deterministic from base seed)
    const trialSeed = collapseSeed + BigInt(trial * 7919);
    const result = quantumCollapsePipeline(perturbedLines, trialSeed, temperature);
    const selected = result.collapsedIndex;
    selectionFrequency.set(selected, (selectionFrequency.get(selected) || 0) + 1);
  }

  // Find mode
  let modeIndex = 0;
  let maxCount = 0;
  for (const [idx, count] of selectionFrequency) {
    if (count > maxCount) {
      maxCount = count;
      modeIndex = idx;
    }
  }

  const modeProbability = maxCount / config.numSamples;

  // Top 3 paths
  const sortedEntries = [...selectionFrequency.entries()].sort((a, b) => b[1] - a[1]);
  const topPaths = sortedEntries.slice(0, 3).map(([index, count]) => ({
    index,
    frequency: count / config.numSamples,
  }));

  return {
    modeIndex,
    modeProbability,
    selectionFrequency,
    topPaths,
    mcConfidence: modeProbability,
    isStable: modeProbability > 0.6,
  };
}

// ═══════════════════════════════════════════════
// 11. Cross-Engine Entanglement Detection (跨引擎纠缠检测)
//
// 检测哪些引擎在预测输出上存在统计纠缠（高度相关）。
// 纠缠引擎不应获得独立的双倍权重——需要降低冗余权重。
// ═══════════════════════════════════════════════

export interface EngineEntanglement {
  engineA: string;
  engineB: string;
  correlation: number;  // Pearson r across all dimensions
  entangled: boolean;   // |r| > threshold
  strength: 'strong' | 'moderate' | 'weak';
}

/**
 * Detect entangled (highly correlated) engine pairs.
 *
 * When two engines produce nearly identical FateVectors, they are "entangled"
 * and should not be double-counted in the fusion process.
 *
 * Uses Pearson correlation across all 6 fate dimensions.
 * |r| > 0.85 → strong entanglement → significant weight penalty
 * |r| > 0.65 → moderate entanglement → mild weight penalty
 */
export function detectEngineEntanglement(
  engineFateVectors: Array<{ engineName: string; fateVector: FateVector }>,
  threshold: number = 0.65,
): EngineEntanglement[] {
  const entanglements: EngineEntanglement[] = [];

  for (let i = 0; i < engineFateVectors.length; i++) {
    for (let j = i + 1; j < engineFateVectors.length; j++) {
      const a = engineFateVectors[i];
      const b = engineFateVectors[j];

      // Pearson correlation across 6 dimensions
      const valsA = ALL_FATE_DIMENSIONS.map(d => a.fateVector[d]);
      const valsB = ALL_FATE_DIMENSIONS.map(d => b.fateVector[d]);
      const n = valsA.length;

      const meanA = valsA.reduce((s, v) => s + v, 0) / n;
      const meanB = valsB.reduce((s, v) => s + v, 0) / n;

      let cov = 0, varA = 0, varB = 0;
      for (let k = 0; k < n; k++) {
        const dA = valsA[k] - meanA;
        const dB = valsB[k] - meanB;
        cov += dA * dB;
        varA += dA * dA;
        varB += dB * dB;
      }

      const denom = Math.sqrt(varA * varB);
      const r = denom > 1e-10 ? cov / denom : 0;
      const absR = Math.abs(r);

      entanglements.push({
        engineA: a.engineName,
        engineB: b.engineName,
        correlation: r,
        entangled: absR > threshold,
        strength: absR > 0.85 ? 'strong' : absR > 0.65 ? 'moderate' : 'weak',
      });
    }
  }

  return entanglements;
}

/**
 * Calculate entanglement-adjusted weights.
 *
 * For entangled engine pairs, the lower-weighted engine receives a penalty
 * to prevent double-counting correlated information.
 *
 * Penalty formula: w_adjusted = w_original × (1 - |r| × penalty_factor)
 *   strong entanglement: penalty_factor = 0.4
 *   moderate entanglement: penalty_factor = 0.2
 */
export function adjustWeightsForEntanglement(
  weights: Array<{ engineName: string; weight: number }>,
  entanglements: EngineEntanglement[],
): Array<{ engineName: string; weight: number; adjustmentReason: string }> {
  const adjustedMap = new Map<string, { weight: number; reasons: string[] }>();
  for (const w of weights) {
    adjustedMap.set(w.engineName, { weight: w.weight, reasons: [] });
  }

  for (const ent of entanglements) {
    if (!ent.entangled) continue;

    const wA = adjustedMap.get(ent.engineA);
    const wB = adjustedMap.get(ent.engineB);
    if (!wA || !wB) continue;

    const penaltyFactor = ent.strength === 'strong' ? 0.4 : 0.2;
    // Penalize the lower-weight engine (it's the "redundant" one)
    if (wA.weight <= wB.weight) {
      wA.weight *= (1 - Math.abs(ent.correlation) * penaltyFactor);
      wA.reasons.push(`纠缠惩罚(${ent.engineB},r=${ent.correlation.toFixed(2)},×${(1 - Math.abs(ent.correlation) * penaltyFactor).toFixed(2)})`);
    } else {
      wB.weight *= (1 - Math.abs(ent.correlation) * penaltyFactor);
      wB.reasons.push(`纠缠惩罚(${ent.engineA},r=${ent.correlation.toFixed(2)},×${(1 - Math.abs(ent.correlation) * penaltyFactor).toFixed(2)})`);
    }
  }

  // Re-normalize
  const total = [...adjustedMap.values()].reduce((s, v) => s + v.weight, 0);
  const result: Array<{ engineName: string; weight: number; adjustmentReason: string }> = [];
  for (const [name, { weight, reasons }] of adjustedMap) {
    result.push({
      engineName: name,
      weight: total > 0 ? weight / total : weight,
      adjustmentReason: reasons.length > 0 ? reasons.join('；') : '无纠缠调整',
    });
  }

  return result;
}

// ═══════════════════════════════════════════════
// 12. Rényi Entropy (Rényi 熵)
//
// 推广 Shannon 熵到 order-α 的 Rényi 熵：
//   H_α = 1/(1-α) · log₂(Σ p_i^α)
//
// α=1 → Shannon entropy (取极限)
// α=2 → Collision entropy (最常用)
// α→∞ → Min-entropy (最坏情况)
// ═══════════════════════════════════════════════

/**
 * Calculate Rényi entropy of order α.
 *
 * Special cases:
 * - α → 1: Shannon entropy (continuous limit)
 * - α = 2: Collision entropy, -log₂(Σ p_i²)
 * - α → ∞: Min-entropy, -log₂(max p_i)
 *
 * Higher-order Rényi emphasizes dominant probabilities more strongly.
 */
export function calculateRenyiEntropy(probabilities: number[], alpha: number = 2): number {
  if (probabilities.length === 0) return 0;

  // Special case: α = 1 → Shannon entropy
  if (Math.abs(alpha - 1) < 1e-10) {
    return calculateEntropy(probabilities);
  }

  // Special case: α → ∞ → Min-entropy
  if (alpha > 50) {
    const maxP = Math.max(...probabilities.filter(p => p > 0));
    return maxP > 0 ? -Math.log2(maxP) : 0;
  }

  let sumPowerAlpha = 0;
  for (const p of probabilities) {
    if (p > 1e-15) {
      sumPowerAlpha += Math.pow(p, alpha);
    }
  }

  if (sumPowerAlpha <= 0) return 0;
  return (1 / (1 - alpha)) * Math.log2(sumPowerAlpha);
}

/**
 * Multi-scale entropy profile: compute Rényi entropy at different orders.
 * Provides a richer view of the distribution than a single entropy value.
 *
 * Returns: { α: H_α } for α ∈ [0.5, 1, 2, 5, ∞]
 */
export function entropyProfile(probabilities: number[]): Record<string, number> {
  return {
    'H_0.5': calculateRenyiEntropy(probabilities, 0.5),
    'H_1_shannon': calculateEntropy(probabilities),
    'H_2_collision': calculateRenyiEntropy(probabilities, 2),
    'H_5': calculateRenyiEntropy(probabilities, 5),
    'H_inf_min': calculateRenyiEntropy(probabilities, 100),
  };
}
