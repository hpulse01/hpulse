/**
 * EngineOutput field/structure validator.
 * Pure, deterministic. No I/O.
 */
import type { EngineOutput, FateVector } from '@/types/prediction';

export interface EngineOutputIssue {
  field: string;
  severity: 'error' | 'warning';
  message: string;
}

export interface EngineOutputValidationResult {
  ok: boolean;
  issues: EngineOutputIssue[];
}

const REQUIRED_STRING_FIELDS: (keyof EngineOutput)[] = [
  'engineName',
  'engineNameCN',
  'engineVersion',
  'ruleSchool',
];

const FATE_DIMS: (keyof FateVector)[] = [
  'life', 'wealth', 'relation', 'health', 'wisdom',
  'spirit', 'socialStatus', 'creativity', 'luck', 'homeStability',
];

export function validateEngineOutput(eo: Partial<EngineOutput> | null | undefined): EngineOutputValidationResult {
  const issues: EngineOutputIssue[] = [];
  if (!eo || typeof eo !== 'object') {
    return { ok: false, issues: [{ field: '*', severity: 'error', message: 'EngineOutput is null/undefined' }] };
  }

  for (const f of REQUIRED_STRING_FIELDS) {
    if (typeof eo[f] !== 'string' || !(eo[f] as string).length) {
      issues.push({ field: String(f), severity: 'error', message: `missing string field "${String(f)}"` });
    }
  }

  if (!['A', 'B', 'C', 'D'].includes(String(eo.sourceGrade))) {
    issues.push({ field: 'sourceGrade', severity: 'error', message: `invalid sourceGrade "${String(eo.sourceGrade)}"` });
  }
  if (typeof eo.confidence !== 'number' || eo.confidence < 0 || eo.confidence > 1) {
    issues.push({ field: 'confidence', severity: 'error', message: `confidence must be 0..1, got ${String(eo.confidence)}` });
  }
  if (typeof eo.completenessScore !== 'number' || eo.completenessScore < 0 || eo.completenessScore > 100) {
    issues.push({ field: 'completenessScore', severity: 'error', message: `completenessScore must be 0..100` });
  }
  if (!['birth', 'query', 'hybrid'].includes(String(eo.timingBasis))) {
    issues.push({ field: 'timingBasis', severity: 'error', message: `invalid timingBasis "${String(eo.timingBasis)}"` });
  }

  // FateVector
  const fv = eo.fateVector as FateVector | undefined;
  if (!fv || typeof fv !== 'object') {
    issues.push({ field: 'fateVector', severity: 'error', message: 'fateVector missing' });
  } else {
    for (const d of FATE_DIMS) {
      const v = fv[d];
      if (typeof v !== 'number' || Number.isNaN(v)) {
        issues.push({ field: `fateVector.${d}`, severity: 'error', message: `not a number` });
      } else if (v < 0 || v > 100) {
        issues.push({ field: `fateVector.${d}`, severity: 'error', message: `out of range 0..100 (${v})` });
      }
    }
  }

  if (!Array.isArray(eo.explanationTrace) || eo.explanationTrace.length === 0) {
    issues.push({ field: 'explanationTrace', severity: 'error', message: 'explanationTrace empty' });
  }
  if (!Array.isArray(eo.warnings)) {
    issues.push({ field: 'warnings', severity: 'error', message: 'warnings must be array' });
  }
  if (!eo.normalizedOutput || typeof eo.normalizedOutput !== 'object') {
    issues.push({ field: 'normalizedOutput', severity: 'error', message: 'normalizedOutput missing' });
  } else {
    const status = (eo.normalizedOutput as Record<string, string>).implementationStatus
      ?? (eo.normalizedOutput as Record<string, string>).p4ImplementationStatus;
    if (!status) {
      issues.push({ field: 'normalizedOutput.implementationStatus', severity: 'warning', message: 'implementationStatus not declared' });
    } else if (!['complete', 'partial', 'needs_source_validation'].includes(status)) {
      issues.push({ field: 'normalizedOutput.implementationStatus', severity: 'error', message: `invalid status "${status}"` });
    }
  }
  if (!eo.validationFlags || typeof eo.validationFlags !== 'object') {
    issues.push({ field: 'validationFlags', severity: 'warning', message: 'validationFlags missing' });
  }

  const hasError = issues.some(i => i.severity === 'error');
  return { ok: !hasError, issues };
}

export function getImplementationStatus(eo: EngineOutput): 'complete' | 'partial' | 'needs_source_validation' | 'unknown' {
  const s = eo.normalizedOutput?.implementationStatus ?? eo.normalizedOutput?.p4ImplementationStatus;
  if (s === 'complete' || s === 'partial' || s === 'needs_source_validation') return s;
  return 'unknown';
}
