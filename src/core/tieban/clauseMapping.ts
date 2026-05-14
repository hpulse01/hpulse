/**
 * P4.3 — Clause lookup with explicit fallback semantics.
 *
 * The Tieban clause corpus may not contain every requested id. We refuse to
 * silently substitute — every match returns a structured `ClauseMatch` that
 * names the fallback reason and quantifies the distance.
 */

import type { ClauseMatch, FallbackReason } from './types';

/** Lookup function provided by caller (DB query, in-memory map, etc). */
export type ClauseLookup = (clauseNumber: number) => { content: unknown } | null;

const MIN_CLAUSE_ID = 1;
const MAX_CLAUSE_ID = 12000;

export function clampClauseId(id: number): { id: number; clamped: boolean } {
  if (id < MIN_CLAUSE_ID) return { id: MIN_CLAUSE_ID, clamped: true };
  if (id > MAX_CLAUSE_ID) return { id: MAX_CLAUSE_ID, clamped: true };
  return { id: Math.floor(id), clamped: false };
}

export interface FindClauseOptions {
  /** How many ids to scan around the request before giving up. Default 25. */
  searchRadius?: number;
}

/**
 * Try the requested id first. If absent, expand outward by 1, 2, 3 ... until
 * `searchRadius`. If still nothing, return NO_MATCH.
 */
export function findClause(
  requested: number,
  lookup: ClauseLookup,
  options: FindClauseOptions = {},
): ClauseMatch {
  const radius = options.searchRadius ?? 25;
  const { id: clampedRequested, clamped } = clampClauseId(requested);

  const exact = lookup(clampedRequested);
  if (exact) {
    const reason: FallbackReason = clamped ? 'PALACE_BOUNDARY_CLAMP' : 'EXACT';
    return {
      requestedClauseNumber: requested,
      matchedClauseNumber: clampedRequested,
      exactMatch: !clamped,
      fallbackDistance: clamped ? Math.abs(requested - clampedRequested) : 0,
      fallbackReason: reason,
      payload: exact.content,
    };
  }

  for (let d = 1; d <= radius; d++) {
    for (const sign of [-1, 1] as const) {
      const candidate = clampedRequested + sign * d;
      if (candidate < MIN_CLAUSE_ID || candidate > MAX_CLAUSE_ID) continue;
      const found = lookup(candidate);
      if (found) {
        return {
          requestedClauseNumber: requested,
          matchedClauseNumber: candidate,
          exactMatch: false,
          fallbackDistance: Math.abs(candidate - requested),
          fallbackReason: 'NEAREST_NEIGHBOR',
          payload: found.content,
        };
      }
    }
  }

  return {
    requestedClauseNumber: requested,
    matchedClauseNumber: null,
    exactMatch: false,
    fallbackDistance: null,
    fallbackReason: 'NO_MATCH',
  };
}
