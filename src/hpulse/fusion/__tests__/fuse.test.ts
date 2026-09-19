import { describe, expect, it } from 'vitest';
import { fuseDestiny } from '../fuse';
import { FUSION_VERSION } from '../types';
import type { WorldTree, StageNode, DomainNode, ObservationNode } from '@/hpulse/worldtree/types';
import type { EngineRunResult } from '@/hpulse/engines/runner';
import type { FateVector, EngineOutput } from '@/types/prediction';
import { ALL_FATE_DIMENSIONS } from '@/types/prediction';
import { ALL_ENGINES, type EngineId, type LifeStage, MATRIX_VERSION } from '@/hpulse/weights/types';

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
    observations: [makeObservation('bazi', d, stage, score, w), makeObservation('ziwei', d, stage, score, w)],
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

function makeWorldTree(stageScore = 60): WorldTree {
  const stages = [
    makeStage('childhood', 0, 12, 8, stageScore),
    makeStage('youth', 13, 29, 22, stageScore),
    makeStage('prime', 30, 44, 37, stageScore + 5),
    makeStage('middle', 45, 59, 52, stageScore),
    makeStage('elder', 60, 99, 70, stageScore - 5),
  ];
  stages[0].transitionToNext = { from: 'childhood', to: 'youth', delta: makeFateVector(0), magnitude: 2 };
  stages[1].transitionToNext = { from: 'youth', to: 'prime', delta: makeFateVector(5), magnitude: 5 };
  stages[2].transitionToNext = { from: 'prime', to: 'middle', delta: makeFateVector(-5), magnitude: 5 };
  stages[3].transitionToNext = { from: 'middle', to: 'elder', delta: makeFateVector(-5), magnitude: 5 };

  const avgScore = (stageScore + stageScore + stageScore + 5 + stageScore + stageScore - 5) / 5;
  return {
    kind: 'root',
    meta: {
      seedMaterial: 'a'.repeat(64),
      matrixVersion: MATRIX_VERSION,
      enginesConsidered: 13,
      enginesSucceeded: 13,
      defaultEvent: 'general',
      defaultGranularity: 'year',
      worldTreeVersion: 'wtree-1.0.0',
    },
    lifetimeFateVector: makeFateVector(avgScore),
    stages,
    permanentlyDegraded: {},
  };
}

function makeEngineResult(id: EngineId, ok: boolean): EngineRunResult {
  if (ok) {
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
  return {
    ok: false,
    id,
    error: { code: 'TEST_FAIL', message: 'intentional test failure' },
    durationMs: 1,
  };
}

describe('fuseDestiny', () => {
  it('returns a valid DestinyFusionResult with correct version', () => {
    const tree = makeWorldTree();
    const results = ALL_ENGINES.map(id => makeEngineResult(id, true));
    const fusion = fuseDestiny(tree, results);
    expect(fusion.version).toBe(FUSION_VERSION);
    expect(fusion.verdict).toBeDefined();
    expect(fusion.stageEvidence).toHaveLength(5);
  });

  it('is deterministic: same inputs produce identical output', () => {
    const tree = makeWorldTree();
    const results = ALL_ENGINES.map(id => makeEngineResult(id, true));
    const a = fuseDestiny(tree, results);
    const b = fuseDestiny(tree, results);
    expect(a).toEqual(b);
  });

  it('produces overallScore that is a positive number', () => {
    const tree = makeWorldTree(60);
    const results = ALL_ENGINES.map(id => makeEngineResult(id, true));
    const fusion = fuseDestiny(tree, results);
    expect(fusion.verdict.overallScore).toBeGreaterThan(0);
  });

  it('reports degraded engines from the WorldTree', () => {
    const tree = makeWorldTree();
    tree.permanentlyDegraded = { mayan: 'test degraded' };
    const results = ALL_ENGINES.filter(id => id !== 'mayan').map(id => makeEngineResult(id, true));
    results.push(makeEngineResult('mayan', false));
    const fusion = fuseDestiny(tree, results);
    expect(fusion.degradedEngines).toContain('mayan');
  });

  it('verdict includes top and bottom dimensions', () => {
    const tree = makeWorldTree();
    const results = ALL_ENGINES.map(id => makeEngineResult(id, true));
    const fusion = fuseDestiny(tree, results);
    expect(fusion.verdict.topDimensions.length).toBeGreaterThanOrEqual(1);
    expect(fusion.verdict.bottomDimensions.length).toBeGreaterThanOrEqual(1);
  });

  it('explanation trace contains HPU-6 version', () => {
    const tree = makeWorldTree();
    const results = ALL_ENGINES.map(id => makeEngineResult(id, true));
    const fusion = fuseDestiny(tree, results);
    expect(fusion.explanationTrace.some(l => l.includes('[HPU-6]'))).toBe(true);
    expect(fusion.explanationTrace.some(l => l.includes(FUSION_VERSION))).toBe(true);
  });
});
