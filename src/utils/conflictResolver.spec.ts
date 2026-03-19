import { describe, it, expect } from 'vitest';
import { detectConflicts, fuseFateVectors } from './conflictResolver';
import type { EngineOutput, WeightEntry } from '@/types/prediction';

function makeEngine(name: string, fv: Record<string, number>, confidence = 0.7): EngineOutput {
  return {
    engineName: name, engineNameCN: name, engineVersion: '1.0', sourceUrls: [],
    sourceGrade: 'B', ruleSchool: '', confidence,
    computationTimeMs: 1, rawInputSnapshot: {},
    fateVector: { life: fv.life ?? 50, wealth: fv.wealth ?? 50, relation: fv.relation ?? 50, health: fv.health ?? 50, wisdom: fv.wisdom ?? 50, spirit: fv.spirit ?? 50, socialStatus: fv.socialStatus ?? 50, creativity: fv.creativity ?? 50, luck: fv.luck ?? 50, homeStability: fv.homeStability ?? 50 },
    normalizedOutput: {}, warnings: [], uncertaintyNotes: [],
    timingBasis: 'birth' as const,
    explanationTrace: ['test-trace'],
    completenessScore: 80,
    validationFlags: { passed: ['test'], failed: [], warnings: [] },
    timeWindows: [],
    aspectScores: {},
    eventCandidates: [],
  };
}

describe('conflictResolver', () => {
  it('detects conflicts above threshold', () => {
    const engines = [
      makeEngine('a', { life: 80 }),
      makeEngine('b', { life: 40 }),
    ];
    const weights: WeightEntry[] = [
      { engineName: 'a', weight: 0.5, reason: '' },
      { engineName: 'b', weight: 0.5, reason: '' },
    ];
    const conflicts = detectConflicts(engines, weights, 25);
    expect(conflicts.some(c => c.dimension === 'life')).toBe(true);
    expect(conflicts.find(c => c.dimension === 'life')!.delta).toBe(40);
  });

  it('no conflicts when values are close', () => {
    const engines = [
      makeEngine('a', { life: 50 }),
      makeEngine('b', { life: 55 }),
    ];
    const weights: WeightEntry[] = [
      { engineName: 'a', weight: 0.5, reason: '' },
      { engineName: 'b', weight: 0.5, reason: '' },
    ];
    const conflicts = detectConflicts(engines, weights, 25);
    expect(conflicts.filter(c => c.dimension === 'life')).toHaveLength(0);
  });

  it('fuseFateVectors produces values in 0-100 range', () => {
    const engines = [
      makeEngine('a', { life: 90, wealth: 20 }),
      makeEngine('b', { life: 30, wealth: 80 }),
    ];
    const weights: WeightEntry[] = [
      { engineName: 'a', weight: 0.6, reason: '' },
      { engineName: 'b', weight: 0.4, reason: '' },
    ];
    const conflicts = detectConflicts(engines, weights);
    const fused = fuseFateVectors(engines, weights, conflicts);
    for (const v of Object.values(fused)) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
  });
});
