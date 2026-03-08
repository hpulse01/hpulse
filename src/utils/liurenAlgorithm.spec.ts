import { describe, it, expect } from 'vitest';
import { runLiuRen, type LiuRenInput } from './liurenAlgorithm';

const BASE_INPUT: LiuRenInput = {
  queryTimeUtc: '2024-06-15T10:30:00Z',
  birthYear: 1990,
  birthMonth: 5,
  birthDay: 15,
  birthHour: 8,
  timezoneOffsetMinutes: 480,
};

describe('liurenAlgorithm', () => {
  it('相同 queryTimeUtc → 相同课体', () => {
    const r1 = runLiuRen(BASE_INPUT);
    const r2 = runLiuRen(BASE_INPUT);
    expect(r1.siKe).toEqual(r2.siKe);
    expect(r1.sanChuan).toEqual(r2.sanChuan);
    expect(r1.tianJiang).toEqual(r2.tianJiang);
    expect(r1.keType).toBe(r2.keType);
    expect(r1.auspiciousness).toBe(r2.auspiciousness);
  });

  it('不同 queryTimeUtc → 盘面变化', () => {
    const input2: LiuRenInput = { ...BASE_INPUT, queryTimeUtc: '2024-12-25T03:00:00Z' };
    const r1 = runLiuRen(BASE_INPUT);
    const r2 = runLiuRen(input2);
    // At least some part of the chart should differ
    const same = r1.chart.tianPan.join('') === r2.chart.tianPan.join('') &&
      r1.chart.riGan === r2.chart.riGan && r1.chart.shiBranch === r2.chart.shiBranch;
    expect(same).toBe(false);
  });

  it('四课非空且有4课', () => {
    const r = runLiuRen(BASE_INPUT);
    expect(r.siKe.courses).toHaveLength(4);
    r.siKe.courses.forEach(c => {
      expect(c.upper).toBeTruthy();
      expect(c.lower).toBeTruthy();
      expect(c.label).toBeTruthy();
    });
  });

  it('三传非空', () => {
    const r = runLiuRen(BASE_INPUT);
    expect(r.sanChuan.chu).toBeTruthy();
    expect(r.sanChuan.zhong).toBeTruthy();
    expect(r.sanChuan.mo).toBeTruthy();
    expect(r.sanChuan.method).toBeTruthy();
  });

  it('天将排布非空且有12将', () => {
    const r = runLiuRen(BASE_INPUT);
    expect(r.tianJiang.generals).toHaveLength(12);
    r.tianJiang.generals.forEach(g => {
      expect(g.name).toBeTruthy();
      expect(g.branch).toBeTruthy();
    });
    expect(r.tianJiang.guiRen).toBeTruthy();
    expect(['昼贵', '夜贵']).toContain(r.tianJiang.guiType);
  });

  it('课体名称非空', () => {
    const r = runLiuRen(BASE_INPUT);
    expect(r.keType).toBeTruthy();
  });

  it('吉凶等级为有效值', () => {
    const r = runLiuRen(BASE_INPUT);
    expect(['大吉', '吉', '中平', '凶', '大凶']).toContain(r.auspiciousness);
  });

  it('占断摘要非空', () => {
    const r = runLiuRen(BASE_INPUT);
    expect(r.summary.length).toBeGreaterThan(10);
  });

  it('天盘有12个地支', () => {
    const r = runLiuRen(BASE_INPUT);
    expect(r.chart.tianPan).toHaveLength(12);
    expect(r.chart.diPan).toHaveLength(12);
  });

  it('日干日支非空', () => {
    const r = runLiuRen(BASE_INPUT);
    expect(r.chart.riGan).toBeTruthy();
    expect(r.chart.riBranch).toBeTruthy();
  });

  it('meta 包含不确定性说明', () => {
    const r = runLiuRen(BASE_INPUT);
    expect(r.meta.uncertaintyNotes.length).toBeGreaterThan(0);
    expect(r.meta.warnings.length).toBeGreaterThan(0);
  });
});
