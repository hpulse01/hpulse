import { describe, it, expect } from 'vitest';
import { auditEngineOutputs } from '../implementationAudit';
import type { EngineOutput, FateVector } from '@/types/prediction';

const fv: FateVector = {
  life: 50, wealth: 50, relation: 50, health: 50, wisdom: 50,
  spirit: 50, socialStatus: 50, creativity: 50, luck: 50, homeStability: 50,
};

function eo(over: Partial<EngineOutput>): EngineOutput {
  return {
    engineName: 'e',
    engineNameCN: '引擎',
    engineVersion: '1.0',
    sourceUrls: [],
    sourceGrade: 'B',
    ruleSchool: 'std',
    confidence: 0.6,
    computationTimeMs: 1,
    rawInputSnapshot: {},
    fateVector: fv,
    normalizedOutput: { implementationStatus: 'complete' },
    warnings: [],
    uncertaintyNotes: [],
    timingBasis: 'birth',
    explanationTrace: ['s1', 's2'],
    completenessScore: 80,
    validationFlags: { passed: [], failed: [], warnings: [] },
    timeWindows: [],
    aspectScores: {},
    eventCandidates: [],
    ...over,
  };
}

describe('implementationAudit', () => {
  it('classifies engines into complete/partial/needs_source_validation/unknown', () => {
    const r = auditEngineOutputs([
      eo({ engineName: 'a' }),
      eo({ engineName: 'b', normalizedOutput: { implementationStatus: 'partial' }, warnings: ['w'], confidence: 0.5 }),
      eo({ engineName: 'c', normalizedOutput: { implementationStatus: 'needs_source_validation' }, warnings: ['w'], sourceGrade: 'C', confidence: 0.3 }),
      eo({ engineName: 'd', normalizedOutput: {} }),
    ]);
    expect(r.complete).toEqual(['a']);
    expect(r.partial).toEqual(['b']);
    expect(r.needsSourceValidation).toEqual(['c']);
    expect(r.unknown).toEqual(['d']);
    expect(r.totalEngines).toBe(4);
  });

  it('flags partial engine with inflated confidence as risk', () => {
    const r = auditEngineOutputs([
      eo({ engineName: 'x', normalizedOutput: { implementationStatus: 'partial' }, warnings: ['w'], confidence: 0.9 }),
    ]);
    expect(r.atRisk[0].risks).toContain('partial:confidence>0.65');
  });

  it('readyForP5 false when an engine has invalid output', () => {
    const r = auditEngineOutputs([
      eo({ engineName: 'bad', explanationTrace: [] }),
    ]);
    expect(r.readyForP5).toBe(false);
    expect(r.blockers.length).toBeGreaterThan(0);
  });

  it('readyForP5 true when all engines well-formed', () => {
    const r = auditEngineOutputs([
      eo({ engineName: 'a' }),
      eo({ engineName: 'b', normalizedOutput: { implementationStatus: 'partial' }, warnings: ['w'], confidence: 0.5, completenessScore: 60 }),
    ]);
    expect(r.readyForP5).toBe(true);
  });
});
