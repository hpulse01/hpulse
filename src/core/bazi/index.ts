// P4.2 — Bazi core public exports.
export * from './calculateBazi';      // legacy core (BaziChart = BaziCoreChart) + calculateBazi(astro)
export * from './calculateBaziChart'; // new orchestrator (returns rich BaziChart from types.ts)
export * from './types';              // BaziCoreInput + rich BaziChart (overrides re-export of legacy BaziChart)
export * from './analyzeStrength';
export * from './calculateDaYun';
export * from './toEngineOutput';
export * as BaziConstants from './constants';
export { calculateBaziChart as default } from './calculateBaziChart';
