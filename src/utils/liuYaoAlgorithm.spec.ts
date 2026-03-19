import { describe, it, expect } from 'vitest';
import { calculateLiuYaoHexagram } from './liuYaoAlgorithm';

const TIMESTAMP_A = new Date('2024-06-15T10:30:00Z');
const TIMESTAMP_B = new Date('2024-06-15T10:30:01Z');

describe('LiuYao Algorithm Engine', () => {
  it('produces structured output with key fields', () => {
    const result = calculateLiuYaoHexagram(TIMESTAMP_A);

    // Layer 1: rawParams
    expect(result.rawParams.divineTime).toBeTruthy();
    expect(result.rawParams.timeGanZhi).toBeTruthy();
    expect(result.rawParams.dayStem).toBeTruthy();
    expect(result.rawParams.method).toContain('纳甲');

    // Layer 2: chartResult
    const hex = result.chartResult.mainHexagram;
    expect(hex.name).toBeTruthy();
    expect(hex.description).toBeTruthy();
    expect(hex.lines).toHaveLength(6);
    expect(hex.upperTrigram).toBeTruthy();
    expect(hex.lowerTrigram).toBeTruthy();
    expect(hex.palace).toBeTruthy();
    expect(hex.palaceElement).toBeTruthy();
    expect(hex.shiYao).toBeGreaterThanOrEqual(1);
    expect(hex.shiYao).toBeLessThanOrEqual(6);
    expect(hex.yingYao).toBeGreaterThanOrEqual(1);
    expect(hex.yingYao).toBeLessThanOrEqual(6);

    // Each line should have full annotations
    for (const line of hex.lines) {
      expect(line.position).toBeGreaterThanOrEqual(1);
      expect(line.position).toBeLessThanOrEqual(6);
      expect([6, 7, 8, 9]).toContain(line.value);
      expect(['yin', 'yang']).toContain(line.yinYang);
      expect(line.branch).toBeTruthy();
      expect(line.element).toBeTruthy();
      expect(line.relative).toBeTruthy();
      expect(line.spirit).toBeTruthy();
    }

    // Exactly one shi and one ying
    expect(hex.lines.filter(l => l.isShiYao).length).toBe(1);
    expect(hex.lines.filter(l => l.isYingYao).length).toBe(1);

    // Layer 3: analysisConclusion
    expect(result.analysisConclusion.interpretation).toBeTruthy();
    expect(result.analysisConclusion.dominantElement).toBeTruthy();
    expect(['大吉', '吉', '平', '凶', '大凶']).toContain(result.analysisConclusion.overallTendency);
    expect(result.analysisConclusion.keyFindings.length).toBeGreaterThan(0);

    // v3.0 fields
    expect(result.analysisConclusion.yongShen).toBeDefined();
    expect(result.analysisConclusion.yongShen!.yongShen.relative).toBeTruthy();
    expect(Array.isArray(result.analysisConclusion.fuShen)).toBe(true);
    expect(Array.isArray(result.analysisConclusion.fanFuYin)).toBe(true);

    // Legacy fields
    expect(result.mainHexagram).toBe(result.chartResult.mainHexagram);
    expect(result.interpretation).toBe(result.analysisConclusion.interpretation);
  });

  it('deterministic: same input produces same output', () => {
    const r1 = calculateLiuYaoHexagram(TIMESTAMP_A);
    const r2 = calculateLiuYaoHexagram(TIMESTAMP_A);

    expect(r1.mainHexagram.name).toBe(r2.mainHexagram.name);
    expect(r1.mainHexagram.lines.map(l => l.value)).toEqual(r2.mainHexagram.lines.map(l => l.value));
    expect(r1.mainHexagram.palace).toBe(r2.mainHexagram.palace);
    expect(r1.analysisConclusion.overallTendency).toBe(r2.analysisConclusion.overallTendency);
    expect(r1.analysisConclusion.interpretation).toBe(r2.analysisConclusion.interpretation);
  });

  it('sensitive to input changes', () => {
    const rA = calculateLiuYaoHexagram(TIMESTAMP_A);
    const rB = calculateLiuYaoHexagram(TIMESTAMP_B);

    // Changing the second should affect the line values (seed uses second)
    const linesA = rA.mainHexagram.lines.map(l => l.value);
    const linesB = rB.mainHexagram.lines.map(l => l.value);

    const differs =
      JSON.stringify(linesA) !== JSON.stringify(linesB) ||
      rA.mainHexagram.name !== rB.mainHexagram.name ||
      rA.analysisConclusion.interpretation !== rB.analysisConclusion.interpretation;

    expect(differs).toBe(true);
  });
});
