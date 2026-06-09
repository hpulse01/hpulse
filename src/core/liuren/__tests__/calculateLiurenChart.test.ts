import { describe, it, expect } from 'vitest';
import { calculateLiurenChart, liurenChartToEngineOutput } from '../index';

const input = {
  queryTimeUtc: '2025-05-14T03:00:00Z',
  timezoneIana: 'Asia/Shanghai',
};

describe('P4.8 Liuren — basic plate', () => {
  it('deterministic: same input → same chart', () => {
    const a = calculateLiurenChart(input);
    const b = calculateLiurenChart(input);
    expect(a.monthGeneral).toBe(b.monthGeneral);
    expect(a.threeTransmissions.chu).toBe(b.threeTransmissions.chu);
    expect(a.plates.map((p) => `${p.earthBranch}|${p.heavenBranch}|${p.deity}`).join(',')).toBe(
      b.plates.map((p) => `${p.earthBranch}|${p.heavenBranch}|${p.deity}`).join(','),
    );
  });
  it('plates have 12 cells, all 12 deities assigned', () => {
    const c = calculateLiurenChart(input);
    expect(c.plates.length).toBe(12);
    const deities = c.plates.map((p) => p.deity).filter(Boolean);
    expect(new Set(deities).size).toBe(12);
  });
  it('four classes + three transmissions exist', () => {
    const c = calculateLiurenChart(input);
    expect(c.fourClasses.ke1.heaven).toBeTruthy();
    expect(c.fourClasses.ke4.heaven).toBeTruthy();
    expect(c.threeTransmissions.chu).toBeTruthy();
    expect(c.threeTransmissions.zhong).toBeTruthy();
    expect(c.threeTransmissions.mo).toBeTruthy();
  });
  it('partial implementation status + sourceGrade ≤ C', () => {
    const c = calculateLiurenChart(input);
    expect(c.implementationStatus).toBe('partial');
    expect(['C','D']).toContain(c.sourceGrade);
  });
  it('explanationTrace populated', () => {
    const c = calculateLiurenChart(input);
    expect(c.explanationTrace.length).toBeGreaterThan(5);
  });
  it('EngineOutput complete', () => {
    const out = liurenChartToEngineOutput(calculateLiurenChart(input));
    expect(out.engineName).toBe('liuren');
    expect(out.fateVector.life).toBeGreaterThanOrEqual(0);
    expect(out.fateVector.life).toBeLessThanOrEqual(100);
    expect(out.eventCandidates.length).toBeGreaterThan(4);
    expect(out.validationFlags.passed).toContain('deterministic_no_random');
  });
});

describe('P4.8+ Liuren — 九宗门课体识别', () => {
  it('课体字段存在且为已知课体之一', () => {
    const KNOWN = ['元首课','重审课','知一课','涉害课','蒿矢课','弹射课','昴星课（虎视）','昴星课（冬蛇掩目）','别责课','八专课','伏吟课','返吟课','未识别'];
    const c = calculateLiurenChart(input);
    expect(KNOWN).toContain(c.keTi);
    expect(c.threeTransmissions.keTi).toBe(c.keTi);
    expect(c.explanationTrace.some((s) => s.rule === 'liuren.keTi')).toBe(true);
  });

  it('多时间点扫描：三传/课体确定且方法合法', () => {
    const METHODS = ['贼克','比用','涉害','遥克','昴星','别责','八专','伏吟','反吟','fallback'];
    for (const day of ['01','05','09','14','20','26']) {
      for (const hour of ['01','07','13','19']) {
        const q = { queryTimeUtc: `2025-05-${day}T${hour}:00:00Z`, timezoneIana: 'Asia/Shanghai' };
        const a = calculateLiurenChart(q);
        const b = calculateLiurenChart(q);
        expect(METHODS).toContain(a.threeTransmissions.method);
        expect(a.threeTransmissions).toEqual(b.threeTransmissions);
        expect(a.keTi).toBeTruthy();
      }
    }
  });

  it('EngineOutput 暴露课体', () => {
    const out = liurenChartToEngineOutput(calculateLiurenChart(input));
    expect(out.normalizedOutput.keTi).toBeTruthy();
    expect(out.eventCandidates.some((e) => e.startsWith('课体:'))).toBe(true);
  });
});
