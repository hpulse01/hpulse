import { QuantumPredictionEngine, type QuantumInput, type QuantumPredictionResult } from '@/utils/quantumPredictionEngine';
import { PROBABILITY_THRESHOLD } from '@/utils/worldTreeGenerator';
import type { EngineName } from '@/types/prediction';
import type {
  AdminOrchestrationSnapshot,
  DestinyPhase,
  DestinyTimelineEvent,
  FullPredictionReport,
  NormalizedBirthContext,
  SystemEngineResult,
  UnifiedPredictionInput,
} from '@/types/unifiedPrediction';

const TESTED_ENGINES = new Set<EngineName>([
  'tieban', 'ziwei', 'meihua', 'qimen', 'liuren', 'taiyi',
]);

function normalizeBirthContext(input: UnifiedPredictionInput): NormalizedBirthContext {
  return {
    localDateTime: input.birthLocalDateTime,
    birthUtcDateTime: input.birthUtcDateTime,
    timezoneIana: input.timezoneIana,
    timezoneOffsetMinutesAtBirth: input.timezoneOffsetMinutesAtBirth,
    normalizedLocationName: input.normalizedLocationName,
    geoLatitude: input.geoLatitude,
    geoLongitude: input.geoLongitude,
    gender: input.gender,
    queryType: input.queryType,
    queryTimeUtc: input.queryTimeUtc,
  };
}

function toQuantumInput(input: UnifiedPredictionInput): QuantumInput {
  return {
    year: input.birthLocalDateTime.year,
    month: input.birthLocalDateTime.month,
    day: input.birthLocalDateTime.day,
    hour: input.birthLocalDateTime.hour,
    minute: input.birthLocalDateTime.minute,
    gender: input.gender,
    geoLatitude: input.geoLatitude,
    geoLongitude: input.geoLongitude,
    timezoneOffsetMinutes: input.timezoneOffsetMinutesAtBirth,
  };
}

function buildTimeline(result: QuantumPredictionResult): DestinyTimelineEvent[] {
  if (result.collapseResult) {
    return result.collapseResult.collapsedPath.map((node) => ({
      age: node.age,
      year: node.year,
      category: node.event.category,
      description: node.event.description,
      confidence: node.cumulativeProbability,
      engineSupports: node.engineSupports,
      isTerminal: node.isDeath,
    }));
  }

  return result.destinyTimeline.map((event) => ({
    age: event.age,
    year: event.year,
    category: event.eventType,
    description: event.description,
    confidence: event.convergence,
    engineSupports: event.systemVotes,
    isTerminal: event.age >= result.deathAge,
  }));
}

function buildPhases(timeline: DestinyTimelineEvent[]): DestinyPhase[] {
  if (timeline.length === 0) return [];

  const chunkSize = Math.max(1, Math.ceil(timeline.length / 4));
  const phases: DestinyPhase[] = [];

  for (let i = 0; i < timeline.length; i += chunkSize) {
    const slice = timeline.slice(i, i + chunkSize);
    const ageStart = slice[0].age;
    const ageEnd = slice[slice.length - 1].age;
    const themes = [...new Set(slice.map((item) => item.category))];
    const avg = slice.reduce((sum, item) => sum + item.confidence, 0) / slice.length;
    phases.push({
      phaseId: `phase-${phases.length + 1}`,
      title: `${ageStart}-${ageEnd}岁阶段`,
      ageRange: [ageStart, ageEnd],
      dominantThemes: themes,
      keyEvents: slice,
      stabilityScore: Number(avg.toFixed(3)),
    });
  }

  return phases;
}

function buildEngineResults(result: QuantumPredictionResult): SystemEngineResult[] {
  const candidateMap = new Map<EngineName, FullPredictionReport['eventCandidates']>();
  result.collapseResult?.collapsedPath.forEach((node) => {
    for (const support of node.event.engineSupports) {
      const engineId = support.engineName as EngineName;
      const list = candidateMap.get(engineId) ?? [];
      list.push(node.event);
      candidateMap.set(engineId, list);
    }
  });

  return result.unifiedResult?.engineOutputs.map((engineOutput) => {
    const engineId = engineOutput.engineName as EngineName;
    const relatedCandidates = candidateMap.get(engineId) ?? [];
    const explanationTrace = [
      `${engineOutput.engineNameCN}(${engineOutput.engineVersion})`,
      `timing:${engineOutput.timingBasis}`,
      ...Object.entries(engineOutput.normalizedOutput).slice(0, 6).map(([key, value]) => `${key}:${value}`),
    ];
    const validationFlags = [
      `source:${engineOutput.sourceGrade}`,
      `confidence:${engineOutput.confidence.toFixed(3)}`,
      `timing:${engineOutput.timingBasis}`,
    ];

    return {
      engineId,
      engineVersion: engineOutput.engineVersion,
      normalizedInputSnapshot: engineOutput.rawInputSnapshot,
      rawComputedChart: engineOutput.normalizedOutput,
      featureVector: engineOutput.fateVector,
      timeWindows: relatedCandidates.map((candidate) => `${candidate.ageWindow[0]}-${candidate.ageWindow[1]}`),
      aspectScores: engineOutput.fateVector,
      eventCandidates: relatedCandidates,
      confidence: engineOutput.confidence,
      explanationTrace,
      warnings: engineOutput.warnings,
      completenessScore: Number((Math.min(1, engineOutput.confidence + (Object.keys(engineOutput.normalizedOutput).length >= 4 ? 0.15 : 0))).toFixed(3)),
      validationFlags,
    };
  }) ?? [];
}

