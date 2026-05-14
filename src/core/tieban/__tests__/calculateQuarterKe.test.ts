import { describe, it, expect } from 'vitest';
import { calculateQuarterKe } from '../calculateQuarterKe';

describe('calculateQuarterKe', () => {
  it('produces exactly 8 candidates with monotonically increasing keOffset', () => {
    const r = calculateQuarterKe(123456);
    expect(r.candidates).toHaveLength(8);
    for (let i = 0; i < 8; i++) {
      expect(r.candidates[i].quarterIndex).toBe(i);
      expect(r.candidates[i].keOffset).toBe(i * 15);
    }
  });

  it('every candidate clauseNumber is in [1, 12000]', () => {
    const r = calculateQuarterKe(987654);
    for (const c of r.candidates) {
      expect(c.clauseNumber).toBeGreaterThanOrEqual(1);
      expect(c.clauseNumber).toBeLessThanOrEqual(12000);
    }
  });

  it('is deterministic', () => {
    const a = calculateQuarterKe(50000);
    const b = calculateQuarterKe(50000);
    expect(JSON.stringify(a.candidates)).toBe(JSON.stringify(b.candidates));
  });
});
