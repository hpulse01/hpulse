/**
 * Quantum Collapse — Coherence Model
 *
 * Pure metrics 0-1 measuring internal consistency.
 */

import type { EngineOutput } from '@/types/prediction';
import { clamp01 } from './deterministic';
import type { CollapseResult, FusedEvent, WorldTreeNode } from './types';

export function calculateEventCoherence(event: FusedEvent, previous: FusedEvent[]): number {
  // Lower coherence when the event contradicts the latest previous event of the same category.
  const sameCat = [...previous].reverse().find(p => p.canonicalCategory === event.canonicalCategory);
  if (!sameCat) return clamp01(1 - event.conflictScore);
  if (sameCat.polarity === event.polarity || event.polarity === 'mixed' || sameCat.polarity === 'mixed') {
    return clamp01(1 - event.conflictScore * 0.7);
  }
  return clamp01(0.5 - event.conflictScore * 0.3);
}

export function calculatePathCoherence(path: WorldTreeNode[]): number {
  if (path.length === 0) return 0;
  let acc = 0; let count = 0;
  for (const node of path) {
    if (node.event) { acc += node.coherence; count++; }
  }
  return count === 0 ? 0 : clamp01(acc / count);
}

export function calculateEngineCoherence(engineOutputs: EngineOutput[]): number {
  if (engineOutputs.length === 0) return 0;
  // Ratio of complete-status engines + mean confidence
  const norm = (engineOutputs).map(o => (o.normalizedOutput ?? {}) as Record<string, string>);
  const completeRatio = norm.filter(n => n.implementationStatus === 'complete').length / engineOutputs.length;
  const meanConf = engineOutputs.reduce((a, o) => a + (o.confidence ?? 0), 0) / engineOutputs.length;
  return clamp01(0.5 * completeRatio + 0.5 * meanConf);
}

export function calculateOverallCoherence(collapse: CollapseResult, engineOutputs: EngineOutput[]): number {
  const path = calculatePathCoherence(collapse.collapsedPath);
  const engine = calculateEngineCoherence(engineOutputs);
  return clamp01(0.65 * path + 0.35 * engine);
}
