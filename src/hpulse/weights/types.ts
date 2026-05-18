/**
 * HPU-3 DynamicWeights — type contracts.
 *
 * Pure data, no runtime. Values are normalized so Σ weights = 1 across all
 * available engines. Any engine present in `degraded_engines` is excluded
 * from the denominator and gets weight 0 in the output.
 */

export type LifeStage =
  | "childhood"
  | "youth"
  | "prime"
  | "middle"
  | "elder";

export type EventType =
  | "career"
  | "wealth"
  | "love"
  | "health"
  | "crisis"
  | "decision"
  | "migration"
  | "general";

export type Granularity =
  | "minute"
  | "hour"
  | "day"
  | "week"
  | "month"
  | "year"
  | "decade";

/** Registered metaphysical engines, v1.1.0 — 13 systems. */
export type EngineId =
  | "bazi"
  | "ziwei"
  | "liuyao"
  | "qimen"
  | "daliuren"
  | "taiyi"
  | "tieban"
  | "meihua"
  | "astrology"   // Western astrology
  | "vedic"       // Vedic / Jyotish
  | "numerology"  // Pythagorean numerology
  | "mayan"       // Mayan Tzolkin
  | "kabbalah";   // Kabbalistic gematria

export const ALL_ENGINES: readonly EngineId[] = [
  "bazi",
  "ziwei",
  "liuyao",
  "qimen",
  "daliuren",
  "taiyi",
  "tieban",
  "meihua",
  "astrology",
  "vedic",
  "numerology",
  "mayan",
  "kabbalah",
] as const;

export interface WeightQuery {
  /** Subject age in years at query time. Derived from StandardizedInput. */
  ageYears: number;
  event: EventType;
  granularity: Granularity;
  /** Engines that failed / are unavailable for this query. */
  degradedEngines?: EngineId[];
}

export interface DynamicWeights {
  /** Normalized weights for every engine (degraded → 0). */
  weights: Record<EngineId, number>;
  /** Derived life stage used in α(t). */
  lifeStage: LifeStage;
  event: EventType;
  granularity: Granularity;
  /** Sorted desc by weight; ties broken by ALL_ENGINES order. */
  dominant: EngineId;
  degradedEngines: EngineId[];
  matrixVersion: string;
  /** Reason map for degraded engines (caller-provided context). */
  degradedReason: Partial<Record<EngineId, string>>;
}

export const MATRIX_VERSION = "wmat-1.0.0";

export function lifeStageOf(ageYears: number): LifeStage {
  if (ageYears <= 12) return "childhood";
  if (ageYears <= 29) return "youth";
  if (ageYears <= 44) return "prime";
  if (ageYears <= 59) return "middle";
  return "elder";
}
