/**
 * P6 — Prediction Verification Ledger scoring (pure, deterministic).
 *
 * Scores each engine against user-reported actuals (the absolute source of
 * truth). An engine "claims" a domain when it produced a time window covering
 * the event age for that dimension, or — lacking a window — when its fate
 * vector takes a clear directional stance (≥60 positive / ≤40 negative).
 */
import type { FateDimension, FateVector, TimeWindow } from '@/types/prediction';

export interface LedgerEngineRecord {
  engineName: string;
  engineNameCN: string;
  implementationStatus: string;
  sourceGrade: string;
  rawConfidence: number;
  cappedConfidence: number;
  warnings: string[];
  fateVector: FateVector;
  timeWindows: TimeWindow[];
  explanationTrace: string[];
}

export interface LedgerRun {
  id: string;
  predictionId: string;
  birthYear: number;
  engineRecords: LedgerEngineRecord[];
}

export interface LedgerActual {
  runId: string;
  eventDate: string; // ISO yyyy-mm-dd
  domain: FateDimension;
  magnitude: number; // 1-10
  polarity: -1 | 0 | 1;
}

export interface EngineScore {
  engineName: string;
  engineNameCN: string;
  claims: number;
  hits: number;
  hitRate: number; // 0-1
  avgCappedConfidence: number; // 0-1
  /** |avgCappedConfidence − hitRate| — lower is better calibrated */
  calibrationGap: number;
  byDomain: Record<string, { claims: number; hits: number }>;
}

function windowHit(trend: TimeWindow['trend'], polarity: number): boolean {
  if (polarity > 0) return trend === 'rising';
  if (polarity < 0) return trend === 'declining';
  return trend === 'stable';
}

function vectorClaim(score: number, polarity: number): 'hit' | 'miss' | 'none' {
  if (score >= 60) return polarity > 0 ? 'hit' : 'miss';
  if (score <= 40) return polarity < 0 ? 'hit' : 'miss';
  return 'none';
}

export function scoreLedger(runs: LedgerRun[], actuals: LedgerActual[]): EngineScore[] {
  const byRun = new Map(runs.map(r => [r.id, r]));
  const acc = new Map<string, EngineScore & { confSum: number; confN: number }>();

  const getAcc = (rec: LedgerEngineRecord) => {
    let s = acc.get(rec.engineName);
    if (!s) {
      s = {
        engineName: rec.engineName,
        engineNameCN: rec.engineNameCN,
        claims: 0, hits: 0, hitRate: 0,
        avgCappedConfidence: 0, calibrationGap: 0,
        byDomain: {}, confSum: 0, confN: 0,
      };
      acc.set(rec.engineName, s);
    }
    return s;
  };

  for (const run of runs) {
    for (const rec of run.engineRecords) {
      const s = getAcc(rec);
      s.confSum += rec.cappedConfidence;
      s.confN += 1;
    }
  }

  for (const actual of actuals) {
    const run = byRun.get(actual.runId);
    if (!run) continue;
    const eventYear = Number(actual.eventDate.slice(0, 4));
    if (!Number.isFinite(eventYear)) continue;
    const age = eventYear - run.birthYear;

    for (const rec of run.engineRecords) {
      const windows = (rec.timeWindows ?? []).filter(
        w => w.dimension === actual.domain && age >= w.startAge && age <= w.endAge,
      );
      let claimed = false;
      let hit = false;
      if (windows.length > 0) {
        claimed = true;
        hit = windows.some(w => windowHit(w.trend, actual.polarity));
      } else {
        const score = rec.fateVector?.[actual.domain];
        if (typeof score === 'number') {
          const verdict = vectorClaim(score, actual.polarity);
          if (verdict !== 'none') {
            claimed = true;
            hit = verdict === 'hit';
          }
        }
      }
      if (!claimed) continue;
      const s = getAcc(rec);
      s.claims += 1;
      if (hit) s.hits += 1;
      const d = (s.byDomain[actual.domain] ??= { claims: 0, hits: 0 });
      d.claims += 1;
      if (hit) d.hits += 1;
    }
  }

  return [...acc.values()]
    .map(({ confSum, confN, ...s }) => {
      const avg = confN > 0 ? confSum / confN : 0;
      const hitRate = s.claims > 0 ? s.hits / s.claims : 0;
      return {
        ...s,
        hitRate,
        avgCappedConfidence: avg,
        calibrationGap: s.claims > 0 ? Math.abs(avg - hitRate) : 0,
      };
    })
    .sort((a, b) => b.claims - a.claims || a.engineName.localeCompare(b.engineName));
}
