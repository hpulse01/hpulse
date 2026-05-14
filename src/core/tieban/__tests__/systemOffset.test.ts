import { describe, it, expect } from 'vitest';
import {
  calculateSystemOffset,
  expectedClauseFromBase,
  applyCalibration,
  projectPalaceClauseId,
} from '../systemOffset';
import { PALACE_OFFSETS } from '../constants';
import type { FamilyVerificationCandidate, TheoreticalBaseResult } from '../types';

const baseStub: TheoreticalBaseResult = {
  theoreticalBase: 1234,
  legacyBaseNumber: 9999,
  pillarSum: 100,
  yaoValue: 1,
  rawQuarterIndex: 0,
  minuteOffset: 0,
  genderShift: 0,
  explanationTrace: [],
};

const candidate = (clause: number, score = 80, q = 2): FamilyVerificationCandidate => ({
  quarterIndex: q,
  label: '三刻',
  timeRange: '30-45分',
  keOffset: 30,
  clauseNumber: clause,
  predictedFatherZodiac: 0,
  predictedMotherZodiac: 0,
  matchScore: score,
  scoreBreakdown: { father: 0, mother: 0, parentsStatus: 0, siblings: 0 },
});

describe('systemOffset — calculateSystemOffset', () => {
  it('records theoreticalBase, expected, confirmed, difference', () => {
    const r = calculateSystemOffset(1234, 999);
    expect(r.theoreticalBase).toBe(1234);
    expect(r.expectedClauseId).toBe(expectedClauseFromBase(1234));
    expect(r.confirmedClauseId).toBe(999);
    expect(r.difference).toBe(999 - r.expectedClauseId);
    expect(r.trace.length).toBeGreaterThan(0);
  });

  it('normalizes offset to shortest signed walk on the modulo ring', () => {
    const big = calculateSystemOffset(1, 11999);
    expect(big.normalizedOffset).toBeGreaterThan(-6000);
    expect(big.normalizedOffset).toBeLessThanOrEqual(6000);
  });

  it('is deterministic (same input → same output)', () => {
    const a = calculateSystemOffset(4321, 5555);
    const b = calculateSystemOffset(4321, 5555);
    expect(a.normalizedOffset).toBe(b.normalizedOffset);
  });
});

describe('systemOffset — applyCalibration', () => {
  it('returns offset 0 + warning when no candidate provided', () => {
    const r = applyCalibration(baseStub, null);
    expect(r.systemOffset).toBe(0);
    expect(r.lockedQuarterIndex).toBeNull();
    expect(r.confirmedClauseId).toBeNull();
    expect(r.warnings.some((w) => w.code === 'TIEBAN_CALIBRATION_SKIPPED')).toBe(true);
  });

  it('records lockedQuarterIndex + confirmedClauseId when candidate provided', () => {
    const r = applyCalibration(baseStub, candidate(2500, 90, 4));
    expect(r.lockedQuarterIndex).toBe(4);
    expect(r.confirmedClauseId).toBe(2500);
    expect(r.calibrationTrace.length).toBeGreaterThan(0);
  });

  it('emits low-match warning when matchScore < 50', () => {
    const r = applyCalibration(baseStub, candidate(2500, 30));
    expect(r.warnings.some((w) => w.code === 'TIEBAN_LOW_MATCH_SCORE')).toBe(true);
  });
});

describe('systemOffset — projectPalaceClauseId', () => {
  it('clamps result to [1, 12000]', () => {
    expect(projectPalaceClauseId(1, 0, PALACE_OFFSETS.FATE)).toBeGreaterThanOrEqual(1);
    expect(projectPalaceClauseId(11999, 0, PALACE_OFFSETS.FLOW_MONTH)).toBeLessThanOrEqual(12000);
  });

  it('is deterministic', () => {
    const a = projectPalaceClauseId(1234, 50, PALACE_OFFSETS.WEALTH);
    const b = projectPalaceClauseId(1234, 50, PALACE_OFFSETS.WEALTH);
    expect(a).toBe(b);
  });
});
