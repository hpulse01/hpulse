/**
 * auditEngineOutput.ts — convenience facade combining
 *   validation + confidence + explanation + registry cross-check.
 *
 * Higher layers should depend on this single entry point instead of
 * re-implementing audit logic.
 */
import type { EngineOutput } from '@/types/prediction';
import { validateEngineOutput, getImplementationStatus } from './validation';
import { auditConfidence } from './confidence';
import { checkExplanation } from './explanation';
import { auditEngineOutputs, type ImplementationAuditReport } from './implementationAudit';
import { getEngineSource } from './algorithmSourceRegistry';
import { normalizeStatus } from './implementationStatus';

export interface SingleEngineAudit {
  engineName: string;
  status: ReturnType<typeof getImplementationStatus>;
  outputOk: boolean;
  outputIssues: string[];
  explanationOk: boolean;
  explanationProblems: string[];
  rawConfidence: number;
  cappedConfidence: number;
  capReasons: string[];
  /** Mismatch between declared status and registry expectation. */
  registryMismatch?: string;
}

export function auditSingleEngineOutput(eo: EngineOutput): SingleEngineAudit {
  const v = validateEngineOutput(eo);
  const c = auditConfidence(eo);
  const ex = checkExplanation(eo);
  const status = getImplementationStatus(eo);

  let registryMismatch: string | undefined;
  const reg = getEngineSource(eo.engineName);
  if (reg) {
    const declared = normalizeStatus(status);
    const expected = normalizeStatus(reg.implementationStatus);
    if (declared === 'complete' && expected !== 'complete') {
      registryMismatch = `engine claims complete but registry says ${expected}`;
    }
    if (eo.sourceGrade && reg.sourceGrade && rank(eo.sourceGrade) < rank(reg.sourceGrade)) {
      registryMismatch = (registryMismatch ? registryMismatch + '; ' : '') +
        `sourceGrade ${eo.sourceGrade} > registry ceiling ${reg.sourceGrade}`;
    }
  }

  return {
    engineName: eo.engineName,
    status,
    outputOk: v.ok,
    outputIssues: v.issues.filter(i => i.severity === 'error').map(i => `${i.field}: ${i.message}`),
    explanationOk: ex.ok,
    explanationProblems: ex.problems,
    rawConfidence: c.rawConfidence,
    cappedConfidence: c.cappedConfidence,
    capReasons: c.capReasons,
    registryMismatch,
  };
}

function rank(g: string): number {
  // higher rank = more permissive grade declaration; A=4 down to D=1
  return { A: 4, B: 3, C: 2, D: 1 }[g] ?? 0;
}

export function auditAll(outputs: EngineOutput[]): {
  perEngine: SingleEngineAudit[];
  report: ImplementationAuditReport;
} {
  return {
    perEngine: outputs.map(auditSingleEngineOutput),
    report: auditEngineOutputs(outputs),
  };
}
