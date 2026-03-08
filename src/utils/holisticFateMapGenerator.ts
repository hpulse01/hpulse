/**
 * H-Pulse Holographic Fate Map Generator v1.0
 *
 * Transforms CollapseResult → HolographicFateMap with three layers:
 *   1. Macro: overall life pattern analysis
 *   2. Meso: key life events timeline
 *   3. Micro: current daily guidance
 */

import type {
  HolographicFateMap, MacroFateLayer, MesoEventLayer, MicroDailyLayer,
  MacroPhaseOverview, MesoEvent, FateCurvePoint, LifePhase, FateNode,
} from '@/types/holisticFateMap';
import type { CollapsedPathNode, CollapseResult } from '@/types/destinyTree';
import type { FateVector, FateDimension } from '@/types/prediction';
import { ALL_FATE_DIMENSIONS, FATE_DIMENSION_LABELS } from '@/types/prediction';

// ═══════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════

function averageFateVector(vectors: FateVector[]): FateVector {
  if (vectors.length === 0) return { life: 50, wealth: 50, relation: 50, health: 50, wisdom: 50, spirit: 50 };
  const result: FateVector = { life: 0, wealth: 0, relation: 0, health: 0, wisdom: 0, spirit: 0 };
  for (const fv of vectors) {
    for (const dim of ALL_FATE_DIMENSIONS) result[dim] += fv[dim];
  }
  for (const dim of ALL_FATE_DIMENSIONS) result[dim] = Math.round(result[dim] / vectors.length);
  return result;
}

function overallScore(fv: FateVector): number {
  return Math.round((fv.life + fv.wealth + fv.relation + fv.health + fv.wisdom + fv.spirit) / 6);
}

function findStrongest(fv: FateVector): FateDimension {
  let best: FateDimension = 'life';
  for (const dim of ALL_FATE_DIMENSIONS) {
    if (fv[dim] > fv[best]) best = dim;
  }
  return best;
}

function findWeakest(fv: FateVector): FateDimension {
  let worst: FateDimension = 'life';
  for (const dim of ALL_FATE_DIMENSIONS) {
    if (fv[dim] < fv[worst]) worst = dim;
  }
  return worst;
}

function getLifePhase(age: number): { phase: LifePhase; name: string } {
  if (age <= 12) return { phase: 'childhood', name: '童年期' };
  if (age <= 22) return { phase: 'youth', name: '青年期' };
  if (age <= 35) return { phase: 'prime', name: '壮年期' };
  if (age <= 50) return { phase: 'midlife', name: '中年期' };
  if (age <= 65) return { phase: 'mature', name: '壮暮期' };
  return { phase: 'elderly', name: '晚年期' };
}

function determineTrend(startScore: number, endScore: number): MacroPhaseOverview['trend'] {
  const diff = endScore - startScore;
  if (diff > 10) return 'ascending';
  if (diff > 3) return 'peak';
  if (diff > -3) return 'stable';
  if (diff > -10) return 'declining';
  return 'turbulent';
}

function gradeFromScore(score: number): MacroFateLayer['overallGrade'] {
  if (score >= 80) return 'S';
  if (score >= 65) return 'A';
  if (score >= 50) return 'B';
  if (score >= 35) return 'C';
  return 'D';
}

// ═══════════════════════════════════════════════
// Macro Layer Generator
// ═══════════════════════════════════════════════

