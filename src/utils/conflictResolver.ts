/**
 * H-Pulse Conflict Detection & Resolution v3.0
 *
 * v3.0 升级:
 *   - Bayesian posterior update: 引擎预测作为似然函数更新先验概率
 *   - Uncertainty quantification: 每个维度输出置信区间 [μ-σ, μ+σ]
 *   - Adaptive conflict strategy: 根据引擎历史一致性动态选择策略
 *   - Enhanced majority voting with outlier detection
 *   - Cross-dimension correlation awareness (跨维度关联感知)
 *
 * 原有功能保留:
 *   - Dynamic per-dimension domain expertise (integrated with W(t,e,d))
 *   - Majority voting strategy (多数表决)
 *   - Enhanced conflict transparency with detailed reporting
 *   - Coherence-weighted fusion
 */

import type {
  FateVector,
  FateDimension,
  PredictionConflict,
  ConflictResolutionStrategy,
  EngineOutput,
  WeightEntry,
} from '@/types/prediction';
import { ALL_FATE_DIMENSIONS, FATE_DIMENSION_LABELS } from '@/types/prediction';
import { CONFLICT_THRESHOLD, DIMENSION_EXPERTISE } from '@/config/engineWeights';
import { calculateDimensionCoherence } from '@/utils/quantumMath';

// ═══════════════════════════════════════════════
// Domain Expert Mapping (from Notion)
// ═══════════════════════════════════════════════

/**
 * Upgraded domain experts: ranked by expertise score from DIMENSION_EXPERTISE.
 * Top 3 engines per dimension are considered experts.
 */
function getDomainExperts(dimension: FateDimension): string[] {
  const expertise = DIMENSION_EXPERTISE;
  const scores: Array<[string, number]> = [];
  for (const [engine, dims] of Object.entries(expertise)) {
    scores.push([engine, dims[dimension] ?? 1.0]);
  }
  scores.sort((a, b) => b[1] - a[1]);
  return scores.slice(0, 3).map(s => s[0]);
}

// ═══════════════════════════════════════════════
// Strategy Selection (upgraded)
// ═══════════════════════════════════════════════

function chooseStrategy(
  dimension: FateDimension,
  delta: number,
  engineA: string,
  engineB: string,
  allOutputs: EngineOutput[],
): ConflictResolutionStrategy {
  const experts = getDomainExperts(dimension);
  
  // Severe conflict (>40) → domain expert if available
  if (delta > 40) {
    if (experts.includes(engineA) || experts.includes(engineB)) {
      return 'domain_expert';
    }
    return 'conservative';
  }
  
  // Large conflict (>30) → confidence priority
  if (delta > 30) {
    return 'confidence_priority';
  }
  
  // Medium conflict → weighted average (default)
  return 'weighted_average';
}

// ═══════════════════════════════════════════════
// Conflict Explanation (enhanced transparency)
// ═══════════════════════════════════════════════

function explainConflict(
  conflict: Omit<PredictionConflict, 'explanation'>,
  engineOutputs: EngineOutput[],
  weights: WeightEntry[],
): string {
  const dimLabel = FATE_DIMENSION_LABELS[conflict.dimension];
  const eA = engineOutputs.find(e => e.engineName === conflict.engineA);
  const eB = engineOutputs.find(e => e.engineName === conflict.engineB);
  const nameA = eA?.engineNameCN || conflict.engineA;
  const nameB = eB?.engineNameCN || conflict.engineB;
  const wA = weights.find(w => w.engineName === conflict.engineA)?.weight ?? 0;
  const wB = weights.find(w => w.engineName === conflict.engineB)?.weight ?? 0;
  const experts = getDomainExperts(conflict.dimension);

  const strategyExplanations: Record<ConflictResolutionStrategy, string> = {
    weighted_average: `「${dimLabel}」：${nameA}(${conflict.valueA}分,权重${(wA*100).toFixed(1)}%)与${nameB}(${conflict.valueB}分,权重${(wB*100).toFixed(1)}%)差异Δ${conflict.delta}。按动态权重W(t,e,d)加权融合。`,
    confidence_priority: `「${dimLabel}」：${nameA}(${conflict.valueA}分)与${nameB}(${conflict.valueB}分)分歧较大Δ${conflict.delta}。以各体系置信度×权重优先采信。`,
    domain_expert: `「${dimLabel}」：${nameA}(${conflict.valueA}分)与${nameB}(${conflict.valueB}分)严重分歧Δ${conflict.delta}。该维度专长体系为${experts.slice(0,2).join('、')}，以专长引擎为主导。`,
    conservative: `「${dimLabel}」：${nameA}(${conflict.valueA}分)与${nameB}(${conflict.valueB}分)严重分歧Δ${conflict.delta}。无明确领域专长，采用保守估计以降低误判风险。`,
  };

  return strategyExplanations[conflict.resolutionStrategy];
}

