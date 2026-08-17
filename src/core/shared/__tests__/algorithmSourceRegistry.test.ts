import { describe, expect, it } from 'vitest';
import type { EngineOutput, FateVector } from '@/types/prediction';
import {
  ALGORITHM_SOURCE_REGISTRY,
  applySourceRegistryPolicy,
} from '../algorithmSourceRegistry';

const fateVector: FateVector = {
  life: 50,
  wealth: 50,
  relation: 50,
  health: 50,
  wisdom: 50,
  spirit: 50,
  socialStatus: 50,
  creativity: 50,
  luck: 50,
  homeStability: 50,
};

function output(engineName: string, status = 'complete'): EngineOutput {
  return {
    engineName,
    engineNameCN: engineName,
    engineVersion: 'test',
    sourceUrls: [],
    sourceGrade: 'A',
    ruleSchool: 'test',
    confidence: 0.99,
    computationTimeMs: 0,
    rawInputSnapshot: {},
    fateVector,
    normalizedOutput: { implementationStatus: status },
    warnings: [],
    uncertaintyNotes: [],
    timingBasis: 'birth',
    explanationTrace: ['test step'],
    completenessScore: 100,
    validationFlags: { passed: [], failed: [], warnings: [] },
    timeWindows: [],
    aspectScores: {},
    eventCandidates: [],
  };
}

describe('algorithm source registry policy', () => {
  it('never marks an engine complete while known rules are missing', () => {
    for (const record of Object.values(ALGORITHM_SOURCE_REGISTRY)) {
      if (record.implementationStatus === 'complete') {
        expect(record.missingRules, record.engineName).toEqual([]);
      }
    }
  });

  it('caps a locally complete output to the audited engine-wide status', () => {
    const result = applySourceRegistryPolicy(output('western'));
    expect(result.normalizedOutput.declaredImplementationStatus).toBe('complete');
    expect(result.normalizedOutput.implementationStatus).toBe('partial');
    expect(result.sourceGrade).toBe('B');
    expect(result.confidence).toBeLessThanOrEqual(0.65);
    expect(result.warnings.some((warning) => warning.startsWith('registry_missing_rules:'))).toBe(true);
  });

  it('keeps source-validation status stricter than a local partial claim', () => {
    const result = applySourceRegistryPolicy(output('tieban', 'partial'));
    expect(result.normalizedOutput.implementationStatus).toBe('needs_source_validation');
    expect(result.confidence).toBeLessThanOrEqual(0.45);
  });

  it('degrades an unregistered engine instead of trusting its claim', () => {
    const result = applySourceRegistryPolicy(output('unregistered'));
    expect(result.normalizedOutput.implementationStatus).toBe('needs_source_validation');
    expect(result.confidence).toBe(0.4);
    expect(result.warnings).toContain('source_registry_missing');
  });
});
