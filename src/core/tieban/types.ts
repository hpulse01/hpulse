/**
 * P4.3 — Structured trace types for the Tieban (铁板神数) pipeline.
 *
 * Goals:
 *   - Make every step (theoretical base → quarter ke → 六亲校时 → systemOffset → clause lookup)
 *     observable as a deterministic record.
 *   - Make condensation/fallback rules explicit (`requestedClauseNumber`,
 *     `matchedClauseNumber`, `exactMatch`, `fallbackDistance`, `fallbackReason`).
 *   - Never paper over a missing clause as "exact".
 */

import type { ExplanationStep, AstroWarning, SourceGrade } from '../astro-time/types';

export interface TheoreticalBaseResult {
  /** The number returned by the theoretical-base formula, mod BASE_MODULO. */
  theoreticalBase: number;
  /** The legacy `baseNumber` (raw, unmodded) for compatibility / debugging. */
  legacyBaseNumber: number;
  /** Sum of pillar 太玄 scores. */
  pillarSum: number;
  /** Branch yao value at hour pillar. */
  yaoValue: number;
  /** Quarter index 0..7 derived from minute. */
  rawQuarterIndex: number;
  /** Minute remainder inside the 15-min ke. */
  minuteOffset: number;
  /** +500 if female. */
  genderShift: 0 | 500;
  explanationTrace: ExplanationStep[];
}

export interface QuarterKeCandidate {
  /** 0..7 */
  quarterIndex: number;
  /** Display label e.g. "一刻 (初刻)". */
  label: string;
  /** Time range string e.g. "0-15分". */
  timeRange: string;
  /** Offset added to base for this candidate. */
  keOffset: number;
  /** Resulting clause number this quarter would map to (palace=PARENTS). */
  clauseNumber: number;
}

export interface QuarterKeResult {
  candidates: QuarterKeCandidate[];
  explanationTrace: ExplanationStep[];
}

export interface FamilyFacts {
  fatherZodiac: number;        // 0..11 (鼠..猪)
  motherZodiac: number;
  parentsStatus: 'both_alive' | 'father_deceased' | 'mother_deceased' | 'both_deceased';
  siblingsCount: number;
}

export interface FamilyVerificationCandidate extends QuarterKeCandidate {
  predictedFatherZodiac: number;
  predictedMotherZodiac: number;
  /** 0..100 — higher means user input matches better. */
  matchScore: number;
  /** Per-component breakdown (transparent to user). */
  scoreBreakdown: {
    father: number;
    mother: number;
    parentsStatus: number;
    siblings: number;
  };
}

export interface FamilyVerificationResult {
  /** All 8 quarter candidates ranked by matchScore (descending). */
  ranked: FamilyVerificationCandidate[];
  /** The candidate with the highest score; locked time. */
  locked: FamilyVerificationCandidate;
  /** systemOffset implied by the locked clause vs theoreticalBase. */
  systemOffset: number;
  explanationTrace: ExplanationStep[];
  warnings: AstroWarning[];
}

export type FallbackReason =
  | 'EXACT'
  | 'NEAREST_NEIGHBOR'
  | 'PALACE_BOUNDARY_CLAMP'
  | 'NO_MATCH';

export interface ClauseMatch {
  /** What we ASKED for (post-offset, post-modulo). */
  requestedClauseNumber: number;
  /** What the lookup actually returned. */
  matchedClauseNumber: number | null;
  /** True iff requested === matched and content was found. */
  exactMatch: boolean;
  /** Absolute |matched − requested|, or null when no match exists. */
  fallbackDistance: number | null;
  fallbackReason: FallbackReason;
  /** Optional payload returned by the lookup (e.g. clause text). */
  payload?: unknown;
}

export interface TiebanCalculation {
  pillars: { year: string; month: string; day: string; hour: string };
  base: TheoreticalBaseResult;
  quarter: QuarterKeResult;
  /** Filled only after `familyVerification` is invoked. */
  verification?: FamilyVerificationResult;
  warnings: AstroWarning[];
  explanationTrace: ExplanationStep[];
  sourceGrade: SourceGrade;
}
