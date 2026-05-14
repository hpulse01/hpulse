import { describe, it, expect } from 'vitest';
import { calculateMingShenGong, buildPalaceLayout } from '../palaceLayout';
import { PALACE_BRANCH_ORDER, PALACE_ORDER } from '../constants';

describe('palaceLayout', () => {
  it('locates 命宫 deterministically for given lunar month + hour', () => {
    const r = calculateMingShenGong(6, 4); // 6月 + 辰时
    expect(r.mingIndex).toBeGreaterThanOrEqual(0);
    expect(r.mingIndex).toBeLessThan(12);
    expect(PALACE_BRANCH_ORDER[r.mingIndex]).toBe(r.mingGongBranch);
    // Same input → same output
    const r2 = calculateMingShenGong(6, 4);
    expect(r2).toEqual(r);
  });

  it('builds 12 palaces in canonical order with stable sanFang/duiGong', () => {
    const ms = calculateMingShenGong(3, 2);
    const { palaces } = buildPalaceLayout(ms.mingIndex, ms.shenIndex);
    expect(palaces).toHaveLength(12);
    expect(palaces[0].name).toBe('命宫');
    expect(palaces[0].isMing).toBe(true);
    // 命宫的对宫 = 迁移
    expect(palaces[0].duiGong).toBe('迁移');
    expect(palaces[0].sanFang).toEqual(['财帛', '官禄']);
    // All 12 names appear exactly once
    expect(new Set(palaces.map(p => p.name)).size).toBe(12);
    expect(palaces.map(p => p.name)).toEqual([...PALACE_ORDER]);
  });
});
