import { describe, it, expect } from 'vitest';
import {
  calculateQimenChart,
  qimenChartToEngineOutput,
  placeSanQiLiuYi,
  dunDirectionForTerm,
  JU_TABLE,
  SAN_QI_LIU_YI_ORDER,
} from '../index';

describe('P4.7 Qimen — 阴阳遁判定', () => {
  it('冬至为阳遁', () => expect(dunDirectionForTerm('冬至')).toBe('yang'));
  it('夏至为阴遁', () => expect(dunDirectionForTerm('夏至')).toBe('yin'));
  it('立春为阳遁', () => expect(dunDirectionForTerm('立春')).toBe('yang'));
  it('立秋为阴遁', () => expect(dunDirectionForTerm('立秋')).toBe('yin'));
});

describe('P4.7 Qimen — 局数表完整', () => {
  it('24 节气均有 [上中下] 三元局数', () => {
    expect(Object.keys(JU_TABLE).length).toBe(24);
    for (const [, row] of Object.entries(JU_TABLE)) {
      expect(row.length).toBe(3);
      for (const v of row) {
        expect(v).toBeGreaterThanOrEqual(1);
        expect(v).toBeLessThanOrEqual(9);
      }
    }
  });
});

describe('P4.7 Qimen — 三奇六仪 placement', () => {
  it('阳遁 1 局：戊→1宫，顺布', () => {
    const layout = placeSanQiLiuYi(1, 'yang', []);
    expect(layout[1]).toBe('戊');
    expect(layout[2]).toBe('己');
    expect(layout[3]).toBe('庚');
    expect(layout[9]).toBe('乙');
  });
  it('阴遁 9 局：戊→9宫，逆布', () => {
    const layout = placeSanQiLiuYi(9, 'yin', []);
    expect(layout[9]).toBe('戊');
    expect(layout[8]).toBe('己');
    expect(layout[1]).toBe('乙');
  });
  it('SAN_QI_LIU_YI_ORDER fixed', () => {
    expect(SAN_QI_LIU_YI_ORDER).toEqual(['戊','己','庚','辛','壬','癸','丁','丙','乙']);
  });
});

describe('P4.7 Qimen — 整盘 deterministic + structure', () => {
  const input = {
    queryTimeUtc: '2025-05-14T03:00:00Z',
    timezoneIana: 'Asia/Shanghai',
    geoLatitude: 39.9042,
    geoLongitude: 116.4074,
    yongShenCategory: '财运' as const,
  };

  it('same input → same chart', () => {
    const a = calculateQimenChart(input);
    const b = calculateQimenChart(input);
    expect(a.juNumber).toBe(b.juNumber);
    expect(a.dunDirection).toBe(b.dunDirection);
    expect(a.zhiFuStar).toBe(b.zhiFuStar);
    expect(a.zhiShiGate).toBe(b.zhiShiGate);
    expect(a.hourGanzhi).toBe(b.hourGanzhi);
    expect(a.palaces.map((p) => p.star).join(',')).toBe(b.palaces.map((p) => p.star).join(','));
  });

  it('九宫结构完整 (9 cells, all required fields)', () => {
    const c = calculateQimenChart(input);
    expect(c.palaces.length).toBe(9);
    for (const cell of c.palaces) {
      expect(cell.palace).toBeGreaterThanOrEqual(1);
      expect(cell.palace).toBeLessThanOrEqual(9);
      expect(cell.trigram).toBeTruthy();
      expect(cell.direction).toBeTruthy();
      expect(cell.element).toBeTruthy();
    }
    // 中宫 5 无门、无神
    const center = c.palaces[4];
    expect(center.palace).toBe(5);
    expect(center.gate).toBeNull();
    expect(center.deity).toBeNull();
  });

  it('八门覆盖 8 个非中宫 (each gate appears exactly once)', () => {
    const c = calculateQimenChart(input);
    const gates = c.palaces.map((p) => p.gate).filter((g): g is NonNullable<typeof g> => !!g);
    expect(gates.length).toBe(8);
    expect(new Set(gates).size).toBe(8);
  });

  it('八神覆盖 8 个非中宫 (each deity appears exactly once)', () => {
    const c = calculateQimenChart(input);
    const deities = c.palaces.map((p) => p.deity).filter((d): d is NonNullable<typeof d> => !!d);
    expect(deities.length).toBe(8);
    expect(new Set(deities).size).toBe(8);
  });

  it('值符星 / 值使门存在', () => {
    const c = calculateQimenChart(input);
    expect(c.zhiFuStar).toBeTruthy();
    expect(c.zhiShiGate).toBeTruthy();
    expect(c.hourXunShou).toMatch(/^甲/);
  });

  it('用神 trace 存在', () => {
    const c = calculateQimenChart(input);
    expect(c.yongShen.category).toBe('财运');
    expect(c.yongShen.primarySymbol).toBe('生门');
    expect(c.explanationTrace.some((s) => s.rule === 'qimen.yongShen')).toBe(true);
  });
});

describe('P4.7 Qimen — EngineOutput adapter', () => {
  it('produces complete EngineOutput with fateVector', () => {
    const c = calculateQimenChart({
      queryTimeUtc: '2025-05-14T03:00:00Z',
      timezoneIana: 'Asia/Shanghai',
      yongShenCategory: '事业',
    });
    const out = qimenChartToEngineOutput(c);
    expect(out.engineName).toBe('qimen');
    expect(out.fateVector).toBeDefined();
    expect(out.fateVector.life).toBeGreaterThanOrEqual(0);
    expect(out.fateVector.life).toBeLessThanOrEqual(100);
    expect(out.explanationTrace.length).toBeGreaterThan(5);
    expect(out.validationFlags.passed).toContain('deterministic_no_random');
    expect(out.eventCandidates.length).toBeGreaterThan(9);
    expect(out.normalizedOutput.dun).toMatch(/yang|yin/);
  });
});
