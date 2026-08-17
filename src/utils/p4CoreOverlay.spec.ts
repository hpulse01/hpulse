import { describe, expect, it } from 'vitest';
import type { EngineOutput, FateVector } from '@/types/prediction';
import { applyCoreOverlay, mergeCoreOverlay } from './p4CoreOverlay';

const legacyVector: FateVector = {
  life: 1, wealth: 2, relation: 3, health: 4, wisdom: 5,
  spirit: 6, socialStatus: 7, creativity: 8, luck: 9, homeStability: 10,
};

const coreVector: FateVector = {
  life: 91, wealth: 82, relation: 73, health: 64, wisdom: 55,
  spirit: 46, socialStatus: 37, creativity: 28, luck: 19, homeStability: 11,
};

function output(kind: 'legacy' | 'core'): EngineOutput {
  const core = kind === 'core';
  return {
    engineName: 'bazi',
    engineNameCN: '八字',
    engineVersion: core ? 'core-2.0.0' : 'legacy-9.9.9',
    sourceUrls: [core ? 'core-source' : 'legacy-source'],
    sourceGrade: core ? 'B' : 'A',
    ruleSchool: core ? 'core-school' : 'legacy-school',
    confidence: core ? 0.62 : 0.99,
    computationTimeMs: core ? 12 : 1,
    rawInputSnapshot: { authority: kind },
    fateVector: core ? coreVector : legacyVector,
    normalizedOutput: { authority: kind },
    warnings: [`${kind}-warning`],
    uncertaintyNotes: [`${kind}-uncertainty`],
    timingBasis: core ? 'birth' : 'hybrid',
    explanationTrace: [`${kind}-trace`],
    completenessScore: core ? 68 : 100,
    validationFlags: {
      passed: [`${kind}-passed`], failed: [], warnings: [],
    },
    timeWindows: core ? [{
      dimension: 'life', startAge: 20, endAge: 30, confidence: 0.5,
      trend: 'stable', evidence: 'core-only',
    }] : [],
    aspectScores: core ? { canonical: 66 } : { fabricated: 100 },
    eventCandidates: core ? ['core-event'] : ['legacy-event'],
  };
}

describe('p4 core authority boundary', () => {
  it('prevents every legacy score-bearing field from entering fusion', () => {
    const merged = mergeCoreOverlay(output('legacy'), output('core'));

    expect(merged.fateVector).toEqual(coreVector);
    expect(merged.aspectScores).toEqual({ canonical: 66 });
    expect(merged.eventCandidates).toEqual(['core-event']);
    expect(merged.timeWindows).toHaveLength(1);
    expect(merged.engineVersion).toBe('core-2.0.0');
    expect(merged.ruleSchool).toBe('core-school');
    expect(merged.rawInputSnapshot).toEqual({ authority: 'core' });
    expect(merged.validationFlags.passed).toEqual(['core-passed']);
    expect(merged.normalizedOutput.legacyNormalizedOutput).toEqual({ authority: 'legacy' });
  });

  it('quarantines legacy heuristics when the authoritative core fails', () => {
    const quarantined = applyCoreOverlay(output('legacy'), {
      engineName: 'bazi', coreOutput: null, coreError: 'fixture failure', coreDurationMs: 1,
    });

    expect(new Set(Object.values(quarantined.fateVector))).toEqual(new Set([50]));
    expect(quarantined.confidence).toBe(0);
    expect(quarantined.completenessScore).toBe(0);
    expect(quarantined.eventCandidates).toEqual([]);
    expect(quarantined.validationFlags.failed).toContain('authoritative_core_failed');
  });
});
