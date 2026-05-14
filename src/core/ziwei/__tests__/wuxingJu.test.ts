import { describe, it, expect } from 'vitest';
import { calculateMingGongStem, calculateWuxingJu } from '../wuxingJu';

describe('wuxingJu', () => {
  it('calculates 命宫天干 via 五虎遁', () => {
    const r = calculateMingGongStem('甲', 0); // mingIndex 0 = 寅, 甲己 → 丙寅
    expect(r.stem).toBe('丙');
  });

  it('returns deterministic 五行局 with no fallback for known input', () => {
    const ju = calculateWuxingJu('丙', '寅');
    expect(ju.name).toBe('水二局');
    expect(ju.number).toBe(2);
    expect(ju.element).toBe('水');
    expect(ju.fallbackUsed).toBe(false);
    expect(ju.warnings).toHaveLength(0);
  });

  it('marks fallbackUsed and warns when table miss', () => {
    // @ts-expect-error force invalid stem
    const ju = calculateWuxingJu('X', '寅');
    expect(ju.fallbackUsed).toBe(true);
    expect(ju.warnings.length).toBeGreaterThan(0);
  });
});
