/**
 * P4.2 — Pillar wrappers around `src/core/calendar/fourPillars`.
 *
 * Provides BaZi-shaped helpers that take a `BaziCoreInput` (or its
 * normalized astro time) and return enriched pillar info.
 */

import { fourPillarsFromAstro } from '../calendar/fourPillars';
import { hourPillarOf } from '../calendar/chineseHour';
import type { NormalizedAstroTime, ExplanationStep, AstroWarning } from '../astro-time/types';
import type { Pillar } from '../calendar/ganzhi';

export interface PillarBundle {
  year: Pillar;
  month: Pillar;
  day: Pillar;
  hour: Pillar;
  explanationTrace: ExplanationStep[];
  warnings: AstroWarning[];
}

export function calculateFourPillars(astro: NormalizedAstroTime): PillarBundle {
  const fp = fourPillarsFromAstro(astro);
  return {
    year: fp.year,
    month: fp.month,
    day: fp.day,
    hour: fp.hour,
    explanationTrace: fp.explanationTrace,
    warnings: [],
  };
}

/**
 * Recompute hour pillar using a true-solar override, when the caller has
 * provided a precomputed local true solar civil hour.
 */
export function calculateHourPillarTrueSolar(
  dayStem: Pillar['stem'],
  trueSolarHour: number,
): Pillar {
  return hourPillarOf(dayStem, trueSolarHour);
}

export { fourPillarsFromAstro };
