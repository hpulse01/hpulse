import { describe, it, expect } from 'vitest';
import { MeihuaEngine } from './meihuaAlgorithm';
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

describe('MeihuaEngine', () => {
  describe('divineByTime', () => {
    it('returns stable results for same input', () => {
      const r1 = MeihuaEngine.divineByTime(2025, 3, 15, 10);
      const r2 = MeihuaEngine.divineByTime(2025, 3, 15, 10);
      expect(r1.benGua.name).toBe(r2.benGua.name);
      expect(r1.huGua.name).toBe(r2.huGua.name);
      expect(r1.bianGua.name).toBe(r2.bianGua.name);
      expect(r1.dongYao).toBe(r2.dongYao);
    });

    it('generates valid trigrams', () => {
      const r = MeihuaEngine.divineByTime(2025, 3, 15, 10);
      expect(r.benGua.upper.index).toBeGreaterThanOrEqual(0);
      expect(r.benGua.upper.index).toBeLessThanOrEqual(7);
      expect(r.benGua.lower.index).toBeGreaterThanOrEqual(0);
      expect(r.benGua.lower.index).toBeLessThanOrEqual(7);
    });

    it('dongYao is between 1 and 6', () => {
      const r = MeihuaEngine.divineByTime(2025, 3, 15, 10);
      expect(r.dongYao).toBeGreaterThanOrEqual(1);
      expect(r.dongYao).toBeLessThanOrEqual(6);
    });

    it('benGua, huGua, bianGua all have names', () => {
      const r = MeihuaEngine.divineByTime(2025, 1, 1, 0);
      expect(r.benGua.name).toBeTruthy();
      expect(r.huGua.name).toBeTruthy();
      expect(r.bianGua.name).toBeTruthy();
    });
  });

  describe('divineByNumber', () => {
    it('returns stable results for same numbers', () => {
      const r1 = MeihuaEngine.divineByNumber(5, 10);
      const r2 = MeihuaEngine.divineByNumber(5, 10);
      expect(r1.benGua.name).toBe(r2.benGua.name);
      expect(r1.dongYao).toBe(r2.dongYao);
      expect(r1.score).toBe(r2.score);
    });

    it('different numbers produce different results', () => {
      const r1 = MeihuaEngine.divineByNumber(3, 7);
      const r2 = MeihuaEngine.divineByNumber(11, 22);
      // Not guaranteed different, but very likely
      expect(r1.benGua.name !== r2.benGua.name || r1.dongYao !== r2.dongYao).toBe(true);
    });
  });

  describe('tiYong relation', () => {
    it('determines valid ti-yong relation', () => {
      const r = MeihuaEngine.divineByTime(2025, 3, 15, 10);
      const validRelations = ['体生用', '用生体', '体克用', '用克体', '比和'];
      expect(validRelations).toContain(r.tiYong.relation);
    });

    it('determines valid tendency', () => {
      const r = MeihuaEngine.divineByNumber(8, 16);
      const validTendencies = ['吉', '凶', '中', '大吉', '大凶'];
      expect(validTendencies).toContain(r.tiYong.tendency);
    });
  });

  describe('FateVector mapping', () => {
    it('produces values in 5-95 range', () => {
      const r = MeihuaEngine.divineByTime(2025, 6, 1, 12);
      const fv = MeihuaEngine.meihuaToFateVector(r);
      for (const key of ['life', 'wealth', 'relation', 'health', 'wisdom', 'spirit'] as const) {
        expect(fv[key]).toBeGreaterThanOrEqual(5);
        expect(fv[key]).toBeLessThanOrEqual(95);
      }
    });
  });

  describe('runMeihua (engine interface)', () => {
    it('returns valid EngineOutput', () => {
      const { eo, meihuaResult } = MeihuaEngine.runMeihua(makeInput());
      expect(eo.engineName).toBe('meihua');
      expect(eo.engineNameCN).toBe('梅花易数');
      expect(eo.fateVector.life).toBeGreaterThanOrEqual(5);
      expect(meihuaResult.benGua.name).toBeTruthy();
    });

    it('uses text divination when questionText is provided', () => {
      const { meihuaResult } = MeihuaEngine.runMeihua(makeInput({ questionText: '今天适合出行吗' }));
      expect(meihuaResult.method).toBe('number');
      expect(meihuaResult.benGua.name).toBeTruthy();
    });

    it('uses time divination when no questionText', () => {
      const { meihuaResult } = MeihuaEngine.runMeihua(makeInput());
      expect(meihuaResult.method).toBe('time');
    });
  });
});
