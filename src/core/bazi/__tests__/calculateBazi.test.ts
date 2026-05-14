import { describe, it, expect } from 'vitest';
import { normalizeBirthTime } from '../../astro-time/normalizeBirthTime';
import { calculateBazi } from '../calculateBazi';
import { analyzeStrength } from '../analyzeStrength';

const SH = { geoLatitude: 31.2304, geoLongitude: 121.4737, timezoneIana: 'Asia/Shanghai' };

describe('calculateBazi', () => {
  it('produces four canonical pillars + day master for 1995-06-15 14:30 Shanghai', () => {
    const astro = normalizeBirthTime({
      birthLocalDateTime: { year: 1995, month: 6, day: 15, hour: 14, minute: 30 },
      ...SH,
    });
    const chart = calculateBazi(astro);
    // 1995 after 立春 → 乙亥; 6/15 after 芒种 → 壬午月; 14:30 → 未时; 时干 derived from day stem
    expect(chart.fourPillars.year.ganzhi).toBe('乙亥');
    expect(chart.fourPillars.month.ganzhi).toBe('壬午');
    expect(chart.dayMaster.stem).toBe(chart.fourPillars.day.stem);
    expect(chart.fourPillars.hour.branch).toBe('未');
  });

  it('day pillar of day pillar position has stemTenGod = 日主', () => {
    const astro = normalizeBirthTime({
      birthLocalDateTime: { year: 2000, month: 5, day: 5, hour: 8, minute: 0 },
      ...SH,
    });
    const chart = calculateBazi(astro);
    const dayP = chart.pillarAnalyses.find((p) => p.position === 'day')!;
    expect(dayP.stemTenGod).toBe('日主');
  });

  it('elementBalance sums to a positive total covering all 5 elements', () => {
    const astro = normalizeBirthTime({
      birthLocalDateTime: { year: 1985, month: 8, day: 20, hour: 11, minute: 0 },
      ...SH,
    });
    const chart = calculateBazi(astro);
    const total = chart.elementBalance.reduce((s, e) => s + e.weight, 0);
    expect(total).toBeGreaterThan(0);
    expect(chart.elementBalance).toHaveLength(5);
  });

  it('is fully deterministic for identical input', () => {
    const astro = normalizeBirthTime({
      birthLocalDateTime: { year: 1992, month: 11, day: 3, hour: 4, minute: 45 },
      ...SH,
    });
    const a = calculateBazi(astro);
    const b = calculateBazi(astro);
    expect(JSON.stringify(a.fourPillars)).toBe(JSON.stringify(b.fourPillars));
    expect(JSON.stringify(a.elementBalance)).toBe(JSON.stringify(b.elementBalance));
  });

  it('attaches a multi-step explanation trace covering trace from astro-time + calendar + bazi', () => {
    const astro = normalizeBirthTime({
      birthLocalDateTime: { year: 2000, month: 1, day: 1, hour: 12, minute: 0 },
      ...SH,
    });
    const chart = calculateBazi(astro);
    const rules = chart.explanationTrace.map((s) => s.rule);
    expect(rules).toContain('julianDayFromUtc');
    expect(rules).toContain('lunarFromUtc');
    expect(rules).toContain('bazi.dayMaster');
    expect(rules).toContain('bazi.elementBalance');
  });
});

describe('analyzeStrength', () => {
  it('returns a 0..100 score and a labeled level', () => {
    const astro = normalizeBirthTime({
      birthLocalDateTime: { year: 1990, month: 10, day: 10, hour: 10, minute: 0 },
      ...SH,
    });
    const chart = calculateBazi(astro);
    const s = analyzeStrength(chart);
    expect(s.score).toBeGreaterThanOrEqual(0);
    expect(s.score).toBeLessThanOrEqual(100);
    expect(['极弱', '偏弱', '中和', '偏旺', '极旺']).toContain(s.level);
    expect(s.components.seasonScore + s.components.rootScore + s.components.visibleScore + s.components.balanceScore)
      .toBe(s.score);
  });

  it('flags partial implementation honestly', () => {
    const astro = normalizeBirthTime({
      birthLocalDateTime: { year: 1990, month: 10, day: 10, hour: 10, minute: 0 },
      ...SH,
    });
    const s = analyzeStrength(calculateBazi(astro));
    expect(s.warnings.some((w) => w.code === 'STRENGTH_PARTIAL')).toBe(true);
  });
});
