/**
 * implementationStatus.ts — canonical enum + helpers.
 * Centralises the four official statuses every engine must declare.
 */

export type ImplementationStatus =
  | 'complete'
  | 'partial'
  | 'needs_source_validation'
  | 'placeholder_removed';

export const IMPLEMENTATION_STATUSES: ImplementationStatus[] = [
  'complete', 'partial', 'needs_source_validation', 'placeholder_removed',
];

/** Maximum confidence allowed for each status (hard ceiling). */
export const STATUS_MAX_CONFIDENCE: Record<ImplementationStatus, number> = {
  complete: 1.0,
  partial: 0.65,
  needs_source_validation: 0.45,
  placeholder_removed: 0.0,
};

export function isValidStatus(s: unknown): s is ImplementationStatus {
  return typeof s === 'string' && (IMPLEMENTATION_STATUSES as string[]).includes(s);
}

export function normalizeStatus(s: unknown): ImplementationStatus {
  if (isValidStatus(s)) return s;
  // legacy / engine-specific aliases
  if (s === 'partial_rules' || s === 'partial_implementation') return 'partial';
  if (s === 'unknown' || s === undefined || s === null) return 'needs_source_validation';
  return 'needs_source_validation';
}
