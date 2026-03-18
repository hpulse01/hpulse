import type { UserProfile } from '@/hooks/useAuth';
import type { AdminOrchestrationSnapshot, FullPredictionReport, UnifiedPredictionInput } from '@/types/unifiedPrediction';
import { PredictionOrchestrator } from '@/utils/predictionOrchestrator';
import { assertSuperAdminAccess } from '@/utils/predictionAccess';
import type { QuantumPredictionResult } from '@/utils/quantumPredictionEngine';

export function createPredictionReport(input: UnifiedPredictionInput): FullPredictionReport {
  return PredictionOrchestrator.execute(input);
}

export function createPredictionReportFromExistingPrediction(
  input: UnifiedPredictionInput,
  prediction: QuantumPredictionResult,
): FullPredictionReport {
  return PredictionOrchestrator.fromPrediction(input, prediction);
}

export function getAdminOrchestrationSnapshot(
  report: FullPredictionReport,
  profile: UserProfile | null | undefined,
): AdminOrchestrationSnapshot {
  assertSuperAdminAccess(profile);
  return report.adminSnapshot;
}
