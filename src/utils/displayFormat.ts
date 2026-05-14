/**
 * Display formatting helpers — P5-FIX.
 *
 * Different engines report confidence/completeness on different scales:
 *   - P4 core engines: 0..100
 *   - Legacy engines:  0..1
 *
 * normalizePercent() unifies both into 0..100. formatPercent() renders.
 */

export function normalizePercent(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  if (value < 0) return 0;
  if (value <= 1) return value * 100;
  if (value > 100) return 100;
  return value;
}

export function formatPercent(value: number | null | undefined, digits = 0): string {
  const n = normalizePercent(value);
  if (n == null) return '—';
  return `${n.toFixed(digits)}%`;
}

/** For completeness scores already in 0..100 — kept as-is, just clamped. */
export function formatScore(value: number | null | undefined, digits = 0): string {
  if (value == null || !Number.isFinite(value)) return '—';
  const n = Math.max(0, Math.min(100, value));
  return n.toFixed(digits);
}

/** Coerce unknown normalizedOutput field to a printable string. */
export function asText(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (Array.isArray(v)) return v.length === 0 ? '' : `[${v.length}]`;
  return '';
}
