import { describe, it, expect } from 'vitest';
import { generateTiebanReport } from '../generateTiebanReport';
import { tiebanReportToEngineOutput } from '../toEngineOutput';
import { applyCalibration } from '../systemOffset';
import type { FamilyVerificationCandidate, QuarterKeResult, TheoreticalBaseResult } from '../types';
import { ALL_FATE_DIMENSIONS } from '../../../types/prediction';

const base: TheoreticalBaseResult = {
  theoreticalBase: 1234,
  legacyBaseNumber: 9999,
  pillarSum: 100, yaoValue: 1, rawQuarterIndex: 0, minuteOffset: 0, genderShift: 0,
  explanationTrace: [],
};
const quarter: QuarterKeResult = { candidates: [], explanationTrace: [] };
const candidate: FamilyVerificationCandidate = {
  quarterIndex: 3, label: '四刻', timeRange: '45-60分', keOffset: 45, clauseNumber: 1500,
  predictedFatherZodiac: 0, predictedMotherZodiac: 0, matchScore: 85,
  scoreBreakdown: { father: 0, mother: 0, parentsStatus: 0, siblings: 0 },
};

describe('tiebanReportToEngineOutput', () => {
  it('produces a valid EngineOutput with required fields', async () => {
    const cal = applyCalibration(base, candidate);
    const report = await generateTiebanReport(base, quarter, cal, {
      clauseProvider: (n) => ({ content: `条文 ${n}` }),
    });
    const out = tiebanReportToEngineOutput(report, { gender: 'male' });

    expect(out.engineName).toBe('tieban');
    expect(out.engineNameCN).toBe('铁板神数');
    expect(out.engineVersion).toBe('P4.3-core');
    expect(out.timingBasis).toBe('birth');
    expect(out.sourceGrade).toBe(report.sourceGrade);
    // EngineOutput.confidence is canonical 0-1; report.confidence is 0-100.
    expect(out.confidence).toBeCloseTo(report.confidence / 100, 10);
    expect(out.confidence).toBeLessThanOrEqual(1);
    expect(out.completenessScore).toBe(report.completenessScore);
    expect(out.explanationTrace.length).toBeGreaterThan(0);
    expect(out.eventCandidates.length).toBe(report.destinySections.length);
    expect(out.normalizedOutput.theoreticalBase).toBe('1234');
    expect(out.normalizedOutput.confirmedClauseId).toBe('1500');
  });

  it('every fateVector dimension is in [0, 100]', async () => {
    const cal = applyCalibration(base, candidate);
    const report = await generateTiebanReport(base, quarter, cal, {
      clauseProvider: (n) => ({ content: `条文 ${n} 主才艺学问。` }),
    });
    const out = tiebanReportToEngineOutput(report);
    for (const d of ALL_FATE_DIMENSIONS) {
      const v = out.fateVector[d];
      expect(Number.isFinite(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
  });

  it('fateVector is deterministic for identical reports', async () => {
    const cal = applyCalibration(base, candidate);
    const opts = { clauseProvider: (n: number) => ({ content: `c${n}` }) };
    const a = tiebanReportToEngineOutput(await generateTiebanReport(base, quarter, cal, opts));
    const b = tiebanReportToEngineOutput(await generateTiebanReport(base, quarter, cal, opts));
    expect(a.fateVector).toEqual(b.fateVector);
  });

  it('downgrades luck/life when calibration was skipped', async () => {
    const calibrated = applyCalibration(base, candidate);
    const skipped = applyCalibration(base, null);
    const opts = { clauseProvider: (n: number) => ({ content: `c${n}` }) };
    const a = tiebanReportToEngineOutput(await generateTiebanReport(base, quarter, calibrated, opts));
    const b = tiebanReportToEngineOutput(await generateTiebanReport(base, quarter, skipped, opts));
    expect(a.fateVector.luck).toBeGreaterThan(b.fateVector.luck);
    expect(a.fateVector.life).toBeGreaterThan(b.fateVector.life);
  });
});
