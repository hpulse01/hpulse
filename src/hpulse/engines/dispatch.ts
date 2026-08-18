/**
 * HPU-4 — Per-engine StandardizedInput → EngineOutput dispatchers.
 *
 * Thin wrappers over `src/core/*` adapters. Most reuse the proven dispatch
 * logic from `src/utils/p4CoreOverlay.ts`. Tieban is wired here with a
 * best-effort path because the overlay omits it.
 */
import type { EngineOutput, StandardizedInput } from "@/types/prediction";
import { runCoreEngine, type CoreEngineName } from "@/utils/p4CoreOverlay";

import { normalizeBirthTime } from "@/core/astro-time/normalizeBirthTime";
import { runTieban } from "@/core/tieban/runTieban";
import type { FamilyFacts, TiebanFullReport } from "@/core/tieban/types";
import { tiebanReportToEngineOutput } from "@/core/tieban/toEngineOutput";

/** Reuse the legacy overlay dispatcher. Throws never — returns { coreOutput, coreError }. */
export function dispatchViaOverlay(name: CoreEngineName, si: StandardizedInput): EngineOutput {
  const r = runCoreEngine(name, si);
  if (r.coreOutput) return r.coreOutput;
  throw new Error(r.coreError ?? `core_engine_${name}_returned_null`);
}

/**
 * Tieban best-effort EO. Without family facts it runs ungraded
 * (warning + downgraded sourceGrade). A real production call should pass
 * `familyFacts` so Kao Ke locks the quarter.
 */
export function dispatchTieban(si: StandardizedInput, facts?: FamilyFacts): EngineOutput {
  const astro = normalizeBirthTime({
    birthLocalDateTime: si.birthLocalDateTime,
    geoLatitude: si.geoLatitude,
    geoLongitude: si.geoLongitude,
    timezoneIana: si.timezoneIana,
    birthUtcDateTime: si.birthUtcDateTime,
  });
  const calc = runTieban(astro, si.gender, facts ? { facts } : {});

  // Synthesize a minimal TiebanFullReport-compatible structure so the existing
  // `tiebanReportToEngineOutput` adapter can shape the output. Sections are
  // empty when full report (clause DB) is unavailable; FateVector falls back
  // to neutral 50s but warnings + grade reflect the missing data.
  const stubReport: TiebanFullReport = {
    inputSnapshot: {
      birthLocalDateTime: si.birthLocalDateTime,
      timezoneIana: si.timezoneIana,
      geoLatitude: si.geoLatitude,
      geoLongitude: si.geoLongitude,
    },
    baseResult: calc.base,
    quarterKe: calc.quarter,
    calibration: calc.verification
      ? {
          theoreticalBase: calc.base.theoreticalBase,
          confirmedClauseId: null,
          systemOffset: calc.verification.systemOffset ?? 0,
          lockedQuarterIndex: calc.verification.locked.quarterIndex,
          selectedOption: calc.verification.locked,
          calibrationTrace: calc.verification.explanationTrace,
          warnings: calc.verification.warnings,
        }
      : {
          theoreticalBase: calc.base.theoreticalBase,
          confirmedClauseId: null,
          systemOffset: 0,
          lockedQuarterIndex: null,
          selectedOption: null,
          calibrationTrace: [],
          warnings: calc.warnings,
        },
    destinySections: [],
    clauseLookups: [],
    sensitiveFlags: [],
    validationFlags: {
      passed: [],
      failed: calc.verification ? [] : ["KAOKE_NOT_RUN"],
      warnings: calc.warnings.map((w) => `${w.code}: ${w.message}`),
    },
    warnings: calc.warnings,
    explanationTrace: calc.explanationTrace,
    sourceGrade: calc.sourceGrade,
    implementationStatus: "needs_source_validation",
    confidence: facts ? 0.35 : 0.2,
    completenessScore: facts ? 35 : 20,
    uncertaintyNotes: [
      "铁板公式尚未完成权威文献交叉验证。",
      ...(facts ? [] : ["未提供六亲事实，考刻未锁定。"]),
    ],
  };

  return tiebanReportToEngineOutput(stubReport, {
    birthLocalDateTime: si.birthLocalDateTime,
    gender: si.gender,
    facts: facts ?? null,
  });
}
