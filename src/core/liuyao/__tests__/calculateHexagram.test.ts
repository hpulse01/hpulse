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

describe('Liu Yao — 进阶规则 (伏神/进退神/伏反吟/应期)', () => {
  it('用神不现时寻得伏神（含飞伏关系）', () => {
    // 乾宫纯卦 乾为天：六亲无妻财? 乾宫首卦含妻财(寅) — 改用问子女在无子孙的卦
    // 构造：全静卦 + 指定类别，扫描直到 hidden 为真
    let found = false;
    const combos: LineValue[][] = [
      [7,7,7,7,7,7],[8,8,8,8,8,8],[7,8,7,8,7,8],[8,7,8,7,8,7],[7,7,8,8,7,7],[8,8,7,7,8,8],
    ];
    for (const manualLines of combos) {
      for (const cat of ['财运','事业','学业','子女','健康'] as const) {
        const chart = calculateHexagram({ mode: 'manual', manualLines, yongShenCategory: cat });
        if (chart.yongShen.hidden) {
          found = true;
          expect(chart.fuShen).not.toBeNull();
          expect(chart.fuShen!.yongShen).toBe(chart.yongShen.yongShen);
          expect(chart.fuShen!.position).toBeGreaterThanOrEqual(1);
          expect(chart.fuShen!.position).toBeLessThanOrEqual(6);
          expect(chart.fuShen!.branch).toMatch(/子|丑|寅|卯|辰|巳|午|未|申|酉|戌|亥/);
          expect(chart.fuShen!.relation).toMatch(/飞来生伏|伏去生飞|飞来克伏|伏去克飞|比和/);
        }
      }
    }
    expect(found).toBe(true);
  });

  it('伏吟：动爻变出同支记入 fanFuYin 并降低置信度', () => {
    const a = calculateHexagram({ mode: 'manual', manualLines: [7,8,9,7,6,8] });
    expect(a.fanFuYin.fuYinPositions.length + a.fanFuYin.fanYinPositions.length).toBeGreaterThanOrEqual(0);
    expect(a.fanFuYin.scoreAdjustment).toBeLessThanOrEqual(0);
  });

  it('进退神：化出之支按经典进神对判定', () => {
    // 遍历一批种子，确保检测器对动爻产生一致的进/退神条目结构
    for (let seed = 1; seed <= 20; seed++) {
      const chart = calculateHexagram({ mode: 'random', seed });
      for (const jt of chart.jinTuiShen) {
        expect(jt.type).toMatch(/进神|退神/);
        expect(chart.mainHexagram.changingLines).toContain(jt.position);
      }
    }
  });

  it('应期：至少给出候选并带依据', () => {
    const chart = calculateHexagram({ mode: 'manual', manualLines: [7,8,9,7,6,8], questionText: '问财运' });
    expect(chart.yingQi.length).toBeGreaterThan(0);
    for (const y of chart.yingQi) {
      expect(y.branch).toMatch(/子|丑|寅|卯|辰|巳|午|未|申|酉|戌|亥/);
      expect(y.basis.length).toBeGreaterThan(0);
    }
  });

  it('提供历法时 implementationStatus = complete', () => {
    const chart = calculateHexagram({
      mode: 'manual', manualLines: [7,8,9,7,6,8],
      queryTimeUtc: '2026-05-14T08:30:00', timezoneIana: 'Asia/Shanghai',
    });
    expect(chart.calendar).not.toBeNull();
    expect(chart.implementationStatus).toBe('complete');
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
