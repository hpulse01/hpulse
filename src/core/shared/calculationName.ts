/**
 * Normalize the optional spelling used by name-based cultural rule systems.
 *
 * This value is deliberately separate from the account display name: callers
 * must supply it explicitly because spelling and script change the result.
 */
export const CALCULATION_NAME_MAX_LENGTH = 120;

export function normalizeCalculationName(value: string | null | undefined): string | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value
    .normalize('NFKC')
    .trim()
    .replace(/\s+/gu, ' ');
  if (!normalized) return undefined;
  return Array.from(normalized).slice(0, CALCULATION_NAME_MAX_LENGTH).join('');
}
