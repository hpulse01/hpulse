/**
 * P6 — Prediction Verification Ledger service.
 *
 * Persists every unified prediction run (engine outputs with cappedConfidence,
 * implementationStatus, sourceGrade, warnings, trace) and user-reported
 * actuals. Writes are blocked when the implementation audit reports blockers.
 * RLS keeps all rows private to the owning user.
 */
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import type { EngineOutput, FateDimension, UnifiedPredictionResult } from '@/types/prediction';
import { auditEngineOutputs } from '@/core/shared/implementationAudit';
import { auditSingleEngineOutput } from '@/core/shared/auditEngineOutput';
import type { LedgerActual, LedgerEngineRecord, LedgerRun } from '@/utils/ledgerScoring';

export interface SaveRunResult {
  saved: boolean;
  reason: 'ok' | 'not_authenticated' | 'audit_blocked' | 'duplicate' | 'error';
  blockers?: string[];
  error?: string;
}

export interface PredictionRunRow {
  id: string;
  predictionId: string;
  algorithmVersion: string;
  queryType: string;
  birthYear: number;
  finalConfidence: number;
  generatedAt: string;
  auditBlockers: string[];
  engineRecords: LedgerEngineRecord[];
}

export interface PredictionActualRow extends LedgerActual {
  id: string;
  note: string | null;
}

function buildEngineRecords(outputs: EngineOutput[]): LedgerEngineRecord[] {
  return outputs.map(eo => {
    const audit = auditSingleEngineOutput(eo);
    return {
      engineName: eo.engineName,
      engineNameCN: eo.engineNameCN,
      implementationStatus: audit.status,
      sourceGrade: eo.sourceGrade,
      rawConfidence: audit.rawConfidence,
      cappedConfidence: audit.cappedConfidence,
      warnings: eo.warnings ?? [],
      fateVector: eo.fateVector,
      timeWindows: eo.timeWindows ?? [],
      explanationTrace: eo.explanationTrace ?? [],
    };
  });
}

/** Archive a unified prediction run. No-op when not logged in or audit-blocked. */
export async function savePredictionRun(result: UnifiedPredictionResult): Promise<SaveRunResult> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { saved: false, reason: 'not_authenticated' };

  const audit = auditEngineOutputs(result.engineOutputs);
  if (audit.blockers.length > 0) {
    return { saved: false, reason: 'audit_blocked', blockers: audit.blockers };
  }

  const { error } = await supabase.from('prediction_runs').insert({
    user_id: user.id,
    prediction_id: result.predictionId,
    algorithm_version: result.algorithmVersion,
    query_type: result.input.queryType,
    birth_input: {
      birthLocalDateTime: result.input.birthLocalDateTime,
      gender: result.input.gender,
      normalizedLocationName: result.input.normalizedLocationName,
      timezoneIana: result.input.timezoneIana,
    } as unknown as Json,
    final_confidence: result.finalConfidence,
    fused_fate_vector: result.fusedFateVector as unknown as Json,
    engine_records: buildEngineRecords(result.engineOutputs) as unknown as Json,
    audit_blockers: audit.blockers as unknown as Json,
    generated_at: result.generatedAt,
  });

  if (error) {
    if (error.code === '23505') return { saved: false, reason: 'duplicate' };
    return { saved: false, reason: 'error', error: error.message };
  }
  return { saved: true, reason: 'ok' };
}

export async function listPredictionRuns(): Promise<PredictionRunRow[]> {
  const { data, error } = await supabase
    .from('prediction_runs')
    .select('*')
    .order('generated_at', { ascending: false });
  if (error || !data) return [];
  return data.map(row => {
    const birth = row.birth_input as { birthLocalDateTime?: { year?: number } } | null;
    return {
      id: row.id,
      predictionId: row.prediction_id,
      algorithmVersion: row.algorithm_version,
      queryType: row.query_type,
      birthYear: birth?.birthLocalDateTime?.year ?? 0,
      finalConfidence: Number(row.final_confidence),
      generatedAt: row.generated_at,
      auditBlockers: (row.audit_blockers as string[] | null) ?? [],
      engineRecords: (row.engine_records as unknown as LedgerEngineRecord[] | null) ?? [],
    };
  });
}

export async function listPredictionActuals(): Promise<PredictionActualRow[]> {
  const { data, error } = await supabase
    .from('prediction_actuals')
    .select('*')
    .order('event_date', { ascending: false });
  if (error || !data) return [];
  return data.map(row => ({
    id: row.id,
    runId: row.run_id,
    eventDate: row.event_date,
    domain: row.domain as FateDimension,
    magnitude: row.magnitude,
    polarity: row.polarity as -1 | 0 | 1,
    note: row.note,
  }));
}

export async function addPredictionActual(input: {
  runId: string;
  eventDate: string;
  domain: FateDimension;
  magnitude: number;
  polarity: -1 | 0 | 1;
  note?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'not_authenticated' };
  const { error } = await supabase.from('prediction_actuals').insert({
    run_id: input.runId,
    user_id: user.id,
    event_date: input.eventDate,
    domain: input.domain,
    magnitude: input.magnitude,
    polarity: input.polarity,
    note: input.note ?? null,
  });
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function deletePredictionActual(id: string): Promise<boolean> {
  const { error } = await supabase.from('prediction_actuals').delete().eq('id', id);
  return !error;
}

export async function deletePredictionRun(id: string): Promise<boolean> {
  const { error } = await supabase.from('prediction_runs').delete().eq('id', id);
  return !error;
}

export function runsToLedger(runs: PredictionRunRow[]): LedgerRun[] {
  return runs.map(r => ({
    id: r.id,
    predictionId: r.predictionId,
    birthYear: r.birthYear,
    engineRecords: r.engineRecords,
  }));
}
