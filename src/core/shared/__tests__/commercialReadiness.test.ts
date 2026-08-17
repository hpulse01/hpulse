import { describe, expect, it } from 'vitest';
import type { EngineOutput, FateVector } from '@/types/prediction';
import { assessCommercialReadiness } from '../commercialReadiness';

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

function output(overrides: Partial<EngineOutput> = {}): EngineOutput {
  return {
    engineName: 'bazi',
    engineNameCN: '八字',
    engineVersion: 'test-core',
    sourceUrls: ['https://example.com/stable-rule-reference'],
    sourceGrade: 'B',
    ruleSchool: 'test school',
    confidence: 0.8,
    computationTimeMs: 0,
    rawInputSnapshot: {},
    fateVector,
    normalizedOutput: {
      implementationStatus: 'complete',
      registryPolicyApplied: true,
      p4CoreVersion: 'test-core',
    },
    warnings: [],
    uncertaintyNotes: [],
    timingBasis: 'birth',
    explanationTrace: ['[rule.one] input normalized', '[rule.two] chart calculated'],
    completenessScore: 100,
    validationFlags: { passed: ['fixture'], failed: [], warnings: [] },
    timeWindows: [],
    aspectScores: {},
    eventCandidates: [],
    ...overrides,
  };
}

describe('commercial release readiness gate', () => {
  it('fails closed when a required engine is absent', () => {
    const report = assessCommercialReadiness([], { requiredEngines: ['bazi'] });
    expect(report.ready).toBe(false);
    expect(report.blockers).toContainEqual(expect.objectContaining({
      code: 'required_engine_missing',
      engineName: 'bazi',
    }));
  });

  it('blocks the current partial registry even when a local output claims complete', () => {
    const report = assessCommercialReadiness([output()], { requiredEngines: ['bazi'] });
    expect(report.ready).toBe(false);
    expect(report.blockers).toContainEqual(expect.objectContaining({
      code: 'registry_status_incomplete',
      engineName: 'bazi',
    }));
    expect(report.blockers).toContainEqual(expect.objectContaining({
      code: 'registry_missing_rules',
      engineName: 'bazi',
    }));
  });

  it('detects individualized mortality or lifespan claims recursively', () => {
    const report = assessCommercialReadiness([
      output({
        eventCandidates: ['预计死亡年龄为 78 岁'],
        normalizedOutput: {
          implementationStatus: 'complete',
          registryPolicyApplied: true,
          p4CoreVersion: 'test-core',
        },
      }),
    ], { requiredEngines: ['bazi'] });

    expect(report.blockers).toContainEqual(expect.objectContaining({
      code: 'sensitive_mortality_content',
      engineName: 'bazi',
      path: 'eventCandidates[0]',
    }));
  });

  it('does not mistake an explicit non-prediction boundary notice for a mortality claim', () => {
    const report = assessCommercialReadiness([
      output({
        uncertaintyNotes: ['有限分析窗口不是寿命预测，也不表示死亡时间。'],
      }),
    ], { requiredEngines: ['bazi'] });

    expect(report.blockers.some((blocker) => blocker.code === 'sensitive_mortality_content')).toBe(false);
  });

  it('records authoritative core failures and engine execution failures', () => {
    const report = assessCommercialReadiness([
      output({
        normalizedOutput: {
          implementationStatus: 'needs_source_validation',
          registryPolicyApplied: true,
          authoritativeCoreError: 'fixture failure',
        },
        validationFlags: { passed: [], failed: ['authoritative_core_failed'], warnings: [] },
      }),
    ], {
      requiredEngines: ['bazi'],
      failedEngines: [{ engineName: 'vedic', error: 'fixture crash' }],
    });

    expect(report.blockers).toContainEqual(expect.objectContaining({ code: 'authoritative_core_failed', engineName: 'bazi' }));
    expect(report.blockers).toContainEqual(expect.objectContaining({ code: 'engine_execution_failed', engineName: 'vedic' }));
  });
});
