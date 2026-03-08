/**
 * H-Pulse Recursive World Tree Generator v4.0
 *
 * v4.0: Quantum Math Framework integration.
 *   - Collapse uses amplitude-based Born rule (|Ψ|²/Z)
 *   - Deterministic seeded PRNG replaces score-sorting
 *   - Fate potential drives world line selection
 *   - Full quantum collapse audit trail
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
// World Tree Generator
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
 * Find candidate events applicable at a given age.
 * Respects event dependencies and exclusions.
 */
function findEventsAtAge(
  candidates: UnifiedEventCandidate[],
  age: number,
  usedEventIds: Set<string>,
  completedCategories: Set<string>,
): UnifiedEventCandidate[] {
  return candidates.filter(c => {
    if (usedEventIds.has(c.id)) return false;
    if (age < c.ageWindow[0] || age > c.ageWindow[1]) return false;
    // Check prerequisites: all must be in usedEventIds
    for (const prereq of c.prerequisiteEventIds) {
      if (!usedEventIds.has(prereq)) return false;
    }
    // Check exclusions: none should be in usedEventIds
    for (const conflict of c.conflictingEventIds) {
      if (usedEventIds.has(conflict)) return false;
    }
    return true;
  });
}

/**
 * Determine if death should occur at this age based on DeathFusionResult.
 * No hash/random - purely event-driven.
 */
function checkDeathAtAge(
  fateVector: FateVector,
  age: number,
  deathFusion: DeathFusionResult,
  parentDeathChecked: Set<number>,
): { die: boolean; cause: DeathCause; description: string; reason: string } {
  // Health critical threshold
  if (fateVector.health <= 10 && age >= 50) {
    return { die: true, cause: 'illness', description: '健康值极低，重病不治',
      reason: `健康值${fateVector.health}<=10且年龄${age}>=50` };
  }

  // Check death candidates from fusion
  for (const dc of deathFusion.candidates) {
    if (age >= dc.ageWindow[0] && age <= dc.ageWindow[1]) {
      // Strong candidates die at estimated age
      if (dc.strength === 'strong' && age >= dc.estimatedAge - 2) {
        return { die: true, cause: dc.cause, description: dc.description,
          reason: `强死亡候选(${dc.engines.join('+')}共识)在${dc.estimatedAge}岁` };
      }
      // Weak candidates die at estimated age only if health is low
      if (dc.strength === 'weak' && age >= dc.estimatedAge && fateVector.health <= 40) {
        return { die: true, cause: dc.cause, description: dc.description,
          reason: `弱死亡候选在${dc.estimatedAge}岁，健康值${fateVector.health}偏低` };
      }
    }
  }

  // Natural aging: primary death age window
  const primary = deathFusion.primaryDeath;
  if (age >= primary.estimatedAge + 3) {
    return { die: true, cause: 'natural_aging', description: `${age}岁超过主要寿限候选(${primary.estimatedAge}岁)`,
      reason: `超过主要寿限${primary.estimatedAge}+3岁` };
  }

  // Hard cap
  if (age >= MAX_AGE) {
    return { die: true, cause: 'lifespan_limit', description: '寿限已至',
      reason: `达到绝对上限${MAX_AGE}岁` };
  }

  return { die: false, cause: 'natural_aging', description: '', reason: '' };
}

/**
 * Calculate enhancement bonus for an event based on enhancedByEventIds.
 */
function calculateEnhancement(event: UnifiedEventCandidate, usedEventIds: Set<string>): number {
  let bonus = 0;
  for (const enhId of event.enhancedByEventIds) {
    if (usedEventIds.has(enhId)) bonus += 0.05;
  }
  return bonus;
}

