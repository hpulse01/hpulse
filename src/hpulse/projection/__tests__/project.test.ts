import { describe, expect, it } from 'vitest';
import { projectReport } from '../project';
import { PROJECTION_VERSION } from '../types';
import type { PipelineReport } from '@/hpulse/orchestrator/pipeline';
import type { NormalizeOutcome, StandardizedInput } from '@/hpulse/input/types';
import type { WorldTree, StageNode, DomainNode, ObservationNode } from '@/hpulse/worldtree/types';
import type { EngineRunResult } from '@/hpulse/engines/runner';
import type { FateVector, EngineOutput } from '@/types/prediction';
import { ALL_FATE_DIMENSIONS } from '@/types/prediction';
import { ALL_ENGINES, type EngineId, type LifeStage, MATRIX_VERSION } from '@/hpulse/weights/types';
import { FUSION_VERSION, type DestinyFusionResult } from '@/hpulse/fusion/types';

function makeFateVector(base: number): FateVector {
  const fv = {} as FateVector;
  for (const d of ALL_FATE_DIMENSIONS) fv[d] = base;
  return fv;
}

function makeObservation(engineId: EngineId, dim: string, stage: string, score: number, weight: number): ObservationNode {
  return {
    kind: 'observation',
    id: `${stage}.${dim}.${engineId}.0`,
    engineId,
    engineName: engineId,
    score,
    weight,
    contribution: weight * score,
    evidence: null,
    sourceGrade: 'B',
  };
}

function makeStage(stage: string, startAge: number, endAge: number, pivotAge: number, score: number): StageNode {
  const fv = makeFateVector(score);
  const weights: Record<EngineId, number> = {} as Record<EngineId, number>;
  const w = 1 / ALL_ENGINES.length;
  for (const id of ALL_ENGINES) weights[id] = w;
  const domains: DomainNode[] = ALL_FATE_DIMENSIONS.map(d => ({
    kind: 'domain' as const,
    id: `${stage}.${d}`,
    dimension: d,
    score,
    coverage: 1,
    observations: [makeObservation('bazi', d, stage, score, w)],
    dominantEngine: 'bazi' as EngineId,
  }));
  return {
    kind: 'stage',
    id: stage,
    window: { stage: stage as LifeStage, startAge, endAge, pivotAge },
    fateVector: fv,
    weights,
    activeEngines: [...ALL_ENGINES],
    degradedEngines: [],
    domains,
  };
}

function makeWorldTree(): WorldTree {
  return {
    kind: 'root',
    meta: {
      seedMaterial: 'b'.repeat(64),
      matrixVersion: MATRIX_VERSION,
      enginesConsidered: 13,
      enginesSucceeded: 13,
      defaultEvent: 'general',
      defaultGranularity: 'year',
      worldTreeVersion: 'wtree-1.0.0',
    },
    lifetimeFateVector: makeFateVector(55),
    stages: [
      makeStage('childhood', 0, 12, 8, 50),
      makeStage('youth', 13, 29, 22, 55),
      makeStage('prime', 30, 44, 37, 60),
      makeStage('middle', 45, 59, 52, 55),
      makeStage('elder', 60, 99, 70, 50),
    ],
    permanentlyDegraded: {},
  };
}

function makeEngineResult(id: EngineId): EngineRunResult {
  return {
    ok: true,
    id,
    output: {
      engineName: id,
      engineNameCN: id,
      engineVersion: '1.0.0-test',
      ruleSchool: 'test',
      computationTimeMs: 1,
      rawInputSnapshot: {},
      fateVector: makeFateVector(60),
      confidence: 0.8,
      completenessScore: 85,
      sourceGrade: 'B',
      sourceUrls: ['https://example.com'],
      timingBasis: 'birth',
      uncertaintyNotes: [],
      warnings: [],
      eventCandidates: [],
      explanationTrace: [],
      validationFlags: { passed: [], failed: [], warnings: [] },
      normalizedOutput: { registryPolicyApplied: true, p4CoreVersion: '1.0' },
      timeWindows: [],
      aspectScores: {},
    } satisfies EngineOutput,
    durationMs: 10,
  };
}

