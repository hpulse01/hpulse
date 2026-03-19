import { describe, it, expect } from 'vitest';
import { KabbalahEngine } from './worldSystems/kabbalah';

const INPUT_A = { year: 1990, month: 5, day: 15 };
const INPUT_B = { year: 1990, month: 5, day: 16 };

describe('Kabbalah Engine', () => {
  it('produces structured output with key fields', () => {
    const report = KabbalahEngine.calculate(INPUT_A);

    // Soul & personality sephiroth
    expect(report.soulSephirah).toBeDefined();
    expect(report.soulSephirah.name).toBeTruthy();
    expect(report.soulSephirah.nameCN).toBeTruthy();
    expect(report.soulSephirah.energy).toBeGreaterThanOrEqual(10);
    expect(report.soulSephirah.energy).toBeLessThanOrEqual(95);

    expect(report.personalitySephirah).toBeDefined();
    expect(report.personalitySephirah.name).toBeTruthy();

    // Life path
    expect(report.lifePath).toBeDefined();
    expect(report.lifePath.tarotArcana).toBeTruthy();
    expect(report.lifePath.letter).toBeTruthy();

    // Active sephiroth — all 10
    expect(report.activeSephiroth).toHaveLength(10);

    // Tree balance
    expect(report.treeBalance.pillarOfMercy).toBeGreaterThan(0);
    expect(report.treeBalance.pillarOfSeverity).toBeGreaterThan(0);
    expect(report.treeBalance.middlePillar).toBeGreaterThan(0);
    expect(report.treeBalance.interpretation).toBeTruthy();

    // Gematria
    expect(report.gematria.totalValue).toBeGreaterThan(0);
    expect(report.gematria.reducedValue).toBeGreaterThanOrEqual(1);
    expect(report.gematria.reducedValue).toBeLessThanOrEqual(9);
    expect(report.gematria.resonantSephirah).toBeTruthy();

    // Four worlds
    expect(report.fourWorlds.dominantWorld).toBeTruthy();
    expect(report.fourWorlds.interpretation).toBeTruthy();

    // Shadow
    expect(report.shadowSephirah).toBeTruthy();

    // v3.0 fields
    expect(report.lightningFlash.sequence).toHaveLength(10);
    expect(report.lightningFlash.interpretation).toBeTruthy();
    expect(report.daatGateway).toBeDefined();
    expect(Array.isArray(report.activePaths)).toBe(true);

    // Life vectors
    const aspects = ['career', 'wealth', 'love', 'health', 'wisdom', 'social', 'creativity', 'fortune', 'family', 'spirituality'];
    for (const a of aspects) {
      expect(report.lifeVectors[a]).toBeGreaterThanOrEqual(5);
      expect(report.lifeVectors[a]).toBeLessThanOrEqual(95);
    }
  });

  it('deterministic: same input produces same output', () => {
    const r1 = KabbalahEngine.calculate(INPUT_A);
    const r2 = KabbalahEngine.calculate(INPUT_A);

    expect(r1.soulSephirah).toEqual(r2.soulSephirah);
    expect(r1.personalitySephirah).toEqual(r2.personalitySephirah);
    expect(r1.gematria).toEqual(r2.gematria);
    expect(r1.lifeVectors).toEqual(r2.lifeVectors);
    expect(r1.fourWorlds).toEqual(r2.fourWorlds);
  });

  it('sensitive to input changes', () => {
    const rA = KabbalahEngine.calculate(INPUT_A);
    const rB = KabbalahEngine.calculate(INPUT_B);

    // At least one of these should differ when day changes by 1
    const differs =
      rA.soulSephirah.index !== rB.soulSephirah.index ||
      rA.gematria.totalValue !== rB.gematria.totalValue ||
      JSON.stringify(rA.lifeVectors) !== JSON.stringify(rB.lifeVectors);

    expect(differs).toBe(true);
  });
});
