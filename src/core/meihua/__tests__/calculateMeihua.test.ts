import { describe, it, expect } from 'vitest';
import {
  calculateMeihua,
  meihuaChartToEngineOutput,
  trigramFromNumber,
  movingLineFromSum,
  deriveHuGua,
  deriveBianGua,
  buildHexagram,
  trigramByName,
} from '../index';

describe('P4.6 Meihua — number→trigram & moving line', () => {
  it('maps 1..8 to 乾..坤 (先天数)', () => {
    expect(trigramFromNumber(1).name).toBe('乾');
    expect(trigramFromNumber(2).name).toBe('兑');
    expect(trigramFromNumber(3).name).toBe('离');
    expect(trigramFromNumber(4).name).toBe('震');
    expect(trigramFromNumber(5).name).toBe('巽');
    expect(trigramFromNumber(6).name).toBe('坎');
    expect(trigramFromNumber(7).name).toBe('艮');
    expect(trigramFromNumber(8).name).toBe('坤');
  });
  it('mod-8 wraps; 0/16 → 坤', () => {
    expect(trigramFromNumber(16).name).toBe('坤');
    expect(trigramFromNumber(9).name).toBe('乾');
  });
  it('moving line mod 6, 0→6', () => {
    expect(movingLineFromSum(6)).toBe(6);
    expect(movingLineFromSum(7)).toBe(1);
    expect(movingLineFromSum(13)).toBe(1);
  });
});

describe('P4.6 Meihua — manual mode determinism', () => {
  const input = {
    mode: 'manual' as const,
    manualUpper: '乾' as const,
    manualLower: '坤' as const,
    manualMovingLine: 3,
    questionText: 't',
  };
  it('same input → same output', () => {
    const a = calculateMeihua(input);
    const b = calculateMeihua(input);
    expect(a.benGua.name).toBe(b.benGua.name);
    expect(a.huGua.name).toBe(b.huGua.name);
    expect(a.bianGua.name).toBe(b.bianGua.name);
    expect(a.bodyUse.relation).toBe(b.bodyUse.relation);
    expect(a.confidence).toBe(b.confidence);
  });
  it('benGua = 天地否', () => {
    const c = calculateMeihua(input);
    expect(c.benGua.name).toBe('天地否');
  });
  it('movingLine 3 → 用卦=下卦(坤)，体卦=上卦(乾)', () => {
    const c = calculateMeihua(input);
    expect(c.bodyUse.useTrigram.name).toBe('坤');
    expect(c.bodyUse.bodyTrigram.name).toBe('乾');
  });
});

describe('P4.6 Meihua — numbers mode', () => {
  it('upper=1, lower=8 → 乾上坤下 = 天地否; move = 9 mod 6 = 3', () => {
    const c = calculateMeihua({ mode: 'numbers', upperNumber: 1, lowerNumber: 8 });
    expect(c.upperTrigram.name).toBe('乾');
    expect(c.lowerTrigram.name).toBe('坤');
    expect(c.movingLine).toBe(3);
    expect(c.benGua.name).toBe('天地否');
  });
});

describe('P4.6 Meihua — 互卦 / 变卦 结构', () => {
  it('乾为天 (all yang) 互卦仍为乾为天', () => {
    const ben = buildHexagram(trigramByName('乾'), trigramByName('乾'));
    expect(deriveHuGua(ben).name).toBe('乾为天');
  });
  it('动爻翻转改变卦', () => {
    const ben = buildHexagram(trigramByName('乾'), trigramByName('乾'));
    const bian = deriveBianGua(ben, 1); // flip line 1
    expect(bian.bits[0]).toBe(0);
    expect(bian.name).not.toBe('乾为天');
  });
});

describe('P4.6 Meihua — EngineOutput adapter', () => {
  it('produces complete EngineOutput shape', () => {
    const c = calculateMeihua({
      mode: 'manual',
      manualUpper: '离',
      manualLower: '坎',
      manualMovingLine: 5,
    });
    const out = meihuaChartToEngineOutput(c);
    expect(out.engineName).toBe('meihua');
    expect(out.fateVector).toBeDefined();
    expect(out.fateVector.life).toBeGreaterThanOrEqual(0);
    expect(out.fateVector.life).toBeLessThanOrEqual(100);
    expect(out.explanationTrace.length).toBeGreaterThan(3);
    expect(out.eventCandidates.some((e) => e.startsWith('本卦:'))).toBe(true);
    expect(out.normalizedOutput.benGua).toBeTruthy();
    expect(out.normalizedOutput.huGua).toBeTruthy();
    expect(out.normalizedOutput.bianGua).toBeTruthy();
    expect(out.validationFlags.passed).toContain('deterministic_no_random');
  });
});

describe('P4.6 Meihua — time mode determinism', () => {
  it('same UTC + tz → same chart', () => {
    const base = {
      mode: 'time' as const,
      queryTimeUtc: '2025-05-14T03:00:00Z',
      timezoneIana: 'Asia/Shanghai',
    };
    const a = calculateMeihua(base);
    const b = calculateMeihua(base);
    expect(a.benGua.name).toBe(b.benGua.name);
    expect(a.movingLine).toBe(b.movingLine);
    expect(a.castingSource).toBe(b.castingSource);
  });
});
