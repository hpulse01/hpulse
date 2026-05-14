/**
 * Quantum Collapse — Probability Model
 *
 * Deterministic probability composition. No Math.random.
 */

import { clamp01 } from './deterministic';
import type { FusedEvent, WorldTreeNode } from './types';

export function calculateEventProbability(event: FusedEvent): number {
  return clamp01(event.probability);
}

export function calculateBranchProbability(
  parentNode: WorldTreeNode,
  candidate: FusedEvent,
): number {
  // Parent coherence carried forward; candidate probability discounted by parent contradictionPenalty
  const parentFactor = clamp01(parentNode.coherence) || 0.5;
  const penalty = parentNode.contradictionPenalty;
  return clamp01(candidate.probability * parentFactor * (1 - 0.5 * penalty));
}

export function calculateCumulativeProbability(path: WorldTreeNode[]): number {
  return path.reduce<number>((acc, n) => acc * (n.branchProbability || 1), 1);
}

export function applyContradictionPenalty(
  candidate: FusedEvent,
  selectedSoFar: FusedEvent[],
): number {
  // If a previously-selected event has opposing polarity in the same category
  let penalty = 0;
  for (const prev of selectedSoFar) {
    if (prev.canonicalCategory === candidate.canonicalCategory) {
      if (
        (prev.polarity === 'positive' && candidate.polarity === 'negative') ||
        (prev.polarity === 'negative' && candidate.polarity === 'positive')
      ) {
        penalty = Math.max(penalty, 0.4);
      }
    }
  }
  return clamp01(penalty + candidate.conflictScore * 0.5);
}

/**
 * Sensitive events are NOT removed. Their probability is capped to honest
 * value; we only return a soft "displayWeight" to inform UI behavior.
 */
export function applySensitivePenaltyOrMarker(event: FusedEvent): { displayWeight: number; reason: string } {
  if (event.sensitiveFlags.length === 0) return { displayWeight: 1, reason: 'not sensitive' };
  if (event.sensitiveFlags.includes('death')) return { displayWeight: 0.5, reason: 'death event — collapsed display' };
  if (event.sensitiveFlags.includes('self_harm') || event.sensitiveFlags.includes('crime') || event.sensitiveFlags.includes('violence')) {
    return { displayWeight: 0.25, reason: 'admin-only detail; UI must redact' };
  }
  return { displayWeight: 0.7, reason: 'cautious display' };
}
