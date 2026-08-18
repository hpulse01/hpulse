/**
 * P4.3 — generateTiebanReport.
 *
 * Builds a structured destiny report from a calibrated Tieban calculation.
 * For each section, it:
 *   1. Projects the requested clause id via `projectPalaceClauseId`.
 *   2. Looks up the clause via the caller-supplied async provider.
 *   3. Records exact / fallback / no-match transparently.
 *   4. Surfaces sensitive keyword flags in neutral language.
 *
 * Pure logic — no clock reads, no randomness. The clause provider is the
 * only side-effecting collaborator (typically wraps SupabaseService).
 */

import type { ExplanationStep, AstroWarning, SourceGrade } from '../astro-time/types';
import {
  PALACE_OFFSETS,
  SECTION_SPECS,
  SENSITIVE_KEYWORDS,
} from './constants';
import { findClause, type ClauseLookup } from './clauseMapping';
import { containsHighRiskPersonalOutcome, PUBLIC_CLAUSE_REDACTION } from './sensitiveContent';
import { projectPalaceClauseId } from './systemOffset';
import type {
  CalibrationResult,
  ClauseMatch,
  DestinySection,
  ImplementationStatus,
  QuarterKeResult,
  TheoreticalBaseResult,
  TiebanFullReport,
} from './types';

export type AsyncClauseProvider = (clauseNumber: number) => Promise<{ content: unknown } | null>;

export interface GenerateTiebanReportOptions {
  /** Used to fetch clause content; may consult Supabase, local cache, etc. */
  asyncClauseProvider?: AsyncClauseProvider;
  /** Sync provider for testability. If both provided, async wins. */
  clauseProvider?: ClauseLookup;
  /** How far to scan for fallback clauses. Default 25. */
  searchRadius?: number;
  /** Snapshot of the original input, retained verbatim in the report. */
  inputSnapshot?: Record<string, unknown>;
  /** Optional implementation-status override. Default: needs_source_validation. */
  implementationStatus?: ImplementationStatus;
}

function neutralInterpretation(content: unknown, sensitive: boolean): string {
  if (content == null) return '此条文暂未收录，无法给出解读。';
  const text = String(content).trim();
  if (!text) return '此条文暂未收录，无法给出解读。';
  if (sensitive) {
    return `${text}\n\n（说明：此为铁板神数原文译述，仅作命理参考。涉及健康/灾厄/婚姻等内容请理性看待，不构成医疗、法律或行动建议。）`;
  }
  return text;
}

function detectSensitiveFlags(content: unknown): string[] {
  if (content == null) return [];
  const text = String(content);
  const flags: string[] = [];
  for (const [category, keywords] of Object.entries(SENSITIVE_KEYWORDS)) {
    if (keywords.some((kw) => text.includes(kw))) flags.push(category);
  }
  return flags;
}

function confidenceFor(match: ClauseMatch, baseConfidence: number): number {
  if (match.exactMatch) return baseConfidence;
  if (match.fallbackReason === 'NEAREST_NEIGHBOR') {
    const dist = match.fallbackDistance ?? 0;
    return Math.max(20, Math.round(baseConfidence - Math.min(40, dist * 2)));
  }
  if (match.fallbackReason === 'PALACE_BOUNDARY_CLAMP') return Math.round(baseConfidence * 0.6);
  return 15; // NO_MATCH
}

function makeSyncProviderFromAsync(
  async: AsyncClauseProvider,
  cache: Map<number, { content: unknown } | null>,
): ClauseLookup {
  return (n) => (cache.has(n) ? cache.get(n) ?? null : null);
}

async function prefetchClausesForSection(
  requested: number,
  radius: number,
  async: AsyncClauseProvider,
  cache: Map<number, { content: unknown } | null>,
): Promise<void> {
  const ids: number[] = [requested];
  for (let d = 1; d <= radius; d++) {
    ids.push(requested + d, requested - d);
  }
  await Promise.all(
    ids.map(async (id) => {
      if (cache.has(id)) return;
      try {
        const v = await async(id);
        cache.set(id, v);
      } catch {
        cache.set(id, null);
      }
    }),
  );
}

