/// <reference types="node" />
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { findForbidden, scanDateNowUsage } from '../determinismGuard';

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const s = statSync(full);
    if (s.isDirectory()) walk(full, out);
    else if (full.endsWith('.ts') && !full.includes('__tests__')) out.push(full);
  }
  return out;
}

describe('determinism guard — full src/core scan', () => {
  const files = walk('src/core');

  it('no Math.random anywhere in src/core', () => {
    const offenders: string[] = [];
    for (const f of files) {
      const src = readFileSync(f, 'utf8');
      const hits = findForbidden(src);
      if (hits.length) offenders.push(`${f}: ${hits.join(', ')}`);
    }
    expect(offenders).toEqual([]);
  });

  it('Date.now / new Date() usage in src/core is only for timing measurement', () => {
    const violations: string[] = [];
    for (const f of files) {
      const src = readFileSync(f, 'utf8');
      const usages = scanDateNowUsage(f, src);
      for (const u of usages) {
        if (!u.looksLikeTiming) {
          violations.push(`${u.file}:${u.line} → ${u.text}`);
        }
      }
    }
    // Report (don't assert hard) — but make sure none are clearly value-baking.
    // Allow up to 0 strict violations; anything triggers a visible failure.
    expect(violations).toEqual([]);
  });
});
