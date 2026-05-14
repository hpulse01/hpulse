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

/**
 * Build the UTC instant corresponding to a local civil time in `iana`.
 *
 * Performs two iterations of offset resolution to settle DST transitions.
 */
export function utcFromLocal(
  local: { year: number; month: number; day: number; hour: number; minute: number; second?: number },
  iana: string,
): { utc: Date; offsetMinutes: number } {
  const naiveUtcMs = Date.UTC(
    local.year,
    local.month - 1,
    local.day,
    local.hour,
    local.minute,
    local.second ?? 0,
  );
  // First pass: get offset assuming naïve UTC ≈ local
  let offset = offsetMinutesAt(new Date(naiveUtcMs), iana);
  let utcMs = naiveUtcMs - offset * 60000;
  // Second pass: refine across DST boundaries
  offset = offsetMinutesAt(new Date(utcMs), iana);
  utcMs = naiveUtcMs - offset * 60000;
  return { utc: new Date(utcMs), offsetMinutes: offset };
}
