/**
 * Quantum Collapse — Event Normalization
 *
 * Take raw EventSeeds and produce a normalized representation:
 *  - canonical category
 *  - normalized confidence factoring in sourceGrade + implementationStatus
 *  - normalized severity
 *  - dimension vector
 */

import {
  IMPLEMENTATION_STATUS_WEIGHT, PRECISION_WEIGHT, SOURCE_GRADE_WEIGHT,
} from './constants';
import type { EventSeed, NormalizedEventSeed } from './types';
import { clamp01 } from './deterministic';

const CATEGORY_TO_DIMENSIONS: Record<string, string[]> = {
  career: ['life'], wealth: ['wealth'], relationship: ['relation'],
  marriage: ['relation'], family: ['relation'], children: ['relation'],
  parents: ['relation'], health: ['health'], illness: ['health'],
  accident: ['health'], death: ['health', 'life'], migration: ['life'],
  education: ['wisdom'], creativity: ['wisdom'], reputation: ['reputation'],
  legal: ['life'], conflict: ['relation'], spiritual: ['spirit'],
  property: ['wealth'], turning_point: ['life'], unknown: [],
};

export function normalizeEventSeed(seed: EventSeed): NormalizedEventSeed {
  const gradeW = SOURCE_GRADE_WEIGHT[seed.sourceGrade] ?? 0.6;
  const statusW = IMPLEMENTATION_STATUS_WEIGHT[seed.implementationStatus] ?? 0.5;
  const precisionW = PRECISION_WEIGHT[seed.ageWindow.precision] ?? 0.6;
  const baseConf = seed.eventConfidence;

  // Compose: base * gradeW * statusW * precisionW * (0.5 + 0.5 * engineWeight)
  const engineFactor = 0.5 + 0.5 * seed.engineWeight;
  const normalizedConfidence = clamp01(baseConf * gradeW * statusW * precisionW * engineFactor);

  const dims = CATEGORY_TO_DIMENSIONS[seed.category] ?? [];
  const dimensionVector: Record<string, number> = {};
  for (const d of dims) {
    dimensionVector[d] = (dimensionVector[d] ?? 0) + (seed.polarity === 'negative' ? -1 : seed.polarity === 'positive' ? 1 : 0);
  }

  return {
    seedId: seed.id,
    canonicalCategory: seed.category,
    canonicalDescription: seed.description,
    normalizedAgeWindow: seed.ageWindow,
    normalizedYearWindow: seed.yearWindow,
    normalizedConfidence,
    normalizedSeverity: seed.severity,
    sensitiveFlags: seed.sensitiveFlags,
    dimensionVector,
    trace: [
      `gradeW=${gradeW.toFixed(2)} statusW=${statusW.toFixed(2)} precisionW=${precisionW.toFixed(2)} engineW=${seed.engineWeight.toFixed(2)}`,
      `baseConf=${baseConf.toFixed(3)} → normalizedConfidence=${normalizedConfidence.toFixed(3)}`,
      `category=${seed.category} severity=${seed.severity}`,
    ],
  };
}

export function normalizeAll(seeds: EventSeed[]): NormalizedEventSeed[] {
  return seeds.map(normalizeEventSeed);
}
