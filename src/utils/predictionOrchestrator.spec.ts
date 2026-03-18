import { describe, expect, it } from 'vitest';
import { PredictionOrchestrator } from './predictionOrchestrator';
import type { UnifiedPredictionInput } from '@/types/unifiedPrediction';

const makeInput = (overrides?: Partial<UnifiedPredictionInput>): UnifiedPredictionInput => ({
  birthLocalDateTime: { year: 1990, month: 6, day: 15, hour: 14, minute: 30 },
  birthUtcDateTime: '1990-06-15T06:30:00.000Z',
  geoLatitude: 39.9042,
  geoLongitude: 116.4074,
  timezoneIana: 'Asia/Shanghai',
  timezoneOffsetMinutesAtBirth: 480,
  gender: 'male',
  normalizedLocationName: '北京',
  queryType: 'natalAnalysis',
  queryTimeUtc: '2025-01-01T00:00:00.000Z',
  sourceMetadata: {
    provider: 'test',
    confidence: 1,
    normalizedLocationName: '北京',
    timezoneIana: 'Asia/Shanghai',
  },
  ...overrides,
});

describe('PredictionOrchestrator', () => {
  it('normalizes birth context into a single contract', () => {
    const normalized = PredictionOrchestrator.normalizeInput(makeInput());
    expect(normalized.timezoneIana).toBe('Asia/Shanghai');
    expect(normalized.localDateTime.hour).toBe(14);
    expect(normalized.queryType).toBe('natalAnalysis');
  });

  it('builds a full report with admin snapshot and unified timeline', () => {
    const report = PredictionOrchestrator.execute(makeInput());
    expect(report.engineResults).toHaveLength(13);
    expect(report.adminSnapshot.engineCoverageMatrix).toHaveLength(13);
    expect(report.dashboardPayload.activeEngines).toHaveLength(13);
    expect(report.destinyTimeline.length).toBeGreaterThan(0);
  });

  it('keeps death boundary terminal in the unified timeline', () => {
    const report = PredictionOrchestrator.execute(makeInput());
    expect(report.collapseResult).not.toBeNull();
    expect(report.destinyTimeline.at(-1)?.isTerminal).toBe(true);
  });
});