function generateMacroLayer(collapse: CollapseResult, birthYear: number): MacroFateLayer {
  const path = collapse.collapsedPath;
  const allFateVectors = path.map(n => n.fateVector);
  const lifetimeAvg = averageFateVector(allFateVectors);
  const score = overallScore(lifetimeAvg);

  // Generate phase overviews
  const phaseConfigs: Array<{ phase: LifePhase; name: string; range: [number, number] }> = [
    { phase: 'childhood', name: '童年期', range: [0, 12] },
    { phase: 'youth', name: '青年期', range: [13, 22] },
    { phase: 'prime', name: '壮年期', range: [23, 35] },
    { phase: 'midlife', name: '中年期', range: [36, 50] },
    { phase: 'mature', name: '壮暮期', range: [51, 65] },
    { phase: 'elderly', name: '晚年期', range: [66, 100] },
  ];

  const phaseOverviews: MacroPhaseOverview[] = phaseConfigs.map(pc => {
    const phaseNodes = path.filter(n => n.age >= pc.range[0] && n.age <= pc.range[1]);
    const phaseVectors = phaseNodes.map(n => n.fateVector);
    const avgFate = averageFateVector(phaseVectors);
    const phaseScore = overallScore(avgFate);
    
    const startNodes = phaseNodes.filter(n => n.age <= pc.range[0] + 3);
    const endNodes = phaseNodes.filter(n => n.age >= pc.range[1] - 3);
    const startScore = startNodes.length > 0 ? overallScore(averageFateVector(startNodes.map(n => n.fateVector))) : phaseScore;
    const endScore = endNodes.length > 0 ? overallScore(averageFateVector(endNodes.map(n => n.fateVector))) : phaseScore;

    const keyEvents = phaseNodes.filter(n =>
      n.event.intensity === 'critical' || n.event.intensity === 'life_defining'
    );

    // Dominant engine from engine supports
    const engineCounts: Record<string, number> = {};
    for (const n of phaseNodes) {
      for (const e of n.engineSupports) engineCounts[e] = (engineCounts[e] || 0) + 1;
    }
    const dominantEngine = Object.entries(engineCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'bazi';

    // Core theme from dominant event categories
    const catCounts: Record<string, number> = {};
    for (const n of phaseNodes) catCounts[n.event.category] = (catCounts[n.event.category] || 0) + 1;
    const topCat = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '运势平稳';

    return {
      phase: pc.phase,
      phaseName: pc.name,
      ageRange: pc.range,
      trend: determineTrend(startScore, endScore),
      averageFate: avgFate,
      coreTheme: topCat,
      keyEventCount: keyEvents.length,
      dominantEngine,
    };
  });

  // Fate title generation
  const strongest = findStrongest(lifetimeAvg);
  const strongLabel = FATE_DIMENSION_LABELS[strongest];
  const traits: string[] = [];
  for (const dim of ALL_FATE_DIMENSIONS) {
    if (lifetimeAvg[dim] >= 70) traits.push(`${FATE_DIMENSION_LABELS[dim]}旺盛`);
    else if (lifetimeAvg[dim] <= 30) traits.push(`${FATE_DIMENSION_LABELS[dim]}偏弱`);
  }

  return {
    overallGrade: gradeFromScore(score),
    fateTitle: `${strongLabel}主导命格`,
    fateDescription: `命主一生${strongLabel}维度突出，整体运势评分${score}分(${gradeFromScore(score)}级)。`,
    coreTraits: traits.length > 0 ? traits : ['综合运势平衡'],
    phaseOverviews,
    lifetimeAverageFate: lifetimeAvg,
    strongestDimension: strongest,
    weakestDimension: findWeakest(lifetimeAvg),
    estimatedLifespan: collapse.deathAge,
    deathCause: collapse.deathCause,
    totalNodes: path.length,
  };
}

// ═══════════════════════════════════════════════
// Meso Layer Generator
// ═══════════════════════════════════════════════

function generateMesoLayer(collapse: CollapseResult, birthYear: number): MesoEventLayer {
  const path = collapse.collapsedPath;

  const keyEvents: MesoEvent[] = [];
  for (let i = 0; i < path.length; i++) {
    const node = path[i];
    if (node.event.intensity === 'minor' && !node.isDeath) continue;

    const prevFV = i > 0 ? path[i - 1].fateVector : node.fateVector;
    const currFV = node.fateVector;

    // Find max change dimension
    let maxDim: FateDimension = 'life';
    let maxChange = 0;
    for (const dim of ALL_FATE_DIMENSIONS) {
      const change = Math.abs(currFV[dim] - prevFV[dim]);
      if (change > maxChange) { maxChange = change; maxDim = dim; }
    }

    const isTurningPoint = maxChange >= 15 ||
      node.event.intensity === 'critical' ||
      node.event.intensity === 'life_defining';

    keyEvents.push({
      id: `MESO-${i}`,
      layer: 'meso',
      age: node.age,
      year: node.year,
      title: node.event.subcategory || node.event.description.slice(0, 20),
      description: node.event.description,
      category: node.event.category,
      subcategory: node.event.subcategory,
      fateVector: currFV,
      dominantDimension: maxDim,
      changeMagnitude: Math.round(currFV[maxDim] - prevFV[maxDim]),
      supportingEngines: node.engineSupports,
      consensusCount: node.event.consensusCount,
      confidence: node.cumulativeProbability,
      causalChain: [],
      prerequisiteNodeIds: [],
      consequences: [],
      intensity: node.event.intensity,
      isTurningPoint,
      fateVectorBefore: prevFV,
      fateVectorAfter: currFV,
      maxChangeDimension: maxDim,
      maxChangeAmount: maxChange,
    });
  }

  const turningPoints = keyEvents.filter(e => e.isTurningPoint);
  const peaks = keyEvents.filter(e => overallScore(e.fateVector) >= 70);
  const valleys = keyEvents.filter(e => overallScore(e.fateVector) <= 35);

  // Generate fate curve
  const fateCurve: FateCurvePoint[] = path.map(node => ({
    age: node.age,
    year: node.year,
    fateVector: node.fateVector,
    overallScore: overallScore(node.fateVector),
    dominantEvent: node.event.intensity !== 'minor' ? node.event.description.slice(0, 30) : null,
  }));

  return { keyEvents, turningPoints, peaks, valleys, fateCurve };
}

// ═══════════════════════════════════════════════
// Micro Layer Generator
// ═══════════════════════════════════════════════

function generateMicroLayer(collapse: CollapseResult, currentAge: number): MicroDailyLayer {
  const path = collapse.collapsedPath;

  // Find current/nearest node
  const currentNode = path.reduce((closest, node) => {
    if (Math.abs(node.age - currentAge) < Math.abs(closest.age - currentAge)) return node;
    return closest;
  }, path[0]);

  const nextNode = path.find(n => n.age > currentAge);
  const fv = currentNode?.fateVector ?? { life: 50, wealth: 50, relation: 50, health: 50, wisdom: 50, spirit: 50 };

  const focusDim = findWeakest(fv);
  const prevNode = path.filter(n => n.age < currentAge).pop();
  const dimensionTrend: MicroDailyLayer['dimensionTrend'] =
    prevNode ? (fv[focusDim] > prevNode.fateVector[focusDim] ? 'up' : fv[focusDim] < prevNode.fateVector[focusDim] ? 'down' : 'stable') : 'stable';

  // Generate auspicious/inauspicious
  const auspicious: string[] = [];
  const inauspicious: string[] = [];
  for (const dim of ALL_FATE_DIMENSIONS) {
    if (fv[dim] >= 65) auspicious.push(`${FATE_DIMENSION_LABELS[dim]}运势良好`);
    if (fv[dim] <= 35) inauspicious.push(`${FATE_DIMENSION_LABELS[dim]}需注意`);
  }

  const nextEvent = nextNode ? nextNode.event.description.slice(0, 30) : '运势平稳';

  return {
    dailyGuidance: `当前${FATE_DIMENSION_LABELS[focusDim]}维度需关注(${fv[focusDim]}分)，${dimensionTrend === 'up' ? '趋势向好' : dimensionTrend === 'down' ? '注意调整' : '保持稳定'}。下一命运节点：${nextEvent}。`,
    currentCycle: currentNode?.event.subcategory ?? '平稳期',
    auspicious: auspicious.length > 0 ? auspicious : ['整体运势平稳'],
    inauspicious: inauspicious.length > 0 ? inauspicious : ['暂无明显不利'],
    focusDimension: focusDim,
    dimensionTrend,
  };
}

// ═══════════════════════════════════════════════
// Public API: Generate Holographic Fate Map
// ═══════════════════════════════════════════════

export function generateHolographicFateMap(
  collapse: CollapseResult,
  birthYear: number,
  gender: string,
  currentAge: number = 30,
): HolographicFateMap {
  return {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    birthYear,
    gender,
    macroLayer: generateMacroLayer(collapse, birthYear),
    mesoLayer: generateMesoLayer(collapse, birthYear),
    microLayer: generateMicroLayer(collapse, currentAge),
    collapseInfo: {
      totalPathsConsidered: collapse.totalPathsConsidered,
      collapseConfidence: collapse.collapseConfidence,
      selectedReason: collapse.selectedReason,
      dominantEngines: collapse.dominantEngines,
    },
  };
}
