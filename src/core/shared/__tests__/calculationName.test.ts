import { describe, expect, it } from 'vitest';
import {
  CALCULATION_NAME_MAX_LENGTH,
  normalizeCalculationName,
} from '../calculationName';

describe('normalizeCalculationName', () => {
  it('uses NFKC and stable whitespace normalization', () => {
    expect(normalizeCalculationName('  Ｊｏｈｎ\t Smith  ')).toBe('John Smith');
  });

  it('returns undefined for omitted or blank input', () => {
    expect(normalizeCalculationName(undefined)).toBeUndefined();
    expect(normalizeCalculationName(' \n ')).toBeUndefined();
  });

  it('caps by Unicode code point rather than UTF-16 unit', () => {
    const value = `${'א'.repeat(CALCULATION_NAME_MAX_LENGTH)}extra`;
    expect(Array.from(normalizeCalculationName(value) ?? '')).toHaveLength(CALCULATION_NAME_MAX_LENGTH);
  });
});