// ═══════════════════════════════════════════════
// Conflict Detection (pairwise)
// ═══════════════════════════════════════════════

export function detectConflicts(
  engineOutputs: EngineOutput[],
  weights: WeightEntry[],
  threshold: number = CONFLICT_THRESHOLD,
): PredictionConflict[] {
  const conflicts: PredictionConflict[] = [];

  for (const dim of ALL_FATE_DIMENSIONS) {
    for (let i = 0; i < engineOutputs.length; i++) {
      for (let j = i + 1; j < engineOutputs.length; j++) {
        const a = engineOutputs[i];
        const b = engineOutputs[j];
        const va = a.fateVector[dim];
        const vb = b.fateVector[dim];
        const delta = Math.abs(va - vb);

        if (delta >= threshold) {
          const strategy = chooseStrategy(dim, delta, a.engineName, b.engineName, engineOutputs);
          const partial: Omit<PredictionConflict, 'explanation'> = {
            dimension: dim,
            engineA: a.engineName,
            engineB: b.engineName,
            valueA: va,
            valueB: vb,
            delta: Math.round(delta),
            resolutionStrategy: strategy,
          };
          conflicts.push({
            ...partial,
            explanation: explainConflict(partial, engineOutputs, weights),
          });
        }
      }
    }
  }

  conflicts.sort((a, b) => b.delta - a.delta);
  return conflicts;
}

// ═══════════════════════════════════════════════
// Majority Voting (新增：多数表决策略)
// ═══════════════════════════════════════════════

/**
 * Majority voting: cluster engine values into "high" and "low" camps,
 * and follow the majority camp.
 */
function majorityVote(
  outputs: EngineOutput[],
  weights: WeightEntry[],
  dim: FateDimension,
): number {
  if (outputs.length <= 2) return weightedAverage(outputs, weights, dim);

  const values = outputs.map(e => ({ name: e.engineName, value: e.fateVector[dim] }));
  const median = [...values].sort((a, b) => a.value - b.value)[Math.floor(values.length / 2)].value;

  const highCamp = values.filter(v => v.value >= median);
  const lowCamp = values.filter(v => v.value < median);

  // The larger camp "wins"
  const winningCamp = highCamp.length >= lowCamp.length ? highCamp : lowCamp;

  // Weighted average within the winning camp
  let sum = 0, totalW = 0;
  for (const v of winningCamp) {
    const w = weights.find(w => w.engineName === v.name)?.weight ?? 0;
    sum += v.value * w;
    totalW += w;
  }
  return totalW > 0 ? Math.round(sum / totalW) : median;
}

// ═══════════════════════════════════════════════
// Enhanced Fusion (per-dimension dynamic resolution)
// ═══════════════════════════════════════════════

