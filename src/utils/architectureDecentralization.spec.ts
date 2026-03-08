import { describe, it, expect } from 'vitest';
import { QuantumPredictionEngine } from './quantumPredictionEngine';
import type { StandardizedInput } from '@/types/prediction';

function makeInput(overrides?: Partial<StandardizedInput>): StandardizedInput {
  return {
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
    sourceMetadata: { provider: 'test', confidence: 1, normalizedLocationName: '北京', timezoneIana: 'Asia/Shanghai' },
    ...overrides,
  };
}

describe('Architecture: All engines executed', () => {
  it('all activeEngines appear in executedEngines or failedEngines', () => {
    const r = QuantumPredictionEngine.orchestrate(makeInput());
    for (const name of r.activeEngines) {
      const executed = r.executedEngines.includes(name);
      const failed = r.failedEngines.some(f => f.engineName === name);
      expect(executed || failed).toBe(true);
    }
  });

  it('executedEngines matches executionTrace successful entries', () => {
    const r = QuantumPredictionEngine.orchestrate(makeInput());
    const traceSuccessNames = r.executionTrace.filter(t => t.success).map(t => t.engineName);
    expect(new Set(r.executedEngines)).toEqual(new Set(traceSuccessNames));
  });

  it('weights sum to 1.0', () => {
    const r = QuantumPredictionEngine.orchestrate(makeInput());
    const sum = r.weightsUsed.reduce((s, w) => s + w.weight, 0);
    expect(sum).toBeCloseTo(1.0, 5);
  });

  it('executionTrace has timing basis for each entry', () => {
    const r = QuantumPredictionEngine.orchestrate(makeInput());
    for (const trace of r.executionTrace) {
      expect(['birth', 'query', 'hybrid']).toContain(trace.timingBasis);
    }
  });
});

describe('Decentralization: engine independence', () => {
  it('bazi output does not reference tieban in its rawInputSnapshot', () => {
    const r = QuantumPredictionEngine.orchestrate(makeInput());
    const baziOut = r.engineOutputs.find(e => e.engineName === 'bazi');
    expect(baziOut).toBeDefined();
    const snap = JSON.stringify(baziOut!.rawInputSnapshot);
    expect(snap).not.toContain('tieban');
  });

  it('engineDependencyGraph shows no engine depending on tieban', () => {
    const r = QuantumPredictionEngine.orchestrate(makeInput());
    for (const [engine, deps] of Object.entries(r.engineDependencyGraph)) {
      if (engine !== 'tieban') {
        expect(deps).not.toContain('tieban');
      }
    }
  });

  it('natalAnalysis activates 13 engines (all)', () => {
    const r = QuantumPredictionEngine.orchestrate(makeInput({ queryType: 'natalAnalysis' }));
    expect(r.activeEngines.length).toBe(13);
  });
});

describe('Instant engines timing', () => {
  const INSTANT_ENGINES = ['liuyao', 'meihua', 'qimen', 'liuren', 'taiyi'];

  it('instant engines have timingBasis = query', () => {
    const r = QuantumPredictionEngine.orchestrate(makeInput());
    for (const name of INSTANT_ENGINES) {
      const eo = r.engineOutputs.find(e => e.engineName === name);
      if (eo) {
        expect(eo.timingBasis).toBe('query');
      }
    }
  });

  it('natal engines have timingBasis = birth', () => {
    const r = QuantumPredictionEngine.orchestrate(makeInput());
    const NATAL = ['tieban', 'bazi', 'ziwei', 'western', 'vedic', 'numerology', 'mayan', 'kabbalah'];
    for (const name of NATAL) {
      const eo = r.engineOutputs.find(e => e.engineName === name);
      if (eo) {
        expect(eo.timingBasis).toBe('birth');
      }
    }
  });

  it('same queryTimeUtc → same instant engine output', () => {
    const input = makeInput({ queryType: 'instantDecision' });
    const r1 = QuantumPredictionEngine.orchestrate(input);
    const r2 = QuantumPredictionEngine.orchestrate(input);
    for (const name of INSTANT_ENGINES) {
      const o1 = r1.engineOutputs.find(e => e.engineName === name);
      const o2 = r2.engineOutputs.find(e => e.engineName === name);
      if (o1 && o2) {
        expect(o1.fateVector).toEqual(o2.fateVector);
      }
    }
  });

  it('different queryTimeUtc → different instant engine output', () => {
    const r1 = QuantumPredictionEngine.orchestrate(makeInput({ queryType: 'instantDecision', queryTimeUtc: '2025-01-01T00:00:00.000Z' }));
    const r2 = QuantumPredictionEngine.orchestrate(makeInput({ queryType: 'instantDecision', queryTimeUtc: '2025-06-15T12:00:00.000Z' }));
    let anyDiff = false;
    for (const name of INSTANT_ENGINES) {
      const o1 = r1.engineOutputs.find(e => e.engineName === name);
      const o2 = r2.engineOutputs.find(e => e.engineName === name);
      if (o1 && o2) {
        if (JSON.stringify(o1.fateVector) !== JSON.stringify(o2.fateVector)) anyDiff = true;
      }
    }
    expect(anyDiff).toBe(true);
  });
});
