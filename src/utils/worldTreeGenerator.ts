/**
 * H-Pulse Recursive World Tree Generator v6.0
 *
 * v6.0 升级:
 *   - Age-dependent fate vector natural drift (年龄命运向量自然漂移)
 *   - Decoherence-aware branch pruning (退相干感知剪枝)
 *   - Enhanced collapse with annealing + Monte Carlo validation
 *   - Life phase transition detection (人生阶段转换检测)
 *   - Cumulative karma accounting (累计因果积分)
 *
 * v5.0 原有功能:
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
  calculateDecoherence, annealedCollapse, monteCarloPathIntegral,
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
// Age-Dependent Fate Vector Natural Drift (v6.0 新增)
//
// 命运向量随年龄自然变化，即使没有重大事件也会漂移。
// 模拟自然规律：健康随年龄下降、智慧随经验增长等。
//
// 漂移公式: Δd(age) = drift_rate_d × Δt × modifier(age)
// ═══════════════════════════════════════════════

/**
 * Natural drift rates per year for each fate dimension.
 * Positive = natural growth, negative = natural decline.
 */
const NATURAL_DRIFT_RATES: Record<FateDimension, number> = {
  life: 0,       // Career: neutral drift (event-driven)
  wealth: 0.3,   // Wealth: slight natural accumulation
  relation: 0,   // Relationships: event-driven
  health: -0.5,  // Health: gradual natural decline
  wisdom: 0.4,   // Wisdom: natural growth with age
  spirit: 0.2,   // Spirituality: gradual deepening
};

/**
 * Age-dependent drift modifiers.
 * Health declines faster after 50, wisdom grows faster in middle age, etc.
 */
function getAgeDriftModifier(dim: FateDimension, age: number): number {
  switch (dim) {
    case 'health':
      if (age < 25) return 0.2;      // Youth: minimal decline
      if (age < 40) return 0.5;      // Prime: slow decline
      if (age < 55) return 1.0;      // Middle: standard decline
      if (age < 70) return 1.8;      // Late middle: accelerated
      return 2.5;                     // Elderly: rapid decline
    case 'wisdom':
      if (age < 15) return 2.0;      // Childhood: rapid learning
      if (age < 30) return 1.5;      // Young adult: strong growth
      if (age < 50) return 1.0;      // Middle: steady growth
      if (age < 70) return 0.7;      // Late: slowing
      return 0.3;                     // Elderly: plateau
    case 'wealth':
      if (age < 20) return 0;        // Youth: no wealth drift
      if (age < 35) return 1.5;      // Career building: fast
      if (age < 55) return 1.0;      // Peak: steady
      if (age < 70) return 0.5;      // Pre-retirement
      return -0.5;                    // Retirement: spending down
    case 'spirit':
      if (age < 30) return 0.3;      // Youth: slowly awakening
      if (age < 50) return 0.8;      // Middle: deepening
      return 1.5;                     // Late: spiritual maturation
    default:
      return 1.0;
  }
}

/**
 * Apply natural age-dependent drift to a fate vector.
 * Models the passage of time between events.
 */
function applyNaturalDrift(base: FateVector, fromAge: number, toAge: number): FateVector {
  if (toAge <= fromAge) return { ...base };

  const result = { ...base };
  const yearsDelta = toAge - fromAge;

  for (const dim of ALL_FATE_DIMENSIONS) {
    const baseRate = NATURAL_DRIFT_RATES[dim];
    // Use midpoint age for modifier
    const midAge = (fromAge + toAge) / 2;
    const modifier = getAgeDriftModifier(dim, midAge);
    const totalDrift = baseRate * yearsDelta * modifier;

    result[dim] = Math.max(5, Math.min(95, Math.round(result[dim] + totalDrift)));
  }

  return result;
}

// ═══════════════════════════════════════════════
// Life Phase Transition Detection (v6.0 新增)
//
// 检测重大人生阶段转换，在转换期自动增加分支因子。
// ═══════════════════════════════════════════════

const LIFE_PHASE_BOUNDARIES = [
  { age: 6, name: '入学', branchBoost: 1.5 },
  { age: 12, name: '青春期', branchBoost: 1.3 },
  { age: 18, name: '成年', branchBoost: 2.0 },
  { age: 22, name: '步入社会', branchBoost: 1.8 },
  { age: 30, name: '而立之年', branchBoost: 1.5 },
  { age: 40, name: '不惑之年', branchBoost: 1.3 },
  { age: 50, name: '知天命', branchBoost: 1.4 },
  { age: 60, name: '耳顺之年', branchBoost: 1.6 },
  { age: 70, name: '古稀之年', branchBoost: 1.2 },
];

function getPhaseTransitionBoost(age: number): number {
  for (const phase of LIFE_PHASE_BOUNDARIES) {
    if (Math.abs(age - phase.age) <= 1) return phase.branchBoost;
  }
  return 1.0;
}

// ═══════════════════════════════════════════════
// Cumulative Karma Accounting (v6.0 新增)
//
// 追踪正面/负面事件的累积效应——
// 连续负面事件降低后续正面事件概率(厄运积累)，反之亦然。
// ═══════════════════════════════════════════════