/**
 * Recursively expand a node's children.
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

  // Look ahead for next events
  for (let lookAhead = 1; lookAhead <= 15 && currentAge + lookAhead <= MAX_AGE; lookAhead++) {
    const nextAge = currentAge + lookAhead;
    const events = findEventsAtAge(ctx.fusionResult.candidates, nextAge, usedEventIds, completedCategories);
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
      const deathCheck = checkDeathAtAge(parent.localFateVector, nextDecade, ctx.deathFusion, new Set());

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
    const sorted = [...events].sort((a, b) => {
      // Sort by: enhanced probability > fusedProbability > consensusCount
      const aEnhanced = a.fusedProbability + calculateEnhancement(a, usedEventIds);
      const bEnhanced = b.fusedProbability + calculateEnhancement(b, usedEventIds);
      return bEnhanced - aEnhanced;
    });
    const mainEvent = sorted[0];
    const altEvents = sorted.slice(1, 3);

    // Main branch
    const mainUsed = new Set(usedEventIds);
    mainUsed.add(mainEvent.id);
    const mainCats = new Set(completedCategories);
    mainCats.add(mainEvent.category);
    ctx.nodeIdCounter++;

    const enhBonus = calculateEnhancement(mainEvent, usedEventIds);
    const mainFate = applyImpact(parent.localFateVector, mainEvent.fateImpact as Partial<Record<FateDimension, number>>);
    const mainDeathCheck = checkDeathAtAge(mainFate, nextAge, ctx.deathFusion, new Set());

    // Build event relationships
    const depsMet = mainEvent.prerequisiteEventIds.filter(id => usedEventIds.has(id));
    const exclusionsApplied = mainEvent.conflictingEventIds.filter(id => usedEventIds.has(id));
    const enhancementsReceived = mainEvent.enhancedByEventIds.filter(id => usedEventIds.has(id));
    const transformationsTriggered: string[] = [];
    if (mainEvent.transformsToEventId && usedEventIds.has(mainEvent.transformsToEventId)) {
      transformationsTriggered.push(mainEvent.transformsToEventId);
    }

    const mainChild: WorldNode = {
      id: `WN-${ctx.nodeIdCounter}`, parentId: parent.id,
      depth, age: nextAge, year: ctx.birthYear + nextAge,
      alive: !mainDeathCheck.die, isDeath: mainDeathCheck.die,
      deathCause: mainDeathCheck.die ? mainDeathCheck.cause : undefined,
      dominantEvent: mainEvent,
      contributingEvents: events.filter(e => e.id !== mainEvent.id),
      engineSupports: mainEvent.engineSupports.map(s => s.engineName),
      transitionProbability: Math.min(0.95, mainEvent.fusedProbability + enhBonus),
      cumulativeProbability: parent.cumulativeProbability * Math.min(0.95, mainEvent.fusedProbability + enhBonus),
      causalChain: [...parent.causalChain, mainEvent.description],
      localFateVector: mainFate,
      collapseWeight: parent.collapseWeight * mainEvent.fusedProbability * (mainEvent.consensusCount * 0.2 + 0.6),
      branchReason: mainDeathCheck.die ? mainDeathCheck.description : mainEvent.description,
      parentCausalChain: [...parent.causalChain],
      eventRelationships: { dependenciesMet: depsMet, exclusionsApplied, enhancementsReceived, transformationsTriggered },
      children: [],
    };

    parent.children.push(mainChild);
    ctx.nodeCount++;

    if (!mainDeathCheck.die) {
      expandNode(mainChild, ctx, mainUsed, mainCats, depth + 1);
    }

    // Alternative branches
    for (const altEvent of altEvents) {
      if (ctx.nodeCount >= MAX_NODES) break;
      const altUsed = new Set(usedEventIds);
      altUsed.add(altEvent.id);
      const altCats = new Set(completedCategories);
      altCats.add(altEvent.category);
      ctx.nodeIdCounter++;
      const altEnhBonus = calculateEnhancement(altEvent, usedEventIds);
      const altFate = applyImpact(parent.localFateVector, altEvent.fateImpact as Partial<Record<FateDimension, number>>);
      const altDeathCheck = checkDeathAtAge(altFate, nextAge, ctx.deathFusion, new Set());

      const altChild: WorldNode = {
        id: `WN-${ctx.nodeIdCounter}`, parentId: parent.id,
        depth, age: nextAge, year: ctx.birthYear + nextAge,
        alive: !altDeathCheck.die, isDeath: altDeathCheck.die,
        deathCause: altDeathCheck.die ? altDeathCheck.cause : undefined,
        dominantEvent: altEvent, contributingEvents: [],
        engineSupports: altEvent.engineSupports.map(s => s.engineName),
        transitionProbability: Math.min(0.95, altEvent.fusedProbability * 0.7 + altEnhBonus),
        cumulativeProbability: parent.cumulativeProbability * altEvent.fusedProbability * 0.7,
        causalChain: [...parent.causalChain, altEvent.description],
        localFateVector: altFate,
        collapseWeight: parent.collapseWeight * altEvent.fusedProbability * 0.5,
        branchReason: altDeathCheck.die ? altDeathCheck.description : `分支：${altEvent.description}`,
        parentCausalChain: [...parent.causalChain],
        eventRelationships: {
          dependenciesMet: altEvent.prerequisiteEventIds.filter(id => usedEventIds.has(id)),
          exclusionsApplied: altEvent.conflictingEventIds.filter(id => usedEventIds.has(id)),
          enhancementsReceived: altEvent.enhancedByEventIds.filter(id => usedEventIds.has(id)),
          transformationsTriggered: [],
        },
        children: [],
      };

      parent.children.push(altChild);
      ctx.nodeCount++;

      if (!altDeathCheck.die) {
        expandNode(altChild, ctx, altUsed, altCats, depth + 1);
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
// Quantum Collapse Engine v4.0 (Amplitude-Based)
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

  // Build world line inputs for quantum collapse
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

    // Build engine supports for quantum amplitude calculation
    const engineSupports: EngineSupport[] = Object.entries(engineCounts).map(([engine, count]) => ({
      engineName: engine,
      weight: count / path.length,
      probability: Math.min(0.95, term.cumulativeProbability * (1 + count * 0.05)),
    }));

    // Mainline and enhancement bonuses baked into collapse weight
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

  // Generate deterministic collapse seed from birth data
  const collapseSeed = generateCollapseSeed(
    tree.birthYear, 1, 1, 0, 0,
    tree.gender as 'male' | 'female',
    0, 0,
  );

  // Run quantum collapse pipeline
  const collapseDistribution = quantumCollapsePipeline(worldLineInputs, collapseSeed);
  
  const winnerIdx = collapseDistribution.collapsedIndex;
  const winner = pathDataList[winnerIdx >= 0 ? winnerIdx : 0];
  const rejected = pathDataList.filter((_, i) => i !== winnerIdx).slice(0, 5);

  // Determine dominant engines
  const sortedEngines = Object.entries(winner.engineCounts).sort((a, b) => b[1] - a[1]);
  const dominantEngines = sortedEngines.slice(0, 3).map(([e]) => e);

  // Build collapsed path
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

  const rejectedBranches: RejectedBranchSummary[] = rejected.map((r, i) => {
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

  // Conflict resolution notes
  const conflictResolutionNotes: string[] = [];
  for (const node of winner.path) {
    if (node.eventRelationships.exclusionsApplied.length > 0) {
      conflictResolutionNotes.push(`${node.age}岁：排除了${node.eventRelationships.exclusionsApplied.length}个冲突事件`);
    }
  }

  // Selected reason with quantum details
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
    `量子坍缩v4.0：从${pathDataList.length}条世界线中，通过波函数振幅计算(Ψ=Ae^{-E/kT})，` +
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
