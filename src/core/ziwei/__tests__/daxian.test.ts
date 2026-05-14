import { describe, it, expect } from 'vitest';
import { calculateDaxian } from '../daxian';
import type { ZiweiPalace } from '../types';

function fakePalaces(): ZiweiPalace[] {
  return Array.from({ length: 12 }, (_, i) => ({
    name: '命宫', branch: '寅', index: i,
    isMing: i === 0, isShen: false,
    stars: [], majorStars: [], minorStars: [], auxiliaryStars: [], shaStars: [],
    sanFang: [], duiGong: '迁移',
    strengthScore: 50, evaluation: '', interpretationKeys: [],
  } as unknown as ZiweiPalace));
}

describe('daxian', () => {
  it('阳男顺行, 阴男逆行', () => {
    const p = fakePalaces();
    const yangMale = calculateDaxian({ palaces: p, mingIndex: 0, wuxingJuNumber: 2, gender: 'male', yearGan: '甲' });
    expect(yangMale.direction).toBe('clockwise');
    const yinMale = calculateDaxian({ palaces: p, mingIndex: 0, wuxingJuNumber: 2, gender: 'male', yearGan: '乙' });
    expect(yinMale.direction).toBe('counterclockwise');
  });

  it('startAge equals 五行局数 and yields 12 steps', () => {
    const p = fakePalaces();
    const r = calculateDaxian({ palaces: p, mingIndex: 0, wuxingJuNumber: 5, gender: 'female', yearGan: '甲' });
    expect(r.startAge).toBe(5);
    expect(r.steps).toHaveLength(12);
    expect(r.steps[0].startAge).toBe(5);
    expect(r.steps[1].startAge).toBe(15);
  });
});
