import { describe, it, expect } from 'vitest';
import { QimenEngine } from './qimenAlgorithm';
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
    queryType: 'instantDecision',
    queryTimeUtc: '2025-03-15T10:30:00.000Z',
    sourceMetadata: {
      provider: 'test',
      confidence: 1,
      normalizedLocationName: '北京',
      timezoneIana: 'Asia/Shanghai',
    },
    ...overrides,
  };
}

describe('QimenEngine', () => {
  describe('buildChart', () => {
    it('returns stable chart for same input', () => {
      const c1 = QimenEngine.buildChart({ year: 2025, month: 3, day: 15, hour: 10 });
      const c2 = QimenEngine.buildChart({ year: 2025, month: 3, day: 15, hour: 10 });
      expect(c1.dunType).toBe(c2.dunType);
      expect(c1.juNumber).toBe(c2.juNumber);
      expect(c1.zhiFu).toBe(c2.zhiFu);
      expect(c1.zhiShi).toBe(c2.zhiShi);
      expect(c1.hourStem).toBe(c2.hourStem);
    });

    it('different times produce different charts', () => {
      const c1 = QimenEngine.buildChart({ year: 2025, month: 3, day: 15, hour: 10 });
      const c2 = QimenEngine.buildChart({ year: 2025, month: 8, day: 20, hour: 14 });
      expect(c1.dunType !== c2.dunType || c1.juNumber !== c2.juNumber || c1.hourStem !== c2.hourStem).toBe(true);
    });

    it('generates valid dunType', () => {
      const c = QimenEngine.buildChart({ year: 2025, month: 1, day: 10, hour: 8 });
      expect(['阳遁', '阴遁']).toContain(c.dunType);
    });

    it('juNumber is between 1 and 9', () => {
      const c = QimenEngine.buildChart({ year: 2025, month: 6, day: 20, hour: 12 });
      expect(c.juNumber).toBeGreaterThanOrEqual(1);
      expect(c.juNumber).toBeLessThanOrEqual(9);
    });

    it('generates 9 palaces', () => {
      const c = QimenEngine.buildChart({ year: 2025, month: 3, day: 15, hour: 10 });
      expect(c.palaces).toHaveLength(9);
    });

    it('zhiFu and zhiShi are non-empty', () => {
      const c = QimenEngine.buildChart({ year: 2025, month: 3, day: 15, hour: 10 });
      expect(c.zhiFu).toBeTruthy();
      expect(c.zhiShi).toBeTruthy();
    });

    it('each palace has gate, star, deity', () => {
      const c = QimenEngine.buildChart({ year: 2025, month: 5, day: 1, hour: 6 });
      for (const p of c.palaces) {
        expect(p.gate).toBeTruthy();
        expect(p.star).toBeTruthy();
        expect(p.deity).toBeTruthy();
        expect(p.name).toBeTruthy();
      }
    });
  });

  describe('阴遁/阳遁 determination', () => {
    it('winter months are 阳遁', () => {
      const c = QimenEngine.buildChart({ year: 2025, month: 1, day: 10, hour: 8 });
      expect(c.dunType).toBe('阳遁');
    });

    it('summer months are 阴遁', () => {
      const c = QimenEngine.buildChart({ year: 2025, month: 7, day: 15, hour: 12 });
      expect(c.dunType).toBe('阴遁');
    });
  });

  describe('evaluateChart', () => {
    it('returns score between 5 and 95', () => {
      const c = QimenEngine.buildChart({ year: 2025, month: 3, day: 15, hour: 10 });
      const { score } = QimenEngine.evaluateChart(c);
      expect(score).toBeGreaterThanOrEqual(5);
      expect(score).toBeLessThanOrEqual(95);
    });

    it('returns non-empty pattern', () => {
      const c = QimenEngine.buildChart({ year: 2025, month: 3, day: 15, hour: 10 });
      const { pattern } = QimenEngine.evaluateChart(c);
      expect(pattern).toBeTruthy();
    });
  });

  describe('FateVector mapping', () => {
    it('produces values in 5-95 range', () => {
      const c = QimenEngine.buildChart({ year: 2025, month: 3, day: 15, hour: 10 });
      const { score } = QimenEngine.evaluateChart(c);
      const fv = QimenEngine.qimenToFateVector(c, score);
      for (const key of ['life', 'wealth', 'relation', 'health', 'wisdom', 'spirit'] as const) {
        expect(fv[key]).toBeGreaterThanOrEqual(5);
        expect(fv[key]).toBeLessThanOrEqual(95);
      }
    });
  });

  describe('runQimen (engine interface)', () => {
    it('returns valid EngineOutput', () => {
      const { eo, qimenResult } = QimenEngine.runQimen(makeInput());
      expect(eo.engineName).toBe('qimen');
      expect(eo.engineNameCN).toBe('奇门遁甲');
      expect(eo.normalizedOutput['遁局']).toBeTruthy();
      expect(eo.normalizedOutput['值符']).toBeTruthy();
      expect(eo.normalizedOutput['值使']).toBeTruthy();
      expect(eo.normalizedOutput['时干']).toBeTruthy();
      expect(eo.normalizedOutput['主要门']).toBeTruthy();
      expect(eo.normalizedOutput['主要星']).toBeTruthy();
      expect(qimenResult.summary).toBeTruthy();
    });

    it('same queryTimeUtc produces same chart', () => {
      const input = makeInput();
      const r1 = QimenEngine.runQimen(input);
      const r2 = QimenEngine.runQimen(input);
      expect(r1.qimenResult.chart.dunType).toBe(r2.qimenResult.chart.dunType);
      expect(r1.qimenResult.chart.juNumber).toBe(r2.qimenResult.chart.juNumber);
      expect(r1.qimenResult.chart.zhiFu).toBe(r2.qimenResult.chart.zhiFu);
    });
  });
});
