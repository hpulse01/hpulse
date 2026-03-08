/**
 * H-Pulse Conflict Detection & Resolution v2.0
 *
 * Upgraded per Notion specification:
 *   - Dynamic per-dimension domain expertise (integrated with W(t,e,d))
 *   - Majority voting strategy (多数表决)
 *   - Enhanced conflict transparency with detailed reporting
 *   - Coherence-weighted fusion
 *   - Uncertainty quantification per dimension
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
