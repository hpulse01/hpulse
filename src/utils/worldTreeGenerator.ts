/**
 * H-Pulse Recursive World Tree Generator
 *
 * Builds a recursive destiny tree from UnifiedEventCandidates.
 * Each node represents a life event, children represent branching futures.
 * All paths terminate at death nodes.
 */

import type {
  UnifiedEventCandidate, WorldNode, RecursiveWorldTree,
  DeathCause, CollapsedPathNode, CollapseResult,
  RejectedBranchSummary, EventFusionResult,
} from '@/types/destinyTree';
import type { FateVector, FateDimension } from '@/types/prediction';
import { ALL_FATE_DIMENSIONS } from '@/types/prediction';

// ── Deterministic hash for reproducibility ──
function deterministicHash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

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

const DEFAULT_FATE_VECTOR: FateVector = { life: 50, wealth: 50, relation: 50, health: 50, wisdom: 50, spirit: 50 };

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
}

/**
 * Build the root birth node.
 */
function createRootNode(ctx: TreeGenContext): WorldNode {
  const birthEvent: UnifiedEventCandidate = {
    id: 'UEC-BIRTH', mergeKey: 'birth', category: 'turning_point',
    subcategory: '出生', description: '命主降生',
    peakAge: 0, ageWindow: [0, 0],
    fusedProbability: 1.0, intensity: 'life_defining',
    engineSupports: [], consensusCount: 0,
    isMainline: true, deathRelated: false,
    fateImpact: {}, prerequisiteEventIds: [], conflictingEventIds: [],
  };

  return {
    id: `WN-0`, parentId: null, depth: 0, age: 0, year: ctx.birthYear,
    alive: true, isDeath: false,
    dominantEvent: birthEvent, contributingEvents: [],
    engineSupports: [], transitionProbability: 1.0, cumulativeProbability: 1.0,
    causalChain: ['出生'], localFateVector: { ...ctx.baseFateVector },
    collapseWeight: 1.0, branchReason: '命主降生，命运树起始',
    children: [],
  };
}

/**
 * Find candidate events applicable at a given age.
 */
function findEventsAtAge(
  candidates: UnifiedEventCandidate[],
  age: number,
  usedEventIds: Set<string>,
): UnifiedEventCandidate[] {
  return candidates.filter(c =>
    !usedEventIds.has(c.id) &&
    age >= c.ageWindow[0] &&
    age <= c.ageWindow[1]
  );
}

/**
 * Determine if a node should die.
 */
function shouldDie(
  fateVector: FateVector,
  age: number,
  deathEvents: UnifiedEventCandidate[],
  nodeHash: number,
): { die: boolean; cause: DeathCause; description: string } {
  // Natural death probability increases with age
  const naturalDeathProb = age >= 90 ? 0.8 : age >= 80 ? 0.3 : age >= 70 ? 0.1 : 0.01;

  // Health-driven death
  if (fateVector.health <= 10 && age >= 50) {
    return { die: true, cause: 'illness', description: '健康值极低，重病不治' };
  }

  // Death events that match this age
  for (const de of deathEvents) {
    if (age >= de.ageWindow[0] && age <= de.ageWindow[1]) {
      const deathProb = de.fusedProbability * (age >= 70 ? 1.5 : 1.0);
      const roll = (nodeHash % 100) / 100;
      if (roll < deathProb) {
        return {
          die: true,
          cause: de.category === 'accident' ? 'accident' : de.category === 'health' ? 'illness' : 'sudden',
          description: de.description,
        };
      }
    }
  }

  // Natural aging death
  const roll = ((nodeHash + age * 7) % 100) / 100;
  if (roll < naturalDeathProb) {
    return { die: true, cause: 'natural_aging', description: `${age}岁自然寿终` };
  }

  // Hard cap
  if (age >= MAX_AGE) {
    return { die: true, cause: 'lifespan_limit', description: '寿限已至' };
  }

  return { die: false, cause: 'natural_aging', description: '' };
}

/**
 * Recursively expand a node's children.
 */
