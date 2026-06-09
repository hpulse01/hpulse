import { describe, it, expect } from 'vitest';
import { calculateBaziChart } from '../calculateBaziChart';
import { baziChartToEngineOutput } from '../toEngineOutput';
import type { BaziCoreInput } from '../types';

const SH: Pick<BaziCoreInput, 'timezoneIana' | 'geoLatitude' | 'geoLongitude'> = {
  timezoneIana: 'Asia/Shanghai', geoLatitude: 31.2304, geoLongitude: 121.4737,
};

const baseInput: BaziCoreInput = {
  birthLocalDateTime: { year: 1995, month: 6, day: 15, hour: 14, minute: 30 },
  gender: 'male',
  ...SH,
};

describe('calculateBaziChart', () => {
  it('produces 4 pillars with full enrichment', () => {
    const c = calculateBaziChart(baseInput);
    expect(c.fourPillars.year.ganZhi).toBe('乙亥');
    expect(c.fourPillars.month.ganZhi).toBe('壬午');
    expect(c.fourPillars.day.tenGod).toBe('日主');
    expect(c.fourPillars.hour.branch).toBe('未');
    expect(c.fourPillars.year.twelveStage).toMatch(/长生|沐浴|冠带|临官|帝旺|衰|病|死|墓|绝|胎|养/);
    expect(c.fourPillars.year.nayin.length).toBeGreaterThan(0);
    expect(c.fourPillars.year.hiddenStems.length).toBeGreaterThan(0);
  });

  it('is fully deterministic', () => {
    const a = calculateBaziChart(baseInput);
    const b = calculateBaziChart(baseInput);
    expect(JSON.stringify(a.fourPillars)).toBe(JSON.stringify(b.fourPillars));
    expect(a.strengthScore).toBe(b.strengthScore);
    expect(JSON.stringify(a.daYun)).toBe(JSON.stringify(b.daYun));
  });

  it('day master strength is in canonical scale', () => {
    const c = calculateBaziChart(baseInput);
    expect(['veryStrong', 'strong', 'balanced', 'weak', 'veryWeak']).toContain(c.dayMasterStrength);
    expect(c.strengthScore).toBeGreaterThanOrEqual(0);
    expect(c.strengthScore).toBeLessThanOrEqual(100);
  });

  it('produces 10 da-yun steps and respects 顺逆', () => {
    const c = calculateBaziChart(baseInput);
    expect(c.daYun).toHaveLength(10);
    // 1995 = 乙亥 (yin) male → 逆行
    expect(c.daYun[0].direction).toBe('backward');
    expect(c.daYun[0].startAge).toBeGreaterThan(0);
  });

  it('flowYear is null without targetYear/queryTimeUtc; populated with targetYear', () => {
    const c0 = calculateBaziChart(baseInput);
    expect(c0.flowYear).toBeNull();

    const c1 = calculateBaziChart({ ...baseInput, targetYear: 2026 });
    expect(c1.flowYear).not.toBeNull();
    expect(c1.flowYear!.year).toBe(2026);
    expect(c1.flowYear!.ganZhi).toHaveLength(2);
  });

  it('warnings are present and partial flag is honest', () => {
    const c = calculateBaziChart(baseInput);
    expect(c.implementationStatus).toBe('partial_rules');
    expect(c.uncertaintyNotes.length).toBeGreaterThan(0);
  });

  it('toEngineOutput returns full EngineOutput with fateVector 0..100', () => {
    const c = calculateBaziChart({ ...baseInput, targetYear: 2026 });
    const out = baziChartToEngineOutput(c, c.inputSnapshot);
    expect(out.engineName).toBe('bazi');
    expect(out.timingBasis).toBe('birth');
    const v = out.fateVector;
    for (const k of Object.keys(v) as (keyof typeof v)[]) {
      expect(v[k]).toBeGreaterThanOrEqual(0);
      expect(v[k]).toBeLessThanOrEqual(100);
    }
    expect(out.eventCandidates.length).toBeGreaterThan(0);
    expect(out.explanationTrace.length).toBeGreaterThan(0);
    expect(out.completenessScore).toBeGreaterThan(0);
  });
});

describe('调候用神 / 化气格 / 从格 / 流月细化', () => {
  it('每张命盘都给出调候用神（表查找）', () => {
    const c = calculateBaziChart(baseInput);
    expect(c.tiaohou).not.toBeNull();
    expect(c.tiaohou!.stems.length).toBeGreaterThan(0);
    expect(c.tiaohou!.primary).toBe(c.tiaohou!.stems[0]);
    expect(c.tiaohou!.elements.length).toBeGreaterThan(0);
    expect(typeof c.tiaohou!.presentInStems).toBe('boolean');
  });

  it('调候结果确定且可追溯', () => {
    const a = calculateBaziChart(baseInput);
    const b = calculateBaziChart(baseInput);
    expect(a.tiaohou).toEqual(b.tiaohou);
    expect(a.explanationTrace.some((s) => s.rule === 'bazi.tiaohou')).toBe(true);
    expect(a.explanationTrace.some((s) => s.rule === 'bazi.congHua')).toBe(true);
  });

  it('流月细化：含十神/冲合/影响柱', () => {
    const c = calculateBaziChart({ ...baseInput, targetYear: 2026, targetMonth: 6 });
    expect(c.flowMonth).not.toBeNull();
    expect(c.flowMonth!.tenGod).toBeTruthy();
    expect(Array.isArray(c.flowMonth!.clashes)).toBe(true);
    expect(Array.isArray(c.flowMonth!.combinations)).toBe(true);
    expect(Array.isArray(c.flowMonth!.affectedPillars)).toBe(true);
  });

  it('格局候选排序且 selected 阈值 >= 50', () => {
    const c = calculateBaziChart(baseInput);
    for (let i = 1; i < c.patternCandidates.length; i++) {
      expect(c.patternCandidates[i - 1].confidence).toBeGreaterThanOrEqual(c.patternCandidates[i].confidence);
    }
    if (c.selectedPattern) expect(c.selectedPattern.confidence).toBeGreaterThanOrEqual(50);
  });
});

describe('flowYear forbids implicit system clock', () => {
  it('throws when neither targetYear nor queryTimeUtc supplied to analyzeFlowYear directly', async () => {
    const { analyzeFlowYear } = await import('../analyzeFlowYear');
    const c = calculateBaziChart(baseInput);
    expect(() => analyzeFlowYear(c, {})).toThrow();
  });
});

describe('determinism guards: no Math.random / Date.now in core', () => {
  it('no Math.random usage in src/core/bazi', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const dir = path.resolve(process.cwd(), 'src/core/bazi');
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts') && !f.endsWith('.test.ts'));
    for (const f of files) {
      const txt = fs.readFileSync(path.join(dir, f), 'utf8');
      expect(txt.includes('Math.random'), `${f} contains Math.random`).toBe(false);
    }
  });
});