export async function generateTiebanReport(
  base: TheoreticalBaseResult,
  quarterKe: QuarterKeResult,
  calibration: CalibrationResult,
  options: GenerateTiebanReportOptions = {},
): Promise<TiebanFullReport> {
  const radius = options.searchRadius ?? 25;
  const cache = new Map<number, { content: unknown } | null>();

  const sections: DestinySection[] = [];
  const lookups: ClauseMatch[] = [];
  const explanationTrace: ExplanationStep[] = [];
  const warnings: AstroWarning[] = [...calibration.warnings];
  const sensitiveFlagsAll = new Set<string>();

  for (const spec of SECTION_SPECS) {
    const palaceOffset = PALACE_OFFSETS[spec.palace];
    const requested = projectPalaceClauseId(
      base.theoreticalBase,
      calibration.systemOffset,
      palaceOffset,
    );

    let provider: ClauseLookup;
    if (options.asyncClauseProvider) {
      await prefetchClausesForSection(requested, radius, options.asyncClauseProvider, cache);
      provider = makeSyncProviderFromAsync(options.asyncClauseProvider, cache);
    } else if (options.clauseProvider) {
      provider = options.clauseProvider;
    } else {
      provider = () => null;
    }

    const rawMatch = findClause(requested, provider, { searchRadius: radius });
    const highRiskContentExcluded = containsHighRiskPersonalOutcome(rawMatch.payload);
    const match: ClauseMatch = highRiskContentExcluded
      ? { ...rawMatch, payload: undefined }
      : rawMatch;
    lookups.push(match);

    const sensitiveFlags = spec.sensitive ? detectSensitiveFlags(match.payload) : [];
    if (spec.sensitive && spec.sensitiveCategory) sensitiveFlags.push(spec.sensitiveCategory);
    if (highRiskContentExcluded) sensitiveFlags.push('high_risk_personal_outcome_excluded');
    sensitiveFlags.forEach((f) => sensitiveFlagsAll.add(f));

    const baseConf = calibration.confirmedClauseId != null ? 80 : 55;
    const sectionConfidence = confidenceFor(match, baseConf);

    const sectionTrace: ExplanationStep[] = [
      {
        rule: 'tieban.report.requestedClause',
        detail: `${spec.nameCN}：theoreticalBase + systemOffset → ${spec.palace} 宫 → 条文 ${requested}`,
        data: {
          section: spec.key,
          palace: spec.palace,
          palaceOffset,
          theoreticalBase: base.theoreticalBase,
          systemOffset: calibration.systemOffset,
          requestedClauseNumber: requested,
        },
      },
      {
        rule: 'tieban.report.clauseLookup',
        detail: match.exactMatch
          ? `精确命中条文 ${match.matchedClauseNumber}。`
          : match.fallbackReason === 'NO_MATCH'
            ? `条文 ${requested} 未收录，且 ±${radius} 范围内无回退条文。`
            : `条文 ${requested} 未收录，回退到 ${match.matchedClauseNumber} (距离 ${match.fallbackDistance})。`,
        data: { ...match, payload: undefined },
      },
    ];
    explanationTrace.push(...sectionTrace);

    if (!match.exactMatch && match.fallbackReason !== 'NO_MATCH') {
      warnings.push({
        code: 'TIEBAN_FALLBACK_USED',
        message: `${spec.nameCN}: 请求条文 ${requested}，回退到 ${match.matchedClauseNumber} (距离 ${match.fallbackDistance})。`,
        severity: 'warning',
      });
    } else if (match.fallbackReason === 'NO_MATCH') {
      warnings.push({
        code: 'TIEBAN_CLAUSE_MISSING',
        message: `${spec.nameCN}: 条文 ${requested} 缺失，已透明标记 unavailable，不伪造命中。`,
        severity: 'warning',
      });
    }
    if (highRiskContentExcluded) {
      warnings.push({
        code: 'TIEBAN_HIGH_RISK_CONTENT_EXCLUDED',
        message: `${spec.nameCN}: 原始条文包含不适合公开呈现的高风险个人结论，已屏蔽。`,
        severity: 'warning',
      });
    }

    sections.push({
      sectionKey: spec.key,
      sectionName: spec.nameCN,
      palace: spec.palace,
      requestedClauseNumber: requested,
      clauseLookup: match,
      interpretation: highRiskContentExcluded
        ? PUBLIC_CLAUSE_REDACTION
        : neutralInterpretation(match.payload, !!spec.sensitive),
      sensitiveFlags,
      confidence: sectionConfidence,
      explanationTrace: sectionTrace,
    });
  }

  // Aggregate metrics
  const exactCount = lookups.filter((m) => m.exactMatch).length;
  const fallbackCount = lookups.filter((m) => !m.exactMatch && m.fallbackReason !== 'NO_MATCH').length;
  const missingCount = lookups.filter((m) => m.fallbackReason === 'NO_MATCH').length;

  const completenessScore = Math.round(((exactCount + fallbackCount * 0.5) / lookups.length) * 100);
  const confidence = Math.round(
    sections.reduce((sum, s) => sum + s.confidence, 0) / sections.length,
  );

  let sourceGrade: SourceGrade;
  if (calibration.confirmedClauseId == null) sourceGrade = 'D';
  else if (missingCount > 0) sourceGrade = 'D';
  else if (fallbackCount > 0) sourceGrade = 'C';
  else sourceGrade = 'B'; // We do NOT claim 'A' until the formula has source validation.

  const implementationStatus: ImplementationStatus =
    options.implementationStatus ?? 'needs_source_validation';

  const validationFlags = {
    passed: [
      'deterministic_no_random',
      'deterministic_no_clock',
      `clauses_lookup_count=${lookups.length}`,
      `clauses_exact=${exactCount}`,
    ],
    failed: missingCount > 0 ? [`clauses_missing=${missingCount}`] : [],
    warnings: [
      ...(fallbackCount > 0 ? [`clauses_fallback=${fallbackCount}`] : []),
      ...(calibration.confirmedClauseId == null ? ['kaoke_skipped'] : []),
    ],
  };

  const uncertaintyNotes: string[] = [];
  if (implementationStatus === 'needs_source_validation') {
    uncertaintyNotes.push('当前 theoreticalBase 公式尚未完成古籍文献交叉校验，标记为 needs_source_validation。');
  }
  if (fallbackCount > 0) uncertaintyNotes.push(`${fallbackCount} 个 section 使用 fallback 条文，相关结论置信度已下调。`);
  if (missingCount > 0) uncertaintyNotes.push(`${missingCount} 个 section 条文缺失，已透明标记 unavailable。`);

  explanationTrace.push({
    rule: 'tieban.report.aggregate',
    detail: `合计 ${lookups.length} 条 lookup：精确 ${exactCount}，回退 ${fallbackCount}，缺失 ${missingCount}。sourceGrade=${sourceGrade}`,
    data: { exactCount, fallbackCount, missingCount, sourceGrade, completenessScore, confidence },
  });

  return {
    inputSnapshot: options.inputSnapshot ?? {},
    baseResult: base,
    quarterKe,
    calibration,
    clauseLookups: lookups,
    destinySections: sections,
    sensitiveFlags: Array.from(sensitiveFlagsAll),
    implementationStatus,
    sourceGrade,
    confidence,
    completenessScore,
    warnings,
    uncertaintyNotes,
    explanationTrace,
    validationFlags,
  };
}
