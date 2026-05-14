/**
 * Quantum Collapse — Event Fusion
 *
 * Group normalized seeds by (canonicalCategory + age window overlap),
 * combine multi-engine support deterministically.
 */

import type { FusedEvent, NormalizedEventSeed, EventSeed, AgeWindow, EventPolarity, SensitiveFlag } from './types';
import { clamp01, deterministicId, stableSortByScore } from './deterministic';
import { annotateFusedSensitive, sanitizeSensitiveDisplay } from './sensitiveEvents';
import { DEFAULT_POLARITY } from './constants';

interface Context {
  seedIndex: Map<string, EventSeed>;
}

function windowsOverlap(a: AgeWindow, b: AgeWindow): boolean {
  return !(a.latestAge < b.earliestAge || b.latestAge < a.earliestAge);
}

function mergeWindows(a: AgeWindow, b: AgeWindow): AgeWindow {
  const earliestAge = Math.max(a.earliestAge, b.earliestAge);
  const latestAge = Math.min(a.latestAge, b.latestAge);
  // If they don't overlap, fall back to broader union (shouldn't happen here).
  if (latestAge < earliestAge) {
    return {
      earliestAge: Math.min(a.earliestAge, b.earliestAge),
      latestAge: Math.max(a.latestAge, b.latestAge),
      precision: 'wide',
    };
  }
  const span = latestAge - earliestAge;
  const precision: AgeWindow['precision'] = span <= 1 ? 'exact' : span <= 5 ? 'narrow' : span <= 15 ? 'wide' : 'unknown';
  return { earliestAge, latestAge, precision };
}

function dominantPolarity(items: NormalizedEventSeed[], ctx: Context): EventPolarity {
  let pos = 0, neg = 0;
  for (const it of items) {
    const seed = ctx.seedIndex.get(it.seedId);
    const p = seed?.polarity ?? DEFAULT_POLARITY[it.canonicalCategory];
    if (p === 'positive') pos += it.normalizedConfidence;
    else if (p === 'negative') neg += it.normalizedConfidence;
  }
  if (pos > neg * 1.5) return 'positive';
  if (neg > pos * 1.5) return 'negative';
  if (pos === 0 && neg === 0) return 'neutral';
  return 'mixed';
}

function pickRepresentativeDescription(items: NormalizedEventSeed[]): string {
  const sorted = [...items].sort((a, b) => b.normalizedConfidence - a.normalizedConfidence || a.seedId.localeCompare(b.seedId));
  return sorted[0]?.canonicalDescription ?? '';
}

