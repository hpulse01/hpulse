/**
 * P4.11 — Core Engine Overlay
 *
 * Bridges the deterministic P4 `src/core/*` engine adapters into the legacy
 * `quantumPredictionEngine` orchestrator.
 *
 * Strategy: each legacy runner still produces its EngineOutput for backward
 * compatibility (the rich `normalizedOutput` keys etc. are consumed by older
 * UI). After the legacy runner returns, we run the matching P4 core engine
 * and OVERLAY its deterministic metadata (sourceGrade, completenessScore,
 * confidence, warnings, uncertaintyNotes, explanationTrace, implementation
 * status flag, validationFlags) onto the legacy EngineOutput.
 *
 * If the core engine throws or returns nothing, the legacy EO passes through
 * unchanged — but a warning is appended so we never silently swallow the
 * core failure.
 *
 * NO randomness, NO Date.now() in OUTPUT — only used for trace timestamps
 * inside the orchestrator.
 */
import type { EngineOutput, StandardizedInput } from '@/types/prediction';

import { calculateBaziChart, baziChartToEngineOutput } from '@/core/bazi';
import { calculateZiweiChart, ziweiChartToEngineOutput } from '@/core/ziwei';
import { calculateHexagram, liuyaoChartToEngineOutput } from '@/core/liuyao';
import { calculateMeihua, meihuaChartToEngineOutput } from '@/core/meihua';
import { calculateQimenChart, qimenChartToEngineOutput } from '@/core/qimen';
import { calculateLiurenChart, liurenChartToEngineOutput } from '@/core/liuren';
import { calculateTaiyiChart, taiyiChartToEngineOutput } from '@/core/taiyi';
import { calculateWesternChart, westernChartToEngineOutput } from '@/core/western';
import { calculateVedicChart, vedicChartToEngineOutput } from '@/core/vedic';
import { calculateNumerology, numerologyToEngineOutput } from '@/core/numerology';
import { calculateMayan, mayanToEngineOutput } from '@/core/mayan';
import { calculateKabbalah, kabbalahToEngineOutput } from '@/core/kabbalah';

/**
 * Engines wired to a P4 core adapter.
 * `tieban` core requires multi-step (normalizeBirthTime + base + report)
 * wiring + KaoKe family-facts; not yet exposed as a single-call adapter.
 * It is intentionally OMITTED — its legacy output passes through unchanged.
 */
export const CORE_ENGINE_NAMES = [
  'bazi', 'ziwei',
  'liuyao', 'meihua', 'qimen', 'liuren', 'taiyi',
  'western', 'vedic', 'numerology', 'mayan', 'kabbalah',
] as const;
export type CoreEngineName = (typeof CORE_ENGINE_NAMES)[number];

export interface CoreOverlayResult {
  engineName: CoreEngineName;
  /** Core EngineOutput, or null if the core engine threw. */
  coreOutput: EngineOutput | null;
  /** Error message if the core engine threw. Never silently swallowed. */
  coreError: string | null;
  /** Wall time spent in core engine, milliseconds. Trace-only, not in OUTPUT. */
  coreDurationMs: number;
}

/* ───────────────────────── core dispatchers ───────────────────────── */

function runCoreBazi(si: StandardizedInput): EngineOutput {
  const input = {
    birthLocalDateTime: si.birthLocalDateTime,
    gender: si.gender,
    timezoneIana: si.timezoneIana,
    timezoneOffsetMinutes: si.timezoneOffsetMinutesAtBirth,
    geoLatitude: si.geoLatitude,
    geoLongitude: si.geoLongitude,
    queryTimeUtc: si.queryTimeUtc,
  };
  const chart = calculateBaziChart(input);
  return baziChartToEngineOutput(chart, input);
}

function runCoreZiwei(si: StandardizedInput): EngineOutput {
  const input = {
    birthLocalDateTime: si.birthLocalDateTime,
    gender: si.gender,
    timezoneIana: si.timezoneIana,
    geoLatitude: si.geoLatitude,
    geoLongitude: si.geoLongitude,
    queryTimeUtc: si.queryTimeUtc,
  };
  const chart = calculateZiweiChart(input);
  return ziweiChartToEngineOutput(chart, input);
}

function runCoreLiuyao(si: StandardizedInput): EngineOutput {
  const chart = calculateHexagram({
    mode: 'time',
    queryTimeUtc: si.queryTimeUtc,
    timezoneIana: si.timezoneIana,
    questionText: si.questionText,
  });
  return liuyaoChartToEngineOutput(chart);
}

function runCoreMeihuaWrapper(si: StandardizedInput): EngineOutput {
  const chart = calculateMeihua({
    mode: 'time',
    queryTimeUtc: si.queryTimeUtc,
    timezoneIana: si.timezoneIana,
  });
  return meihuaChartToEngineOutput(chart);
}

function runCoreQimenWrapper(si: StandardizedInput): EngineOutput {
  const chart = calculateQimenChart({
    queryTimeUtc: si.queryTimeUtc,
    timezoneIana: si.timezoneIana,
    geoLatitude: si.geoLatitude,
    geoLongitude: si.geoLongitude,
  });
  return qimenChartToEngineOutput(chart);
}

