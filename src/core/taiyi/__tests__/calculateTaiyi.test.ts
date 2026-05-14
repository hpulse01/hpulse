import { describe, it, expect } from 'vitest';
import { calculateTaiyiChart, taiyiChartToEngineOutput } from '../index';

const input = {
  queryTimeUtc: '2025-05-14T03:00:00Z',
  timezoneIana: 'Asia/Shanghai',
};

describe('P4.8 Taiyi — basic chart', () => {
  it('deterministic: same input → same chart', () => {
    const a = calculateTaiyiChart(input);
    const b = calculateTaiyiChart(input);
    expect(a.juNumber).toBe(b.juNumber);
    expect(a.taiyiPalace).toBe(b.taiyiPalace);
    expect(a.wenChangPalace).toBe(b.wenChangPalace);
    expect(a.shiJiPalace).toBe(b.shiJiPalace);
    expect(a.zhuKeJudgment).toBe(b.zhuKeJudgment);
  });
  it('partial implementation + low sourceGrade + reduced confidence', () => {
    const c = calculateTaiyiChart(input);
    expect(c.implementationStatus).toBe('partial');
    expect(['C','D']).toContain(c.sourceGrade);
    expect(c.confidence).toBeLessThanOrEqual(60);
  });
  it('palace numbers 1..9 (excluding 5 via 寄宫)', () => {
    const c = calculateTaiyiChart(input);
    for (const p of [c.taiyiPalace, c.wenChangPalace, c.shiJiPalace]) {
      expect(p).toBeGreaterThanOrEqual(1);
      expect(p).toBeLessThanOrEqual(9);
      expect(p).not.toBe(5);
    }
  });
  it('ji_nian + yuan + ju computed', () => {
    const c = calculateTaiyiChart(input);
    expect(c.jiNian).toBeGreaterThan(0);
    expect(c.yuanIndex).toBeGreaterThanOrEqual(1);
    expect(c.yuanIndex).toBeLessThanOrEqual(360);
    expect(c.juNumber).toBeGreaterThanOrEqual(1);
    expect(c.juNumber).toBeLessThanOrEqual(72);
  });
  it('explanationTrace populated', () => {
    const c = calculateTaiyiChart(input);
    expect(c.explanationTrace.some((s) => s.rule === 'taiyi.taiyiPalace')).toBe(true);
    expect(c.explanationTrace.some((s) => s.rule === 'taiyi.wenChang')).toBe(true);
    expect(c.explanationTrace.some((s) => s.rule === 'taiyi.shiJi')).toBe(true);
    expect(c.explanationTrace.some((s) => s.rule === 'taiyi.zhuKe')).toBe(true);
  });
  it('EngineOutput complete', () => {
    const out = taiyiChartToEngineOutput(calculateTaiyiChart(input));
    expect(out.engineName).toBe('taiyi');
    expect(out.fateVector.life).toBeGreaterThanOrEqual(0);
    expect(out.eventCandidates.length).toBeGreaterThan(4);
    expect(out.validationFlags.failed).toContain('advanced_rules_partial');
  });
  it('epochYear override changes ji_nian', () => {
    const a = calculateTaiyiChart(input);
    const b = calculateTaiyiChart({ ...input, epochYear: -10000000 });
    expect(a.jiNian).not.toBe(b.jiNian);
  });
});
