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
  // Date.now is allowed for performance.now-equivalent timing in adapters,
  // but never as a value baked into algorithm output. The test enforces
  // explicit allow-list per file.
];

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
