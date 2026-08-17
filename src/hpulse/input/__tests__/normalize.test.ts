import { describe, expect, it } from 'vitest';
import { RawUserInputSchema, type RawUserInput } from '../types';
import { normalizeInput, resolveBirthInstant } from '../normalize';

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
  it('normalizes the optional calculation spelling without reading an account name', () => {
    const parsed = RawUserInputSchema.parse({
      ...base,
      calculation_name: '  Ｊｏｈｎ   Smith  ',
    });
    expect(parsed.calculation_name).toBe('John Smith');
  });

  it('treats a blank calculation spelling as omitted', () => {
    const parsed = RawUserInputSchema.parse({ ...base, calculation_name: '   ' });
    expect(parsed.calculation_name).toBeUndefined();
  });

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

describe('normalizeInput runtime fallback', () => {
  it('keeps the pipeline usable and explicitly reports when WASM is unavailable', async () => {
    const result = await normalizeInput({ ...base, calculation_name: '  Ｊｏｈｎ   Smith  ' });
    expect(result.ok).toBe(true);
    expect(result.input?.calculation_name).toBe('John Smith');
    expect(result.input?.seed_material).toMatch(/^[a-f0-9]{64}$/);
    expect(result.issues.some((issue) => issue.code === 'wasm_unavailable_typescript_fallback')).toBe(true);
  });
});
