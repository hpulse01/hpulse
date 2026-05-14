import { describe, it, expect } from 'vitest';
import { calculateHexagram } from '../calculateHexagram';
import { liuyaoChartToEngineOutput } from '../toEngineOutput';
import { ALL_FATE_DIMENSIONS } from '../../../types/prediction';
import type { LineValue } from '../types';

describe('Liu Yao core — manual cast', () => {
  const manual: LineValue[] = [7, 8, 9, 7, 6, 8]; // mixed static + 2 changing
  const input = {
    mode: 'manual' as const,
    manualLines: manual,
    questionText: '问财运',
  };

  it('produces main hexagram with 6 lines + changed hexagram + 世应', () => {
    const chart = calculateHexagram(input);
    expect(chart.mainHexagram.lines.length).toBe(6);
    expect(chart.mainHexagram.changingLines).toEqual([3, 5]);
    expect(chart.changedHexagram).toBeDefined();
    expect(chart.mainHexagram.shiYao).toBeGreaterThanOrEqual(1);
    expect(chart.mainHexagram.shiYao).toBeLessThanOrEqual(6);
    expect(chart.mainHexagram.yingYao).toBeGreaterThanOrEqual(1);
  });

  it('every line has 六亲 + 六神 + 月令旺衰', () => {
    const chart = calculateHexagram(input);
    for (const ln of chart.mainHexagram.lines) {
      expect(ln.relative).toMatch(/父母|兄弟|子孙|妻财|官鬼/);
      expect(ln.spirit).toMatch(/青龙|朱雀|勾陈|螣蛇|白虎|玄武/);
      expect(ln.monthStrength).toMatch(/旺|相|休|囚|死/);
      expect(ln.element).toMatch(/金|木|水|火|土/);
    }
  });

  it('选取用神依据 questionText（财运 → 妻财）+ trace 存在', () => {
    const chart = calculateHexagram(input);
    expect(chart.yongShen.category).toBe('财运');
    expect(chart.yongShen.yongShen).toBe('妻财');
    expect(chart.yongShen.trace.length).toBeGreaterThan(0);
  });

  it('is deterministic for identical input', () => {
    const a = calculateHexagram(input);
    const b = calculateHexagram(input);
    expect(a.mainHexagram.name).toBe(b.mainHexagram.name);
    expect(a.changedHexagram?.name).toBe(b.changedHexagram?.name);
    expect(a.confidence).toBe(b.confidence);
  });
});

describe('Liu Yao core — random mode requires explicit seed', () => {
  it('throws if seed missing', () => {
    expect(() => calculateHexagram({ mode: 'random' })).toThrow(/seed/);
  });

  it('same seed → same hexagram', () => {
    const a = calculateHexagram({ mode: 'random', seed: 42 });
    const b = calculateHexagram({ mode: 'random', seed: 42 });
    expect(a.mainHexagram.name).toBe(b.mainHexagram.name);
    expect(a.castingSource).toBe('random:seed=42');
  });
});

describe('Liu Yao — EngineOutput', () => {
  it('emits valid EngineOutput with fateVector dimensions in [0,100]', () => {
    const chart = calculateHexagram({ mode: 'manual', manualLines: [7,8,9,7,6,8] });
    const out = liuyaoChartToEngineOutput(chart);
    expect(out.engineName).toBe('liuyao');
    expect(out.engineVersion).toBe('P4.5-core');
    expect(out.normalizedOutput.mainHexagram).toBeTruthy();
    expect(out.eventCandidates.length).toBeGreaterThan(0);
    for (const d of ALL_FATE_DIMENSIONS) {
      const v = out.fateVector[d];
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
  });
});
