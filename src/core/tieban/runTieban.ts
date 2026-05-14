/**
 * P4.3 — Top-level orchestrator for the Tieban core pipeline.
 *
 * Takes a `NormalizedAstroTime` (P4.1) + gender, runs:
 *   1. calculateTiebanBase  → theoreticalBase + legacyBaseNumber
 *   2. calculateQuarterKe   → 8 candidates
 *   3. (optional) familyVerification → locked quarter + systemOffset
 *
 * Pure / deterministic / fully traced.
 */

import type { NormalizedAstroTime, AstroWarning, ExplanationStep, SourceGrade } from '../astro-time/types';
import type { Gender } from '../../types/prediction';
import { calculateTiebanBase } from './calculateTiebanBase';
import { calculateQuarterKe } from './calculateQuarterKe';
import { familyVerification } from './familyVerification';
import type { FamilyFacts, TiebanCalculation } from './types';

export interface RunTiebanOptions {
  facts?: FamilyFacts;
}

export function runTieban(
  astro: NormalizedAstroTime,
  gender: Gender,
  options: RunTiebanOptions = {},
): TiebanCalculation {
  const baseFull = calculateTiebanBase(astro, gender);
  const quarter = calculateQuarterKe(baseFull.legacyBaseNumber);

  const trace: ExplanationStep[] = [
    ...astro.explanationTrace,
    ...baseFull.explanationTrace,
    ...quarter.explanationTrace,
  ];
  const warnings: AstroWarning[] = [...astro.warnings];

  let verification;
  if (options.facts) {
    verification = familyVerification(baseFull.legacyBaseNumber, baseFull, quarter, options.facts);
    trace.push(...verification.explanationTrace);
    warnings.push(...verification.warnings);
  } else {
    warnings.push({
      code: 'KAOKE_NOT_RUN',
      message: '未执行六亲校时；时间锁定为时辰边界，最终条文可能存在 ±15 分误差。',
      severity: 'warning',
    });
  }

  const grade: SourceGrade = (() => {
    if (warnings.some((w) => w.severity === 'error')) return 'D';
    if (verification && verification.locked.matchScore >= 70) return astro.sourceGrade;
    if (verification) return astro.sourceGrade === 'A' ? 'B' : astro.sourceGrade;
    return astro.sourceGrade === 'A' ? 'C' : astro.sourceGrade; // no kaoke = downgrade
  })();

  return {
    pillars: baseFull.pillars,
    base: {
      theoreticalBase: baseFull.theoreticalBase,
      legacyBaseNumber: baseFull.legacyBaseNumber,
      pillarSum: baseFull.pillarSum,
      yaoValue: baseFull.yaoValue,
      rawQuarterIndex: baseFull.rawQuarterIndex,
      minuteOffset: baseFull.minuteOffset,
      genderShift: baseFull.genderShift,
      explanationTrace: baseFull.explanationTrace,
    },
    quarter,
    verification,
    warnings,
    explanationTrace: trace,
    sourceGrade: grade,
  };
}
