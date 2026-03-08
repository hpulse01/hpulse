/**
 * H-Pulse Recursive World Tree Generator v5.0
 *
 * v5.0: Notion 全面改革
 *   - Dynamic Branch Factor B(t) based on event significance
 *   - Three-tier pruning: probability threshold, causal consistency, temporal consistency
 *   - Quantum amplitude-based Born rule collapse
 *   - Deterministic seeded PRNG
 *   - Holographic Fate Map integration
 */

import type {
  UnifiedEventCandidate, WorldNode, RecursiveWorldTree,
  DeathCause, CollapsedPathNode, CollapseResult,
  RejectedBranchSummary, EventFusionResult, DeathFusionResult,
} from '@/types/destinyTree';
import type { FateVector, FateDimension } from '@/types/prediction';
import { ALL_FATE_DIMENSIONS } from '@/types/prediction';
import {
  generateCollapseSeed, quantumCollapsePipeline,
  calculateFatePotential, calculateCollapseConfidence,
  type WorldLineInput, type EngineSupport,
} from '@/utils/quantumMath';

// ── Apply event impact to fate vector ──
function applyImpact(base: FateVector, impact: Partial<Record<FateDimension, number>>): FateVector {
  const result = { ...base };
  for (const dim of ALL_FATE_DIMENSIONS) {
    if (impact[dim]) {
      result[dim] = Math.max(5, Math.min(95, Math.round(result[dim] + impact[dim])));
    }
  }
  return result;
}

// ═══════════════════════════════════════════════
// Dynamic Branch Factor B(t)
// Notion 规范：
//   日常琐事: 1-2, 普通决策: 2-4, 重大选择: 4-8
//   命运节点: 8-16, 生死关头: 16+
// ═══════════════════════════════════════════════

type EventSignificance = 'trivial' | 'ordinary' | 'major' | 'critical' | 'fatal';

function classifySignificance(event: UnifiedEventCandidate): EventSignificance {
  switch (event.intensity) {
    case 'minor': return 'trivial';
    case 'moderate': return 'ordinary';
    case 'major': return 'major';
    case 'critical': return 'critical';
    case 'life_defining': return event.deathRelated ? 'fatal' : 'critical';
    default: return 'trivial';
  }
}

/**
 * Dynamic Branch Factor B(t) = B_base · Π(1 + σ_s(t))
 * Simplified: return [minBranches, maxBranches] for an event significance level.
 */
function getBranchRange(significance: EventSignificance): [number, number] {
  switch (significance) {
    case 'trivial':  return [1, 2];
    case 'ordinary': return [2, 3];
    case 'major':    return [3, 5];
    case 'critical': return [4, 8];
    case 'fatal':    return [2, 4]; // Death events: limited but meaningful branches
    default:         return [1, 2];
  }
}

/**
 * Calculate actual branch count based on significance and event volatility.
 * σ_s(t) = event volatility from engine consensus
 */
function calculateBranchFactor(
  events: UnifiedEventCandidate[],
  fateVector: FateVector,
  age: number,
): number {
  if (events.length === 0) return 1;

  const topEvent = events[0];
  const significance = classifySignificance(topEvent);
  const [minB, maxB] = getBranchRange(significance);

  // Volatility factor: based on health + consensus
  const healthVolatility = fateVector.health < 30 ? 1.3 : fateVector.health < 50 ? 1.1 : 1.0;
  const consensusStability = topEvent.consensusCount >= 3 ? 0.9 : 1.1; // More consensus = fewer wild branches

  // Base branch factor with volatility
  let B = Math.round(minB + (maxB - minB) * healthVolatility * consensusStability * 0.5);
  
  // Clamp to available events count (can't branch more than event options)
  B = Math.min(B, events.length, maxB);
  B = Math.max(B, minB);

  return B;
}

// ═══════════════════════════════════════════════
// Pruning Strategies (Notion 规范)
// ═══════════════════════════════════════════════

/** Probability threshold pruning: discard branches with P < threshold */
const PROBABILITY_THRESHOLD = 0.005; // 0.5%

