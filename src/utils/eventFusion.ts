/**
 * H-Pulse Event Fusion Layer v3.0
 *
 * Merges DestinyEventSeed[] from all engines into UnifiedEventCandidate[].
 * Includes Death Candidate Fusion sublayer.
 */

import type {
  DestinyEventSeed, UnifiedEventCandidate, EventFusionResult,
  EventCategory, EventIntensity,
  DeathCandidate, DeathFusionResult, DeathStrength, DeathCause,
} from '@/types/destinyTree';

const INTENSITY_ORDER: EventIntensity[] = ['minor', 'moderate', 'major', 'critical', 'life_defining'];

function maxIntensity(a: EventIntensity, b: EventIntensity): EventIntensity {
  return INTENSITY_ORDER.indexOf(a) >= INTENSITY_ORDER.indexOf(b) ? a : b;
}

// ═══════════════════════════════════════════════
// Death Candidate Fusion
// ═══════════════════════════════════════════════

function fuseDeathCandidates(deathSeeds: DestinyEventSeed[]): DeathFusionResult {
  // Group death seeds by approximate age window
  const groups = new Map<string, DestinyEventSeed[]>();
  for (const seed of deathSeeds) {
    // Group by 10-year bands
    const band = Math.floor(((seed.earliestAge + seed.latestAge) / 2) / 10) * 10;
    const key = `death-band-${band}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(seed);
  }

  const candidates: DeathCandidate[] = [];

  for (const [key, seeds] of groups) {
    const engines = [...new Set(seeds.map(s => s.engineName))];
    const consensusCount = engines.length;
    const avgAge = Math.round(seeds.reduce((s, d) => s + (d.earliestAge + d.latestAge) / 2, 0) / seeds.length);
    const minAge = Math.min(...seeds.map(s => s.earliestAge));
    const maxAge = Math.max(...seeds.map(s => s.latestAge));
    const avgProb = seeds.reduce((s, d) => s + d.probability, 0) / seeds.length;

    // Classify strength
    let strength: DeathStrength;
    if (consensusCount >= 3 && avgProb >= 0.4) {
      strength = 'strong';
    } else if (consensusCount >= 2 || avgProb >= 0.35) {
      strength = 'weak';
    } else {
      strength = 'illness_only';
    }

    // Determine cause
    const causeVotes: Record<string, number> = {};
    for (const s of seeds) {
      const cause = s.category === 'accident' ? 'accident' : s.category === 'health' ? 'illness' : 'natural_aging';
      causeVotes[cause] = (causeVotes[cause] || 0) + 1;
    }
    const cause = (Object.entries(causeVotes).sort((a, b) => b[1] - a[1])[0]?.[0] || 'natural_aging') as DeathCause;

    candidates.push({
      eventId: seeds[0].id,
      mergeKey: key,
      strength,
      estimatedAge: avgAge,
      ageWindow: [minAge, maxAge],
      fusedProbability: Math.min(0.9, avgProb * (1 + consensusCount * 0.1)),
      engines,
      consensusCount,
      cause,
      causalChain: seeds.flatMap(s => s.causalFactors).slice(0, 10),
      description: `${consensusCount}引擎共识：约${avgAge}岁(${strength === 'strong' ? '强' : strength === 'weak' ? '弱' : '病灾'})死亡候选`,
    });
  }

  // Sort by consensus then probability
  candidates.sort((a, b) => b.consensusCount - a.consensusCount || b.fusedProbability - a.fusedProbability);

  const strongCandidates = candidates.filter(c => c.strength === 'strong');
  const weakCandidates = candidates.filter(c => c.strength === 'weak');
  const illnessOnly = candidates.filter(c => c.strength === 'illness_only');

  // Primary death: prefer strong consensus, then weak, then illness
  const primaryDeath = strongCandidates[0] || weakCandidates[0] || illnessOnly[0] || {
    eventId: 'default-death',
    mergeKey: 'death-default',
    strength: 'weak' as DeathStrength,
    estimatedAge: 78,
    ageWindow: [70, 85] as [number, number],
    fusedProbability: 0.5,
    engines: [],
    consensusCount: 0,
    cause: 'natural_aging' as DeathCause,
    causalChain: ['无明确死亡信号，使用默认寿限'],
    description: '无明确死亡共识，默认寿限78岁',
  };

  const fusionReasoning =
    `死亡候选融合：${candidates.length}个候选(强${strongCandidates.length}/弱${weakCandidates.length}/病灾${illnessOnly.length})。` +
    `主要死亡候选：${primaryDeath.estimatedAge}岁(${primaryDeath.engines.join('+')}共识，${primaryDeath.cause})。`;

  return { candidates, strongCandidates, weakCandidates, illnessOnly, primaryDeath, fusionReasoning };
}

// ═══════════════════════════════════════════════
// Main Fusion
// ═══════════════════════════════════════════════

export function fuseEventSeeds(
  allSeeds: DestinyEventSeed[],
  engineWeights: Record<string, number>,
): EventFusionResult {
  // Group by mergeKey
  const groups = new Map<string, DestinyEventSeed[]>();
  for (const seed of allSeeds) {
    const key = seed.mergeKey;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(seed);
  }

  const candidates: UnifiedEventCandidate[] = [];
  const mergeLog: EventFusionResult['mergeLog'] = [];
  let candidateId = 0;

  for (const [mergeKey, seeds] of groups) {
    candidateId++;
    const id = `UEC-${String(candidateId).padStart(4, '0')}`;

    const earliests = seeds.map(s => s.earliestAge);
    const latests = seeds.map(s => s.latestAge);
    const narrowEarliest = Math.max(...earliests);
    const narrowLatest = Math.min(...latests);

    let ageWindow: [number, number];
    let peakAge: number;
    if (narrowEarliest <= narrowLatest) {
      ageWindow = [narrowEarliest, narrowLatest];
      peakAge = Math.round((narrowEarliest + narrowLatest) / 2);
    } else {
      ageWindow = [Math.min(...earliests), Math.max(...latests)];
      peakAge = Math.round((ageWindow[0] + ageWindow[1]) / 2);
    }

    let weightedProbSum = 0;
    let weightSum = 0;
    for (const seed of seeds) {
      const w = engineWeights[seed.engineName] || 0.05;
      weightedProbSum += seed.probability * w;
      weightSum += w;
    }
    const fusedProbability = weightSum > 0 ? Math.min(0.95, weightedProbSum / weightSum) : 0.5;

    const catCounts: Record<string, number> = {};
    seeds.forEach(s => { catCounts[s.category] = (catCounts[s.category] || 0) + 1; });
    const category = (Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'turning_point') as EventCategory;

    let intensity: EventIntensity = 'minor';
    for (const s of seeds) intensity = maxIntensity(intensity, s.intensity);

    const description = seeds.length > 1
      ? `[${seeds.length}引擎共振] ${seeds.map(s => s.description).join(' | ')}`
      : seeds[0].description;

    const mergedImpact: Record<string, number> = {};
    for (const s of seeds) {
      for (const [dim, val] of Object.entries(s.fateImpact)) {
        mergedImpact[dim] = (mergedImpact[dim] || 0) + (val || 0);
      }
    }
    for (const dim of Object.keys(mergedImpact)) {
      mergedImpact[dim] = Math.round(mergedImpact[dim] / seeds.length);
    }

    const deathRelated = seeds.some(s => s.deathRelated);
    const consensusCount = new Set(seeds.map(s => s.engineName)).size;
    const isMainline = consensusCount >= 2 || intensity === 'life_defining' || intensity === 'critical';

    // Collect conflict tags for dependency/exclusion
    const allConflictTags = [...new Set(seeds.flatMap(s => s.conflictTags))];

    candidates.push({
      id, mergeKey, category,
      subcategory: seeds[0].subcategory,
      description, peakAge, ageWindow,
      fusedProbability, intensity,
      engineSupports: seeds.map(s => ({
        engineName: s.engineName,
        seedId: s.id,
        probability: s.probability,
        causalFactors: s.causalFactors,
      })),
      consensusCount, isMainline, deathRelated,
      fateImpact: mergedImpact,
      prerequisiteEventIds: [],
      conflictingEventIds: [],
      enhancedByEventIds: [],
      transformsToEventId: null,
    });

    if (seeds.length > 1) {
      mergeLog.push({
        mergeKey,
        mergedCount: seeds.length,
        engines: [...new Set(seeds.map(s => s.engineName))],
      });
    }
  }

  // Sort by peakAge
  candidates.sort((a, b) => a.peakAge - b.peakAge);

  // Build prerequisite chains
  const catPrev: Record<string, string> = {};
  for (const c of candidates) {
    if (catPrev[c.category]) {
      c.prerequisiteEventIds.push(catPrev[c.category]);
    }
    catPrev[c.category] = c.id;
  }

  // Detect conflicts and enhancements
  const conflictLog: EventFusionResult['conflictLog'] = [];
  for (let i = 0; i < candidates.length; i++) {
    for (let j = i + 1; j < candidates.length; j++) {
      const a = candidates[i];
      const b = candidates[j];
      if (a.ageWindow[0] <= b.ageWindow[1] && b.ageWindow[0] <= a.ageWindow[1]) {
        const aPositive = Object.values(a.fateImpact).reduce((s, v) => s + (v || 0), 0) > 0;
        const bPositive = Object.values(b.fateImpact).reduce((s, v) => s + (v || 0), 0) > 0;
        
        if (aPositive !== bPositive && a.category === b.category) {
          // Conflict: same category, opposite impact
          a.conflictingEventIds.push(b.id);
          b.conflictingEventIds.push(a.id);
          conflictLog.push({
            eventA: a.id, eventB: b.id,
            resolution: `同期同类冲突：${a.description.slice(0, 30)} vs ${b.description.slice(0, 30)}，以多引擎共振优先`,
          });
        } else if (aPositive === bPositive && a.category === b.category) {
          // Enhancement: same category, same direction
          a.enhancedByEventIds.push(b.id);
          b.enhancedByEventIds.push(a.id);
        }
      }
    }
  }

  const mainlineEvents = candidates.filter(c => c.isMainline);
  const sidelineEvents = candidates.filter(c => !c.isMainline);
  const deathEvents = candidates.filter(c => c.deathRelated);

  // Death candidate fusion
  const deathSeeds = allSeeds.filter(s => s.deathRelated);
  const deathFusion = fuseDeathCandidates(deathSeeds);

  return { candidates, mainlineEvents, sidelineEvents, deathEvents, mergeLog, conflictLog, deathFusion };
}