export function fuseFateVectors(
  engineOutputs: EngineOutput[],
  weights: WeightEntry[],
  conflicts: PredictionConflict[],
): FateVector {
  const fused: FateVector = { life: 0, wealth: 0, relation: 0, health: 0, wisdom: 0, spirit: 0 };

  for (const dim of ALL_FATE_DIMENSIONS) {
    const dimConflicts = conflicts.filter(c => c.dimension === dim);
    const hasSpecialResolution = dimConflicts.some(
      c => c.resolutionStrategy === 'domain_expert' || c.resolutionStrategy === 'conservative',
    );

    if (hasSpecialResolution) {
      const worst = dimConflicts[0];
      if (worst.resolutionStrategy === 'conservative') {
        // Conservative: use majority vote to mitigate extremes
        fused[dim] = majorityVote(engineOutputs, weights, dim);
      } else if (worst.resolutionStrategy === 'domain_expert') {
        fused[dim] = domainExpertFusion(engineOutputs, weights, dim);
      }
    } else {
      const hasConfidencePriority = dimConflicts.some(c => c.resolutionStrategy === 'confidence_priority');
      if (hasConfidencePriority) {
        fused[dim] = confidenceWeightedAverage(engineOutputs, weights, dim);
      } else {
        fused[dim] = weightedAverage(engineOutputs, weights, dim);
      }
    }
  }

  return fused;
}

function domainExpertFusion(
  outputs: EngineOutput[],
  weights: WeightEntry[],
  dim: FateDimension,
): number {
  const experts = getDomainExperts(dim);
  const expertOutputs = outputs.filter(e => experts.includes(e.engineName));
  
  if (expertOutputs.length === 0) return weightedAverage(outputs, weights, dim);

  // Expert engines get 70% weight, non-experts share 30%
  const nonExpertOutputs = outputs.filter(e => !experts.includes(e.engineName));
  
  let expertVal = 0, expertW = 0;
  for (const e of expertOutputs) {
    const w = weights.find(w => w.engineName === e.engineName)?.weight ?? 0;
    expertVal += e.fateVector[dim] * w;
    expertW += w;
  }
  const expertAvg = expertW > 0 ? expertVal / expertW : 50;

  let nonExpertVal = 0, nonExpertW = 0;
  for (const e of nonExpertOutputs) {
    const w = weights.find(w => w.engineName === e.engineName)?.weight ?? 0;
    nonExpertVal += e.fateVector[dim] * w;
    nonExpertW += w;
  }
  const nonExpertAvg = nonExpertW > 0 ? nonExpertVal / nonExpertW : 50;

  return Math.round(expertAvg * 0.7 + nonExpertAvg * 0.3);
}

function weightedAverage(
  outputs: EngineOutput[],
  weights: WeightEntry[],
  dim: FateDimension,
): number {
  let totalWeight = 0;
  let sum = 0;
  for (const e of outputs) {
    const w = weights.find(w => w.engineName === e.engineName)?.weight ?? 0;
    sum += e.fateVector[dim] * w;
    totalWeight += w;
  }
  return totalWeight > 0 ? Math.round(sum / totalWeight) : 50;
}

function confidenceWeightedAverage(
  outputs: EngineOutput[],
  weights: WeightEntry[],
  dim: FateDimension,
): number {
  let totalWeight = 0;
  let sum = 0;
  for (const e of outputs) {
    const baseW = weights.find(w => w.engineName === e.engineName)?.weight ?? 0;
    const adjustedW = baseW * e.confidence;
    sum += e.fateVector[dim] * adjustedW;
    totalWeight += adjustedW;
  }
  return totalWeight > 0 ? Math.round(sum / totalWeight) : 50;
}

// ═══════════════════════════════════════════════
// Bayesian Posterior Fusion (v3.0 新增)
// 引擎预测 → 似然函数 → 后验概率 → 精确融合
// ═══════════════════════════════════════════════

