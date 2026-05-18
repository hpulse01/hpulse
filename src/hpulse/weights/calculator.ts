/**
 * HPU-3 DynamicWeightCalculator — pure TS, deterministic.
 *
 *   W_i(t,e,d) = α_i(t) · β_i(e) · γ_i(d) / Σ_j[ α_j(t) · β_j(e) · γ_j(d) ]
 *
 * Degraded engines are excluded from the denominator and assigned 0.
 * Same input + same matrixVersion ⇒ byte-identical output (no Math.random,
 * no Date.now), per the HPU-1 determinism contract.
 */
import { ALPHA, BETA, GAMMA } from "./matrix-v1";
import {
  ALL_ENGINES,
  MATRIX_VERSION,
  lifeStageOf,
  type DynamicWeights,
  type EngineId,
  type WeightQuery,
} from "./types";

export interface ComputeWeightsOptions extends WeightQuery {
  /** Optional human-readable reasons for degraded engines, for audit trail. */
  degradedReason?: Partial<Record<EngineId, string>>;
}

export function computeDynamicWeights(opts: ComputeWeightsOptions): DynamicWeights {
  const lifeStage = lifeStageOf(opts.ageYears);
  const a = ALPHA[lifeStage];
  const b = BETA[opts.event];
  const g = GAMMA[opts.granularity];

  const degradedSet = new Set<EngineId>(opts.degradedEngines ?? []);

  // raw products
  const raw: Record<EngineId, number> = {} as Record<EngineId, number>;
  let denom = 0;
  for (const id of ALL_ENGINES) {
    if (degradedSet.has(id)) {
      raw[id] = 0;
      continue;
    }
    const v = a[id] * b[id] * g[id];
    raw[id] = v;
    denom += v;
  }

  const weights: Record<EngineId, number> = {} as Record<EngineId, number>;
  if (denom <= 0) {
    // All engines degraded — defensive, should never happen.
    for (const id of ALL_ENGINES) weights[id] = 0;
  } else {
    for (const id of ALL_ENGINES) weights[id] = raw[id] / denom;
  }

  // Deterministic dominant: highest weight, tie-broken by ALL_ENGINES order.
  let dominant: EngineId = ALL_ENGINES[0];
  let best = -1;
  for (const id of ALL_ENGINES) {
    if (weights[id] > best) {
      best = weights[id];
      dominant = id;
    }
  }

  return {
    weights,
    lifeStage,
    event: opts.event,
    granularity: opts.granularity,
    dominant,
    degradedEngines: [...degradedSet],
    matrixVersion: MATRIX_VERSION,
    degradedReason: { ...(opts.degradedReason ?? {}) },
  };
}

/** Convenience: sorted [engine, weight] pairs, desc, deterministic. */
export function rankedWeights(w: DynamicWeights): Array<[EngineId, number]> {
  const order = new Map(ALL_ENGINES.map((id, i) => [id, i]));
  return ALL_ENGINES
    .map((id) => [id, w.weights[id]] as [EngineId, number])
    .sort((a, b) => b[1] - a[1] || order.get(a[0])! - order.get(b[0])!);
}
