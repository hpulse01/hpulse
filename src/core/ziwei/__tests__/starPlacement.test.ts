import { describe, it, expect } from 'vitest';
import { calculateZiweiPosition, calculateTianfuPosition, placeMajorStars } from '../starPlacement';

describe('starPlacement', () => {
  it('紫微 + 天府 positions are deterministic and complementary', () => {
    const z = calculateZiweiPosition(15, 2); // lunarDay=15, 水二局
    const t = calculateTianfuPosition(z);
    expect((z + t) % 12).toBe(0);
    expect(calculateZiweiPosition(15, 2)).toBe(z);
  });

  it('places all 14 major stars across 12 palaces', () => {
    const z = calculateZiweiPosition(10, 5); // 土五局
    const t = calculateTianfuPosition(z);
    const placed = placeMajorStars(z, t, {});
    const names = new Set<string>();
    for (const stars of Object.values(placed.byBranchIndex)) {
      for (const s of stars) names.add(s.name);
    }
    expect(names.size).toBe(14);
    for (const n of [
      '紫微', '天机', '太阳', '武曲', '天同', '廉贞',
      '天府', '太阴', '贪狼', '巨门', '天相', '天梁', '七杀', '破军',
    ]) {
      expect(names.has(n)).toBe(true);
    }
  });
});
