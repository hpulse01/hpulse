/**
 * implementationAudit — given a set of EngineOutput results, classify
 * which engines are complete / partial / needs_source_validation /
 * at risk, and produce a structured audit report.
 */
import type { EngineOutput } from '@/types/prediction';
import { validateEngineOutput, getImplementationStatus } from './validation';
import { auditConfidence } from './confidence';
import { checkExplanation } from './explanation';

export type EngineStatus = 'complete' | 'partial' | 'needs_source_validation' | 'unknown';

export interface EngineAuditEntry {
  engineName: string;
  engineNameCN?: string;
  status: EngineStatus;
  sourceGrade: string;
  rawConfidence: number;
  cappedConfidence: number;
  completenessScore: number;
  warningsCount: number;
  explanationOk: boolean;
  outputOk: boolean;
  risks: string[];
}

export interface ImplementationAuditReport {
  generatedAt: string;
  totalEngines: number;
  complete: string[];
  partial: string[];
  needsSourceValidation: string[];
  unknown: string[];
  atRisk: EngineAuditEntry[];
  entries: EngineAuditEntry[];
  /** True when no engine has structural errors AND every partial engine
   *  has a properly capped confidence. Required to advance to P5. */
  readyForP5: boolean;
  blockers: string[];
}

export function auditEngineOutputs(outputs: EngineOutput[]): ImplementationAuditReport {
  const entries: EngineAuditEntry[] = [];
  const complete: string[] = [];
  const partial: string[] = [];
  const nsv: string[] = [];
  const unknown: string[] = [];
  const blockers: string[] = [];

  for (const eo of outputs) {
    const status = getImplementationStatus(eo);
    const v = validateEngineOutput(eo);
    const c = auditConfidence(eo);
    const ex = checkExplanation(eo);
    const risks: string[] = [];

    if (!v.ok) risks.push(...v.issues.filter(i => i.severity === 'error').map(i => `output:${i.field}`));
    if (!ex.ok) risks.push(...ex.problems.map(p => `trace:${p}`));
    if (status === 'partial' && c.rawConfidence > 0.65) risks.push('partial:confidence>0.65');
    if (status === 'needs_source_validation' && c.rawConfidence > 0.45) risks.push('nsv:confidence>0.45');
    if ((eo.warnings?.length ?? 0) === 0 && status !== 'complete') {
      risks.push(`status=${status} but warnings=0`);
    }

    const entry: EngineAuditEntry = {
      engineName: eo.engineName,
      engineNameCN: eo.engineNameCN,
      status,
      sourceGrade: String(eo.sourceGrade),
      rawConfidence: c.rawConfidence,
      cappedConfidence: c.cappedConfidence,
      completenessScore: eo.completenessScore ?? 0,
      warningsCount: eo.warnings?.length ?? 0,
      explanationOk: ex.ok,
      outputOk: v.ok,
      risks,
    };
    entries.push(entry);

    if (status === 'complete') complete.push(eo.engineName);
    else if (status === 'partial') partial.push(eo.engineName);
    else if (status === 'needs_source_validation') nsv.push(eo.engineName);
    else unknown.push(eo.engineName);

    if (!v.ok) blockers.push(`${eo.engineName}: invalid EngineOutput`);
  }

  const atRisk = entries.filter(e => e.risks.length > 0);
  const readyForP5 = blockers.length === 0
    && entries.every(e => e.outputOk && e.explanationOk);

  return {
    generatedAt: new Date(0).toISOString(), // deterministic; report is timestamped externally if needed
    totalEngines: outputs.length,
    complete,
    partial,
    needsSourceValidation: nsv,
    unknown,
    atRisk,
    entries,
    readyForP5,
    blockers,
  };
}
