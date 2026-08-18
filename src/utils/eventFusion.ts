/**
 * H-Pulse Event Fusion Layer v3.0
 *
 * Merges DestinyEventSeed[] from all engines into UnifiedEventCandidate[].
 * Commercial policy excludes mortality/lifespan signals before fusion.
 */

import type {
  DestinyEventSeed, UnifiedEventCandidate, EventFusionResult,
  EventCategory, EventIntensity,
} from '@/types/destinyTree';

const INTENSITY_ORDER: EventIntensity[] = ['minor', 'moderate', 'major', 'critical', 'life_defining'];

function maxIntensity(a: EventIntensity, b: EventIntensity): EventIntensity {
  return INTENSITY_ORDER.indexOf(a) >= INTENSITY_ORDER.indexOf(b) ? a : b;
}

// ═══════════════════════════════════════════════
// Main Fusion
// ═══════════════════════════════════════════════

export function fuseEventSeeds(
  allSeeds: DestinyEventSeed[],
  engineWeights: Record<string, number>,
): EventFusionResult {
  const safeSeeds = allSeeds.filter((seed) => !seed.deathRelated && seed.category !== 'death');
  const excludedSensitiveCount = allSeeds.length - safeSeeds.length;
  // Group by mergeKey
  const groups = new Map<string, DestinyEventSeed[]>();
  for (const seed of safeSeeds) {
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

    const consensusCount = new Set(seeds.map(s => s.engineName)).size;
    const isMainline = consensusCount >= 2 || intensity === 'life_defining' || intensity === 'critical';

    // Collect conflict tags for dependency/exclusion
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
      consensusCount, isMainline, deathRelated: false,
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
  return { candidates, mainlineEvents, sidelineEvents, excludedSensitiveCount, mergeLog, conflictLog };
}