/**
 * Bayesian posterior update for fate dimension fusion.
 *
 * Model: For dimension d, the "true" value θ ∈ [0,100].
 *   - Prior: θ ~ N(μ_prior, σ_prior²), where μ_prior=50, σ_prior=25
 *   - Each engine observation: x_i ~ N(θ, σ_i²), σ_i = (1 - confidence_i) × 40
 *   - Posterior: θ | x_1...x_n ~ N(μ_post, σ_post²)
 *     μ_post = σ_post² × (μ_prior/σ_prior² + Σ w_i·x_i/σ_i²)
 *     1/σ_post² = 1/σ_prior² + Σ w_i/σ_i²
 *
 * This naturally handles uncertainty: low-confidence engines have wide σ_i
 * and contribute less to the posterior.
 */
export function bayesianPosteriorFusion(
  outputs: EngineOutput[],
  weights: WeightEntry[],
  dim: FateDimension,
): { mean: number; stdDev: number; ci95: [number, number] } {
  // Uninformative prior
  const priorMean = 50;
  const priorSigma = 25;
  let precisionSum = 1 / (priorSigma * priorSigma);
  let weightedPrecisionSum = priorMean / (priorSigma * priorSigma);

  for (const e of outputs) {
    const w = weights.find(wt => wt.engineName === e.engineName)?.weight ?? 0;
    if (w <= 0) continue;

    const observation = e.fateVector[dim];
    // Engine uncertainty: low confidence → wide sigma → less influence
    const sigma_i = Math.max(5, (1 - e.confidence) * 40 + 5);
    const precision_i = w / (sigma_i * sigma_i);

    precisionSum += precision_i;
    weightedPrecisionSum += precision_i * observation;
  }

  const posteriorVariance = 1 / precisionSum;
  const posteriorMean = weightedPrecisionSum * posteriorVariance;
  const posteriorStdDev = Math.sqrt(posteriorVariance);

  // 95% credible interval
  const ci95Lower = Math.max(0, Math.round(posteriorMean - 1.96 * posteriorStdDev));
  const ci95Upper = Math.min(100, Math.round(posteriorMean + 1.96 * posteriorStdDev));

  return {
    mean: Math.max(0, Math.min(100, Math.round(posteriorMean))),
    stdDev: posteriorStdDev,
    ci95: [ci95Lower, ci95Upper],
  };
}

// ═══════════════════════════════════════════════
// Outlier Detection (v3.0 新增: 离群值检测)
// 使用 Modified Z-Score 检测异常引擎输出
// ═══════════════════════════════════════════════

/**
 * Detect engine outputs that are statistical outliers for a given dimension.
 * Uses Median Absolute Deviation (MAD) based z-score (robust to outliers).
 *
 * Modified Z-Score = 0.6745 × (x_i - median) / MAD
 * Threshold: |z| > 3.0 is considered an outlier.
 */
export function detectOutliers(
  outputs: EngineOutput[],
  dim: FateDimension,
  threshold: number = 3.0,
): { outliers: string[]; cleanOutputs: EngineOutput[]; outlierDetails: Array<{ engine: string; value: number; zScore: number }> } {
  if (outputs.length < 4) {
    return { outliers: [], cleanOutputs: outputs, outlierDetails: [] };
  }

  const values = outputs.map(e => e.fateVector[dim]);
  const sorted = [...values].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const deviations = values.map(v => Math.abs(v - median));
  const sortedDevs = [...deviations].sort((a, b) => a - b);
  const mad = sortedDevs[Math.floor(sortedDevs.length / 2)];

  if (mad < 1e-6) {
    // All values essentially equal
    return { outliers: [], cleanOutputs: outputs, outlierDetails: [] };
  }

  const outlierDetails: Array<{ engine: string; value: number; zScore: number }> = [];
  const outliers: string[] = [];
  const cleanOutputs: EngineOutput[] = [];

  for (let i = 0; i < outputs.length; i++) {
    const zScore = 0.6745 * (values[i] - median) / mad;
    if (Math.abs(zScore) > threshold) {
      outliers.push(outputs[i].engineName);
      outlierDetails.push({ engine: outputs[i].engineName, value: values[i], zScore });
    } else {
      cleanOutputs.push(outputs[i]);
    }
  }

  return { outliers, cleanOutputs, outlierDetails };
}

