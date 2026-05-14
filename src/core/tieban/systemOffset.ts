/**
 * P4.3 — systemOffset (calibration) — pure deterministic functions.
 *
 * theoreticalBase + PARENTS palace gives an "expected" 考刻 clause id.
 * If 六亲校时 confirms a different clause id, the difference is the
 * systemOffset that must be applied to every subsequent palace projection.
 *
 * No clock reads. No randomness.
 */

import type { ExplanationStep, AstroWarning } from '../astro-time/types';
import { BASE_MODULO, PALACE_OFFSETS, PALACE_SPAN } from './constants';
import type {
  CalibrationResult,
  FamilyVerificationCandidate,
  TheoreticalBaseResult,
} from './types';

export interface SystemOffsetTrace {
  theoreticalBase: number;
  expectedClauseId: number;
  confirmedClauseId: number;
  difference: number;
  normalizedOffset: number;
  trace: ExplanationStep[];
}

export function expectedClauseFromBase(theoreticalBase: number): number {
  const inPalace = ((theoreticalBase % PALACE_SPAN) + PALACE_SPAN) % PALACE_SPAN;
  return PALACE_OFFSETS.KAO_KE + inPalace + 1;
}

export function calculateSystemOffset(
  theoreticalBase: number,
  confirmedClauseId: number,
): SystemOffsetTrace {
  const expected = expectedClauseFromBase(theoreticalBase);
  const difference = confirmedClauseId - expected;
  // Normalize to (−BASE_MODULO/2, BASE_MODULO/2] so the offset is the shortest
  // signed walk on the modulo ring.
  let normalized = difference % BASE_MODULO;
  if (normalized > BASE_MODULO / 2) normalized -= BASE_MODULO;
  if (normalized <= -BASE_MODULO / 2) normalized += BASE_MODULO;

  const trace: ExplanationStep[] = [{
    rule: 'tieban.calibration.systemOffset',
    detail: 'systemOffset = confirmedClauseId − expectedClauseId(theoreticalBase, PARENTS palace)，模 12000 取最短带符号位移。',
    data: { theoreticalBase, expected, confirmedClauseId, difference, normalized },
  }];

  return {
    theoreticalBase,
    expectedClauseId: expected,
    confirmedClauseId,
    difference,
    normalizedOffset: normalized,
    trace,
  };
}

/**
 * Combine baseResult + the locked verification candidate into a CalibrationResult.
 * If no candidate is provided (校时 skipped), systemOffset = 0 and a warning is emitted.
 */
export function applyCalibration(
  base: TheoreticalBaseResult,
  selectedOption: FamilyVerificationCandidate | null,
): CalibrationResult {
  const warnings: AstroWarning[] = [];
  const trace: ExplanationStep[] = [];

  if (!selectedOption) {
    warnings.push({
      code: 'TIEBAN_CALIBRATION_SKIPPED',
      message: '六亲校时未执行，systemOffset 默认为 0；最终条文存在 ±1 刻误差，置信度降级。',
      severity: 'warning',
    });
    trace.push({
      rule: 'tieban.calibration.skipped',
      detail: '未提供校时选项，systemOffset = 0，lockedQuarterIndex = null。',
      data: { theoreticalBase: base.theoreticalBase },
    });
    return {
      theoreticalBase: base.theoreticalBase,
      confirmedClauseId: null,
      systemOffset: 0,
      lockedQuarterIndex: null,
      selectedOption: null,
      calibrationTrace: trace,
      warnings,
    };
  }

  const offset = calculateSystemOffset(base.theoreticalBase, selectedOption.clauseNumber);
  trace.push(...offset.trace);
  trace.push({
    rule: 'tieban.calibration.lock',
    detail: `锁定第 ${selectedOption.quarterIndex + 1} 刻 (${selectedOption.label})，使用 clause ${selectedOption.clauseNumber}。`,
    data: {
      lockedQuarterIndex: selectedOption.quarterIndex,
      lockedClauseId: selectedOption.clauseNumber,
      matchScore: selectedOption.matchScore,
    },
  });

  if (selectedOption.matchScore < 50) {
    warnings.push({
      code: 'TIEBAN_LOW_MATCH_SCORE',
      message: `锁定刻分 ${selectedOption.matchScore}/100 低于 50，systemOffset 可信度受限。`,
      severity: 'warning',
    });
  }

  return {
    theoreticalBase: base.theoreticalBase,
    confirmedClauseId: selectedOption.clauseNumber,
    systemOffset: offset.normalizedOffset,
    lockedQuarterIndex: selectedOption.quarterIndex,
    selectedOption,
    calibrationTrace: trace,
    warnings,
  };
}

/** Project a palace clause id given calibrated theoreticalBase + systemOffset. */
export function projectPalaceClauseId(
  theoreticalBase: number,
  systemOffset: number,
  palaceOffset: number,
): number {
  const baseValue = theoreticalBase + systemOffset;
  const inPalaceOffset = ((baseValue % PALACE_SPAN) + PALACE_SPAN) % PALACE_SPAN;
  let id = palaceOffset + inPalaceOffset + 1;
  if (id < 1) id = 1;
  if (id > BASE_MODULO) id = BASE_MODULO;
  return Math.floor(id);
}
