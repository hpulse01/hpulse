import { describe, it, expect } from 'vitest';
import { calculateSihua } from '../fourTransformations';

describe('fourTransformations', () => {
  it('produces 4 transforms keyed off year stem', () => {
    const r = calculateSihua('甲');
    expect(r.sihua).toHaveLength(4);
    const map = Object.fromEntries(r.sihua.map(s => [s.transform, s.star]));
    expect(map['禄']).toBe('廉贞');
    expect(map['权']).toBe('破军');
    expect(map['科']).toBe('武曲');
    expect(map['忌']).toBe('太阳');
  });

  it('warns and returns empty list for invalid stem', () => {
    // @ts-expect-error
    const r = calculateSihua('X');
    expect(r.sihua).toHaveLength(0);
    expect(r.warnings.length).toBeGreaterThan(0);
  });
});
