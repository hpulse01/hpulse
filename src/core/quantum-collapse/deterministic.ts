/**
 * Quantum Collapse — Deterministic helpers
 *
 * No Math.random, no Date.now affecting outputs. Stable string hashing.
 */

/** FNV-1a 32-bit deterministic hash. */
export function fnv1a(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** Deterministic id: prefix + short hex hash. */
export function deterministicId(prefix: string, ...parts: Array<string | number | undefined>): string {
  return `${prefix}-${fnv1a(parts.join('|')).toString(16).padStart(8, '0')}`;
}

/** Stable comparator: by primary number desc, tiebreak deterministic id asc. */
export function stableSortByScore<T extends { id: string }>(items: T[], score: (t: T) => number): T[] {
  return [...items].sort((a, b) => {
    const sb = score(b); const sa = score(a);
    if (sb !== sa) return sb - sa;
    return a.id.localeCompare(b.id);
  });
}

export function clamp01(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(1, v));
}

export function clampPercent(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(100, v));
}
