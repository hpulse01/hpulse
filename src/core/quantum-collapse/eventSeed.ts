/**
 * Quantum Collapse — Event Seed Extraction
 *
 * From every EngineOutput, derive deterministic EventSeeds based on:
 * - eventCandidates (string list from each engine)
 * - timeWindows (structured age/year ranges)
 * - normalizedOutput (engine-specific structured fields)
 * - warnings (treated as low-confidence risk signals)
 *
 * Hard rules:
 *   - Every seed must have sourceEngine + evidence + ageWindow.
 *   - No invention of events without source text.
 *   - sensitiveFlags preserved (never stripped).
 */

import type { EngineOutput, TimeWindow } from '@/types/prediction';
import type {
  AgeWindow, CanonicalCategory, EventSeed, ImplementationStatusKind,
  QuantumCollapseInput, YearWindow,
} from './types';
import { CATEGORY_KEYWORDS, DEFAULT_POLARITY, SEVERITY_LEVELS } from './constants';
import { deterministicId } from './deterministic';
import { annotateSeedSensitive } from './sensitiveEvents';

function inferCategory(text: string): CanonicalCategory {
  const lower = (text ?? '').toLowerCase();
  for (const [cat, kws] of Object.entries(CATEGORY_KEYWORDS) as Array<[CanonicalCategory, string[]]>) {
    if (cat === 'unknown') continue;
    if (kws.some(k => lower.includes(k.toLowerCase()))) return cat;
  }
  return 'unknown';
}

function ageFromYear(year: number, birthYear: number): number {
  return Math.max(0, year - birthYear);
}

function ageWindowFromTimeWindow(tw: TimeWindow): AgeWindow {
  const span = (tw.endAge ?? 0) - (tw.startAge ?? 0);
  const precision: AgeWindow['precision'] = span <= 1 ? 'exact' : span <= 5 ? 'narrow' : span <= 15 ? 'wide' : 'unknown';
  return { earliestAge: tw.startAge ?? 0, latestAge: tw.endAge ?? 110, precision };
}

function yearWindowFromTimeWindow(tw: TimeWindow, birthYear: number): YearWindow | undefined {
  if (typeof tw.startAge === 'number' && typeof tw.endAge === 'number') {
    return { earliestYear: birthYear + tw.startAge, latestYear: birthYear + tw.endAge };
  }
  return undefined;
}

function statusFromOutput(o: EngineOutput): ImplementationStatusKind {
  const norm = (o.normalizedOutput ?? {}) as Record<string, string>;
  const v = norm.implementationStatus;
  if (v === 'complete' || v === 'partial' || v === 'needs_source_validation' || v === 'placeholder_removed') return v;
  return 'unknown';
}

function defaultAgeWindowFromCategory(cat: CanonicalCategory): AgeWindow {
  switch (cat) {
    case 'education': return { earliestAge: 6, latestAge: 25, precision: 'wide' };
    case 'career': return { earliestAge: 22, latestAge: 60, precision: 'wide' };
    case 'wealth': return { earliestAge: 25, latestAge: 65, precision: 'wide' };
    case 'marriage':
    case 'relationship': return { earliestAge: 20, latestAge: 45, precision: 'wide' };
    case 'children': return { earliestAge: 25, latestAge: 45, precision: 'wide' };
    case 'health':
    case 'illness': return { earliestAge: 30, latestAge: 80, precision: 'wide' };
    case 'death': return { earliestAge: 60, latestAge: 95, precision: 'wide' };
    default: return { earliestAge: 0, latestAge: 110, precision: 'unknown' };
  }
}

function severityFor(category: CanonicalCategory, sourceText: string): EventSeed['severity'] {
  const lower = sourceText.toLowerCase();
  if (category === 'death') return 'life_defining';
  if (/critical|major|严重|重大|life-defining/.test(lower)) return 'major';
  if (/minor|轻微|small/.test(lower)) return 'minor';
  return 'moderate';
}

interface Context {
  birthYear: number;
  engineWeight: number;
}

function makeSeedFromText(
  output: EngineOutput,
  text: string,
  fieldPath: string,
  ctx: Context,
  warnings: string[],
): EventSeed {
  const category = inferCategory(text);
  const status = statusFromOutput(output);
  const window = defaultAgeWindowFromCategory(category);
  const seedId = deterministicId('seed', output.engineName, fieldPath, text);
  const eventConfidence = clampUnit(
    (output.confidence ?? 0) * 0.7 + (output.completenessScore ? output.completenessScore / 100 : 0.3) * 0.3,
  );
  const seed: EventSeed = {
    id: seedId,
    sourceEngine: output.engineName,
    sourceEngineCN: output.engineNameCN ?? output.engineName,
    sourceGrade: output.sourceGrade ?? 'C',
    implementationStatus: status,
    category,
    subcategory: '',
    ageWindow: window,
    description: text,
    evidence: text,
    engineConfidence: clampUnit(output.confidence ?? 0),
    engineWeight: clampUnit(ctx.engineWeight),
    eventConfidence,
    severity: severityFor(category, text),
    polarity: DEFAULT_POLARITY[category],
    sensitiveFlags: [],
    affectedDimensions: [],
    supportingSignals: [text],
    opposingSignals: [],
    rawSource: `${output.engineName}.${fieldPath}`,
    explanationTrace: [
      `engine=${output.engineName}`,
      `field=${fieldPath}`,
      `categoryInferred=${category}`,
      `status=${status}`,
      `engineConfidence=${(output.confidence ?? 0).toFixed(3)}`,
    ],
    warnings: [...warnings],
  };
  return annotateSeedSensitive(seed);
}

