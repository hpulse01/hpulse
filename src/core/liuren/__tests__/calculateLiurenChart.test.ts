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
