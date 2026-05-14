import { describe, it, expect } from 'vitest';
import { twelveStageOf } from '../twelveStages';

describe('twelveStageOf', () => {
  it('甲 (yang) 长生 at 亥, 帝旺 at 卯', () => {
    expect(twelveStageOf('甲', '亥')).toBe('长生');
    expect(twelveStageOf('甲', '卯')).toBe('帝旺');
  });
  it('乙 (yin) reverses: 长生 at 午, 帝旺 at 寅', () => {
    expect(twelveStageOf('乙', '午')).toBe('长生');
    expect(twelveStageOf('乙', '寅')).toBe('帝旺');
  });
  it('庚 长生 at 巳, 帝旺 at 酉', () => {
    expect(twelveStageOf('庚', '巳')).toBe('长生');
    expect(twelveStageOf('庚', '酉')).toBe('帝旺');
  });
});