/** Causal consistency check: event prerequisites must be satisfied */
function checkCausalConsistency(
  event: UnifiedEventCandidate,
  usedEventIds: Set<string>,
  completedCategories: Set<string>,
): boolean {
  // All prerequisites must be met
  for (const prereq of event.prerequisiteEventIds) {
    if (!usedEventIds.has(prereq)) return false;
  }
  // No conflicting events should exist
  for (const conflict of event.conflictingEventIds) {
    if (usedEventIds.has(conflict)) return false;
  }
  return true;
}

/** Temporal consistency: events must occur within their age window */
function checkTemporalConsistency(event: UnifiedEventCandidate, age: number): boolean {
  return age >= event.ageWindow[0] && age <= event.ageWindow[1];
}

/** Combined pruning filter */
function pruneEvents(
  events: UnifiedEventCandidate[],
  age: number,
  usedEventIds: Set<string>,
  completedCategories: Set<string>,
  parentCumulativeProb: number,
): UnifiedEventCandidate[] {
  return events.filter(e => {
    // 1. Already used
    if (usedEventIds.has(e.id)) return false;
    // 2. Temporal consistency
    if (!checkTemporalConsistency(e, age)) return false;
    // 3. Causal consistency
    if (!checkCausalConsistency(e, usedEventIds, completedCategories)) return false;
    // 4. Probability threshold
    if (parentCumulativeProb * e.fusedProbability < PROBABILITY_THRESHOLD) return false;
    return true;
  });
}

// ═══════════════════════════════════════════════
// World Tree Generator Core
// ═══════════════════════════════════════════════

const MAX_DEPTH = 25;
const MAX_NODES = 500;
const MAX_AGE = 100;

interface TreeGenContext {
  fusionResult: EventFusionResult;
  birthYear: number;
  gender: string;
  baseFateVector: FateVector;
  nodeCount: number;
  nodeIdCounter: number;
  deathFusion: DeathFusionResult;
}

function createRootNode(ctx: TreeGenContext): WorldNode {
  const birthEvent: UnifiedEventCandidate = {
    id: 'UEC-BIRTH', mergeKey: 'birth', category: 'turning_point',
    subcategory: '出生', description: '命主降生',
    peakAge: 0, ageWindow: [0, 0],
    fusedProbability: 1.0, intensity: 'life_defining',
    engineSupports: [], consensusCount: 0,
    isMainline: true, deathRelated: false,
    fateImpact: {}, prerequisiteEventIds: [], conflictingEventIds: [],
    enhancedByEventIds: [], transformsToEventId: null,
  };

  return {
    id: `WN-0`, parentId: null, depth: 0, age: 0, year: ctx.birthYear,
    alive: true, isDeath: false,
    dominantEvent: birthEvent, contributingEvents: [],
    engineSupports: [], transitionProbability: 1.0, cumulativeProbability: 1.0,
    causalChain: ['出生'], localFateVector: { ...ctx.baseFateVector },
    collapseWeight: 1.0, branchReason: '命主降生，命运树起始',
    parentCausalChain: [],
    eventRelationships: { dependenciesMet: [], exclusionsApplied: [], enhancementsReceived: [], transformationsTriggered: [] },
    children: [],
  };
}

/**
 * Death check at a given age.
 */
function checkDeathAtAge(
  fateVector: FateVector,
  age: number,
  deathFusion: DeathFusionResult,
): { die: boolean; cause: DeathCause; description: string; reason: string } {
  if (fateVector.health <= 10 && age >= 50) {
    return { die: true, cause: 'illness', description: '健康值极低，重病不治',
      reason: `健康值${fateVector.health}<=10且年龄${age}>=50` };
  }

  for (const dc of deathFusion.candidates) {
    if (age >= dc.ageWindow[0] && age <= dc.ageWindow[1]) {
      if (dc.strength === 'strong' && age >= dc.estimatedAge - 2) {
        return { die: true, cause: dc.cause, description: dc.description,
          reason: `强死亡候选(${dc.engines.join('+')}共识)在${dc.estimatedAge}岁` };
      }
      if (dc.strength === 'weak' && age >= dc.estimatedAge && fateVector.health <= 40) {
        return { die: true, cause: dc.cause, description: dc.description,
          reason: `弱死亡候选在${dc.estimatedAge}岁，健康值${fateVector.health}偏低` };
      }
    }
  }

  const primary = deathFusion.primaryDeath;
  if (age >= primary.estimatedAge + 3) {
    return { die: true, cause: 'natural_aging', description: `${age}岁超过主要寿限候选(${primary.estimatedAge}岁)`,
      reason: `超过主要寿限${primary.estimatedAge}+3岁` };
  }

  if (age >= MAX_AGE) {
    return { die: true, cause: 'lifespan_limit', description: '寿限已至',
      reason: `达到绝对上限${MAX_AGE}岁` };
  }

  return { die: false, cause: 'natural_aging', description: '', reason: '' };
}

