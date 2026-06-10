/**
 * P4.10 — KabbalahResult → EngineOutput.
 */
import { normalizeConfidence01 } from '@/core/shared/confidence';
import type { EngineOutput, FateVector, ValidationFlags } from '../../types/prediction';
import type { KabbalahResult } from './types';

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(n)));

/** Per-sephirah base influence (1..10 → score). Fixed lookup, deterministic. */
const SEPHIRAH_BASE: number[] = [80, 75, 70, 70, 65, 75, 65, 60, 60, 55];

export function kabbalahToEngineOutput(result: KabbalahResult): EngineOutput {
  const trace: string[] = [];
  const sIdx = result.primarySephirah ? result.primarySephirah.number - 1 : -1;
  const base = sIdx >= 0 ? SEPHIRAH_BASE[sIdx] : 50;
  // Derived-from-birthdate-only paths get a confidence-style downweight on the vector too.
  const damped = result.derivedFromName ? base : Math.round(base * 0.85);
  trace.push(`base = ${damped} (sephirah=${result.primarySephirah?.name ?? '-'}, derivedFromName=${result.derivedFromName})`);

  const dim = (label: string, v: number) => { const x = clamp(v); trace.push(`${label} = ${x}`); return x; };
  const fateVector: FateVector = {
    life:          dim('life',          damped),
    wealth:        dim('wealth',        damped),
    relation:      dim('relation',      damped),
    health:        dim('health',        damped),
    wisdom:        dim('wisdom',        damped + (result.primarySephirah?.name === 'Chokhmah' || result.primarySephirah?.name === 'Binah' ? 5 : 0)),
    spirit:        dim('spirit',        damped + 5),
    socialStatus:  dim('socialStatus',  damped),
    creativity:    dim('creativity',    damped),
    luck:          dim('luck',          damped),
    homeStability: dim('homeStability', damped),
  };

  const validationFlags: ValidationFlags = {
    passed: [
      'deterministic_no_random',
      result.gematria ? `gematria_total=${result.gematria.total}` : 'gematria_skipped',
      result.primarySephirah ? `sephirah=${result.primarySephirah.name}` : 'sephirah_missing',
    ],
    failed: result.derivedFromName ? [] : ['derived_from_birthdate_only'],
    warnings: result.warnings.map((w) => `${w.code}: ${w.message}`),
  };

  const eventCandidates: string[] = [];
  if (result.gematria) {
    eventCandidates.push(`Gematria (${result.gematria.source}): ${result.gematria.total} (${result.gematria.letters.length} letters)`);
  }
  if (result.primarySephirah) {
    eventCandidates.push(`Sephirah ${result.primarySephirah.number} ${result.primarySephirah.name} — ${result.primarySephirah.attribute}`);
  }
  if (result.primaryPath) {
    eventCandidates.push(`Path ${result.primaryPath.number} (${result.primaryPath.letterName}): ${result.primaryPath.from} → ${result.primaryPath.to} — ${result.primaryPath.meaning}`);
  }

  return {
    engineName: 'kabbalah',
    engineNameCN: '卡巴拉',
    engineVersion: 'P4.10-core',
    sourceUrls: ['Mispar Hechrachi (standard Hebrew gematria); Tree of Life — 10 Sephirot'],
    sourceGrade: result.sourceGrade,
    ruleSchool: 'Standard gematria; final forms (sofit) take non-final values',
    confidence: normalizeConfidence01(result.confidence),
    computationTimeMs: 0,
    rawInputSnapshot: {
      name: result.input.name ?? null,
      birthYear: result.input.birthYear ?? null,
      birthMonth: result.input.birthMonth ?? null,
      birthDay: result.input.birthDay ?? null,
    },
    fateVector,
    normalizedOutput: {
      gematriaTotal: result.gematria ? String(result.gematria.total) : '-',
      gematriaSource: result.gematria?.source ?? '-',
      sephirahNumber: result.primarySephirah ? String(result.primarySephirah.number) : '-',
      sephirahName: result.primarySephirah?.name ?? '-',
      derivedFromName: String(result.derivedFromName),
      gematriaKatan: result.gematria ? String(result.gematria.katan) : '-',
      gematriaSiduri: result.gematria ? String(result.gematria.siduri) : '-',
      pathNumber: result.primaryPath ? String(result.primaryPath.number) : '-',
      pathLetter: result.primaryPath ? `${result.primaryPath.letterName} (${result.primaryPath.letter})` : '-',
      pathRoute: result.primaryPath ? `${result.primaryPath.from} → ${result.primaryPath.to}` : '-',
      pathMeaning: result.primaryPath?.meaning ?? '-',
      implementationStatus: result.implementationStatus,
    },
    warnings: result.warnings.map((w) => `${w.code}: ${w.message}`),
    uncertaintyNotes: [
      'Final forms (ך ם ן ף ץ) use standard non-final values. Mispar Gadol variant (500..900) not implemented.',
      'Latin → Hebrew transliteration is a coarse phonetic map. For authentic gematria supply Hebrew letters.',
      'Primary path uses Golden Dawn letter→path attribution; other schools (Ari, Gra) assign letters differently.',
      result.derivedFromName
        ? null
        : 'Result derived from birth date only because no name was supplied — this is NOT a complete Kabbalistic profile.',
    ].filter((s): s is string => s != null),
    timingBasis: 'birth',
    explanationTrace: [
      ...result.explanationTrace.map((s) => `[${s.rule}] ${s.detail}`),
      ...trace.map((t) => `[kabbalah.fateVector] ${t}`),
    ],
    completenessScore: result.completenessScore,
    validationFlags,
    timeWindows: [],
    aspectScores: {
      gematriaTotal: result.gematria?.total ?? 0,
      sephirahNumber: result.primarySephirah?.number ?? 0,
      derivedFromName: result.derivedFromName ? 1 : 0,
      pathNumber: result.primaryPath?.number ?? 0,
      gematriaKatan: result.gematria?.katan ?? 0,
      gematriaSiduri: result.gematria?.siduri ?? 0,
    },
    eventCandidates,
  };
}
