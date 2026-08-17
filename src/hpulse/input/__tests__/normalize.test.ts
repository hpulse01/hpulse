import { describe, expect, it } from 'vitest';
import { RawUserInputSchema, type RawUserInput } from '../types';
import { resolveBirthInstant } from '../normalize';

const base: RawUserInput = {
  birth_date: '1990-06-15',
  birth_time: '14:30',
  calendar: 'gregorian',
  location_name: '上海',
  latitude: 31.2304,
  longitude: 121.4737,
  timezone: 'Asia/Shanghai',
  gender: 'male',
  query_time_utc: '2026-08-17T00:00:00Z',
  query_type: 'natal',
  granularity: 'day',
};

describe('resolveBirthInstant', () => {
  it('rejects lunar components until an explicit lunar-to-Gregorian converter exists', () => {
    expect(RawUserInputSchema.safeParse({ ...base, calendar: 'lunar' }).success).toBe(false);
  });

  it('uses historical IANA offset rather than a fixed zone offset', () => {
    expect(resolveBirthInstant(base)).toEqual({
      ok: true,
      birthUtc: '1990-06-15T05:30:00Z',
      offsetMinutes: 540,
      ambiguous: false,
    });
  });

  it('requires an explicit offset for an ambiguous fall-back time', () => {
    const ambiguous = {
      ...base,
      birth_date: '2024-11-03',
      birth_time: '01:30',
      timezone: 'America/New_York',
    };
    const missing = resolveBirthInstant(ambiguous);
    expect(missing.ok).toBe(false);
    if (missing.ok === false) expect(missing.issue.code).toBe('ambiguous_local_time');

    expect(resolveBirthInstant({ ...ambiguous, timezone_offset_minutes: -300 })).toEqual({
      ok: true,
      birthUtc: '2024-11-03T06:30:00Z',
      offsetMinutes: -300,
      ambiguous: true,
    });
  });

  it('rejects a stale or forged offset', () => {
    const result = resolveBirthInstant({ ...base, timezone_offset_minutes: 480 });
    expect(result.ok).toBe(false);
    if (result.ok === false) expect(result.issue.code).toBe('timezone_offset_mismatch');
  });
});