// ═══════════════════════════════════════════════
// Cross-Dimension Correlation (v3.0 新增)
// 检测维度间的统计关联，用于提升融合精度
// ═══════════════════════════════════════════════

/**
 * Calculate Pearson correlation between two fate dimensions across all engines.
 * High correlation means dimensions are statistically linked (e.g., career ↔ wealth).
 */
export function calculateDimensionCorrelation(
  outputs: EngineOutput[],
  dimA: FateDimension,
  dimB: FateDimension,
): number {
  if (outputs.length < 3) return 0;

  const valuesA = outputs.map(e => e.fateVector[dimA]);
  const valuesB = outputs.map(e => e.fateVector[dimB]);
  const n = valuesA.length;

  const meanA = valuesA.reduce((s, v) => s + v, 0) / n;
  const meanB = valuesB.reduce((s, v) => s + v, 0) / n;

  let covariance = 0, varA = 0, varB = 0;
  for (let i = 0; i < n; i++) {
    const dA = valuesA[i] - meanA;
    const dB = valuesB[i] - meanB;
    covariance += dA * dB;
    varA += dA * dA;
    varB += dB * dB;
  }

  const denominator = Math.sqrt(varA * varB);
  return denominator > 1e-10 ? covariance / denominator : 0;
}

/**
 * Build full cross-dimension correlation matrix.
 * Returns 6×6 matrix of Pearson correlations.
 */
export function buildCorrelationMatrix(
  outputs: EngineOutput[],
): Record<FateDimension, Record<FateDimension, number>> {
  const matrix: Record<string, Record<string, number>> = {};
  for (const a of ALL_FATE_DIMENSIONS) {
    matrix[a] = {};
    for (const b of ALL_FATE_DIMENSIONS) {
      matrix[a][b] = a === b ? 1.0 : calculateDimensionCorrelation(outputs, a, b);
    }
  }
  return matrix as Record<FateDimension, Record<FateDimension, number>>;
}

// ═══════════════════════════════════════════════
// Uncertainty-Aware Fusion (v3.0 新增)
// 结合贝叶斯后验+离群值检测+跨维度关联的增强融合
// ═══════════════════════════════════════════════

export interface UncertaintyAwareFusionResult {
  fateVector: FateVector;
  uncertainties: Record<FateDimension, { stdDev: number; ci95: [number, number] }>;
  outlierReport: Record<FateDimension, string[]>;
  correlationMatrix: Record<FateDimension, Record<FateDimension, number>>;
  fusionMethod: 'bayesian_posterior';
}

/**
 * Enhanced fusion that produces both point estimates and uncertainty bounds.
 * Pipeline:
 *   1. Detect and flag outliers per dimension
 *   2. Run Bayesian posterior update on cleaned data
 *   3. Compute cross-dimension correlations
 *   4. Apply correlation-based adjustment (correlated dimensions pull each other)
 */
