import { describe, it, expect } from 'vitest';
import { runTaiyi, type TaiyiInput } from './taiyiAlgorithm';

const BASE_INPUT: TaiyiInput = {
  queryTimeUtc: '2024-06-15T10:30:00Z',
  timezoneOffsetMinutes: 480,
};

describe('taiyiAlgorithm', () => {
  it('相同 queryTimeUtc → 相同局式', () => {
    const r1 = runTaiyi(BASE_INPUT);
    const r2 = runTaiyi(BASE_INPUT);
    expect(r1.chart.juNumber).toBe(r2.chart.juNumber);
    expect(r1.chart.taiyiGong).toBe(r2.chart.taiyiGong);
    expect(r1.chart.zhuSuanGong).toBe(r2.chart.zhuSuanGong);
    expect(r1.chart.keSuanGong).toBe(r2.chart.keSuanGong);
    expect(r1.auspiciousness).toBe(r2.auspiciousness);
    expect(r1.trendLevel).toBe(r2.trendLevel);
  });

  it('不同 queryTimeUtc → 局式变化', () => {
    const input2: TaiyiInput = { ...BASE_INPUT, queryTimeUtc: '2024-12-25T03:00:00Z' };
    const r1 = runTaiyi(BASE_INPUT);
    const r2 = runTaiyi(input2);
    // At least juNumber or taiyiGong should differ
    const same = r1.chart.juNumber === r2.chart.juNumber && r1.chart.taiyiGong === r2.chart.taiyiGong;
    expect(same).toBe(false);
  });

  it('宫位非空且有9宫', () => {
    const r = runTaiyi(BASE_INPUT);
    expect(r.chart.palaces).toHaveLength(9);
    r.chart.palaces.forEach(p => {
      expect(p.name).toBeTruthy();
      expect(p.direction).toBeTruthy();
      expect(p.wuxing).toBeTruthy();
    });
  });

  it('太乙落宫有且仅有一个', () => {
    const r = runTaiyi(BASE_INPUT);
    const taiyiPalaces = r.chart.palaces.filter(p => p.isTaiyi);
    expect(taiyiPalaces).toHaveLength(1);
  });

  it('局数在 1-72 范围', () => {
    const r = runTaiyi(BASE_INPUT);
    expect(r.chart.juNumber).toBeGreaterThanOrEqual(1);
    expect(r.chart.juNumber).toBeLessThanOrEqual(72);
  });

  it('太乙不入中宫(5)', () => {
    // Test multiple inputs
    const inputs: TaiyiInput[] = [
      BASE_INPUT,
      { queryTimeUtc: '2024-01-01T00:00:00Z', timezoneOffsetMinutes: 480 },
      { queryTimeUtc: '2025-07-20T15:00:00Z', timezoneOffsetMinutes: 480 },
    ];
    for (const inp of inputs) {
      const r = runTaiyi(inp);
      expect(r.chart.taiyiGong).not.toBe(5);
    }
  });

  it('格局非空', () => {
    const r = runTaiyi(BASE_INPUT);
    expect(r.patterns.length).toBeGreaterThan(0);
    r.patterns.forEach(p => {
      expect(p.name).toBeTruthy();
      expect(['吉格', '凶格', '平格']).toContain(p.type);
    });
  });

  it('吉凶等级为有效值', () => {
    const r = runTaiyi(BASE_INPUT);
    expect(['大吉', '吉', '中平', '凶', '大凶']).toContain(r.auspiciousness);
  });

  it('趋势等级为有效值', () => {
    const r = runTaiyi(BASE_INPUT);
    expect(['大旺', '旺', '平', '衰', '大衰']).toContain(r.trendLevel);
  });

  it('应期摘要非空', () => {
    const r = runTaiyi(BASE_INPUT);
    expect(r.yingQi.length).toBeGreaterThan(5);
  });

  it('总结非空', () => {
    const r = runTaiyi(BASE_INPUT);
    expect(r.summary.length).toBeGreaterThan(10);
  });

  it('meta 包含不确定性说明', () => {
    const r = runTaiyi(BASE_INPUT);
    expect(r.meta.uncertaintyNotes.length).toBeGreaterThan(0);
    expect(r.meta.warnings.length).toBeGreaterThan(0);
    expect(r.meta.ruleSchool).toContain('太乙');
  });

  it('年干年支非空', () => {
    const r = runTaiyi(BASE_INPUT);
    expect(r.chart.nianGan).toBeTruthy();
    expect(r.chart.nianZhi).toBeTruthy();
  });
});
