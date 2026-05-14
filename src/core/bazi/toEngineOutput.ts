/**
 * Adapter: map P4.2 `BaziChart` to a subset of the legacy `DeepBaZiAnalysis`
 * shape consumed by `quantumPredictionEngine`.
 *
 * This adapter does NOT replace the legacy engine yet; it allows callers to
 * progressively migrate. Fields that legacy code relies on (fourPillars,
 * dayMaster, tenGods, hiddenStems, naYinAnalysis, elementBalance, summary)
 * are filled deterministically from the new core.
 */

import type { BaziChart } from './calculateBazi';
import type { StrengthAnalysis } from './analyzeStrength';

export interface BaziAdapterOutput {
  fourPillars: { year: string; month: string; day: string; hour: string };
  dayMaster: {
    stem: string;
    element: string;
    yinYang: string;
    strengthScore: number;
    strengthLevel: string;
    description: string;
    seasonalStrength: string;
  };
  tenGods: { position: string; stem: string; god: string }[];
  hiddenStems: { branch: string; stems: string[]; gods: string[] }[];
  naYinAnalysis: { position: string; pillar: string; nayin: string }[];
  elementBalance: { element: string; weight: number; count: number }[];
  voidBranches: string[];
  zodiac: string;
  summary: string;
  /** Provenance for the orchestrator. */
  meta: {
    sourceGrade: string;
    warnings: { code: string; message: string; severity: string }[];
    explanationTraceLength: number;
  };
}

export function toAdapterOutput(chart: BaziChart, strength: StrengthAnalysis): BaziAdapterOutput {
  const fp = chart.fourPillars;
  return {
    fourPillars: {
      year: fp.year.ganzhi,
      month: fp.month.ganzhi,
      day: fp.day.ganzhi,
      hour: fp.hour.ganzhi,
    },
    dayMaster: {
      stem: chart.dayMaster.stem,
      element: chart.dayMaster.element,
      yinYang: chart.dayMaster.yinYang,
      strengthScore: strength.score,
      strengthLevel: strength.level,
      description: `日主 ${chart.dayMaster.stem}(${chart.dayMaster.element}) — ${strength.level} (${strength.score}/100)`,
      seasonalStrength: strength.components.seasonScore >= 25 ? '得令' :
        strength.components.seasonScore >= 15 ? '不令不失' : '失令',
    },
    tenGods: chart.pillarAnalyses.map((p) => ({
      position: p.position,
      stem: p.pillar.stem,
      god: p.stemTenGod,
    })),
    hiddenStems: chart.pillarAnalyses.map((p) => ({
      branch: p.pillar.branch,
      stems: p.hiddenStems,
      gods: p.hiddenTenGods,
    })),
    naYinAnalysis: chart.pillarAnalyses.map((p) => ({
      position: p.position,
      pillar: p.pillar.ganzhi,
      nayin: p.nayin,
    })),
    elementBalance: chart.elementBalance.map((e) => ({
      element: e.element,
      weight: e.weight,
      count: e.count,
    })),
    voidBranches: chart.voidBranches,
    zodiac: chart.zodiac,
    summary: `${fp.year.ganzhi} ${fp.month.ganzhi} ${fp.day.ganzhi} ${fp.hour.ganzhi}｜日主 ${chart.dayMaster.stem}(${chart.dayMaster.element})｜${strength.level}`,
    meta: {
      sourceGrade: chart.sourceGrade,
      warnings: [...chart.warnings, ...strength.warnings].map((w) => ({
        code: w.code, message: w.message, severity: w.severity,
      })),
      explanationTraceLength: chart.explanationTrace.length,
    },
  };
}
