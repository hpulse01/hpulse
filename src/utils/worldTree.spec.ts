import { describe, it, expect } from 'vitest';
import { generateWorldTree, collapseWorldTree } from './worldTreeGenerator';
import { fuseEventSeeds } from './eventFusion';
import { extractBaziEvents, extractTiebanEvents, extractZiweiEvents, extractWesternEvents, extractVedicEvents, extractNumerologyEvents, extractMayanEvents, extractKabbalahEvents, extractInstantEvents } from './eventSeedExtractors';
import { QuantumPredictionEngine } from './quantumPredictionEngine';
import type { StandardizedInput, FateVector } from '@/types/prediction';
import type { DestinyEventSeed, WorldNode } from '@/types/destinyTree';

function makeInput(): StandardizedInput {
  return {
    birthLocalDateTime: { year: 1990, month: 6, day: 15, hour: 14, minute: 30 },
    birthUtcDateTime: '1990-06-15T06:30:00.000Z',
    geoLatitude: 39.9042,
    geoLongitude: 116.4074,
    timezoneIana: 'Asia/Shanghai',
    timezoneOffsetMinutesAtBirth: 480,
    gender: 'male',
    normalizedLocationName: '北京',
    queryType: 'natalAnalysis',
    queryTimeUtc: '2025-01-01T00:00:00.000Z',
    sourceMetadata: {
      provider: 'test', confidence: 1,
      normalizedLocationName: '北京', timezoneIana: 'Asia/Shanghai',
    },
  };
}

const BASE_FATE: FateVector = { life: 55, wealth: 50, relation: 50, health: 60, wisdom: 55, spirit: 45, socialStatus: 50, creativity: 52, luck: 50, homeStability: 48 };

function buildTestFusionResult() {
  const result = QuantumPredictionEngine.predict({
    year: 1990, month: 6, day: 15, hour: 14, minute: 30,
    gender: 'male', geoLatitude: 39.9042, geoLongitude: 116.4074, timezoneOffsetMinutes: 480,
    timezoneIana: 'Asia/Shanghai',
    queryTimeUtc: '2025-01-01T00:00:00.000Z',
  });
  // Collect seeds from raw data
  const seeds: DestinyEventSeed[] = [];
  seeds.push(...extractTiebanEvents(result.fullReport, result.baziProfile, 1990));
  if (result.unifiedResult) {
    for (const eo of result.unifiedResult.engineOutputs) {
      if (eo.engineName === 'western') {
        seeds.push(...extractWesternEvents(result.westernReport, 1990));
      } else if (eo.engineName === 'vedic') {
        seeds.push(...extractVedicEvents(result.vedicReport, 1990));
      } else if (eo.engineName === 'numerology') {
        seeds.push(...extractNumerologyEvents(result.numerologyReport, 1990));
      } else if (eo.engineName === 'mayan') {
        seeds.push(...extractMayanEvents(result.mayanReport, 1990));
      } else if (eo.engineName === 'kabbalah') {
        seeds.push(...extractKabbalahEvents(result.kabbalahReport, 1990));
      }
      if (['liuyao', 'meihua', 'qimen', 'liuren', 'taiyi'].includes(eo.engineName)) {
        seeds.push(...extractInstantEvents(eo, '2025-01-01T00:00:00.000Z', 1990));
      }
    }
  }
  const weights: Record<string, number> = {};
  result.unifiedResult?.weightsUsed.forEach(w => { weights[w.engineName] = w.weight; });
  return fuseEventSeeds(seeds, weights);
}

function collectAllNodes(node: WorldNode): WorldNode[] {
  return [node, ...node.children.flatMap(collectAllNodes)];
}

function collectLeaves(node: WorldNode): WorldNode[] {
  if (node.children.length === 0) return [node];
  return node.children.flatMap(collectLeaves);
}