function buildAdminSnapshot(report: Omit<FullPredictionReport, 'adminSnapshot'>, result: QuantumPredictionResult): AdminOrchestrationSnapshot {
  const weights = Object.fromEntries((result.unifiedResult?.weightsUsed ?? []).map((item) => [item.engineName, item.weight]));
  const coverageMatrix = report.engineResults.map((engineResult) => ({
    engineId: engineResult.engineId,
    status: (engineResult.completenessScore >= 0.9 ? '完整接入' : engineResult.completenessScore >= 0.6 ? '部分接入' : '未接入') as '完整接入' | '部分接入' | '未接入',
    realExecution: Boolean(result.unifiedResult?.executedEngines.includes(engineResult.engineId)),
    orchestrated: true,
    structuredEvents: engineResult.eventCandidates.length > 0,
    explanationTrace: engineResult.explanationTrace.length > 0,
    tested: TESTED_ENGINES.has(engineResult.engineId),
    pseudoImplementationRisk: (engineResult.eventCandidates.length > 0 ? 'low' : engineResult.confidence >= 0.65 ? 'medium' : 'high') as 'low' | 'medium' | 'high',
    completenessScore: engineResult.completenessScore,
    eventCandidateCount: engineResult.eventCandidates.length,
    contributionWeight: weights[engineResult.engineId] ?? 0,
    warnings: engineResult.warnings,
    nextGap: engineResult.eventCandidates.length > 0 ? '继续提升规则精度与验证闭环' : '补足结构化事件映射与验证轨迹',
  }));

  return {
    engineCoverageMatrix: coverageMatrix,
    engineWeights: weights,
    engineFailures: result.unifiedResult?.failedEngines ?? [],
    executionSummary: result.unifiedResult?.executionTrace ?? [],
    pruningThreshold: PROBABILITY_THRESHOLD,
    totalEventCandidates: report.eventCandidates.length,
    totalWorldNodes: report.worldTree?.totalNodes ?? 0,
    totalPaths: report.worldTree?.totalPaths ?? 0,
    collapse: report.collapseResult ? {
      deathAge: report.collapseResult.deathAge,
      deathCause: report.collapseResult.deathCause,
      collapseConfidence: report.collapseResult.collapseConfidence,
      selectedReason: report.collapseResult.selectedReason,
    } : null,
    userAccessPolicy: {
      public: ['统一输入', '结果总览', '命运主时间线'],
      member: ['阶段分析', '多体系解释', '验证反馈'],
      admin: ['条文库状态', '用户等级映射'],
      superAdmin: ['引擎权重', '候选事件', '世界树节点统计', '坍缩细节', '执行摘要'],
    },
  };
}

export const PredictionOrchestrator = {
  normalizeInput(input: UnifiedPredictionInput): NormalizedBirthContext {
    return normalizeBirthContext(input);
  },

  execute(input: UnifiedPredictionInput): FullPredictionReport {
    const normalizedBirthContext = normalizeBirthContext(input);
    const prediction = QuantumPredictionEngine.predict(toQuantumInput(input));
    const timeline = buildTimeline(prediction);
    const engineResults = buildEngineResults(prediction);
    const eventCandidates = prediction.collapseResult?.collapsedPath.map((node) => node.event) ?? [];

    const reportBase: Omit<FullPredictionReport, 'adminSnapshot'> = {
      input,
      normalizedBirthContext,
      engineResults,
      eventCandidates,
      worldTree: prediction.destinyTree ?? null,
      collapseResult: prediction.collapseResult ?? null,
      destinyTimeline: timeline,
      destinyPhases: buildPhases(timeline),
      confidence: prediction.unifiedResult?.finalConfidence ?? prediction.overallCoherence,
      coherence: prediction.overallCoherence,
      convergence: prediction.collapseResult?.collapseConfidence ?? prediction.overallCoherence,
      explanationTrace: [
        prediction.unifiedResult?.causalSummary ?? prediction.lifeSummary,
        ...(prediction.unifiedResult?.executionTrace ?? []).map((entry) => `${entry.engineName}:${entry.success ? 'ok' : entry.errorMessage ?? 'failed'}`),
      ],
      dashboardPayload: prediction.unifiedResult!,
    };

    return {
      ...reportBase,
      adminSnapshot: buildAdminSnapshot(reportBase, prediction),
    };
  },
};
