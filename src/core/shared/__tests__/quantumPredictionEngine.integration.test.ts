/**
 * Smoke test: run the orchestrator end-to-end and audit every engine
 * output. Acts as the live P4.12 audit ledger.
 */
import { describe, it, expect } from 'vitest';
import { auditEngineOutputs } from '@/core/shared/implementationAudit';
import { assessCommercialReadiness } from '@/core/shared/commercialReadiness';
import { QuantumPredictionEngine } from '@/utils/quantumPredictionEngine';

const SAMPLE_INPUT = {
  year: 1990,
  month: 5,
  day: 15,
  hour: 8,
  minute: 30,
  gender: 'male' as const,
  geoLatitude: 31.2304,
  geoLongitude: 121.4737,
  timezoneOffsetMinutes: 480,
  timezoneIana: 'Asia/Shanghai',
  queryTimeUtc: '2026-05-14T00:00:00Z',
};

describe('quantumPredictionEngine integration audit (P4.12)', () => {
  it('runs the orchestrator and produces a valid audit report', async () => {
    const result = QuantumPredictionEngine.predict(SAMPLE_INPUT);
    const outputs = result.unifiedResult?.engineOutputs ?? [];
    expect({
      outputCount: outputs.length,
      failedEngines: result.unifiedResult?.failedEngines ?? [],
    }).toEqual({ outputCount: 13, failedEngines: [] });

    const report = auditEngineOutputs(outputs);
    // No engine should silently fail validation.
    expect(
      report.entries
        .filter((entry) => !entry.outputOk)
        .map((entry) => ({ engine: entry.engineName, risks: entry.risks })),
    ).toEqual([]);
    // Every engine must have a non-empty explanation trace.
    expect(
      report.entries
        .filter((entry) => !entry.explanationOk)
        .map((entry) => ({ engine: entry.engineName, risks: entry.risks })),
    ).toEqual([]);
    // The orchestration layer must not hide per-engine execution failures.
    expect(result.unifiedResult?.failedEngines).toEqual([]);

    // A structurally valid beta is not automatically commercially complete.
    // The current source registry intentionally keeps every known gap blocking.
    const commercial = assessCommercialReadiness(outputs, {
      failedEngines: result.unifiedResult?.failedEngines,
    });
    expect(commercial.ready).toBe(false);
    expect(commercial.blockers.some((blocker) => blocker.code === 'registry_status_incomplete')).toBe(true);
    expect(result.unifiedResult?.commercialReadiness).toEqual(commercial);
  }, 30000);

  it('is byte-stable for the same explicit time, zone and input', () => {
    const first = QuantumPredictionEngine.predict(SAMPLE_INPUT);
    const second = QuantumPredictionEngine.predict(SAMPLE_INPUT);
    expect(JSON.stringify(second)).toBe(JSON.stringify(first));
  }, 30000);
});
