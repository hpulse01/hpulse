/**
 * P4.3 — Generate the 8 quarter-ke candidates for 校时.
 *
 * Each candidate represents one of the 8 possible 刻 within a 时辰 and
 * carries the clause it would map to, so the user can compare against
 * 六亲 facts to pick the right one.
 */

import type { ExplanationStep } from '../astro-time/types';
import { TiebanEngine } from '../../utils/tiebanAlgorithm';
import type { QuarterKeCandidate, QuarterKeResult } from './types';

const KE_SHIFT_TABLE = [
  { index: 0, offset: 0,   label: '一刻 (初刻)', timeRange: '0-15分' },
  { index: 1, offset: 15,  label: '二刻',       timeRange: '15-30分' },
  { index: 2, offset: 30,  label: '三刻',       timeRange: '30-45分' },
  { index: 3, offset: 45,  label: '四刻',       timeRange: '45-60分' },
  { index: 4, offset: 60,  label: '五刻',       timeRange: '60-75分' },
  { index: 5, offset: 75,  label: '六刻',       timeRange: '75-90分' },
  { index: 6, offset: 90,  label: '七刻',       timeRange: '90-105分' },
  { index: 7, offset: 105, label: '八刻 (末刻)', timeRange: '105-120分' },
] as const;

export function calculateQuarterKe(legacyBaseNumber: number): QuarterKeResult {
  const legacyCandidates = TiebanEngine.generateKaoKeCandidates(legacyBaseNumber);
  const candidates: QuarterKeCandidate[] = legacyCandidates.map((c) => {
    const ke = KE_SHIFT_TABLE[c.keIndex];
    return {
      quarterIndex: c.quarterIndex,
      label: ke.label,
      timeRange: ke.timeRange,
      keOffset: ke.offset,
      clauseNumber: c.clauseNumber,
    };
  });

  const trace: ExplanationStep[] = [
    {
      rule: 'tieban.quarter.candidates',
      detail: '由 baseNumber 与 KE_SHIFT_TABLE (8 刻 × 15 分) 推得 8 个候选条文，附 PARENTS 宫偏移。',
      data: {
        baseNumber: legacyBaseNumber,
        candidateCount: candidates.length,
        clauseNumbers: candidates.map((c) => c.clauseNumber),
      },
    },
  ];

  return { candidates, explanationTrace: trace };
}
