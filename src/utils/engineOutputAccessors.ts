/**
 * P-FIX — Unified accessors for EngineOutput.
 *
 * Engines report fields under different keys (canonical P4 vs legacy 中文 vs
 * overlay aliases). These helpers centralise the lookup so panels never have
 * to guess which key holds the truth.
 */
import type { EngineOutput } from '@/types/prediction';

export function getNormalizedOutput(eo?: EngineOutput | null): Record<string, unknown> {
  return (eo?.normalizedOutput ?? {}) as Record<string, unknown>;
}

export function getImplementationStatus(eo?: EngineOutput | null): string {
  const n = getNormalizedOutput(eo);
  const v =
    n.implementationStatus ??
    n.p4ImplementationStatus ??
    (n as Record<string, unknown>).implementation_status ??
    'unknown';
  return String(v);
}

export function getEngineByName<T extends { engineName: string }>(
  outputs: readonly T[] | null | undefined,
  name: string,
): T | null {
  return outputs?.find(e => e.engineName === name) ?? null;
}
