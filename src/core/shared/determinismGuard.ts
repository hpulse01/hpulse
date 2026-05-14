/**
 * Determinism guard — runtime + test-time helpers that enforce the
 * "no randomness in core algorithms" invariant.
 *
 * - assertDeterministic(fn): runs `fn` twice with identical inputs and
 *   throws if the JSON-serialized outputs differ.
 * - scanCoreForRandomness(files, source): scans source code strings for
 *   forbidden tokens (Math.random, Date.now used as a value source, etc.)
 *
 * The actual filesystem scan lives in the test file so this module remains
 * a pure runtime helper.
 */

export const FORBIDDEN_TOKENS: readonly RegExp[] = [
  /\bMath\.random\s*\(/,
];

/**
 * Date.now / new Date() are allowed only when used for measuring elapsed
 * computation time (computationTimeMs). They must NOT influence the
 * algorithmic output. Any other usage in src/core is suspicious.
 *
 * scanDateNowUsage() returns occurrences with their surrounding line so
 * the audit can flag misuse. An allow-list of files (adapters that need
 * to stamp computationTimeMs) is supported.
 */
export const DATE_TIME_TOKENS: readonly RegExp[] = [
  /\bDate\.now\s*\(/,
  /new\s+Date\s*\(\s*\)/,
];

export interface DateUsage {
  file: string;
  line: number;
  text: string;
  /** true if line context suggests timing measurement, not value baking */
  looksLikeTiming: boolean;
}

const TIMING_HINTS = /computationTimeMs|elapsed|t0|tStart|startTime|performance\.now|Date\.now\(\)\s*-\s*/;
const COMMENT_LINE_RE = /^\s*(\/\/|\*|\/\*)/;

export function scanDateNowUsage(file: string, source: string): DateUsage[] {
  const out: DateUsage[] = [];
  const lines = source.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (COMMENT_LINE_RE.test(line)) continue;
    if (DATE_TIME_TOKENS.some(re => re.test(line))) {
      const ctx = lines.slice(Math.max(0, i - 1), Math.min(lines.length, i + 2)).join('\n');
      out.push({
        file,
        line: i + 1,
        text: line.trim(),
        looksLikeTiming: TIMING_HINTS.test(ctx),
      });
    }
  }
  return out;
}

export function findForbidden(source: string): string[] {
  const hits: string[] = [];
  for (const re of FORBIDDEN_TOKENS) {
    const m = source.match(re);
    if (m) hits.push(m[0]);
  }
  return hits;
}

/**
 * Run `fn` twice and assert outputs are deeply equal (structural).
 * Throws Error with a diff summary on mismatch.
 */
export function assertDeterministic<T>(fn: () => T, label = 'fn'): T {
  const a = fn();
  const b = fn();
  const sa = JSON.stringify(a);
  const sb = JSON.stringify(b);
  if (sa !== sb) {
    throw new Error(
      `Determinism violation in ${label}: outputs differ between runs.\nA=${sa}\nB=${sb}`,
    );
  }
  return a;
}
