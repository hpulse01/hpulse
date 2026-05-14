import { describe, it, expect } from 'vitest';
import { hourBranchOf, hourPillarOf, hourStemOf } from '../chineseHour';

describe('hourBranchOf', () => {
  it('maps 23 and 0 to 子, 1-2 to 丑, ..., 21-22 to 亥', () => {
    expect(hourBranchOf(23)).toBe('子');
    expect(hourBranchOf(0)).toBe('子');
    expect(hourBranchOf(1)).toBe('丑');
    expect(hourBranchOf(2)).toBe('丑');
    expect(hourBranchOf(11)).toBe('午');
    expect(hourBranchOf(12)).toBe('午');
    expect(hourBranchOf(21)).toBe('亥');
    expect(hourBranchOf(22)).toBe('亥');
  });

  it('rejects out-of-range values', () => {
    expect(() => hourBranchOf(24)).toThrow();
    expect(() => hourBranchOf(-1)).toThrow();
  });
});

describe('hourStemOf — 五鼠遁', () => {
  // 子时 stems by day stem family
  it('甲/己日子时 → 甲子时', () => {
    expect(hourStemOf('甲', '子')).toBe('甲');
    expect(hourStemOf('己', '子')).toBe('甲');
  });
  it('乙/庚日子时 → 丙子时', () => {
    expect(hourStemOf('乙', '子')).toBe('丙');
    expect(hourStemOf('庚', '子')).toBe('丙');
  });
  it('丙/辛日子时 → 戊子时', () => {
    expect(hourStemOf('丙', '子')).toBe('戊');
    expect(hourStemOf('辛', '子')).toBe('戊');
  });
  it('丁/壬日子时 → 庚子时', () => {
    expect(hourStemOf('丁', '子')).toBe('庚');
    expect(hourStemOf('壬', '子')).toBe('庚');
  });
  it('戊/癸日子时 → 壬子时', () => {
    expect(hourStemOf('戊', '子')).toBe('壬');
    expect(hourStemOf('癸', '子')).toBe('壬');
  });

  it('甲日午时 → 庚午', () => {
    // 甲(0) 午(6): (0%5)*2 + 6 = 6 → 庚
    expect(hourPillarOf('甲', 12).ganzhi).toBe('庚午');
  });
});
