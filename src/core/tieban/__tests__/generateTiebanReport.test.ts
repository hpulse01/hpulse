import { describe, it, expect } from 'vitest';
import { generateTiebanReport } from '../generateTiebanReport';
import { applyCalibration } from '../systemOffset';
import { SECTION_SPECS } from '../constants';
import type { FamilyVerificationCandidate, QuarterKeResult, TheoreticalBaseResult } from '../types';

const base: TheoreticalBaseResult = {
  theoreticalBase: 1234,
  legacyBaseNumber: 9999,
  pillarSum: 100,
  yaoValue: 1,
  rawQuarterIndex: 0,
  minuteOffset: 0,
  genderShift: 0,
  explanationTrace: [],
};

const quarter: QuarterKeResult = { candidates: [], explanationTrace: [] };

const candidate: FamilyVerificationCandidate = {
  quarterIndex: 3,
  label: '四刻',
  timeRange: '45-60分',
  keOffset: 45,
  clauseNumber: 1500,
  predictedFatherZodiac: 0,
  predictedMotherZodiac: 0,
  matchScore: 85,
  scoreBreakdown: { father: 0, mother: 0, parentsStatus: 0, siblings: 0 },
};

describe('generateTiebanReport', () => {
  it('produces all sections with requested + lookup metadata', async () => {
    const cal = applyCalibration(base, candidate);
    const report = await generateTiebanReport(base, quarter, cal, {
      clauseProvider: (n) => ({ content: `条文 ${n} 主吉。` }),
    });
    expect(report.destinySections.length).toBe(SECTION_SPECS.length);
    for (const s of report.destinySections) {
      expect(s.requestedClauseNumber).toBeGreaterThan(0);
      expect(s.clauseLookup.exactMatch).toBe(true);
      expect(s.interpretation).toContain('条文');
      expect(s.confidence).toBeGreaterThan(0);
    }
    expect(report.sourceGrade).toBe('B');
  });

  it('marks fallback transparently when exact id is missing', async () => {
    const cal = applyCalibration(base, candidate);
    // Only every 7th id has content → many requested ids miss → nearest-neighbor fallback used.
    const report = await generateTiebanReport(base, quarter, cal, {
      clauseProvider: (n) => (n % 7 === 0 ? { content: `回退条文 ${n}` } : null),
    });
    const anyFallback = report.clauseLookups.some(
      (m) => !m.exactMatch && m.fallbackReason === 'NEAREST_NEIGHBOR',
    );
    expect(anyFallback).toBe(true);
    expect(report.warnings.some((w) => w.code === 'TIEBAN_FALLBACK_USED')).toBe(true);
    expect(['B', 'C', 'D']).toContain(report.sourceGrade);
  });

  it('does not fabricate a hit when no clause exists in radius', async () => {
    const cal = applyCalibration(base, candidate);
    const report = await generateTiebanReport(base, quarter, cal, {
      clauseProvider: () => null,
      searchRadius: 5,
    });
    expect(report.clauseLookups.every((m) => m.fallbackReason === 'NO_MATCH')).toBe(true);
    expect(report.sourceGrade).toBe('D');
    expect(report.warnings.some((w) => w.code === 'TIEBAN_CLAUSE_MISSING')).toBe(true);
  });

  it('flags sensitive sections (health/marriage/disaster)', async () => {
    const cal = applyCalibration(base, candidate);
    const report = await generateTiebanReport(base, quarter, cal, {
      clauseProvider: (n) => ({ content: `主有疾病灾厄，婚姻克。clause=${n}` }),
    });
    expect(report.sensitiveFlags.length).toBeGreaterThan(0);
    const health = report.destinySections.find((s) => s.sectionKey === 'health');
    expect(health?.sensitiveFlags.length).toBeGreaterThan(0);
    expect(health?.interpretation).toContain('仅作命理参考');
  });

  it('is deterministic for identical inputs', async () => {
    const cal = applyCalibration(base, candidate);
    const opts = { clauseProvider: (n: number) => ({ content: `c${n}` }) };
    const a = await generateTiebanReport(base, quarter, cal, opts);
    const b = await generateTiebanReport(base, quarter, cal, opts);
    expect(a.confidence).toBe(b.confidence);
    expect(a.completenessScore).toBe(b.completenessScore);
    expect(a.clauseLookups.map((m) => m.matchedClauseNumber)).toEqual(
      b.clauseLookups.map((m) => m.matchedClauseNumber),
    );
  });
});