function runCoreLiurenWrapper(si: StandardizedInput): EngineOutput {
  const chart = calculateLiurenChart({
    queryTimeUtc: si.queryTimeUtc,
    timezoneIana: si.timezoneIana,
    geoLatitude: si.geoLatitude,
    geoLongitude: si.geoLongitude,
    questionText: si.questionText,
  });
  return liurenChartToEngineOutput(chart);
}

function runCoreTaiyiWrapper(si: StandardizedInput): EngineOutput {
  const chart = calculateTaiyiChart({
    queryTimeUtc: si.queryTimeUtc,
    timezoneIana: si.timezoneIana,
  });
  return taiyiChartToEngineOutput(chart);
}

function runCoreWestern(si: StandardizedInput): EngineOutput {
  const chart = calculateWesternChart({
    birthUtcDateTime: si.birthUtcDateTime,
    geoLatitude: si.geoLatitude,
    geoLongitude: si.geoLongitude,
    timezoneIana: si.timezoneIana,
  });
  return westernChartToEngineOutput(chart);
}

function runCoreVedic(si: StandardizedInput): EngineOutput {
  const chart = calculateVedicChart({
    birthUtcDateTime: si.birthUtcDateTime,
    geoLatitude: si.geoLatitude,
    geoLongitude: si.geoLongitude,
    timezoneIana: si.timezoneIana,
  });
  return vedicChartToEngineOutput(chart);
}

function runCoreNumerology(si: StandardizedInput): EngineOutput {
  const result = calculateNumerology({
    birthYear: si.birthLocalDateTime.year,
    birthMonth: si.birthLocalDateTime.month,
    birthDay: si.birthLocalDateTime.day,
    queryTimeUtc: si.queryTimeUtc,
  });
  return numerologyToEngineOutput(result);
}

function runCoreMayanEngine(si: StandardizedInput): EngineOutput {
  const result = calculateMayan({ utcDateTime: si.birthUtcDateTime });
  return mayanToEngineOutput(result);
}

function runCoreKabbalahEngine(si: StandardizedInput): EngineOutput {
  const result = calculateKabbalah({
    birthYear: si.birthLocalDateTime.year,
    birthMonth: si.birthLocalDateTime.month,
    birthDay: si.birthLocalDateTime.day,
  });
  return kabbalahToEngineOutput(result);
}

const DISPATCH: Record<CoreEngineName, (si: StandardizedInput) => EngineOutput> = {
  bazi: runCoreBazi,
  ziwei: runCoreZiwei,
  
  liuyao: runCoreLiuyao,
  meihua: runCoreMeihuaWrapper,
  qimen: runCoreQimenWrapper,
  liuren: runCoreLiurenWrapper,
  taiyi: runCoreTaiyiWrapper,
  western: runCoreWestern,
  vedic: runCoreVedic,
  numerology: runCoreNumerology,
  mayan: runCoreMayanEngine,
  kabbalah: runCoreKabbalahEngine,
};

/** Run the matching P4 core engine. NEVER throws — captures error string. */
export function runCoreEngine(name: string, si: StandardizedInput): CoreOverlayResult {
  if (!(CORE_ENGINE_NAMES as readonly string[]).includes(name)) {
    return {
      engineName: name as CoreEngineName,
      coreOutput: null,
      coreError: `no_p4_core_adapter_for_${name}`,
      coreDurationMs: 0,
    };
  }
  const t0 = performance.now();
  try {
    const eo = DISPATCH[name as CoreEngineName](si);
    return {
      engineName: name as CoreEngineName,
      coreOutput: eo,
      coreError: null,
      coreDurationMs: Math.round(performance.now() - t0),
    };
  } catch (err) {
    return {
      engineName: name as CoreEngineName,
      coreOutput: null,
      coreError: err instanceof Error ? err.message : String(err),
      coreDurationMs: Math.round(performance.now() - t0),
    };
  }
}

/**
 * Merge deterministic P4 core metadata into a legacy EngineOutput.
 *
 *   - Truth fields overridden by core: sourceGrade, confidence,
 *     completenessScore, validationFlags, timingBasis.
 *   - Aggregated: warnings, uncertaintyNotes, explanationTrace, eventCandidates.
 *   - Preserved from legacy (do not overwrite — UI depends on them):
 *     engineName, engineNameCN, engineVersion, ruleSchool, normalizedOutput,
 *     fateVector, aspectScores, rawInputSnapshot, computationTimeMs, sourceUrls.
 */