function expandNode(
  parent: WorldNode,
  ctx: TreeGenContext,
  usedEventIds: Set<string>,
  depth: number,
): void {
  if (depth >= MAX_DEPTH || ctx.nodeCount >= MAX_NODES || !parent.alive) return;

  // Find the next significant age jump
  const currentAge = parent.age;
  const candidatesByAge = new Map<number, UnifiedEventCandidate[]>();

  // Look ahead for the next events (scan forward 1-15 years)
  for (let lookAhead = 1; lookAhead <= 15 && currentAge + lookAhead <= MAX_AGE; lookAhead++) {
    const nextAge = currentAge + lookAhead;
    const events = findEventsAtAge(ctx.fusionResult.candidates, nextAge, usedEventIds);
    if (events.length > 0) {
      candidatesByAge.set(nextAge, events);
      // Stop after finding the first batch of events
      break;
    }
  }

  // If no events found, skip to next decade
  if (candidatesByAge.size === 0) {
    const nextDecade = Math.ceil((currentAge + 1) / 10) * 10;
    if (nextDecade <= MAX_AGE && nextDecade > currentAge) {
      // Create a "quiet passage" node
      ctx.nodeIdCounter++;
      const nodeHash = deterministicHash(`${parent.id}-quiet-${nextDecade}`);
      const deathCheck = shouldDie(parent.localFateVector, nextDecade, ctx.fusionResult.deathEvents, nodeHash);

      const quietEvent: UnifiedEventCandidate = {
        id: `UEC-QUIET-${nextDecade}`, mergeKey: `quiet-${nextDecade}`,
        category: 'turning_point', subcategory: '平稳期',
        description: `${nextDecade}岁，运势平稳推进`,
        peakAge: nextDecade, ageWindow: [nextDecade, nextDecade],
        fusedProbability: 0.9, intensity: 'minor',
        engineSupports: [], consensusCount: 0,
        isMainline: true, deathRelated: false,
        fateImpact: {}, prerequisiteEventIds: [], conflictingEventIds: [],
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
        children: [],
      };

      parent.children.push(child);
      ctx.nodeCount++;

      if (!deathCheck.die) {
        expandNode(child, ctx, new Set(usedEventIds), depth + 1);
      }
    }
    return;
  }

  // For each age with events, create branches
  for (const [nextAge, events] of candidatesByAge) {
    // Main branch: highest-probability event
    const sorted = [...events].sort((a, b) => b.fusedProbability - a.fusedProbability);
    const mainEvent = sorted[0];
    const altEvents = sorted.slice(1, 3); // up to 2 alternative branches

    // Create main branch
    const mainUsed = new Set(usedEventIds);
    mainUsed.add(mainEvent.id);
    ctx.nodeIdCounter++;
    const mainHash = deterministicHash(`${parent.id}-main-${nextAge}-${mainEvent.id}`);
    const mainFate = applyImpact(parent.localFateVector, mainEvent.fateImpact as Partial<Record<FateDimension, number>>);
    const mainDeathCheck = shouldDie(mainFate, nextAge, ctx.fusionResult.deathEvents, mainHash);

    const mainChild: WorldNode = {
      id: `WN-${ctx.nodeIdCounter}`, parentId: parent.id,
      depth, age: nextAge, year: ctx.birthYear + nextAge,
      alive: !mainDeathCheck.die, isDeath: mainDeathCheck.die,
      deathCause: mainDeathCheck.die ? mainDeathCheck.cause : undefined,
      dominantEvent: mainEvent,
      contributingEvents: events.filter(e => e.id !== mainEvent.id),
      engineSupports: mainEvent.engineSupports.map(s => s.engineName),
      transitionProbability: mainEvent.fusedProbability,
      cumulativeProbability: parent.cumulativeProbability * mainEvent.fusedProbability,
      causalChain: [...parent.causalChain, mainEvent.description],
      localFateVector: mainFate,
      collapseWeight: parent.collapseWeight * mainEvent.fusedProbability * (mainEvent.consensusCount * 0.2 + 0.6),
      branchReason: mainDeathCheck.die ? mainDeathCheck.description : mainEvent.description,
      children: [],
    };

    parent.children.push(mainChild);
    ctx.nodeCount++;

    if (!mainDeathCheck.die) {
      expandNode(mainChild, ctx, mainUsed, depth + 1);
    }

    // Alternative branches (lower probability)
    for (const altEvent of altEvents) {
      if (ctx.nodeCount >= MAX_NODES) break;
      const altUsed = new Set(usedEventIds);
      altUsed.add(altEvent.id);
      ctx.nodeIdCounter++;
      const altHash = deterministicHash(`${parent.id}-alt-${nextAge}-${altEvent.id}`);
      const altFate = applyImpact(parent.localFateVector, altEvent.fateImpact as Partial<Record<FateDimension, number>>);
      const altDeathCheck = shouldDie(altFate, nextAge, ctx.fusionResult.deathEvents, altHash);

      const altChild: WorldNode = {
        id: `WN-${ctx.nodeIdCounter}`, parentId: parent.id,
        depth, age: nextAge, year: ctx.birthYear + nextAge,
        alive: !altDeathCheck.die, isDeath: altDeathCheck.die,
        deathCause: altDeathCheck.die ? altDeathCheck.cause : undefined,
        dominantEvent: altEvent, contributingEvents: [],
        engineSupports: altEvent.engineSupports.map(s => s.engineName),
        transitionProbability: altEvent.fusedProbability * 0.7,
        cumulativeProbability: parent.cumulativeProbability * altEvent.fusedProbability * 0.7,
        causalChain: [...parent.causalChain, altEvent.description],
        localFateVector: altFate,
        collapseWeight: parent.collapseWeight * altEvent.fusedProbability * 0.5,
        branchReason: altDeathCheck.die ? altDeathCheck.description : `分支：${altEvent.description}`,
        children: [],
      };

      parent.children.push(altChild);
      ctx.nodeCount++;

      if (!altDeathCheck.die) {
        expandNode(altChild, ctx, altUsed, depth + 1);
      }
    }
  }
}

