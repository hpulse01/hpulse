// P4.2 — Bazi core public exports.
//
// `types.ts` is the canonical source for the rich `BaziChart` and
// `BaziCoreInput`. The legacy `calculateBazi(astro)` returns a smaller
// chart shape now re-exported as `BaziCoreChart` to avoid name collisions.

export {
  calculateBazi,
  type BaziChart as BaziCoreChart,
  type DayMaster as BaziCoreDayMaster,
  type ElementCount,
  type PillarAnalysis,
  type PillarPosition,
} from './calculateBazi';

export * from './types';
export {
  analyzeStrength,
  type StrengthAnalysis,
  type StrengthLevel as StrengthAnalysisLevel,
} from './analyzeStrength';
export * from './calculateDaYun';
export * from './calculateBaziChart';
export * from './toEngineOutput';
export * as BaziConstants from './constants';
export { calculateBaziChart as default } from './calculateBaziChart';