function calculateEnhancement(event: UnifiedEventCandidate, usedEventIds: Set<string>): number {
  let bonus = 0;
  for (const enhId of event.enhancedByEventIds) {
    if (usedEventIds.has(enhId)) bonus += 0.05;
  }
  return bonus;
}

/**
 * Recursively expand a node's children with dynamic branching and pruning.
 */
function expandNode(
  parent: WorldNode,
  ctx: TreeGenContext,
  usedEventIds: Set<string>,
  completedCategories: Set<string>,
  depth: number,
): void {
  if (depth >= MAX_DEPTH || ctx.nodeCount >= MAX_NODES || !parent.alive) return;

  const currentAge = parent.age;
  const candidatesByAge = new Map<number, UnifiedEventCandidate[]>();

  // Look ahead for next events with pruning
  for (let lookAhead = 1; lookAhead <= 15 && currentAge + lookAhead <= MAX_AGE; lookAhead++) {
    const nextAge = currentAge + lookAhead;
    const events = pruneEvents(
      ctx.fusionResult.candidates, nextAge, usedEventIds,
      completedCategories, parent.cumulativeProbability,
    );
    if (events.length > 0) {
      candidatesByAge.set(nextAge, events);
      break;
    }
  }

  // If no events found, skip to next decade
  if (candidatesByAge.size === 0) {
    const nextDecade = Math.ceil((currentAge + 1) / 10) * 10;
    if (nextDecade <= MAX_AGE && nextDecade > currentAge) {
      ctx.nodeIdCounter++;
      const deathCheck = checkDeathAtAge(parent.localFateVector, nextDecade, ctx.deathFusion);

      const quietEvent: UnifiedEventCandidate = {
        id: `UEC-QUIET-${nextDecade}`, mergeKey: `quiet-${nextDecade}`,
        category: 'turning_point', subcategory: '平稳期',
        description: `${nextDecade}岁，运势平稳推进`,
        peakAge: nextDecade, ageWindow: [nextDecade, nextDecade],
        fusedProbability: 0.9, intensity: 'minor',
        engineSupports: [], consensusCount: 0,
        isMainline: true, deathRelated: false,
        fateImpact: {}, prerequisiteEventIds: [], conflictingEventIds: [],
        enhancedByEventIds: [], transformsToEventId: null,
      };

      const child: WorldNode = {
        id: `WN-${ctx.nodeIdCounter}`, parentId: parent.id,
        depth, age: nextDecade, year: ctx.birthYear + nextDecade,
        alive: !deathCheck.die, isDeath: deathCheck.die,
        deathCause: deathCheck.die ? deathCheck.cause : undefined,
        dominantEvent: quietEvent, contributingEvents: [],
        engineSupports: [], transitionProbability: 0.9,
        cumulativeProbability: parent.cumulativeProbability * 0.9,
        causalChain: [...parent.causalChain, quietEvent.description],
        localFateVector: { ...parent.localFateVector },
        collapseWeight: parent.collapseWeight * 0.9,
        branchReason: deathCheck.die ? deathCheck.description : '运势平稳推进',
        parentCausalChain: [...parent.causalChain],
        eventRelationships: { dependenciesMet: [], exclusionsApplied: [], enhancementsReceived: [], transformationsTriggered: [] },
        children: [],
      };

      parent.children.push(child);
      ctx.nodeCount++;

      if (!deathCheck.die) {
        expandNode(child, ctx, new Set(usedEventIds), new Set(completedCategories), depth + 1);
      }
    }
    return;
  }

  for (const [nextAge, events] of candidatesByAge) {
    // Sort by enhanced probability
    const sorted = [...events].sort((a, b) => {
      const aEnhanced = a.fusedProbability + calculateEnhancement(a, usedEventIds);
      const bEnhanced = b.fusedProbability + calculateEnhancement(b, usedEventIds);
      return bEnhanced - aEnhanced;
    });

    // Dynamic branch factor B(t)
    const branchFactor = calculateBranchFactor(sorted, parent.localFateVector, nextAge);
    const branchEvents = sorted.slice(0, branchFactor);

    for (let bi = 0; bi < branchEvents.length; bi++) {
      if (ctx.nodeCount >= MAX_NODES) break;

      const event = branchEvents[bi];
      const isMain = bi === 0;
      const branchUsed = new Set(usedEventIds);
      branchUsed.add(event.id);
      const branchCats = new Set(completedCategories);
      branchCats.add(event.category);
      ctx.nodeIdCounter++;

      const enhBonus = calculateEnhancement(event, usedEventIds);
      const branchFate = applyImpact(parent.localFateVector, event.fateImpact as Partial<Record<FateDimension, number>>);
      const deathCheck = checkDeathAtAge(branchFate, nextAge, ctx.deathFusion);

      // Transition probability: main branch gets full, alternatives get discounted
      const transProb = isMain
        ? Math.min(0.95, event.fusedProbability + enhBonus)
        : Math.min(0.95, event.fusedProbability * (0.8 - bi * 0.1) + enhBonus);

      const depsMet = event.prerequisiteEventIds.filter(id => usedEventIds.has(id));
      const exclusionsApplied = event.conflictingEventIds.filter(id => usedEventIds.has(id));
      const enhancementsReceived = event.enhancedByEventIds.filter(id => usedEventIds.has(id));
      const transformationsTriggered: string[] = [];
      if (event.transformsToEventId && usedEventIds.has(event.transformsToEventId)) {
        transformationsTriggered.push(event.transformsToEventId);
      }

      const child: WorldNode = {
        id: `WN-${ctx.nodeIdCounter}`, parentId: parent.id,
        depth, age: nextAge, year: ctx.birthYear + nextAge,
        alive: !deathCheck.die, isDeath: deathCheck.die,
        deathCause: deathCheck.die ? deathCheck.cause : undefined,
        dominantEvent: event,
        contributingEvents: isMain ? events.filter(e => e.id !== event.id) : [],
        engineSupports: event.engineSupports.map(s => s.engineName),
        transitionProbability: transProb,
        cumulativeProbability: parent.cumulativeProbability * transProb,
        causalChain: [...parent.causalChain, event.description],
        localFateVector: branchFate,
        collapseWeight: parent.collapseWeight * event.fusedProbability * (event.consensusCount * 0.2 + 0.6) * (isMain ? 1.0 : 0.6),
        branchReason: deathCheck.die ? deathCheck.description : (isMain ? event.description : `分支：${event.description}`),
        parentCausalChain: [...parent.causalChain],
        eventRelationships: { dependenciesMet: depsMet, exclusionsApplied, enhancementsReceived, transformationsTriggered },
        children: [],
      };

      parent.children.push(child);
      ctx.nodeCount++;

      if (!deathCheck.die) {
        expandNode(child, ctx, branchUsed, branchCats, depth + 1);
      }
    }
  }
}

