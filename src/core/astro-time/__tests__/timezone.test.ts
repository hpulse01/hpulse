import { describe, expect, it } from 'vitest';
import { resolveLocalTime, utcFromLocal } from '../timezone';

describe('IANA local-time resolution', () => {
  it('uses the historical DST offset at the birth instant', () => {
    const result = utcFromLocal(
      { year: 1990, month: 6, day: 15, hour: 14, minute: 30 },
      'Asia/Shanghai',
    );
    expect(result.offsetMinutes).toBe(540);
    expect(result.utc.toISOString()).toBe('1990-06-15T05:30:00.000Z');
  });

  it('uses daylight time for a New York summer birth', () => {
    const result = utcFromLocal(
      { year: 2024, month: 7, day: 1, hour: 12, minute: 0 },
      'America/New_York',
    );
    expect(result.offsetMinutes).toBe(-240);
    expect(result.utc.toISOString()).toBe('2024-07-01T16:00:00.000Z');
  });

  it('detects a fall-back overlap and deterministically selects the earlier instant', () => {
    const result = resolveLocalTime(
      { year: 2024, month: 11, day: 3, hour: 1, minute: 30 },
      'America/New_York',
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.ambiguous).toBe(true);
    expect(result.alternatives).toHaveLength(2);
    expect(result.utc.toISOString()).toBe('2024-11-03T05:30:00.000Z');
  });

  it('rejects a spring-forward time that never existed', () => {
    expect(resolveLocalTime(
      { year: 2024, month: 3, day: 10, hour: 2, minute: 30 },
      'America/New_York',
    )).toEqual({ ok: false, reason: 'nonexistent_local_time' });
  });

  it('rejects invalid dates and timezone identifiers', () => {
    expect(resolveLocalTime(
      { year: 2024, month: 2, day: 31, hour: 12, minute: 0 },
      'UTC',
    )).toEqual({ ok: false, reason: 'invalid_local_time' });
    expect(resolveLocalTime(
      { year: 2024, month: 1, day: 1, hour: 12, minute: 0 },
      'Mars/Olympus',
    )).toEqual({ ok: false, reason: 'invalid_timezone' });
  });
});
