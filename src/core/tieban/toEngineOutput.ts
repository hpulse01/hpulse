/**
 * P4.3 — Tieban report → EngineOutput adapter.
 *
 * Maps the structured `TiebanFullReport` into the standard EngineOutput shape
 * used by the Quantum Orchestrator. fateVector is derived deterministically
 * from section confidences + clause-lookup completeness — no randomness.
 */

import type { EngineOutput, FateVector, ValidationFlags } from '../../types/prediction';
import type { TiebanFullReport } from './types';

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(n)));

function sectionConfidence(report: TiebanFullReport, key: string): number {
  const s = report.destinySections.find((x) => x.sectionKey === key);
  return s ? s.confidence : 40;
}

function sectionTextHas(report: TiebanFullReport, key: string, keywords: string[]): boolean {
  const s = report.destinySections.find((x) => x.sectionKey === key);
  if (!s || !s.clauseLookup.payload) return false;
  const text = String(s.clauseLookup.payload);
  return keywords.some((k) => text.includes(k));
}

function buildFateVector(report: TiebanFullReport): { vector: FateVector; trace: string[] } {
  const trace: string[] = [];

  const overview = sectionConfidence(report, 'overview');
  const wealthC = sectionConfidence(report, 'wealth');
  const careerC = sectionConfidence(report, 'career');
  const marriageC = sectionConfidence(report, 'marriage');
  const parentsC = sectionConfidence(report, 'parents');
  const childrenC = sectionConfidence(report, 'children');
  const healthC = sectionConfidence(report, 'health');
  const disasterC = sectionConfidence(report, 'disaster');
  const migrationC = sectionConfidence(report, 'migration');

  // Calibration penalty: no kaoke = downgrade luck/life
  const calibrated = report.calibration.confirmedClauseId != null;
  const calPenalty = calibrated ? 0 : 15;

  const life = clamp(overview * 0.7 + report.confidence * 0.3 - calPenalty);
  trace.push(`life = overview*0.7 + reportConfidence*0.3 − calibrationPenalty = ${life}`);

  const wealth = clamp(wealthC);
  trace.push(`wealth = section('wealth').confidence = ${wealth}`);

  const relation = clamp(marriageC * 0.5 + parentsC * 0.3 + childrenC * 0.2);
  trace.push(`relation = marriage*0.5 + parents*0.3 + children*0.2 = ${relation}`);

  const health = clamp(healthC * 0.6 + disasterC * 0.4);
  trace.push(`health = health*0.6 + disaster*0.4 = ${health}`);

  const wisdomBoost = sectionTextHas(report, 'overview', ['学', '文', '智', '慧', '才', '悟']) ? 12 : 0;
  const wisdom = clamp(overview * 0.7 + wisdomBoost);
  trace.push(`wisdom = overview*0.7 + 学/智/悟 关键词加成(${wisdomBoost}) = ${wisdom}`);

  const spirit = clamp(overview * 0.5 + parentsC * 0.3 + 20);
  trace.push(`spirit = overview*0.5 + parents*0.3 + 福德常数 = ${spirit}`);

  const socialStatus = clamp(careerC * 0.7 + overview * 0.3);
  trace.push(`socialStatus = career*0.7 + overview*0.3 = ${socialStatus}`);

  const creativityBoost = sectionTextHas(report, 'career', ['艺', '技', '巧', '才'])
    || sectionTextHas(report, 'overview', ['艺', '技', '巧', '才']) ? 10 : 0;
  const creativity = clamp(careerC * 0.6 + creativityBoost + 20);
  trace.push(`creativity = career*0.6 + 才艺关键词加成(${creativityBoost}) + 常数 = ${creativity}`);

  const exact = report.clauseLookups.filter((m) => m.exactMatch).length;
  const total = report.clauseLookups.length || 1;
  const fallbackRatio = 1 - exact / total;
  const luck = clamp(report.confidence - fallbackRatio * 30 - calPenalty);
  trace.push(`luck = reportConfidence − fallbackRatio*30 − calibrationPenalty = ${luck}`);

  const homeStability = clamp(parentsC * 0.4 + marriageC * 0.3 + childrenC * 0.3);
  trace.push(`homeStability = parents*0.4 + marriage*0.3 + children*0.3 = ${homeStability}`);

  return {
    vector: { life, wealth, relation, health, wisdom, spirit, socialStatus, creativity, luck, homeStability },
    trace,
  };
}

