import { describe, it, expect } from 'vitest';
import { performDeepBaZiAnalysis } from './baziDeepAnalysis';

describe('BaZi Deep Analysis Engine', () => {
  it('produces structured output with key fields', () => {
    const result = performDeepBaZiAnalysis(1990, 5, 15, 8, 30, 'male');

    // Layer 1: rawParams
    expect(result.rawParams.solarDate).toContain('1990');
    expect(result.rawParams.fourPillars.year).toBeTruthy();
    expect(result.rawParams.fourPillars.month).toBeTruthy();
    expect(result.rawParams.fourPillars.day).toBeTruthy();
    expect(result.rawParams.fourPillars.hour).toBeTruthy();
    expect(result.rawParams.dayMasterStem).toBeTruthy();
    expect(result.rawParams.dayMasterElement).toBeTruthy();

    // Layer 2: chartResult
    expect(result.chartResult.tenGods.length).toBe(4);
    expect(result.chartResult.hiddenStems.length).toBe(4);
    expect(result.chartResult.naYinAnalysis.length).toBe(4);
    expect(result.chartResult.elementBalance.length).toBe(5);
    expect(result.chartResult.twelveStages.length).toBe(4);
    expect(Array.isArray(result.chartResult.shenSha)).toBe(true);
    expect(Array.isArray(result.chartResult.branchInteractions)).toBe(true);
    expect(Array.isArray(result.chartResult.stemCombinations)).toBe(true);
    expect(result.chartResult.kongWang).toBeDefined();
    expect(result.chartResult.kongWang.voidBranches.length).toBe(2);

    // Layer 3: analysisConclusion
    expect(result.analysisConclusion.dayMaster.stem).toBeTruthy();
    expect(result.analysisConclusion.dayMaster.strengthScore).toBeGreaterThanOrEqual(0);
    expect(result.analysisConclusion.dayMaster.strengthScore).toBeLessThanOrEqual(100);
    expect(['极弱', '偏弱', '中和', '偏旺', '极旺']).toContain(result.analysisConclusion.dayMaster.strengthLevel);
    expect(result.analysisConclusion.favorable.elements.length).toBeGreaterThan(0);
    expect(result.analysisConclusion.pattern.name).toBeTruthy();
    expect(['正格', '外格', '特殊格']).toContain(result.analysisConclusion.pattern.type);
    expect(result.analysisConclusion.summary).toBeTruthy();

    // Legacy flat access
    expect(result.fourPillars).toEqual(result.rawParams.fourPillars);
    expect(result.dayMaster).toEqual(result.analysisConclusion.dayMaster);
  });

  it('deterministic: same input produces same output', () => {
    const r1 = performDeepBaZiAnalysis(1990, 5, 15, 8, 30, 'male');
    const r2 = performDeepBaZiAnalysis(1990, 5, 15, 8, 30, 'male');

    expect(r1.rawParams).toEqual(r2.rawParams);
    expect(r1.analysisConclusion.dayMaster).toEqual(r2.analysisConclusion.dayMaster);
    expect(r1.analysisConclusion.pattern).toEqual(r2.analysisConclusion.pattern);
    expect(r1.chartResult.elementBalance).toEqual(r2.chartResult.elementBalance);
    expect(r1.summary).toEqual(r2.summary);
  });

  it('sensitive to input changes', () => {
    const rA = performDeepBaZiAnalysis(1990, 5, 15, 8, 30, 'male');
    const rB = performDeepBaZiAnalysis(1990, 5, 16, 8, 30, 'male');

    // Day change should yield different pillars and potentially different analysis
    const differs =
      rA.rawParams.fourPillars.day !== rB.rawParams.fourPillars.day ||
      rA.analysisConclusion.dayMaster.strengthScore !== rB.analysisConclusion.dayMaster.strengthScore ||
      rA.summary !== rB.summary;

    expect(differs).toBe(true);
  });
});
