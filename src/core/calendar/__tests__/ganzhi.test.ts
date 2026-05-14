import { describe, it, expect } from 'vitest';
import {
  jiaziIndex,
  parseGanzhi,
  sixtyJiazi,
  STEMS,
  BRANCHES,
  HIDDEN_STEMS,
  voidBranches,
} from '../ganzhi';
import { nayinOf } from '../nayin';
import { tenGodOf } from '../tenGods';

describe('ganzhi tables', () => {
  it('has 10 stems and 12 branches', () => {
    expect(STEMS).toHaveLength(10);
    expect(BRANCHES).toHaveLength(12);
  });

  it('60-jiazi cycle starts at 甲子 and ends at 癸亥', () => {
    const cycle = sixtyJiazi();
    expect(cycle).toHaveLength(60);
    expect(cycle[0].ganzhi).toBe('甲子');
    expect(cycle[59].ganzhi).toBe('癸亥');
  });

  it('jiaziIndex returns canonical indices', () => {
    expect(jiaziIndex('甲子')).toBe(0);
    expect(jiaziIndex('乙丑')).toBe(1);
    expect(jiaziIndex('癸亥')).toBe(59);
  });

  it('hidden stems table has every branch keyed', () => {
    for (const b of BRANCHES) {
      expect(HIDDEN_STEMS[b].length).toBeGreaterThan(0);
    }
  });

  it('parseGanzhi rejects malformed input', () => {
    expect(() => parseGanzhi('XX')).toThrow();
  });

  it('voidBranches returns the two branches absent from a 旬', () => {
    // 甲子旬 (idx 0..9) → branches 子..酉; void = 戌, 亥
    expect(voidBranches('甲子')).toEqual(['戌', '亥']);
    // 甲戌旬 (idx 10..19) → branches 戌..未; void = 申, 酉
    expect(voidBranches('甲戌')).toEqual(['申', '酉']);
  });
});

describe('nayin', () => {
  it('甲子 / 乙丑 share 海中金', () => {
    expect(nayinOf('甲子')).toBe('海中金');
    expect(nayinOf('乙丑')).toBe('海中金');
  });

  it('癸亥 → 大海水', () => {
    expect(nayinOf('癸亥')).toBe('大海水');
  });
});

describe('ten gods', () => {
  // Day master 甲 (yang wood):
  //   甲(同阳同) → 比肩
  //   乙(同阴异) → 劫财
  //   丙(火, DM生, 同阳) → 食神
  //   丁(火, DM生, 异) → 伤官
  //   戊(土, DM克, 同) → 偏财
  //   己(土, DM克, 异) → 正财
  //   庚(金, 克DM, 同) → 七杀
  //   辛(金, 克DM, 异) → 正官
  //   壬(水, 生DM, 同) → 偏印
  //   癸(水, 生DM, 异) → 正印
  it('produces canonical 甲 day master mapping', () => {
    expect(tenGodOf('甲', '甲')).toBe('比肩');
    expect(tenGodOf('甲', '乙')).toBe('劫财');
    expect(tenGodOf('甲', '丙')).toBe('食神');
    expect(tenGodOf('甲', '丁')).toBe('伤官');
    expect(tenGodOf('甲', '戊')).toBe('偏财');
    expect(tenGodOf('甲', '己')).toBe('正财');
    expect(tenGodOf('甲', '庚')).toBe('七杀');
    expect(tenGodOf('甲', '辛')).toBe('正官');
    expect(tenGodOf('甲', '壬')).toBe('偏印');
    expect(tenGodOf('甲', '癸')).toBe('正印');
  });
});
