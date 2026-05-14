/**
 * Explanation trace utilities — enforce non-empty, non-vacuous traces.
 */
import type { EngineOutput } from '@/types/prediction';

const VACUOUS_PATTERNS: RegExp[] = [
  /^(ok|done|n\/a|tbd|todo|placeholder|lorem)\b/i,
  /^[\s.\-_]*$/,
];

export interface ExplanationCheck {
  ok: boolean;
  problems: string[];
  steps: number;
}

export function checkExplanation(eo: EngineOutput): ExplanationCheck {
  const problems: string[] = [];
  const trace = eo.explanationTrace ?? [];
  if (!Array.isArray(trace) || trace.length === 0) {
    return { ok: false, problems: ['explanationTrace empty'], steps: 0 };
  }
  if (trace.length < 2) problems.push('trace has <2 steps');
  for (let i = 0; i < trace.length; i++) {
    const s = String(trace[i] ?? '');
    if (s.trim().length < 4) {
      problems.push(`step[${i}] too short`);
      continue;
    }
    if (VACUOUS_PATTERNS.some(re => re.test(s.trim()))) {
      problems.push(`step[${i}] vacuous: "${s}"`);
    }
  }
  return { ok: problems.length === 0, problems, steps: trace.length };
}