function makeSeedFromTimeWindow(
  output: EngineOutput,
  tw: TimeWindow,
  index: number,
  ctx: Context,
): EventSeed {
  const evidence = (tw.evidence ?? '').trim();
  const text = evidence || `${output.engineNameCN ?? output.engineName} ${tw.dimension} window ${index + 1} (${tw.trend})`;
  const category = inferCategory(text + ' ' + tw.dimension);
  const ageWindow = ageWindowFromTimeWindow(tw);
  const yearWindow = yearWindowFromTimeWindow(tw, ctx.birthYear);
  const status = statusFromOutput(output);
  const seedId = deterministicId('seed', output.engineName, 'timeWindow', index, text);
  const seed: EventSeed = {
    id: seedId,
    sourceEngine: output.engineName,
    sourceEngineCN: output.engineNameCN ?? output.engineName,
    sourceGrade: output.sourceGrade ?? 'C',
    implementationStatus: status,
    category,
    subcategory: tw.dimension ?? '',
    ageWindow,
    yearWindow,
    description: text,
    evidence: text,
    engineConfidence: clampUnit(output.confidence ?? 0),
    engineWeight: clampUnit(ctx.engineWeight),
    eventConfidence: clampUnit((tw.confidence ?? output.confidence ?? 0)),
    severity: severityFor(category, text),
    polarity: DEFAULT_POLARITY[category],
    sensitiveFlags: [],
    affectedDimensions: [],
    supportingSignals: [text],
    opposingSignals: [],
    rawSource: `${output.engineName}.timeWindows[${index}]`,
    explanationTrace: [
      `engine=${output.engineName}`,
      `timeWindow=${index}`,
      `ageWindow=${ageWindow.earliestAge}-${ageWindow.latestAge}`,
      `precision=${ageWindow.precision}`,
    ],
    warnings: ageWindow.precision === 'unknown' ? ['time window not clearly specified'] : [],
  };
  return annotateSeedSensitive(seed);
}

function clampUnit(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(1, v));
}

export function extractEventSeedsFromEngineOutputs(input: QuantumCollapseInput): EventSeed[] {
  const seeds: EventSeed[] = [];
  const weightMap = new Map(input.weightsUsed.map(w => [w.engineName, w.weight]));

  for (const out of input.engineOutputs) {
    const ctx: Context = {
      birthYear: input.birthYear,
      engineWeight: weightMap.get(out.engineName) ?? 0.5,
    };

    // 1. eventCandidates
    (out.eventCandidates ?? []).forEach((text, idx) => {
      if (typeof text === 'string' && text.trim().length > 0) {
        seeds.push(makeSeedFromText(out, text.trim(), `eventCandidates[${idx}]`, ctx, []));
      }
    });

    // 2. timeWindows
    (out.timeWindows ?? []).forEach((tw, idx) => {
      seeds.push(makeSeedFromTimeWindow(out, tw, idx, ctx));
    });

    // 3. risk warnings — surface as low-confidence negative seeds
    (out.warnings ?? []).forEach((w, idx) => {
      if (typeof w !== 'string' || w.length === 0) return;
      const lower = w.toLowerCase();
      // only escalate to seed if it mentions a category-relevant keyword
      const cat = inferCategory(w);
      if (cat === 'unknown') return;
      const seedId = deterministicId('seed', out.engineName, `warning[${idx}]`, w);
      const ageWindow = defaultAgeWindowFromCategory(cat);
      const seed: EventSeed = {
        id: seedId,
        sourceEngine: out.engineName,
        sourceEngineCN: out.engineNameCN ?? out.engineName,
        sourceGrade: out.sourceGrade ?? 'C',
        implementationStatus: statusFromOutput(out),
        category: cat,
        subcategory: 'warning_signal',
        ageWindow,
        description: w,
        evidence: w,
        engineConfidence: clampUnit((out.confidence ?? 0) * 0.4),
        engineWeight: clampUnit(ctx.engineWeight),
        eventConfidence: 0.25,
        severity: 'moderate',
        polarity: 'negative',
        sensitiveFlags: [],
        affectedDimensions: [],
        supportingSignals: [w],
        opposingSignals: [],
        rawSource: `${out.engineName}.warnings[${idx}]`,
        explanationTrace: [
          `engine=${out.engineName}`,
          'source=warning',
          `lowered to confidence=0.25`,
          `keywordMatched=${lower.slice(0, 32)}`,
        ],
        warnings: ['extracted from engine warning — low confidence signal'],
      };
      seeds.push(annotateSeedSensitive(seed));
    });
  }

  return seeds;
}
