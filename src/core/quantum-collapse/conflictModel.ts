/**
 * Quantum Collapse — Conflict Model
 *
 * Detect conflicts among fused events; surface them, never silently drop.
 */

import type { FusedEvent } from './types';

export type ConflictKind =
  | 'time_overlap_opposite_polarity'
  | 'category_conflict'
  | 'health_death_conflict'
  | 'marriage_relationship_conflict'
  | 'wealth_trend_conflict'
  | 'engine_grade_disparity'
  | 'self_engine_contradiction';

export interface EventConflict {
  kind: ConflictKind;
  eventA: string;
  eventB: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  resolution: 'confidence_priority' | 'source_grade_priority' | 'multi_engine_support' | 'conservative_sensitive_handling' | 'keep_both_with_uncertainty';
}

function ageOverlap(a: FusedEvent, b: FusedEvent): boolean {
  return !(a.ageWindow.latestAge < b.ageWindow.earliestAge || b.ageWindow.latestAge < a.ageWindow.earliestAge);
}

function severity(a: FusedEvent, b: FusedEvent): 'low' | 'medium' | 'high' {
  if (a.sensitiveFlags.length > 0 || b.sensitiveFlags.length > 0) return 'high';
  if (a.probability > 0.5 && b.probability > 0.5) return 'high';
  if (a.probability > 0.3 || b.probability > 0.3) return 'medium';
  return 'low';
}

export function detectEventConflicts(events: FusedEvent[]): EventConflict[] {
  const conflicts: EventConflict[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const a = events[i]; const b = events[j];
      const pairKey = [a.id, b.id].sort().join('|');
      if (seen.has(pairKey)) continue;
      const overlap = ageOverlap(a, b);
      const opposite = (a.polarity === 'positive' && b.polarity === 'negative') ||
        (a.polarity === 'negative' && b.polarity === 'positive');

      if (overlap && a.canonicalCategory === b.canonicalCategory && opposite) {
        seen.add(pairKey);
        conflicts.push({
          kind: 'time_overlap_opposite_polarity',
          eventA: a.id, eventB: b.id,
          description: `${a.canonicalCategory}: opposite-polarity events overlap age ${Math.max(a.ageWindow.earliestAge, b.ageWindow.earliestAge)}-${Math.min(a.ageWindow.latestAge, b.ageWindow.latestAge)}`,
          severity: severity(a, b),
          resolution: 'multi_engine_support',
        });
        continue;
      }

      if ((a.canonicalCategory === 'death' && b.canonicalCategory === 'health') ||
          (b.canonicalCategory === 'death' && a.canonicalCategory === 'health')) {
        if (overlap) {
          seen.add(pairKey);
          conflicts.push({
            kind: 'health_death_conflict',
            eventA: a.id, eventB: b.id,
            description: 'health-vs-death overlap — conservative handling',
            severity: 'high',
            resolution: 'conservative_sensitive_handling',
          });
        }
      }
    }
  }
  return conflicts;
}

export function summarizeConflicts(conflicts: EventConflict[]): string[] {
  const out: string[] = [];
  const byKind = new Map<ConflictKind, number>();
  for (const c of conflicts) byKind.set(c.kind, (byKind.get(c.kind) ?? 0) + 1);
  for (const [k, n] of byKind) out.push(`${k}: ${n}`);
  return out;
}

export function resolveEventConflict(c: EventConflict, events: FusedEvent[]): { winnerId: string | null; note: string } {
  const a = events.find(e => e.id === c.eventA);
  const b = events.find(e => e.id === c.eventB);
  if (!a || !b) return { winnerId: null, note: 'event(s) not found' };
  if (c.resolution === 'multi_engine_support') {
    if (a.engineSupports.length === b.engineSupports.length) {
      return { winnerId: null, note: 'tied — keep both with uncertainty' };
    }
    return { winnerId: a.engineSupports.length > b.engineSupports.length ? a.id : b.id, note: 'multi-engine winner' };
  }
  if (c.resolution === 'confidence_priority') {
    return { winnerId: a.confidence >= b.confidence ? a.id : b.id, note: 'confidence priority' };
  }
  if (c.resolution === 'conservative_sensitive_handling') {
    return { winnerId: null, note: 'sensitive — keep both, defer to user-visible cautious display' };
  }
  return { winnerId: null, note: 'keep both with uncertainty' };
}