function collectTerminals(node: WorldNode): WorldNode[] {
  if (node.children.length === 0) return [node];
  return node.children.flatMap(collectTerminals);
}

function countNodes(node: WorldNode): number {
  return 1 + node.children.reduce((s, c) => s + countNodes(c), 0);
}

function maxTreeDepth(node: WorldNode): number {
  if (node.children.length === 0) return node.depth;
  return Math.max(...node.children.map(maxTreeDepth));
}

// ═══════════════════════════════════════════════
// Public API: Generate World Tree
// ═══════════════════════════════════════════════

export function generateWorldTree(
  fusionResult: EventFusionResult,
  baseFateVector: FateVector,
  birthYear: number,
  gender: string,
): RecursiveWorldTree {
  const ctx: TreeGenContext = {
    fusionResult, birthYear, gender, baseFateVector,
    nodeCount: 0, nodeIdCounter: 0,
    deathFusion: fusionResult.deathFusion,
  };

  const root = createRootNode(ctx);
  ctx.nodeCount = 1;

  expandNode(root, ctx, new Set(), new Set(), 1);

  // Ensure all terminal nodes are death nodes
  const terminals = collectTerminals(root);
  for (const term of terminals) {
    if (term.alive && !term.isDeath) {
      term.isDeath = true;
      term.alive = false;
      term.deathCause = term.age >= 80 ? 'natural_aging' : 'lifespan_limit';
      term.branchReason = `${term.age}岁寿终`;
    }
  }

  return {
    root,
    totalNodes: countNodes(root),
    totalPaths: terminals.length,
    maxDepth: maxTreeDepth(root),
    terminalNodes: terminals,
    generatedAt: new Date().toISOString(),
    birthYear, gender,
    deathFusion: fusionResult.deathFusion,
  };
}

