import { describe, it, expect } from 'vitest';
import { TiebanEngine } from './tiebanAlgorithm';
import type { TiebanInput } from './tiebanAlgorithm';

const INPUT_A: TiebanInput = {
  year: 1990, month: 5, day: 15, hour: 8, minute: 30,
  gender: 'male', geoLatitude: 39.9, geoLongitude: 116.4, timezoneOffsetMinutes: 480,
};

const INPUT_B: TiebanInput = {
  year: 1990, month: 5, day: 16, hour: 8, minute: 30,
  gender: 'male', geoLatitude: 39.9, geoLongitude: 116.4, timezoneOffsetMinutes: 480,
};

describe('Tieban Algorithm Engine', () => {
  it('produces structured output with key fields', () => {
    const calcResult = TiebanEngine.calculateBaseNumber(INPUT_A);
    expect(calcResult.baseNumber).toBeGreaterThan(0);
    expect(calcResult.pillars.year).toBeTruthy();
    expect(calcResult.pillars.month).toBeTruthy();
    expect(calcResult.pillars.day).toBeTruthy();
    expect(calcResult.pillars.hour).toBeTruthy();
    expect(calcResult.pillars.fullDisplay).toBeTruthy();
    expect(calcResult.stemSum).toBeGreaterThan(0);
    expect(calcResult.branchSum).toBeGreaterThan(0);

    // Theoretical base
    const theoreticalBase = TiebanEngine.calculateTheoreticalBase(INPUT_A);
    expect(theoreticalBase).toBeGreaterThanOrEqual(1);
    expect(theoreticalBase).toBeLessThanOrEqual(12000);

    // KaoKe candidates
    const candidates = TiebanEngine.generateKaoKeCandidates(calcResult.baseNumber);
    expect(candidates).toHaveLength(8);
    for (const c of candidates) {
      expect(c.clauseNumber).toBeGreaterThanOrEqual(1);
      expect(c.clauseNumber).toBeLessThanOrEqual(12000);
      expect(c.timeLabel).toBeTruthy();
    }

    // Destiny projection
    const destinyProjection = TiebanEngine.projectDestinyWithOffset(theoreticalBase, 0);
    expect(destinyProjection.lifeDestiny).toBeGreaterThanOrEqual(1);
    expect(destinyProjection.lifeDestiny).toBeLessThanOrEqual(12000);
    expect(destinyProjection.marriage).toBeGreaterThanOrEqual(1);
    expect(destinyProjection.wealth).toBeGreaterThanOrEqual(1);
    expect(destinyProjection.career).toBeGreaterThanOrEqual(1);
    expect(destinyProjection.health).toBeGreaterThanOrEqual(1);
    expect(destinyProjection.children).toBeGreaterThanOrEqual(1);

    // BaZi profile
    const baziProfile = TiebanEngine.calculateBaZiProfile(INPUT_A);
    expect(baziProfile.dayMaster).toBeTruthy();
    expect(baziProfile.dayMasterElement).toBeTruthy();
    expect(baziProfile.favorableElements.length).toBeGreaterThan(0);
    expect(baziProfile.unfavorableElements.length).toBeGreaterThan(0);

    // Da Yun cycles
    const daYun = TiebanEngine.calculateDaYun(INPUT_A);
    expect(daYun.length).toBeGreaterThan(0);
    // First entry (index 0) is childhood fortune (童限), may have empty ganZhi
    for (const cycle of daYun.slice(1)) {
      expect(cycle.ganZhi).toBeTruthy();
      expect(cycle.element).toBeTruthy();
    }

    // Full destiny report (v2.0)
    const report = TiebanEngine.generateFullDestinyReport(INPUT_A, theoreticalBase, 0);
    expect(report.twelvePalaces).toBeDefined();
    expect(report.twelvePalaces!.length).toBe(12);
    for (const palace of report.twelvePalaces!) {
      expect(palace.name).toBeTruthy();
      expect(palace.clauseNumber).toBeGreaterThanOrEqual(1);
      expect(palace.clauseStrength).toBeGreaterThanOrEqual(5);
      expect(palace.clauseStrength).toBeLessThanOrEqual(95);
      expect(['大吉', '吉', '平', '凶', '大凶']).toContain(palace.evaluation);
    }
    expect(report.luoShuHarmony).toBeDefined();
    expect(report.luoShuHarmony!.harmonyScore).toBeGreaterThanOrEqual(10);
    expect(report.luoShuHarmony!.harmonyScore).toBeLessThanOrEqual(100);

    // v3.0 fields
    expect(report.heTuHarmony).toBeDefined();
    expect(report.heTuHarmony!.harmonyScore).toBeGreaterThanOrEqual(10);
    expect(report.xianTianGua).toBeDefined();
    expect(report.xianTianGua!.totalNumber).toBeGreaterThan(0);

    // Three-layer report
    expect(report.threeLayerReport).toBeDefined();
    expect(report.threeLayerReport!.analysisConclusion.overallGrade).toBeTruthy();
    expect(report.threeLayerReport!.analysisConclusion.lifeSummary).toBeTruthy();
  });

  it('deterministic: same input produces same output', () => {
    const base1 = TiebanEngine.calculateTheoreticalBase(INPUT_A);
    const base2 = TiebanEngine.calculateTheoreticalBase(INPUT_A);
    expect(base1).toBe(base2);

    const report1 = TiebanEngine.generateFullDestinyReport(INPUT_A, base1, 0);
    const report2 = TiebanEngine.generateFullDestinyReport(INPUT_A, base2, 0);

    expect(report1.destinyProjection).toEqual(report2.destinyProjection);
    expect(report1.baziProfile.dayMaster).toBe(report2.baziProfile.dayMaster);
    expect(report1.twelvePalaces).toEqual(report2.twelvePalaces);
    expect(report1.luoShuHarmony).toEqual(report2.luoShuHarmony);
    expect(report1.threeLayerReport!.analysisConclusion).toEqual(report2.threeLayerReport!.analysisConclusion);
  });

  it('sensitive to input changes', () => {
    const baseA = TiebanEngine.calculateTheoreticalBase(INPUT_A);
    const baseB = TiebanEngine.calculateTheoreticalBase(INPUT_B);

    const reportA = TiebanEngine.generateFullDestinyReport(INPUT_A, baseA, 0);
    const reportB = TiebanEngine.generateFullDestinyReport(INPUT_B, baseB, 0);

    const differs =
      baseA !== baseB ||
      reportA.destinyProjection.lifeDestiny !== reportB.destinyProjection.lifeDestiny ||
      reportA.baziProfile.dayMaster !== reportB.baziProfile.dayMaster ||
      JSON.stringify(reportA.twelvePalaces) !== JSON.stringify(reportB.twelvePalaces);

    expect(differs).toBe(true);
  });
});