export function fuseNormalizedEvents(
  normalized: NormalizedEventSeed[],
  seeds: EventSeed[],
): FusedEvent[] {
  const ctx: Context = { seedIndex: new Map(seeds.map(s => [s.id, s])) };
  // Group greedily: sort by category then by earliestAge, then merge overlapping
  const buckets: NormalizedEventSeed[][] = [];
  const sorted = [...normalized].sort((a, b) => {
    if (a.canonicalCategory !== b.canonicalCategory) return a.canonicalCategory.localeCompare(b.canonicalCategory);
    if (a.normalizedAgeWindow.earliestAge !== b.normalizedAgeWindow.earliestAge) return a.normalizedAgeWindow.earliestAge - b.normalizedAgeWindow.earliestAge;
    return a.seedId.localeCompare(b.seedId);
  });
  for (const item of sorted) {
    const last = buckets[buckets.length - 1];
    const lastItem = last?.[last.length - 1];
    if (last && lastItem && lastItem.canonicalCategory === item.canonicalCategory && windowsOverlap(lastItem.normalizedAgeWindow, item.normalizedAgeWindow)) {
      last.push(item);
    } else {
      buckets.push([item]);
    }
  }

  const fused: FusedEvent[] = [];
  for (const bucket of buckets) {
    if (bucket.length === 0) continue;

    // Deduplicate engine support — same engine cannot stack weights more than once at full value
    const enginesByMax = new Map<string, NormalizedEventSeed>();
    for (const it of bucket) {
      const seed = ctx.seedIndex.get(it.seedId);
      const engine = seed?.sourceEngine ?? 'unknown';
      const cur = enginesByMax.get(engine);
      if (!cur || it.normalizedConfidence > cur.normalizedConfidence) enginesByMax.set(engine, it);
    }
    const dedupedSupport = Array.from(enginesByMax.values());

    let merged = bucket[0].normalizedAgeWindow;
    for (let i = 1; i < bucket.length; i++) merged = mergeWindows(merged, bucket[i].normalizedAgeWindow);

    const polarity = dominantPolarity(bucket, ctx);

    // supportingWeight = sum of normalizedConfidence per UNIQUE engine.
    const supportingWeight = dedupedSupport.reduce((acc, it) => acc + it.normalizedConfidence, 0);
    // opposingWeight = items in bucket whose seed polarity contradicts dominant polarity
    let opposingWeight = 0;
    const oppositions = new Set<string>();
    for (const it of bucket) {
      const seed = ctx.seedIndex.get(it.seedId);
      const p = seed?.polarity ?? DEFAULT_POLARITY[it.canonicalCategory];
      if (polarity === 'positive' && p === 'negative') { opposingWeight += it.normalizedConfidence; oppositions.add(seed?.sourceEngine ?? 'unknown'); }
      else if (polarity === 'negative' && p === 'positive') { opposingWeight += it.normalizedConfidence; oppositions.add(seed?.sourceEngine ?? 'unknown'); }
    }

    const conflictScore = clamp01(opposingWeight / Math.max(0.0001, supportingWeight + opposingWeight));
    // probability uses Noisy-OR over deduped engine support (capped at 1)
    let probability = 0;
    for (const it of dedupedSupport) {
      probability = probability + (1 - probability) * clamp01(it.normalizedConfidence);
    }
    probability = clamp01(probability * (1 - 0.5 * conflictScore));

    // confidence = average normalized confidence weighted by engine count factor
    const avgConfidence = dedupedSupport.reduce((acc, it) => acc + it.normalizedConfidence, 0) / Math.max(1, dedupedSupport.length);
    const multiEngineBonus = Math.min(0.2, 0.05 * (dedupedSupport.length - 1));
    const confidence = clamp01(avgConfidence + multiEngineBonus);

    const sensitive: SensitiveFlag[] = Array.from(new Set(bucket.flatMap(b => b.sensitiveFlags)));
    const severityRank = Math.max(...bucket.map(b => severityRankNum(b.normalizedSeverity)));
    const severity = severityFromRank(severityRank);
    const description = pickRepresentativeDescription(bucket);
    const id = deterministicId('fused', bucket[0].canonicalCategory, merged.earliestAge, merged.latestAge, description);

    const supportEngines = stableSortByScore(
      dedupedSupport.map(d => ({ id: ctx.seedIndex.get(d.seedId)?.sourceEngine ?? 'unknown', conf: d.normalizedConfidence })),
      d => d.conf,
    ).map(d => d.id);

    const trace: string[] = [
      `bucketSize=${bucket.length} uniqueEngines=${dedupedSupport.length}`,
      `category=${bucket[0].canonicalCategory} merged=${merged.earliestAge}-${merged.latestAge}`,
      `supportingWeight=${supportingWeight.toFixed(3)} opposingWeight=${opposingWeight.toFixed(3)} conflictScore=${conflictScore.toFixed(3)}`,
      `probability(NoisyOR)=${probability.toFixed(3)} confidence=${confidence.toFixed(3)}`,
      `polarity=${polarity}`,
    ];

    const warnings: string[] = [];
    if (conflictScore > 0.4) warnings.push('engine support is conflicted; treat with caution');
    if (dedupedSupport.length === 1) warnings.push('single-engine event; cross-validation pending');

    const fusedEvent: FusedEvent = {
      id,
      canonicalCategory: bucket[0].canonicalCategory,
      title: deriveTitle(bucket[0].canonicalCategory, description),
      description,
      ageWindow: merged,
      probability,
      confidence,
      severity,
      polarity,
      engineSupports: supportEngines,
      engineOppositions: Array.from(oppositions),
      supportingWeight: Number(supportingWeight.toFixed(4)),
      opposingWeight: Number(opposingWeight.toFixed(4)),
      conflictScore: Number(conflictScore.toFixed(4)),
      coherenceScore: clamp01(1 - conflictScore),
      sensitiveFlags: sensitive,
      displayGuidance: sanitizeSensitiveDisplay(sensitive),
      explanationTrace: trace,
      warnings,
      seedIds: bucket.map(b => b.seedId),
    };

    fused.push(annotateFusedSensitive(fusedEvent));
  }

  return fused;
}

function severityRankNum(s: string): number {
  return ({ minor: 1, moderate: 2, major: 3, critical: 4, life_defining: 5 } as Record<string, number>)[s] ?? 2;
}
function severityFromRank(n: number): FusedEvent['severity'] {
  return (['minor', 'moderate', 'major', 'critical', 'life_defining'] as const)[Math.max(0, Math.min(4, n - 1))];
}
function deriveTitle(category: string, description: string): string {
  if (description.length <= 28) return description;
  return `${category} · ${description.slice(0, 26)}…`;
}
