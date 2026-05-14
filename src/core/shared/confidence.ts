/**
 * Confidence guards: ensure partial / needs_source_validation engines
 * cannot inflate confidence beyond defensible ceilings.
 */
import type { EngineOutput, SourceGrade } from '@/types/prediction';
import { getImplementationStatus } from './validation';

/** Maximum confidence allowed per implementation status. */
export const STATUS_CONFIDENCE_CEILING: Record<string, number> = {
  complete: 1.0,
  partial: 0.65,
  needs_source_validation: 0.45,
  unknown: 0.4,
};

/** Maximum confidence allowed per source grade. */
export const SOURCE_GRADE_CEILING: Record<SourceGrade, number> = {
  A: 1.0,
  B: 0.85,
  C: 0.65,
  D: 0.45,
};

export interface ConfidenceAudit {
  rawConfidence: number;
  cappedConfidence: number;
  capReasons: string[];
}

export function auditConfidence(eo: EngineOutput): ConfidenceAudit {
  const reasons: string[] = [];
  const status = getImplementationStatus(eo);
  let cap = STATUS_CONFIDENCE_CEILING[status] ?? 0.4;
  if (cap < 1) reasons.push(`status=${status} → ≤${cap}`);

  const gradeCap = SOURCE_GRADE_CEILING[eo.sourceGrade] ?? 0.4;
  if (gradeCap < cap) {
    cap = gradeCap;
    reasons.push(`sourceGrade=${eo.sourceGrade} → ≤${gradeCap}`);
  } else if (gradeCap < 1) {
    reasons.push(`sourceGrade=${eo.sourceGrade} ceiling ${gradeCap}`);
  }

  // warnings drag completeness; many warnings should pull confidence down 5% each up to 30%.
  const wPenalty = Math.min(0.3, (eo.warnings?.length ?? 0) * 0.05);
  if (wPenalty > 0) reasons.push(`warnings(${eo.warnings.length}) → -${wPenalty.toFixed(2)}`);

  // completenessScore mapped to 0..1 acts as soft cap.
  const completenessCap = Math.max(0.2, (eo.completenessScore ?? 50) / 100);
  if (completenessCap < cap) {
    cap = completenessCap;
    reasons.push(`completeness=${eo.completenessScore} → ≤${completenessCap.toFixed(2)}`);
  }

  const raw = typeof eo.confidence === 'number' ? eo.confidence : 0;
  const capped = Math.max(0, Math.min(cap, raw) - wPenalty);
  return { rawConfidence: raw, cappedConfidence: capped, capReasons: reasons };
}
