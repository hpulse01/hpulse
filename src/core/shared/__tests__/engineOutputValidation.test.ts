import { describe, it, expect } from 'vitest';
import { validateEngineOutput, getImplementationStatus } from '../validation';
import type { EngineOutput, FateVector } from '@/types/prediction';

const fv: FateVector = {
  life: 50, wealth: 50, relation: 50, health: 50, wisdom: 50,
  spirit: 50, socialStatus: 50, creativity: 50, luck: 50, homeStability: 50,
};

const baseEO: EngineOutput = {
  engineName: 'test',
  engineNameCN: '测试',
  engineVersion: '1.0',
  sourceUrls: [],
  sourceGrade: 'B',
  ruleSchool: 'std',
  confidence: 0.7,
  computationTimeMs: 1,
  rawInputSnapshot: {},
  fateVector: fv,
  normalizedOutput: { implementationStatus: 'partial' },
  warnings: [],
  uncertaintyNotes: [],
  timingBasis: 'birth',
  explanationTrace: ['step1', 'step2'],
  completenessScore: 70,
  validationFlags: { passed: [], failed: [], warnings: [] },
  timeWindows: [],
  aspectScores: {},
  eventCandidates: [],
};

describe('validateEngineOutput', () => {
  it('passes a fully populated EngineOutput', () => {
    const r = validateEngineOutput(baseEO);
    expect(r.ok).toBe(true);
  });

  it('fails when fateVector dim out of range', () => {
    const bad = { ...baseEO, fateVector: { ...fv, life: 999 } };
    const r = validateEngineOutput(bad);
    expect(r.ok).toBe(false);
    expect(r.issues.some(i => i.field === 'fateVector.life')).toBe(true);
  });

  it('fails when explanationTrace empty', () => {
    const bad = { ...baseEO, explanationTrace: [] };
    expect(validateEngineOutput(bad).ok).toBe(false);
  });

  it('fails when sourceGrade invalid', () => {
    const bad = { ...baseEO, sourceGrade: 'Z' as never };
    expect(validateEngineOutput(bad).ok).toBe(false);
  });

  it('reads implementationStatus from normalizedOutput', () => {
    expect(getImplementationStatus(baseEO)).toBe('partial');
    expect(getImplementationStatus({ ...baseEO, normalizedOutput: { p4ImplementationStatus: 'complete' } })).toBe('complete');
    expect(getImplementationStatus({ ...baseEO, normalizedOutput: {} })).toBe('unknown');
  });

  it('null EngineOutput is invalid', () => {
    expect(validateEngineOutput(null).ok).toBe(false);
  });
});
