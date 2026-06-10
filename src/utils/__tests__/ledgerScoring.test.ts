import { describe, expect, it } from 'vitest';
import { scoreLedger, type LedgerEngineRecord, type LedgerRun } from '../ledgerScoring';
import { normalizeConfidence01 } from '@/core/shared/confidence';
import type { FateVector } from '@/types/prediction';

const baseVector: FateVector = {
  life: 50, wealth: 50, relation: 50, health: 50, wisdom: 50,
  spirit: 50, socialStatus: 50, creativity: 50, luck: 50, homeStability: 50,
};

function rec(over: Partial<LedgerEngineRecord>): LedgerEngineRecord {
  return {
    engineName: 'bazi',
    engineNameCN: '八字',
    implementationStatus: 'complete',
    sourceGrade: 'A',
    rawConfidence: 0.8,
    cappedConfidence: 0.8,
    warnings: [],
    fateVector: { ...baseVector },
    timeWindows: [],
    explanationTrace: [],
    ...over,
  };
}

describe('normalizeConfidence01', () => {
  it('passes through 0-1 values and clamps', () => {
    expect(normalizeConfidence01(0.72)).toBe(0.72);
    expect(normalizeConfidence01(0)).toBe(0);
    expect(normalizeConfidence01(1)).toBe(1);
    expect(normalizeConfidence01(-0.5)).toBe(0);
  });
  it('treats values >1 as percentages', () => {
    expect(normalizeConfidence01(85)).toBeCloseTo(0.85, 10);
    expect(normalizeConfidence01(100)).toBe(1);
    expect(normalizeConfidence01(150)).toBe(1);
  });
  it('returns 0 for non-finite input', () => {
    expect(normalizeConfidence01(NaN)).toBe(0);
    expect(normalizeConfidence01(Infinity)).toBe(0);
  });
});

describe('scoreLedger', () => {
  const run: LedgerRun = {
    id: 'run1',
    predictionId: 'p1',
    birthYear: 1990,
    engineRecords: [
      rec({
        engineName: 'bazi',
        engineNameCN: '八字',
        timeWindows: [
          { dimension: 'wealth', startAge: 30, endAge: 39, confidence: 0.7, trend: 'rising', evidence: 'x' },
        ],
      }),
      rec({
        engineName: 'ziwei',
        engineNameCN: '紫微',
        cappedConfidence: 0.6,
        fateVector: { ...baseVector, wealth: 70 },
      }),
    ],
  };

  it('scores window-covered claims as hits when trend matches polarity', () => {
    const scores = scoreLedger([run], [
      { runId: 'run1', eventDate: '2022-05-01', domain: 'wealth', magnitude: 7, polarity: 1 },
    ]);
    const bazi = scores.find(s => s.engineName === 'bazi')!;
    expect(bazi.claims).toBe(1);
    expect(bazi.hits).toBe(1);
    expect(bazi.hitRate).toBe(1);
    // ziwei has no covering window but vector ≥60 → directional claim hit
    const ziwei = scores.find(s => s.engineName === 'ziwei')!;
    expect(ziwei.claims).toBe(1);
    expect(ziwei.hits).toBe(1);
  });

  it('counts misses when polarity contradicts trend', () => {
    const scores = scoreLedger([run], [
      { runId: 'run1', eventDate: '2022-05-01', domain: 'wealth', magnitude: 5, polarity: -1 },
    ]);
    const bazi = scores.find(s => s.engineName === 'bazi')!;
    expect(bazi.claims).toBe(1);
    expect(bazi.hits).toBe(0);
    expect(bazi.calibrationGap).toBeCloseTo(0.8, 10);
  });

  it('ignores actuals for unknown runs and neutral vectors make no claim', () => {
    const scores = scoreLedger([run], [
      { runId: 'missing', eventDate: '2022-05-01', domain: 'wealth', magnitude: 5, polarity: 1 },
      { runId: 'run1', eventDate: '2022-05-01', domain: 'health', magnitude: 5, polarity: 1 },
    ]);
    // health: no windows, vector 50 (neutral) → no claims
    expect(scores.every(s => s.claims === 0)).toBe(true);
  });

  it('is deterministic', () => {
    const actuals = [
      { runId: 'run1', eventDate: '2022-05-01', domain: 'wealth' as const, magnitude: 7, polarity: 1 as const },
    ];
    expect(scoreLedger([run], actuals)).toEqual(scoreLedger([run], actuals));
  });
});
