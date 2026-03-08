/**
 * P1 Conflict Detection & Resolution
 *
 * Detects divergences across engine FateVectors on each dimension,
 * applies resolution strategies, and produces human-readable explanations.
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
import { CONFLICT_THRESHOLD } from '@/config/engineWeights';

// ── Domain expert mapping: which engine is most authoritative per dimension ──
const DOMAIN_EXPERTS: Record<FateDimension, string[]> = {
  life: ['tieban', 'bazi'],
  wealth: ['bazi', 'ziwei'],
  relation: ['ziwei', 'vedic'],
  health: ['vedic', 'bazi'],
  wisdom: ['western', 'kabbalah'],
  spirit: ['vedic', 'kabbalah'],
};

/**
 * Choose resolution strategy based on dimension and conflict magnitude.
 */
function chooseStrategy(
  dimension: FateDimension,
  delta: number,
  engineA: string,
  engineB: string,
): ConflictResolutionStrategy {
  // Large conflicts → domain expert if available
  if (delta > 40) {
    const experts = DOMAIN_EXPERTS[dimension];
    if (experts.includes(engineA) || experts.includes(engineB)) {
      return 'domain_expert';
    }
    return 'conservative';
  }
  // Medium conflicts → confidence priority
  if (delta > 30) {
    return 'confidence_priority';
  }
  // Default → weighted average
  return 'weighted_average';
}

/**
 * Generate human-readable explanation for a conflict.
 */
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

  const strategyExplanations: Record<ConflictResolutionStrategy, string> = {
    weighted_average: `在「${dimLabel}」维度上，${nameA}(${conflict.valueA})与${nameB}(${conflict.valueB})存在${conflict.delta}分差异。最终按各体系权重加权平均取值。`,
    confidence_priority: `在「${dimLabel}」维度上，${nameA}(${conflict.valueA})与${nameB}(${conflict.valueB})分歧较大(Δ${conflict.delta})。优先采信置信度更高的体系结果。`,
    domain_expert: `在「${dimLabel}」维度上，${nameA}(${conflict.valueA})与${nameB}(${conflict.valueB})严重分歧(Δ${conflict.delta})。该维度以领域权威体系为主。`,
    conservative: `在「${dimLabel}」维度上，${nameA}(${conflict.valueA})与${nameB}(${conflict.valueB})严重分歧(Δ${conflict.delta})。采用保守估计（取较低值），以降低误判风险。`,
  };

  return strategyExplanations[conflict.resolutionStrategy];
}

/**
 * Detect all pairwise conflicts across engine outputs.
 */
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
          const strategy = chooseStrategy(dim, delta, a.engineName, b.engineName);
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

  // Sort by delta descending (most severe first)
  conflicts.sort((a, b) => b.delta - a.delta);
  return conflicts;
}

/**
 * Fuse multiple engine FateVectors into one, using weights and conflict resolution.
 */
export function fuseFateVectors(
  engineOutputs: EngineOutput[],
  weights: WeightEntry[],
  conflicts: PredictionConflict[],
): FateVector {
  const fused: FateVector = { life: 0, wealth: 0, relation: 0, health: 0, wisdom: 0, spirit: 0 };

  for (const dim of ALL_FATE_DIMENSIONS) {
    // Check if there are conflicts on this dimension that require special handling
    const dimConflicts = conflicts.filter(c => c.dimension === dim);
    const hasSpecialResolution = dimConflicts.some(
      c => c.resolutionStrategy === 'domain_expert' || c.resolutionStrategy === 'conservative',
    );

    if (hasSpecialResolution) {
      // Find the most severe conflict's strategy
      const worst = dimConflicts[0]; // already sorted by delta desc
      if (worst.resolutionStrategy === 'conservative') {
        // Take the lower value across all engines
        fused[dim] = Math.round(
          Math.min(...engineOutputs.map(e => e.fateVector[dim])),
        );
      } else if (worst.resolutionStrategy === 'domain_expert') {
        // Use domain expert engines with higher weight
        const experts = DOMAIN_EXPERTS[dim];
        const expertOutputs = engineOutputs.filter(e => experts.includes(e.engineName));
        if (expertOutputs.length > 0) {
          const expertWeightSum = expertOutputs.reduce((s, e) => {
            const w = weights.find(w => w.engineName === e.engineName)?.weight ?? 0;
            return s + w;
          }, 0);
          let val = 0;
          for (const e of expertOutputs) {
            const w = weights.find(w => w.engineName === e.engineName)?.weight ?? 0;
            val += e.fateVector[dim] * (expertWeightSum > 0 ? w / expertWeightSum : 1 / expertOutputs.length);
          }
          fused[dim] = Math.round(val);
        } else {
          // fallback: weighted average
          fused[dim] = weightedAverage(engineOutputs, weights, dim);
        }
      }
    } else {
      // confidence_priority or weighted_average → just do weighted average
      // (confidence_priority adjusts weights by confidence)
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
