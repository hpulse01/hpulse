import { describe, it, expect } from 'vitest';
import { calculateLiunian, resolveTargetYear } from '../liunian';
import type { ZiweiPalace } from '../types';

const palaces: ZiweiPalace[] = [];

describe('liunian', () => {
  it('uses targetYear deterministically and ignores system clock', () => {
    const a = calculateLiunian({ targetYear: 2030, birthYear: 1990, palaces, rangeBefore: 0, rangeAfter: 2 });
    const b = calculateLiunian({ targetYear: 2030, birthYear: 1990, palaces, rangeBefore: 0, rangeAfter: 2 });
    expect(a.steps).toEqual(b.steps);
    expect(a.steps.map(s => s.year)).toEqual([2030, 2031, 2032]);
  });

  it('falls back to queryTimeUtc year when targetYear missing', () => {
    const r = resolveTargetYear({ queryTimeUtc: '2025-06-15T00:00:00Z' });
    expect(r.year).toBe(2025);
    expect(r.source).toBe('queryTimeUtc');
  });

  it('returns no steps and warning when both missing', () => {
    const r = resolveTargetYear({});
    expect(r.year).toBeNull();
    expect(r.warning).toBeTruthy();
  });
});