describe('World Tree Generation', () => {
  it('generates a tree with nodes', () => {
    const fusion = buildTestFusionResult();
    const tree = generateWorldTree(fusion, BASE_FATE, 1990, 'male');
    expect(tree.totalNodes).toBeGreaterThan(1);
    expect(tree.totalPaths).toBeGreaterThan(0);
    expect(tree.root.age).toBe(0);
  });

  it('same input → same tree structure', () => {
    const fusion = buildTestFusionResult();
    const t1 = generateWorldTree(fusion, BASE_FATE, 1990, 'male');
    const t2 = generateWorldTree(fusion, BASE_FATE, 1990, 'male');
    expect(t1.totalNodes).toBe(t2.totalNodes);
    expect(t1.totalPaths).toBe(t2.totalPaths);
  });

  it('every leaf is an explicit finite-model terminal', () => {
    const fusion = buildTestFusionResult();
    const tree = generateWorldTree(fusion, BASE_FATE, 1990, 'male');
    const leaves = collectLeaves(tree.root);
    for (const leaf of leaves) {
      expect(leaf.isTerminal).toBe(true);
      expect(leaf.terminalReason).toBeTruthy();
    }
  });

  it('no node expands after a model terminal', () => {
    const fusion = buildTestFusionResult();
    const tree = generateWorldTree(fusion, BASE_FATE, 1990, 'male');
    const allNodes = collectAllNodes(tree.root);
    for (const node of allNodes) {
      if (node.isTerminal) {
        expect(node.children.length).toBe(0);
      }
    }
  });

  it('root node has parentId null', () => {
    const fusion = buildTestFusionResult();
    const tree = generateWorldTree(fusion, BASE_FATE, 1990, 'male');
    expect(tree.root.parentId).toBeNull();
    expect(tree.root.isTerminal).toBe(false);
  });
});

describe('World Tree Collapse', () => {
  it('produces a non-empty collapsed path', () => {
    const fusion = buildTestFusionResult();
    const tree = generateWorldTree(fusion, BASE_FATE, 1990, 'male');
    const collapse = collapseWorldTree(tree);
    expect(collapse.collapsedPath.length).toBeGreaterThan(0);
    expect(collapse.terminalAge).toBeGreaterThan(0);
    expect(collapse.selectionStability).toBeGreaterThan(0);
    expect(collapse.planningHorizonAge).toBe(100);
  });

  it('same input → same collapsed path', () => {
    const fusion = buildTestFusionResult();
    const tree = generateWorldTree(fusion, BASE_FATE, 1990, 'male');
    const c1 = collapseWorldTree(tree);
    const c2 = collapseWorldTree(tree);
    expect(c1.terminalAge).toBe(c2.terminalAge);
    expect(c1.collapsedPath.length).toBe(c2.collapsedPath.length);
  });

  it('collapsed path ends with a finite-model terminal', () => {
    const fusion = buildTestFusionResult();
    const tree = generateWorldTree(fusion, BASE_FATE, 1990, 'male');
    const collapse = collapseWorldTree(tree);
    const last = collapse.collapsedPath[collapse.collapsedPath.length - 1];
    expect(last.isTerminal).toBe(true);
    expect(last.terminalReason).toBeTruthy();
  });

  it('collapse reasoning is non-empty', () => {
    const fusion = buildTestFusionResult();
    const tree = generateWorldTree(fusion, BASE_FATE, 1990, 'male');
    const collapse = collapseWorldTree(tree);
    expect(collapse.collapseReasoning.length).toBeGreaterThan(10);
    expect(collapse.finalLifeSummary.length).toBeGreaterThan(10);
  });
});

