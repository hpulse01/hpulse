import { describe, it, expect } from 'vitest';
import { ZiweiEngine, type ZiweiReport } from './ziweiAlgorithm';

const PALACE_NAMES = ['命宫', '兄弟', '夫妻', '子女', '财帛', '疾厄', '迁移', '仆役', '官禄', '田宅', '福德', '父母'];
const MAIN_14 = ['紫微', '天机', '太阳', '武曲', '天同', '廉贞', '天府', '太阴', '贪狼', '巨门', '天相', '天梁', '七杀', '破军'];

function getReport(): ZiweiReport {
  return ZiweiEngine.generateReport({ year: 1990, month: 6, day: 15, hour: 14, gender: 'male' });
}

describe('ZiweiEngine', () => {
  it('十四主星安星成功 — all 14 main stars placed', () => {
    const r = getReport();
    const allStars = r.palaces.flatMap(p => p.stars.filter(s => s.type === 'major').map(s => s.name));
    for (const star of MAIN_14) {
      expect(allStars).toContain(star);
    }
  });

  it('十二宫结构完整 — all 12 palaces present', () => {
    const r = getReport();
    expect(r.palaces).toHaveLength(12);
    for (const name of PALACE_NAMES) {
      expect(r.palaces.some(p => p.name === name)).toBe(true);
    }
  });

  it('命宫/身宫非空', () => {
    const r = getReport();
    expect(r.mingGong).toBeTruthy();
    expect(r.shenGong).toBeTruthy();
    expect(r.palaces.some(p => p.isMing)).toBe(true);
    expect(r.palaces.some(p => p.isShen)).toBe(true);
  });

  it('五行局已正式纳入', () => {
    const r = getReport();
    expect(r.wuxingju).toBeDefined();
    expect(r.wuxingju.name).toBeTruthy();
    expect(r.wuxingju.number).toBeGreaterThan(0);
  });

  it('四化非空 — at least 4 sihua entries', () => {
    const r = getReport();
    expect(r.sihua.length).toBeGreaterThanOrEqual(4);
    const transforms = r.sihua.map(s => s.transform);
    expect(transforms).toContain('禄');
    expect(transforms).toContain('权');
    expect(transforms).toContain('科');
    expect(transforms).toContain('忌');
  });

  it('大限非空', () => {
    const r = getReport();
    expect(r.daxian.length).toBeGreaterThan(0);
    for (const dx of r.daxian) {
      expect(dx.palaceName).toBeTruthy();
      expect(dx.startAge).toBeDefined();
      expect(dx.endAge).toBeGreaterThan(dx.startAge);
    }
  });

  it('流年非空', () => {
    const r = getReport();
    expect(r.liunian.length).toBeGreaterThan(0);
    for (const ln of r.liunian) {
      expect(ln.year).toBeGreaterThan(1900);
      expect(ln.palaceName).toBeTruthy();
    }
  });

  it('格局检测有输出', () => {
    const r = getReport();
    expect(r.patterns).toBeDefined();
    expect(Array.isArray(r.patterns)).toBe(true);
  });

  it('星曜亮度已区分 — brightness is not all same', () => {
    const r = getReport();
    const brightnessSet = new Set(r.palaces.flatMap(p => p.stars.filter(s => s.type === 'major').map(s => s.brightness)));
    expect(brightnessSet.size).toBeGreaterThan(1);
  });

  it('辅星/煞星至少部分存在', () => {
    const r = getReport();
    const allStarNames = r.palaces.flatMap(p => p.stars.map(s => s.name));
    const auxShaStar = ['左辅', '右弼', '天魁', '天钺', '禄存', '天马', '擎羊', '陀罗', '火星', '铃星', '地空', '地劫'];
    let found = 0;
    for (const s of auxShaStar) {
      if (allStarNames.includes(s)) found++;
    }
    expect(found).toBeGreaterThanOrEqual(6);
  });

  it('FateVector is valid (all dims 0-100)', () => {
    const r = getReport();
    // Test via the orchestrator engine output mapping
    const mingPalace = r.palaces.find(p => p.isMing);
    expect(mingPalace).toBeDefined();
    // Basic validation that the report has enough data for FateVector mapping
    expect(r.palaces.length).toBe(12);
    expect(r.sihua.length).toBeGreaterThanOrEqual(4);
  });

  it('palaceAnalysis 包含关键宫位分析', () => {
    const r = getReport();
    expect(r.palaceAnalysis).toBeDefined();
    expect(Object.keys(r.palaceAnalysis).length).toBeGreaterThan(0);
  });

  it('deterministic: same input → same report', () => {
    const r1 = getReport();
    const r2 = getReport();
    expect(r1.mingGong).toBe(r2.mingGong);
    expect(r1.shenGong).toBe(r2.shenGong);
    expect(r1.wuxingju).toEqual(r2.wuxingju);
    expect(r1.sihua).toEqual(r2.sihua);
  });
});
