/**
 * P-FIX — Display scale helpers.
 *
 * Re-exports the canonical formatters from displayFormat so older import
 * paths keep working. Both 0..1 and 0..100 inputs collapse to a single
 * 0..100 percentage string.
 */
export { formatPercent, formatScore as normalizeScore100, normalizePercent } from './displayFormat';