// ═══════════════════════════════════════════════
// Quantum Collapse Engine v5.0
// ═══════════════════════════════════════════════

function extractPath(root: WorldNode, targetId: string): WorldNode[] {
  if (root.id === targetId) return [root];
  for (const child of root.children) {
    const sub = extractPath(child, targetId);
    if (sub.length > 0) return [root, ...sub];
  }
  return [];
}

export function collapseWorldTree(tree: RecursiveWorldTree): CollapseResult {
  const terminals = tree.terminalNodes;

  if (terminals.length === 0) {
    return {
      collapsedPath: [],
      deathAge: 75, deathCause: 'natural_aging',
      deathDescription: '默认寿终',
      rejectedBranches: [], collapseReasoning: '命运树为空',
      collapseConfidence: 0.1, finalLifeSummary: '无法生成命运路径',
      totalPathsConsidered: 0,
      selectedReason: '无路径可选',
      dominantEngines: [],
      conflictResolutionNotes: [],
      deathBoundaryReason: '无死亡数据',
    };
  }

  interface PathData {
    terminal: WorldNode;
    path: WorldNode[];
    engineCounts: Record<string, number>;
  }
  
  const pathDataList: PathData[] = [];
  const worldLineInputs: WorldLineInput[] = [];

  for (const term of terminals) {
    const path = extractPath(tree.root, term.id);
    if (path.length === 0) continue;

    const engineCounts: Record<string, number> = {};
    let totalConsensus = 0;
    for (const n of path) {
      for (const e of n.engineSupports) {
        engineCounts[e] = (engineCounts[e] || 0) + 1;
      }
      totalConsensus += n.dominantEvent.consensusCount;
    }

    const engineSupports: EngineSupport[] = Object.entries(engineCounts).map(([engine, count]) => ({
      engineName: engine,
      weight: count / path.length,
      probability: Math.min(0.95, term.cumulativeProbability * (1 + count * 0.05)),
    }));

    const mainlineCount = path.filter(n => n.dominantEvent.isMainline).length;
    const enhCount = path.reduce((s, n) => s + n.eventRelationships.enhancementsReceived.length, 0);
    const depCount = path.reduce((s, n) => s + n.eventRelationships.dependenciesMet.length, 0);
    
    const collapseWeight = term.collapseWeight
      * (1 + mainlineCount * 0.1)
      * (1 + enhCount * 0.03)
      * (1 + depCount * 0.02);

    pathDataList.push({ terminal: term, path, engineCounts });
    worldLineInputs.push({
      id: term.id,
      engineSupports,
      collapseWeight,
      consensusCount: totalConsensus,
    });
  }

  const collapseSeed = generateCollapseSeed(
    tree.birthYear, 1, 1, 0, 0,
    tree.gender as 'male' | 'female',
    0, 0,
  );

  const collapseDistribution = quantumCollapsePipeline(worldLineInputs, collapseSeed);
  
  const winnerIdx = collapseDistribution.collapsedIndex;
  const winner = pathDataList[winnerIdx >= 0 ? winnerIdx : 0];
  const rejected = pathDataList.filter((_, i) => i !== winnerIdx).slice(0, 5);

  const sortedEngines = Object.entries(winner.engineCounts).sort((a, b) => b[1] - a[1]);
  const dominantEngines = sortedEngines.slice(0, 3).map(([e]) => e);

  const collapsedPath: CollapsedPathNode[] = winner.path.map(node => ({
    age: node.age,
    year: node.year,
    event: node.dominantEvent,
    fateVector: node.localFateVector,
    cumulativeProbability: node.cumulativeProbability,
    engineSupports: node.engineSupports,
    isDeath: node.isDeath,
    deathCause: node.deathCause,
  }));

  const winnerAmplitude = collapseDistribution.worldLines[winnerIdx >= 0 ? winnerIdx : 0];
  const winnerProb = winnerAmplitude?.probability ?? 0;

  const rejectedBranches: RejectedBranchSummary[] = rejected.map((r) => {
    const rIdx = pathDataList.indexOf(r);
    const rAmplitude = collapseDistribution.worldLines[rIdx];
    return {
      branchAge: r.terminal.age,
      branchEvent: r.terminal.dominantEvent.description.slice(0, 60),
      reason: `量子振幅P=${(rAmplitude?.probability ?? 0).toFixed(4)} < 主线P=${winnerProb.toFixed(4)}`,
      probability: r.terminal.cumulativeProbability,
      rejectedReason: `波函数|Ψ|²较低，${
        r.terminal.age < winner.terminal.age ? '寿命偏短' :
        Object.keys(r.engineCounts).length < Object.keys(winner.engineCounts).length ? '引擎共振不足' : '命理势能偏高'
      }`,
    };
  });

  const conflictResolutionNotes: string[] = [];
  for (const node of winner.path) {
    if (node.eventRelationships.exclusionsApplied.length > 0) {
      conflictResolutionNotes.push(`${node.age}岁：排除了${node.eventRelationships.exclusionsApplied.length}个冲突事件`);
    }
  }

  const selectedReason =
    `量子坍缩选择此路径：波函数振幅P=${winnerProb.toFixed(4)}，` +
    `命理势能E=${winnerAmplitude?.fatePotential?.toFixed(3) ?? 'N/A'}，` +
    `引擎共识(${dominantEngines.join('+')}主导)，` +
    `配分函数Z=${collapseDistribution.partitionFunction.toFixed(3)}，` +
    `信息熵H=${collapseDistribution.entropy.toFixed(3)}bit`;

  const deathNode = winner.terminal;
  const deathBoundaryReason =
    `死亡终点${deathNode.age}岁：${deathNode.branchReason}。` +
    `基于死亡候选融合(${tree.deathFusion.primaryDeath.engines.join('+')}共识，` +
    `主要候选${tree.deathFusion.primaryDeath.estimatedAge}岁，` +
    `强度${tree.deathFusion.primaryDeath.strength})`;

  const collapseReasoning =
    `量子坍缩v5.0：从${pathDataList.length}条世界线中，通过波函数振幅计算(Ψ=Ae^{-E/kT})，` +
    `动态分支因子B(t)生成分支，三级剪枝(概率阈值/因果一致性/时序一致性)优化，` +
    `配分函数归一化(Z=${collapseDistribution.partitionFunction.toFixed(3)})，` +
    `确定性种子PRNG(seed=${collapseSeed.toString(16).slice(0,8)}...)坍缩出唯一命运路径。` +
    `有效温度T=${collapseDistribution.effectiveTemperature.toFixed(2)}，` +
    `坍缩置信度${Math.round(collapseDistribution.collapseConfidence * 100)}%。` +
    `终止于${deathNode.age}岁(${deathNode.deathCause || '自然'})。`;

  const majorEvents = winner.path.filter(n => n.dominantEvent.intensity === 'critical' || n.dominantEvent.intensity === 'life_defining');
  const finalLifeSummary =
    `命主${tree.birthYear}年生，` +
    `一生经历${winner.path.length - 1}个关键命运节点，` +
    `其中${majorEvents.length}个重大事件。` +
    (majorEvents.length > 0 ? `关键转折：${majorEvents.slice(0, 3).map(n => `${n.age}岁(${n.dominantEvent.subcategory})`).join('、')}。` : '') +
    `寿终${deathNode.age}岁，${deathNode.deathCause === 'natural_aging' ? '善终归位' : '因' + (deathNode.branchReason || '命数') + '而终'}。`;

  return {
    collapsedPath,
    deathAge: deathNode.age,
    deathCause: deathNode.deathCause || 'natural_aging',
    deathDescription: deathNode.branchReason,
    rejectedBranches,
    collapseReasoning,
    collapseConfidence: Math.min(0.95, collapseDistribution.collapseConfidence),
    finalLifeSummary,
    totalPathsConsidered: pathDataList.length,
    selectedReason,
    dominantEngines,
    conflictResolutionNotes,
    deathBoundaryReason,
  };
}
