/**
 * HPU-6 — Evidence-quality synthesis.
 *
 * This module deliberately evaluates only properties that can be measured
 * from the engine outputs: rule coverage, cross-engine score agreement and
 * source grade. It does not infer mortality, lifespan or medical outcomes.
 */
import type { EngineRunResult } from '@/hpulse/engines/runner';
import type { WorldTree } from '@/hpulse/worldtree/types';
import type { EngineId } from '@/hpulse/weights/types';
import type { EvidenceQualitySummary } from './types';

const GRADE_SCORE = { A: 1, B: 0.75, C: 0.5, D: 0.25 } as const;

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function round4(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

export function summarizeEvidenceQuality(
  tree: WorldTree,
  results: EngineRunResult[],
): EvidenceQualitySummary {
  const successful = results.filter((result) => result.ok === true);
  const contributingEngines = successful.map((result) => result.id);
  const observationCount = tree.stages.reduce(
    (stageTotal, stage) => stageTotal + stage.domains.reduce(
      (domainTotal, domain) => domainTotal + domain.observations.length,
      0,
    ),
    0,
  );

  const domainCoverages = tree.stages.flatMap((stage) =>
    stage.domains.map((domain) => domain.coverage),
  );
  const ruleCoverage = domainCoverages.length > 0
    ? domainCoverages.reduce((sum, value) => sum + value, 0) / domainCoverages.length
    : 0;

  const agreementSamples: number[] = [];
  for (const stage of tree.stages) {
    for (const domain of stage.domains) {
      if (domain.observations.length < 2) continue;
      const weightSum = domain.observations.reduce((sum, obs) => sum + obs.weight, 0);
      if (weightSum <= 0) continue;
      const mean = domain.observations.reduce(
        (sum, obs) => sum + obs.score * obs.weight,
        0,
      ) / weightSum;
      const variance = domain.observations.reduce(
        (sum, obs) => sum + obs.weight * (obs.score - mean) ** 2,
        0,
      ) / weightSum;
      // A 50-point weighted standard deviation maps to zero agreement.
      agreementSamples.push(clamp01(1 - Math.sqrt(variance) / 50));
    }
  }
  const engineAgreement = agreementSamples.length > 0
    ? agreementSamples.reduce((sum, value) => sum + value, 0) / agreementSamples.length
    : 0;

  let gradeNumerator = 0;
  let gradeDenominator = 0;
  for (const result of successful) {
    const weight = Math.max(0, result.output.completenessScore) / 100;
    gradeNumerator += GRADE_SCORE[result.output.sourceGrade] * weight;
    gradeDenominator += weight;
  }
  const sourceQuality = gradeDenominator > 0 ? gradeNumerator / gradeDenominator : 0;
  const degradedEngines = Object.keys(tree.permanentlyDegraded) as EngineId[];

  return {
    ruleCoverage: round4(clamp01(ruleCoverage)),
    engineAgreement: round4(clamp01(engineAgreement)),
    sourceQuality: round4(clamp01(sourceQuality)),
    observationCount,
    contributingEngines,
    degradedEngines,
    notes: [
      'ruleCoverage measures the weight represented by successful engines',
      'engineAgreement measures dispersion between engine score outputs',
      'sourceQuality is derived from registered source grades and completeness',
      'these values are audit metrics, not event probabilities or scientific predictions',
    ],
  };
}
