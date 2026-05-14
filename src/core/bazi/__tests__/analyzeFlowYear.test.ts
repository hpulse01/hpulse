import { describe, it, expect } from 'vitest';
import { analyzeFlowYear } from '../analyzeFlowYear';
import { calculateBaziChart } from '../calculateBaziChart';

describe('analyzeFlowYear', () => {
  const c = calculateBaziChart({
    birthLocalDateTime: { year: 1995, month: 6, day: 15, hour: 14, minute: 30 },
    gender: 'male', timezoneIana: 'Asia/Shanghai', geoLatitude: 31.2304, geoLongitude: 121.4737,
  });

  it('1984=甲子 anchor: 2024 → 甲辰', () => {
    const f = analyzeFlowYear(c, { targetYear: 2024 });
    expect(f.ganZhi).toBe('甲辰');
    expect(f.year).toBe(2024);
  });

  it('rejects when target missing', () => {
    expect(() => analyzeFlowYear(c, {})).toThrow();
  });

  it('uses queryTimeUtc when targetYear absent', () => {
    const f = analyzeFlowYear(c, { queryTimeUtc: '2024-06-01T00:00:00Z' });
    expect(f.year).toBe(2024);
  });
});
