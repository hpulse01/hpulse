import { describe, it, expect } from 'vitest';
import { calculateZiweiChart } from '../calculateZiweiChart';
import { ziweiChartToEngineOutput } from '../toEngineOutput';
import type { ZiweiCoreInput } from '../types';

const INPUT: ZiweiCoreInput = {
  birthLocalDateTime: { year: 1990, month: 6, day: 15, hour: 14, minute: 30 },
  gender: 'male',
  targetYear: 2025,
};

describe('toEngineOutput', () => {
  it('produces a complete EngineOutput with 10-dim FateVector in [0,100]', () => {
    const chart = calculateZiweiChart(INPUT);
    const out = ziweiChartToEngineOutput(chart, INPUT);
    expect(out.engineName).toBe('ziwei');
    expect(out.engineNameCN).toBe('紫微斗数');
    expect(out.engineVersion).toBe('P4.4-core');
    expect(out.timingBasis).toBe('birth');
    expect(out.explanationTrace.length).toBeGreaterThan(0);
    expect(out.completenessScore).toBeGreaterThan(0);

    for (const v of Object.values(out.fateVector)) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
    expect(out.normalizedOutput.implementationStatus).toBe('partial');
    expect(out.eventCandidates.length).toBeGreaterThan(0);
  });
});