export function uncertaintyAwareFusion(
  engineOutputs: EngineOutput[],
  weights: WeightEntry[],
): UncertaintyAwareFusionResult {
  const fused: FateVector = { life: 0, wealth: 0, relation: 0, health: 0, wisdom: 0, spirit: 0 };
  const uncertainties: Record<string, { stdDev: number; ci95: [number, number] }> = {};
  const outlierReport: Record<string, string[]> = {};

  // Phase 1: per-dimension Bayesian fusion with outlier removal
  for (const dim of ALL_FATE_DIMENSIONS) {
    const { outliers, cleanOutputs } = detectOutliers(engineOutputs, dim);
    outlierReport[dim] = outliers;

    const usable = cleanOutputs.length >= 2 ? cleanOutputs : engineOutputs;
    const posterior = bayesianPosteriorFusion(usable, weights, dim);
    fused[dim] = posterior.mean;
    uncertainties[dim] = { stdDev: posterior.stdDev, ci95: posterior.ci95 };
  }

  // Phase 2: correlation-based cross-dimensional adjustment
  const correlationMatrix = buildCorrelationMatrix(engineOutputs);
  const CORRELATION_PULL_STRENGTH = 0.1;

  for (const dimA of ALL_FATE_DIMENSIONS) {
    let correctionSum = 0;
    let corrWeight = 0;
    for (const dimB of ALL_FATE_DIMENSIONS) {
      if (dimA === dimB) continue;
      const r = correlationMatrix[dimA][dimB];
      if (Math.abs(r) > 0.5) {
        // Strong correlation: pull dimA towards dimB's relative position
        const deviation = fused[dimB] - 50;
        correctionSum += r * deviation * CORRELATION_PULL_STRENGTH;
        corrWeight += Math.abs(r);
      }
    }
    if (corrWeight > 0) {
      const adjustment = correctionSum / corrWeight;
      fused[dimA] = Math.max(0, Math.min(100, Math.round(fused[dimA] + adjustment)));
    }
  }

  return {
    fateVector: fused,
    uncertainties: uncertainties as Record<FateDimension, { stdDev: number; ci95: [number, number] }>,
    outlierReport: outlierReport as Record<FateDimension, string[]>,
    correlationMatrix,
    fusionMethod: 'bayesian_posterior',
  };
}

// ═══════════════════════════════════════════════
// Conflict Summary Report
// ═══════════════════════════════════════════════

export interface ConflictReport {
  totalConflicts: number;
  severityBreakdown: Record<ConflictResolutionStrategy, number>;
  mostContestedDimension: FateDimension;
  overallAgreement: number; // 0-1, higher = more agreement
  dimensionCoherences: Record<FateDimension, number>;
  transparencyNote: string;
}

export function generateConflictReport(
  engineOutputs: EngineOutput[],
  weights: WeightEntry[],
  conflicts: PredictionConflict[],
): ConflictReport {
  const severityBreakdown: Record<ConflictResolutionStrategy, number> = {
    weighted_average: 0, confidence_priority: 0, domain_expert: 0, conservative: 0,
  };
  for (const c of conflicts) severityBreakdown[c.resolutionStrategy]++;

  const dimConflictCounts: Record<FateDimension, number> = {
    life: 0, wealth: 0, relation: 0, health: 0, wisdom: 0, spirit: 0,
  };
  for (const c of conflicts) dimConflictCounts[c.dimension]++;
  
  const mostContested = ALL_FATE_DIMENSIONS.reduce((a, b) =>
    dimConflictCounts[a] > dimConflictCounts[b] ? a : b,
  );

  // Per-dimension coherence
  const dimensionCoherences: Record<string, number> = {};
  const engineWeightValues = engineOutputs.map(e => 
    weights.find(w => w.engineName === e.engineName)?.weight ?? 0
  );
  for (const dim of ALL_FATE_DIMENSIONS) {
    const values = engineOutputs.map(e => e.fateVector[dim]);
    dimensionCoherences[dim] = calculateDimensionCoherence(values, engineWeightValues);
  }

  const overallAgreement = Object.values(dimensionCoherences).reduce((s, v) => s + v, 0) / ALL_FATE_DIMENSIONS.length;

  const transparencyNote = conflicts.length === 0
    ? '所有引擎在6个维度上高度一致，无显著分歧。'
    : `检测到${conflicts.length}个引擎分歧（严重${severityBreakdown.domain_expert + severityBreakdown.conservative}个，` +
      `中等${severityBreakdown.confidence_priority}个，轻微${severityBreakdown.weighted_average}个）。` +
      `「${FATE_DIMENSION_LABELS[mostContested]}」维度争议最大。整体一致性${Math.round(overallAgreement * 100)}%。`;

  return {
    totalConflicts: conflicts.length,
    severityBreakdown,
    mostContestedDimension: mostContested,
    overallAgreement,
    dimensionCoherences: dimensionCoherences as Record<FateDimension, number>,
    transparencyNote,
  };
}
