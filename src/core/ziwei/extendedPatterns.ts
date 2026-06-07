/**
 * P4.4b — Extended pattern detection.
 *
 * Bridges the rich 100+ pattern rule-set from `external/ziwei/patterns.ts`
 * (倪师 / hpulse01) into our internal `ZiweiPattern` shape, augmenting the
 * smaller built-in `detectPatterns` set without removing it.
 */

import type { ExplanationStep } from '../astro-time/types';
import type { ZiweiChart, ZiweiPattern } from './types';
import { adaptToExternal } from './externalAdapter';
import { detectPatterns as externalDetect, type Pattern as ExternalPattern } from './external/ziwei/patterns';

function mapLevel(level: ExternalPattern['level']): {
  type: ZiweiPattern['type'];
  impact: number;
} {
  switch (level) {
    case 'excellent': return { type: '吉格', impact: 9 };
    case 'good':      return { type: '吉格', impact: 6 };
    case 'caution':   return { type: '凶格', impact: -6 };
    case 'neutral':
    default:          return { type: '特殊格', impact: 0 };
  }
}

export function detectExtendedPatterns(chart: ZiweiChart): {
  patterns: ZiweiPattern[];
  explanationTrace: ExplanationStep[];
} {
  const trace: ExplanationStep[] = [];
  let externalPatterns: ExternalPattern[] = [];
  try {
    const adapted = adaptToExternal(chart);
    externalPatterns = externalDetect(adapted);
  } catch (err) {
    trace.push({
      rule: 'ziwei.pattern.external.error',
      detail: `external pattern detector failed: ${(err as Error)?.message ?? err}`,
      data: {},
    });
    return { patterns: [], explanationTrace: trace };
  }

  const out: ZiweiPattern[] = externalPatterns.map((p) => {
    const { type, impact } = mapLevel(p.level);
    const evidence = [
      ...(p.conditions?.required ?? []),
      ...(p.conditions?.bonus?.map(b => `+ ${b}`) ?? []),
      ...(p.conditions?.breaking?.map(b => `- ${b}`) ?? []),
    ];
    return {
      name: p.name,
      type,
      description: p.description,
      palaces: p.palaces,
      impact,
      evidence,
      explanationTrace: [{
        rule: 'ziwei.pattern.external',
        detail: `${p.name} (${p.level}) source=${p.source ?? '—'}`,
        data: {
          name: p.name,
          level: p.level,
          source: p.source,
          conditions: p.conditions,
        },
      }],
    };
  });

  trace.push({
    rule: 'ziwei.pattern.external.summary',
    detail: `external 检测到 ${out.length} 个格局`,
    data: { count: out.length, names: out.map(o => o.name) },
  });
  return { patterns: out, explanationTrace: trace };
}

/** De-duplicate by pattern name — extended set wins (richer source). */
export function mergePatterns(base: ZiweiPattern[], extended: ZiweiPattern[]): ZiweiPattern[] {
  const seen = new Set<string>();
  const out: ZiweiPattern[] = [];
  for (const p of [...extended, ...base]) {
    if (seen.has(p.name)) continue;
    seen.add(p.name);
    out.push(p);
  }
  return out;
}
