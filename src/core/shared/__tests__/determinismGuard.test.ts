import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { assertDeterministic, findForbidden } from '../determinismGuard';

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const s = statSync(full);
    if (s.isDirectory()) walk(full, out);
    else if (full.endsWith('.ts') && !full.includes('__tests__')) out.push(full);
  }
  return out;
}

describe('determinismGuard', () => {
  it('assertDeterministic passes for pure functions', () => {
    const r = assertDeterministic(() => ({ x: 1, y: [2, 3] }));
    expect(r).toEqual({ x: 1, y: [2, 3] });
  });

  it('assertDeterministic throws for non-deterministic functions', () => {
    let n = 0;
    expect(() => assertDeterministic(() => ++n)).toThrow(/Determinism violation/);
  });

  it('src/core contains no Math.random calls', () => {
    const files = walk('src/core');
    const offenders: string[] = [];
    for (const f of files) {
      const src = readFileSync(f, 'utf8');
      const hits = findForbidden(src);
      if (hits.length) offenders.push(`${f}: ${hits.join(', ')}`);
    }
    expect(offenders).toEqual([]);
  });
});