/**
 * Collect all terminal (leaf/death) nodes.
 */
function collectTerminals(node: WorldNode): WorldNode[] {
  if (node.children.length === 0) return [node];
  return node.children.flatMap(collectTerminals);
}

/**
 * Count all nodes in tree.
 */
function countNodes(node: WorldNode): number {
  return 1 + node.children.reduce((s, c) => s + countNodes(c), 0);
}

/**
 * Get max depth of tree.
 */
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
  };

  const root = createRootNode(ctx);
  ctx.nodeCount = 1;

  expandNode(root, ctx, new Set(), 1);

  // Ensure all terminal nodes that are alive get death applied
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
  };
}

// ═══════════════════════════════════════════════
// Quantum Collapse Engine
// ═══════════════════════════════════════════════

/**
 * Extract a path from root to a given terminal node.
 */
function extractPath(root: WorldNode, targetId: string): WorldNode[] {
  if (root.id === targetId) return [root];
  for (const child of root.children) {
    const sub = extractPath(child, targetId);
    if (sub.length > 0) return [root, ...sub];
  }
  return [];
}

/**
 * Collapse the world tree into a single optimal fate path.
 * Selection criteria:
 * - Cumulative probability (path likelihood)
 * - Engine consensus across path
 * - Causal chain consistency
 * - Fate vector coherence
 */
export function collapseWorldTree(tree: RecursiveWorldTree): CollapseResult {
  const terminals = tree.terminalNodes;

  if (terminals.length === 0) {
    // Fallback: tree has no terminals (shouldn't happen)
    return {
      collapsedPath: [],
      deathAge: 75, deathCause: 'natural_aging',
      deathDescription: '默认寿终',
      rejectedBranches: [], collapseReasoning: '命运树为空',
      collapseConfidence: 0.1, finalLifeSummary: '无法生成命运路径',
      totalPathsConsidered: 0,
    };
  }

  // Score each terminal path
  interface ScoredPath {
    terminal: WorldNode;
    path: WorldNode[];
    score: number;
  }

  const scoredPaths: ScoredPath[] = [];

  for (const term of terminals) {
    const path = extractPath(tree.root, term.id);
    if (path.length === 0) continue;

    // Score = cumulative probability × consensus bonus × coherence
    let score = term.cumulativeProbability;

    // Engine consensus bonus: prefer paths with more engine agreement
    const totalConsensus = path.reduce((s, n) => s + n.dominantEvent.consensusCount, 0);
    score *= 1 + totalConsensus * 0.05;

    // Mainline bonus
    const mainlineCount = path.filter(n => n.dominantEvent.isMainline).length;
    score *= 1 + mainlineCount * 0.1;

    // Fate vector coherence: penalize wild swings
    let coherencePenalty = 0;
    for (let i = 1; i < path.length; i++) {
      const prev = path[i - 1].localFateVector;
      const curr = path[i].localFateVector;
      for (const dim of ALL_FATE_DIMENSIONS) {
        coherencePenalty += Math.abs(curr[dim] - prev[dim]) * 0.001;
      }
    }
    score *= Math.max(0.3, 1 - coherencePenalty);

    // Death age preference: longer life paths get slight bonus (unless health dictates otherwise)
    const deathAge = term.age;
    if (deathAge >= 70 && deathAge <= 85) score *= 1.1;

    scoredPaths.push({ terminal: term, path, score });
  }

  // Sort by score descending
  scoredPaths.sort((a, b) => b.score - a.score);
  const winner = scoredPaths[0];
  const rejected = scoredPaths.slice(1, 6); // top 5 rejected

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

  const rejectedBranches: RejectedBranchSummary[] = rejected.map(r => ({
    branchAge: r.terminal.age,
    branchEvent: r.terminal.dominantEvent.description.slice(0, 60),
    reason: `坍缩评分${r.score.toFixed(3)} < 主线${winner.score.toFixed(3)}`,
    probability: r.terminal.cumulativeProbability,
  }));

  // Build collapse reasoning
  const collapseReasoning =
    `从${scoredPaths.length}条命运路径中坍缩出唯一确定态。` +
    `主线路径经过${winner.path.length}个命运节点，` +
    `${winner.path.filter(n => n.dominantEvent.isMainline).length}个主线事件，` +
    `终止于${winner.terminal.age}岁(${winner.terminal.deathCause || '自然'})。` +
    `坍缩基于多引擎共振度、因果连续性和命运向量稳定性综合评分。`;

  const deathNode = winner.terminal;

  // Final life summary
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
    collapseConfidence: Math.min(0.95, winner.score),
    finalLifeSummary,
    totalPathsConsidered: scoredPaths.length,
  };
}
