import { describe, it, expect } from 'vitest';
import { MayanCalendarEngine } from './worldSystems/mayanCalendar';
import QuantumPredictionEngine from './quantumPredictionEngine';

const MOCK_INPUT = {
  year: 1990,
  month: 6,
  day: 15,
};

describe('MayanCalendarEngine', () => {
  it('produces structured output with all key fields', () => {
    const report = MayanCalendarEngine.calculate(MOCK_INPUT);
    expect(report.kin).toBeGreaterThanOrEqual(1);
    expect(report.kin).toBeLessThanOrEqual(260);
    expect(report.daySign).toBeTruthy();
    expect(report.daySignCN).toBeTruthy();
    expect(report.daySignMeaning).toBeTruthy();
    expect(report.galacticTone).toBeGreaterThanOrEqual(1);
    expect(report.galacticTone).toBeLessThanOrEqual(13);
    expect(report.toneMeaning).toBeTruthy();
    expect(report.galacticSignature).toBeTruthy();
    expect(report.haabMonth).toBeTruthy();
    expect(report.haabDay).toBeGreaterThanOrEqual(0);
    expect(report.longCount).toMatch(/^\d+\.\d+\.\d+\.\d+\.\d+$/);
    expect(report.wavespell).toBeTruthy();
    expect(report.color).toBeTruthy();
    expect(report.colorCN).toBeTruthy();
    expect(report.earthFamily).toBeTruthy();
    expect(report.castle).toBeTruthy();
    expect(report.dreamspellCross).toBeDefined();
    expect(report.dreamspellCross.guide.sign).toBeTruthy();
    expect(report.dreamspellCross.analog.sign).toBeTruthy();
    expect(report.dreamspellCross.antipode.sign).toBeTruthy();
    expect(report.dreamspellCross.occult.sign).toBeTruthy();
    expect(report.gapDay).toBeDefined();
    expect(typeof report.gapDay.isGAP).toBe('boolean');
    expect(report.gapDay.interpretation).toBeTruthy();
    expect(report.toneSignSynergy).toBeDefined();
    expect(['high', 'medium', 'low']).toContain(report.toneSignSynergy.harmony);
    expect(typeof report.isPowerDay).toBe('boolean');
    expect(report.lifeVectors).toBeDefined();
    expect(Object.keys(report.lifeVectors).length).toBeGreaterThanOrEqual(8);
  });

  it('lifeVectors values are in 5-95 range', () => {
    const report = MayanCalendarEngine.calculate(MOCK_INPUT);
    for (const [, v] of Object.entries(report.lifeVectors)) {
      expect(v).toBeGreaterThanOrEqual(5);
      expect(v).toBeLessThanOrEqual(95);
    }
  });

  it('deterministic: same input produces same output', () => {
    const r1 = MayanCalendarEngine.calculate(MOCK_INPUT);
    const r2 = MayanCalendarEngine.calculate(MOCK_INPUT);
    expect(r1).toEqual(r2);
  });

  it('sensitive to input changes', () => {
    const r1 = MayanCalendarEngine.calculate(MOCK_INPUT);
    const r2 = MayanCalendarEngine.calculate({ ...MOCK_INPUT, day: 16 });
    const differ = r1.kin !== r2.kin ||
      r1.daySign !== r2.daySign ||
      r1.galacticTone !== r2.galacticTone ||
      JSON.stringify(r1.lifeVectors) !== JSON.stringify(r2.lifeVectors);
    expect(differ).toBe(true);
  });

  it('SystemEngineResult fields are populated in orchestrated output', () => {
    const si = QuantumPredictionEngine.buildStandardizedInput({
      year: MOCK_INPUT.year, month: MOCK_INPUT.month, day: MOCK_INPUT.day,
      hour: 14, minute: 30, gender: 'male',
      geoLatitude: 39.9042, geoLongitude: 116.4074,
      timezoneOffsetMinutes: 480,
    });
    const unified = QuantumPredictionEngine.orchestrate(si);
    const mayanEo = unified.engineOutputs.find(eo => eo.engineName === 'mayan');
    expect(mayanEo).toBeDefined();
    expect(mayanEo!.explanationTrace.length).toBeGreaterThan(0);
    expect(mayanEo!.completenessScore).toBeGreaterThanOrEqual(0);
    expect(mayanEo!.validationFlags).toBeDefined();
    expect(mayanEo!.validationFlags.passed.length).toBeGreaterThan(0);
    expect(mayanEo!.timeWindows).toBeDefined();
    expect(mayanEo!.aspectScores).toBeDefined();
    expect(Object.keys(mayanEo!.aspectScores).length).toBeGreaterThan(0);
    expect(mayanEo!.eventCandidates.length).toBeGreaterThan(0);
  });
});
