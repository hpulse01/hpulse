import { describe, it, expect } from 'vitest';
import { calculateZiweiChart } from '../calculateZiweiChart';
import type { ZiweiCoreInput } from '../types';

const SAMPLE: ZiweiCoreInput = {
  birthLocalDateTime: { year: 1990, month: 6, day: 15, hour: 14, minute: 30 },
  gender: 'male',
  targetYear: 2025,
  timezoneIana: 'Asia/Shanghai',
  geoLatitude: 31.23,
  geoLongitude: 121.47,
};

describe('calculateZiweiChart', () => {
  it('is deterministic — same input ⇒ same output', () => {
    const a = calculateZiweiChart(SAMPLE);
    const b = calculateZiweiChart(SAMPLE);
    expect(JSON.stringify(a.palaces.map(p => ({ n: p.name, b: p.branch, ms: p.majorStars.map(s => s.name) }))))
      .toEqual(JSON.stringify(b.palaces.map(p => ({ n: p.name, b: p.branch, ms: p.majorStars.map(s => s.name) }))));
    expect(a.strengthAnalysis.mingScore).toBe(b.strengthAnalysis.mingScore);
    expect(a.liunian.map(l => l.year)).toEqual(b.liunian.map(l => l.year));
  });

  it('places all 14 major stars and 12 palaces', () => {
    const c = calculateZiweiChart(SAMPLE);
    expect(c.palaces).toHaveLength(12);
    const placed = new Set<string>();
    for (const p of c.palaces) for (const s of p.majorStars) placed.add(s.name);
    expect(placed.size).toBe(14);
  });

  it('produces explanationTrace and validationFlags', () => {
    const c = calculateZiweiChart(SAMPLE);
    expect(c.explanationTrace.length).toBeGreaterThan(5);
    expect(c.validationFlags.passed).toContain('major14_all_placed');
    expect(c.validationFlags.passed).toContain('palaces_12');
    expect(c.implementationStatus).toBe('partial');
  });

  it('does not depend on system year for liunian', () => {
    const c1 = calculateZiweiChart({ ...SAMPLE, targetYear: 2025 });
    const c2 = calculateZiweiChart({ ...SAMPLE, targetYear: 2030 });
    expect(c1.liunian[0].year).not.toEqual(c2.liunian[0].year);
    // But results stable across runs:
    const c1b = calculateZiweiChart({ ...SAMPLE, targetYear: 2025 });
    expect(c1.liunian.map(l => l.year)).toEqual(c1b.liunian.map(l => l.year));
  });

  it('emits a warning when targetYear and queryTimeUtc both missing', () => {
    const c = calculateZiweiChart({ ...SAMPLE, targetYear: undefined, queryTimeUtc: undefined });
    expect(c.liunian).toHaveLength(0);
    expect(c.warnings.some(w => w.code === 'ZIWEI_LIUNIAN_NO_TARGET_YEAR')).toBe(true);
  });
});