function makeFusion(): DestinyFusionResult {
  return {
    version: FUSION_VERSION,
    seedMaterial: 'b'.repeat(64),
    evidenceQuality: {
      ruleCoverage: 0.85,
      engineAgreement: 0.9,
      sourceQuality: 0.75,
      observationCount: 50,
      contributingEngines: [...ALL_ENGINES],
      degradedEngines: [],
      notes: ['test note'],
    },
    verdict: {
      lifetimeFateVector: makeFateVector(55),
      overallScore: 55,
      overallReliability: 0.8,
      dominantStage: 'prime',
      pivotalTransition: null,
      topDimensions: [{ dimension: 'life', score: 55 }],
      bottomDimensions: [{ dimension: 'luck', score: 55 }],
    },
    stageEvidence: [
      { stage: 'childhood', reliability: 0.7, coverage: 0.8, agreement: 0.9, transitionMagnitude: 0 },
      { stage: 'youth', reliability: 0.8, coverage: 0.9, agreement: 0.85, transitionMagnitude: 0 },
      { stage: 'prime', reliability: 0.85, coverage: 0.95, agreement: 0.9, transitionMagnitude: 0 },
      { stage: 'middle', reliability: 0.8, coverage: 0.9, agreement: 0.85, transitionMagnitude: 0 },
      { stage: 'elder', reliability: 0.7, coverage: 0.8, agreement: 0.8, transitionMagnitude: 0 },
    ],
    degradedEngines: [],
    explanationTrace: ['[HPU-6] test trace'],
  };
}

function makeOkReport(): PipelineReport & { ok: true } {
  return {
    ok: true,
    version: 'pipeline-1.0.0',
    normalize: { ok: true, input: {} as StandardizedInput, issues: [] },
    engineResults: ALL_ENGINES.map(makeEngineResult),
    worldTree: makeWorldTree(),
    fusion: makeFusion(),
  };
}

describe('projectReport', () => {
  it('produces a ProjectionView with correct version for a successful pipeline', () => {
    const view = projectReport(makeOkReport());
    expect(view.version).toBe(PROJECTION_VERSION);
    expect(view.ok).toBe(true);
  });

  it('is deterministic: same input produces identical output', () => {
    const report = makeOkReport();
    expect(projectReport(report)).toEqual(projectReport(report));
  });

  it('header contains non-zero score and engines metadata', () => {
    const view = projectReport(makeOkReport());
    expect(view.header.overallScore).toBeGreaterThan(0);
    expect(view.header.enginesConsidered).toBe(13);
    expect(view.header.enginesActive).toBeGreaterThan(0);
  });

  it('produces 10 fateDimension entries ranked 1..10', () => {
    const view = projectReport(makeOkReport());
    expect(view.fateDimensions).toHaveLength(ALL_FATE_DIMENSIONS.length);
    const ranks = view.fateDimensions.map(d => d.rank).sort((a, b) => a - b);
    expect(ranks).toEqual(Array.from({ length: 10 }, (_, i) => i + 1));
  });

  it('produces one engine card per registered engine', () => {
    const view = projectReport(makeOkReport());
    expect(view.engines).toHaveLength(ALL_ENGINES.length);
    expect(view.engines.every(e => ALL_ENGINES.includes(e.engineId))).toBe(true);
  });

  it('produces 5 stage rows matching the life stage windows', () => {
    const view = projectReport(makeOkReport());
    expect(view.stages).toHaveLength(5);
    expect(view.stages.map(s => s.stage)).toEqual([
      'childhood', 'youth', 'prime', 'middle', 'elder',
    ]);
  });

  it('generates a degraded view for a failed pipeline', () => {
    const failedReport: PipelineReport = {
      ok: false,
      version: 'pipeline-1.0.0',
      normalize: { ok: false, input: null, issues: [{ field: 'birth_date', code: 'invalid', severity: 'error', message: 'test' }] },
      reason: 'input_validation_failed: birth_date:invalid',
    };
    const view = projectReport(failedReport);
    expect(view.ok).toBe(false);
    expect(view.reason).toContain('input_validation_failed');
    expect(view.header.overallScore).toBe(0);
    expect(view.stages).toHaveLength(0);
  });

  it('header quantumSignature is deterministic for same seed', () => {
    const report = makeOkReport();
    const a = projectReport(report);
    const b = projectReport(report);
    expect(a.header.quantumSignature).toBe(b.header.quantumSignature);
    expect(a.header.quantumSignature).toMatch(/^HPU·[0-9a-f]{8}$/);
  });
});