export function mergeCoreOverlay(legacy: EngineOutput, core: EngineOutput): EngineOutput {
  // Track P4 core wiring inside normalizedOutput so trace consumers can see it.
  const merged: EngineOutput = {
    ...legacy,
    sourceGrade: core.sourceGrade,
    confidence: core.confidence,
    completenessScore: core.completenessScore,
    timingBasis: core.timingBasis ?? legacy.timingBasis,
    sourceUrls: Array.from(new Set([...legacy.sourceUrls, ...core.sourceUrls])),
    warnings: dedupe([...legacy.warnings, ...core.warnings]),
    uncertaintyNotes: dedupe([...legacy.uncertaintyNotes, ...core.uncertaintyNotes]),
    explanationTrace: [
      ...legacy.explanationTrace,
      `[p4-core overlay applied: ${core.engineVersion}]`,
      ...core.explanationTrace,
    ],
    eventCandidates: dedupe([...legacy.eventCandidates, ...core.eventCandidates]),
    validationFlags: {
      passed: dedupe([...legacy.validationFlags.passed, ...core.validationFlags.passed]),
      failed: dedupe([...legacy.validationFlags.failed, ...core.validationFlags.failed]),
      warnings: dedupe([...legacy.validationFlags.warnings, ...core.validationFlags.warnings]),
    },
    aspectScores: { ...legacy.aspectScores, ...core.aspectScores },
    normalizedOutput: {
      ...legacy.normalizedOutput,
      p4CoreVersion: core.engineVersion,
      p4ImplementationStatus: core.normalizedOutput?.implementationStatus ?? 'unknown',
    },
  };
  return merged;
}

/** Apply merge result OR record failure note on legacy if core failed. */
export function applyCoreOverlay(legacy: EngineOutput, overlay: CoreOverlayResult): EngineOutput {
  if (overlay.coreOutput) return mergeCoreOverlay(legacy, overlay.coreOutput);
  if (!overlay.coreError) return legacy; // engine has no core adapter — pass-through
  return {
    ...legacy,
    warnings: dedupe([...legacy.warnings, `p4_core_failed: ${overlay.coreError}`]),
    validationFlags: {
      ...legacy.validationFlags,
      failed: dedupe([...legacy.validationFlags.failed, 'p4_core_overlay_failed']),
    },
    explanationTrace: [
      ...legacy.explanationTrace,
      `[p4-core overlay FAILED: ${overlay.coreError}] — using legacy output only`,
    ],
  };
}

/**
 * Compute a multiplicative weight adjustment in [0.4, 1.15] driven by the
 * P4 core EngineOutput. Drives partial / low-grade engines DOWN, high-grade
 * complete engines slightly UP. Pure function — no side effects.
 */
export function computeQualityMultiplier(eo: EngineOutput): {
  multiplier: number;
  reason: string;
} {
  let m = 1.0;
  const reasons: string[] = [];

  // sourceGrade A→+15%, B→0, C→-10%, D→-25%
  switch (eo.sourceGrade) {
    case 'A': m *= 1.15; reasons.push('grade=A(+15%)'); break;
    case 'B': reasons.push('grade=B(0)'); break;
    case 'C': m *= 0.90; reasons.push('grade=C(-10%)'); break;
    case 'D': m *= 0.75; reasons.push('grade=D(-25%)'); break;
  }

  // completenessScore: linear scale around 80
  const compFactor = 0.6 + 0.5 * (Math.max(0, Math.min(100, eo.completenessScore)) / 100);
  m *= compFactor;
  reasons.push(`completeness=${eo.completenessScore}(x${compFactor.toFixed(2)})`);

  // partial implementation flag (in normalizedOutput)
  const status = String(eo.normalizedOutput?.implementationStatus ?? eo.normalizedOutput?.p4ImplementationStatus ?? '');
  if (status === 'partial' || status === 'needs_source_validation') {
    m *= 0.85;
    reasons.push('partial(-15%)');
  }

  // warnings count: each warning beyond the first 2 dampens by 3%, capped -20%
  const wExtra = Math.max(0, eo.warnings.length - 2);
  if (wExtra > 0) {
    const wFactor = Math.max(0.80, 1 - 0.03 * wExtra);
    m *= wFactor;
    reasons.push(`warnings=${eo.warnings.length}(x${wFactor.toFixed(2)})`);
  }

  // failed validation flags: -10% per fail
  if (eo.validationFlags.failed.length > 0) {
    const fFactor = Math.max(0.5, 1 - 0.1 * eo.validationFlags.failed.length);
    m *= fFactor;
    reasons.push(`failed=${eo.validationFlags.failed.length}(x${fFactor.toFixed(2)})`);
  }

  // confidence: incorporate gently. If 0..1 scale, already near 1.
  // Many legacy engines report 0..1; P4 core reports 0..100. Normalize.
  const conf01 = eo.confidence > 1 ? eo.confidence / 100 : eo.confidence;
  const confFactor = 0.7 + 0.5 * Math.max(0, Math.min(1, conf01));
  m *= confFactor;
  reasons.push(`confidence=${conf01.toFixed(2)}(x${confFactor.toFixed(2)})`);

  // Clamp final to safe bounds.
  const clamped = Math.max(0.4, Math.min(1.15, m));
  return { multiplier: clamped, reason: reasons.join(' · ') };
}

function dedupe<T>(arr: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const x of arr) {
    const k = typeof x === 'string' ? x : JSON.stringify(x);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(x);
    }
  }
  return out;
}