interface KarmaAccumulator {
  positiveKarma: number;
  negativeKarma: number;
  netKarma: number;
}

function calculateKarma(causalChain: string[], fateVector: FateVector): KarmaAccumulator {
  const avgFate = (fateVector.life + fateVector.wealth + fateVector.relation + fateVector.health + fateVector.wisdom + fateVector.spirit) / 6;
  const positive = Math.max(0, avgFate - 50) / 50;
  const negative = Math.max(0, 50 - avgFate) / 50;
  return {
    positiveKarma: positive,
    negativeKarma: negative,
    netKarma: positive - negative,
  };
}

/**
 * Apply karma-based probability adjustment.
 * Positive net karma → slight boost to positive events.
 * Negative net karma → slight boost to negative events (momentum).
 * This creates realistic "streaks" in the destiny path.
 */
function applyKarmaAdjustment(event: UnifiedEventCandidate, karma: KarmaAccumulator): number {
  const fateImpactSum = Object.values(event.fateImpact).reduce((s, v) => s + (v || 0), 0);
  const isPositiveEvent = fateImpactSum > 0;
  const KARMA_INFLUENCE = 0.1; // Max 10% probability adjustment

  if (isPositiveEvent) {
    // Positive event: boosted by positive karma, reduced by negative
    return event.fusedProbability * (1 + karma.netKarma * KARMA_INFLUENCE);
  } else {
    // Negative event: boosted by negative karma, reduced by positive
    return event.fusedProbability * (1 - karma.netKarma * KARMA_INFLUENCE);
  }
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

    // Dynamic branch factor B(t) with phase transition boost
    let branchFactor = calculateBranchFactor(sorted, parent.localFateVector, nextAge);
    const phaseBoost = getPhaseTransitionBoost(nextAge);
    branchFactor = Math.min(sorted.length, Math.round(branchFactor * phaseBoost));
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
      // v6.0: Apply natural drift before event impact
      const driftedFate = applyNaturalDrift(parent.localFateVector, parent.age, nextAge);
      const branchFate = applyImpact(driftedFate, event.fateImpact as Partial<Record<FateDimension, number>>);
      const deathCheck = checkDeathAtAge(branchFate, nextAge, ctx.deathFusion);

      // v6.0: Karma-adjusted transition probability
      const karma = calculateKarma(parent.causalChain, parent.localFateVector);

      // Transition probability: main branch gets full, alternatives get discounted
      // v6.0: Karma and decoherence modulate probability
      const karmaAdjustedProb = applyKarmaAdjustment(event, karma);
      const decoherenceFactor = calculateDecoherence(nextAge);
      const transProb = isMain
        ? Math.min(0.95, karmaAdjustedProb * decoherenceFactor + enhBonus)
        : Math.min(0.95, karmaAdjustedProb * decoherenceFactor * (0.8 - bi * 0.1) + enhBonus);

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

  // v6.0: Use annealed collapse for robust path selection
  const annealResult = annealedCollapse(worldLineInputs, collapseSeed);
  const collapseDistribution = quantumCollapsePipeline(worldLineInputs, collapseSeed);

  // v6.0: Monte Carlo validation for confidence estimation
  const mcResult = monteCarloPathIntegral(worldLineInputs, collapseSeed, undefined, {
    numSamples: Math.min(50, Math.max(20, pathDataList.length * 3)),
    perturbationScale: 0.05,
  });

  // Prefer annealed winner if stable, otherwise fall back to single-shot
  const winnerIdx = annealResult.stability > 0.5
    ? annealResult.winnerIndex
    : collapseDistribution.collapsedIndex;
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
    `量子坍缩v6.0：从${pathDataList.length}条世界线中，` +
    `通过模拟退火(稳定性${Math.round(annealResult.stability * 100)}%)×蒙特卡洛验证(MC置信度${Math.round(mcResult.mcConfidence * 100)}%)` +
    `双重验证后波函数振幅计算(Ψ=Ae^{-E/kT})坍缩。` +
    `动态分支因子B(t)生成分支，年龄漂移模型+因果积分调节，三级剪枝+退相干感知优化。` +
    `配分函数Z=${collapseDistribution.partitionFunction.toFixed(3)}，` +
    `确定性种子PRNG(seed=${collapseSeed.toString(16).slice(0,8)}...)。` +
    `有效温度T=${collapseDistribution.effectiveTemperature.toFixed(2)}，` +
    `坍缩置信度${Math.round(collapseDistribution.collapseConfidence * 100)}%` +
    `(MC${mcResult.isStable ? '稳定' : '不稳定'}，` +
    `退火${annealResult.stability > 0.7 ? '高度稳定' : annealResult.stability > 0.5 ? '较稳定' : '敏感'})。` +
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
    collapseConfidence: Math.min(0.95, collapseDistribution.collapseConfidence * 0.4 + annealResult.confidence * 0.3 + mcResult.mcConfidence * 0.3),
    finalLifeSummary,
    totalPathsConsidered: pathDataList.length,
    selectedReason,
    dominantEngines,
    conflictResolutionNotes,
    deathBoundaryReason,
  };
}