export function tiebanReportToEngineOutput(
  report: TiebanFullReport,
  inputSnapshot: Record<string, unknown> = {},
): EngineOutput {
  const fr = buildFateVector(report);

  const aspectScores: Record<string, number> = {};
  for (const s of report.destinySections) aspectScores[s.sectionKey] = s.confidence;
  aspectScores.calibrated = report.calibration.confirmedClauseId != null ? 100 : 0;
  aspectScores.systemOffsetAbs = Math.abs(report.calibration.systemOffset);

  const eventCandidates: string[] = [];
  for (const s of report.destinySections) {
    const lk = s.clauseLookup;
    if (lk.exactMatch) {
      eventCandidates.push(`${s.sectionName}:条文${lk.matchedClauseNumber}(精确)`);
    } else if (lk.fallbackReason === 'NEAREST_NEIGHBOR') {
      eventCandidates.push(`${s.sectionName}:条文${lk.requestedClauseNumber}→${lk.matchedClauseNumber}(回退±${lk.fallbackDistance})`);
    } else {
      eventCandidates.push(`${s.sectionName}:条文${lk.requestedClauseNumber}(unavailable)`);
    }
  }

  const validationFlags: ValidationFlags = {
    passed: report.validationFlags.passed,
    failed: report.validationFlags.failed,
    warnings: [
      ...report.validationFlags.warnings,
      ...report.warnings.map((w) => `${w.code}: ${w.message}`),
    ],
  };

  const explanationTrace: string[] = [
    ...report.baseResult.explanationTrace.map((s) => `[${s.rule}] ${s.detail}`),
    ...report.quarterKe.explanationTrace.map((s) => `[${s.rule}] ${s.detail}`),
    ...report.calibration.calibrationTrace.map((s) => `[${s.rule}] ${s.detail}`),
    ...report.explanationTrace.map((s) => `[${s.rule}] ${s.detail}`),
    ...fr.trace.map((t) => `[tieban.fateVector] ${t}`),
  ];

  return {
    engineName: 'tieban',
    engineNameCN: '铁板神数',
    engineVersion: 'P4.3-core',
    sourceUrls: [
      'classical: 铁板神数 (邵雍传) — 待文献交叉校验',
    ],
    sourceGrade: report.sourceGrade,
    ruleSchool: '铁板神数 (theoreticalBase + 六亲校时 + 十二宫投影)',
    confidence: report.confidence,
    computationTimeMs: 0,
    rawInputSnapshot: { ...report.inputSnapshot, ...inputSnapshot },
    fateVector: fr.vector,
    normalizedOutput: {
      theoreticalBase: String(report.baseResult.theoreticalBase),
      systemOffset: String(report.calibration.systemOffset),
      lockedQuarterIndex: report.calibration.lockedQuarterIndex == null ? '' : String(report.calibration.lockedQuarterIndex),
      confirmedClauseId: report.calibration.confirmedClauseId == null ? '' : String(report.calibration.confirmedClauseId),
      sections: report.destinySections.map((s) => `${s.sectionKey}:${s.requestedClauseNumber}`).join(','),
      implementationStatus: report.implementationStatus,
      sensitiveFlags: report.sensitiveFlags.join(','),
    },
    warnings: report.warnings.map((w) => `${w.code}: ${w.message}`),
    uncertaintyNotes: report.uncertaintyNotes,
    timingBasis: 'birth',
    explanationTrace,
    completenessScore: report.completenessScore,
    validationFlags,
    timeWindows: [],
    aspectScores,
    eventCandidates,
  };
}
