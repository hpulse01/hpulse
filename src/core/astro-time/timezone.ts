/**
 * IANA timezone offset resolution.
 *
 * Uses Intl.DateTimeFormat — built-in, deterministic for any historical date
 * supported by the runtime tzdata. Returns the offset in minutes EAST of UTC
 * at the supplied instant (handles DST).
 */

/**
 * Compute the UTC offset (minutes) in `iana` at the moment `utc`.
 * Positive east of UTC.
 */
export function offsetMinutesAt(utc: Date, iana: string): number {
  // Use 'en-US' to get a stable, parseable string.
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: iana,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const parts = dtf.formatToParts(utc);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const localAsUtcMs = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour'),
    get('minute'),
    get('second'),
  );
  return Math.round((localAsUtcMs - utc.getTime()) / 60000);
}

export type LocalTimeResolution =
  | {
      ok: true;
      utc: Date;
      offsetMinutes: number;
      ambiguous: boolean;
      alternatives: Date[];
    }
  | {
      ok: false;
      reason: 'invalid_local_time' | 'invalid_timezone' | 'nonexistent_local_time';
    };

type CivilTime = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second?: number;
};

function partsAt(utc: Date, iana: string): Required<CivilTime> {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: iana,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(utc);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
    second: get('second'),
  };
}

function sameCivilTime(a: Required<CivilTime>, b: Required<CivilTime>): boolean {
  return a.year === b.year
    && a.month === b.month
    && a.day === b.day
    && a.hour === b.hour
    && a.minute === b.minute
    && a.second === b.second;
}

/**
 * Resolve a local civil time against IANA tzdata.
 *
 * Unlike a fixed UTC offset, this detects daylight-saving gaps and overlaps.
 * An overlap is deterministic: the earlier UTC occurrence is selected and all
 * matching instants are returned so callers can request user confirmation.
 */
export function resolveLocalTime(local: CivilTime, iana: string): LocalTimeResolution {
  const requested: Required<CivilTime> = { ...local, second: local.second ?? 0 };
  const naiveUtcMs = Date.UTC(
    requested.year,
    requested.month - 1,
    requested.day,
    requested.hour,
    requested.minute,
    requested.second,
  );
  const normalized = new Date(naiveUtcMs);
  if (
    normalized.getUTCFullYear() !== requested.year
    || normalized.getUTCMonth() + 1 !== requested.month
    || normalized.getUTCDate() !== requested.day
    || normalized.getUTCHours() !== requested.hour
    || normalized.getUTCMinutes() !== requested.minute
    || normalized.getUTCSeconds() !== requested.second
  ) {
    return { ok: false, reason: 'invalid_local_time' };
  }

  const offsets = new Set<number>();
  try {
    // Sampling both sides of the local date captures offsets before and after
    // DST transitions, including half-hour changes such as Australia/Lord_Howe.
    for (const hours of [-48, -24, -12, 0, 12, 24, 48]) {
      offsets.add(offsetMinutesAt(new Date(naiveUtcMs + hours * 3_600_000), iana));
    }
  } catch {
    return { ok: false, reason: 'invalid_timezone' };
  }

  const alternatives = Array.from(offsets)
    .map((offset) => new Date(naiveUtcMs - offset * 60_000))
    .filter((candidate) => {
      try {
        return sameCivilTime(partsAt(candidate, iana), requested);
      } catch {
        return false;
      }
    })
    .filter((candidate, index, all) => (
      all.findIndex((other) => other.getTime() === candidate.getTime()) === index
    ))
    .sort((a, b) => a.getTime() - b.getTime());

  if (alternatives.length === 0) {
    return { ok: false, reason: 'nonexistent_local_time' };
  }

  const utc = alternatives[0];
  return {
    ok: true,
    utc,
    offsetMinutes: offsetMinutesAt(utc, iana),
    ambiguous: alternatives.length > 1,
    alternatives,
  };
}

/**
 * Build the UTC instant corresponding to a local civil time in `iana`.
 *
 * Performs two iterations of offset resolution to settle DST transitions.
 */
export function utcFromLocal(
  local: CivilTime,
  iana: string,
): { utc: Date; offsetMinutes: number; ambiguous: boolean } {
  const resolved = resolveLocalTime(local, iana);
  if (resolved.ok === false) {
    throw new RangeError(resolved.reason);
  }
  return {
    utc: resolved.utc,
    offsetMinutes: resolved.offsetMinutes,
    ambiguous: resolved.ambiguous,
  };
}