describe('Event Fusion', () => {
  it('merges same-mergeKey events from multiple engines', () => {
    const seeds: DestinyEventSeed[] = [
      {
        id: 'a1', engineName: 'bazi', engineVersion: '1.0', timingBasis: 'birth',
        category: 'career', subcategory: '事业', description: '八字事业变动',
        earliestAge: 28, latestAge: 32, probability: 0.7, intensity: 'major',
        causalFactors: ['正官格'], triggerConditions: [], deathRelated: false,
        mergeKey: 'age-30-career', fateImpact: { life: 10 }, sourceDetail: 'bazi',
        sourceFieldPath: 'pattern', sourceEvidence: '正官格', reasoning: '格局推断', confidence: 0.7, conflictTags: ['career'],
      },
      {
        id: 'a2', engineName: 'ziwei', engineVersion: '1.0', timingBasis: 'birth',
        category: 'career', subcategory: '官禄', description: '紫微官禄宫变化',
        earliestAge: 29, latestAge: 33, probability: 0.65, intensity: 'major',
        causalFactors: ['官禄宫化权'], triggerConditions: [], deathRelated: false,
        mergeKey: 'age-30-career', fateImpact: { life: 8 }, sourceDetail: 'ziwei',
        sourceFieldPath: 'palaces[官禄]', sourceEvidence: '官禄宫化权', reasoning: '化权推断', confidence: 0.65, conflictTags: ['career'],
      },
    ];
    const result = fuseEventSeeds(seeds, { bazi: 0.15, ziwei: 0.14 });
    // Should merge into 1 candidate
    const careerEvents = result.candidates.filter(c => c.mergeKey === 'age-30-career');
    expect(careerEvents.length).toBe(1);
    expect(careerEvents[0].consensusCount).toBe(2);
    expect(careerEvents[0].engineSupports.length).toBe(2);
  });

  it('excludes mortality and lifespan guesses before fusion', () => {
    const unsafe: DestinyEventSeed = {
      id: 'unsafe', engineName: 'numerology', engineVersion: 'legacy', timingBasis: 'birth',
      category: 'death', subcategory: 'unsupported', description: 'unsupported lifespan guess',
      earliestAge: 70, latestAge: 80, probability: 0.9, intensity: 'life_defining',
      causalFactors: ['fabricated'], triggerConditions: [], deathRelated: true,
      mergeKey: 'unsafe-lifespan', fateImpact: { health: -50 }, sourceDetail: 'none',
      sourceFieldPath: 'legacy', sourceEvidence: 'none', reasoning: 'none', confidence: 0.9,
      conflictTags: ['unsafe'],
    };
    const result = fuseEventSeeds([unsafe], { numerology: 1 });
    expect(result.candidates).toEqual([]);
    expect(result.excludedSensitiveCount).toBe(1);
  });
});

describe('Full Pipeline Integration', () => {
  it('predict() returns destinyTree and collapseResult', () => {
    const result = QuantumPredictionEngine.predict({
      year: 1990, month: 6, day: 15, hour: 14, minute: 30,
      gender: 'male', geoLatitude: 39.9042, geoLongitude: 116.4074, timezoneOffsetMinutes: 480,
      timezoneIana: 'Asia/Shanghai',
      queryTimeUtc: '2025-01-01T00:00:00.000Z',
    });
    expect(result.destinyTree).toBeDefined();
    expect(result.collapseResult).toBeDefined();
    expect(result.destinyTree!.totalNodes).toBeGreaterThan(1);
    expect(result.collapseResult!.collapsedPath.length).toBeGreaterThan(0);
    expect(result.collapseResult!.planningHorizonAge).toBe(100);
    expect(result.collapseResult!.terminalAge).toBeGreaterThan(0);
  });

  it('analysis horizon uses the destiny tree model boundary', () => {
    const result = QuantumPredictionEngine.predict({
      year: 1990, month: 6, day: 15, hour: 14, minute: 30,
      gender: 'male', geoLatitude: 39.9042, geoLongitude: 116.4074, timezoneOffsetMinutes: 480,
      timezoneIana: 'Asia/Shanghai',
      queryTimeUtc: '2025-01-01T00:00:00.000Z',
    });
    if (result.collapseResult) {
      expect(result.analysisHorizonAge).toBe(result.destinyTree?.planningHorizonAge);
      expect(result.collapseResult.planningHorizonAge).toBe(result.destinyTree?.planningHorizonAge);
    }
  });
});
