/**
 * HPU-4 — Engine registry.
 *
 * Maps each HPU-3 EngineId to a concrete EngineRunner. The registry is the
 * single iteration point for the future Orchestrator (HPU-8) and for the
 * dynamic weights calculator (HPU-3).
 */
import type { StandardizedInput } from "@/types/prediction";
import type { EngineId } from "@/hpulse/weights/types";
import { ALL_ENGINES } from "@/hpulse/weights/types";
import {
  type EngineMeta,
  type EngineRunOptions,
  type EngineRunResult,
  type EngineRunner,
} from "./runner";
import { dispatchTieban, dispatchViaOverlay } from "./dispatch";
import type { FamilyFacts } from "@/core/tieban/types";

/** EngineId (HPU-3 namespace) → legacy CoreEngineName used by `p4CoreOverlay`. */
const OVERLAY_NAME: Partial<Record<EngineId, string>> = {
  bazi: "bazi",
  ziwei: "ziwei",
  liuyao: "liuyao",
  qimen: "qimen",
  daliuren: "liuren",
  taiyi: "taiyi",
  meihua: "meihua",
  astrology: "western",
  numerology: "numerology",
  // tieban handled separately
};

const META: Record<EngineId, EngineMeta> = {
  bazi:       { id: "bazi",       labelCN: "八字命理",       labelEN: "BaZi (Four Pillars)",   timingBasis: "birth"  },
  ziwei:      { id: "ziwei",      labelCN: "紫微斗数",       labelEN: "Ziwei Doushu",          timingBasis: "birth"  },
  liuyao:     { id: "liuyao",     labelCN: "六爻预测",       labelEN: "Liu Yao",               timingBasis: "query"  },
  qimen:      { id: "qimen",      labelCN: "奇门遁甲",       labelEN: "Qi Men Dun Jia",        timingBasis: "query"  },
  daliuren:   { id: "daliuren",   labelCN: "大六壬",         labelEN: "Da Liu Ren",            timingBasis: "query"  },
  taiyi:      { id: "taiyi",      labelCN: "太乙神数",       labelEN: "Taiyi Shenshu",         timingBasis: "query"  },
  tieban:     { id: "tieban",     labelCN: "铁板神数",       labelEN: "Tieban Shenshu",        timingBasis: "hybrid", requires: ["kaoke", "clauseProvider"] },
  meihua:     { id: "meihua",     labelCN: "梅花易数",       labelEN: "Meihua Yi Shu",         timingBasis: "query"  },
  astrology:  { id: "astrology",  labelCN: "西方占星",       labelEN: "Western Astrology",     timingBasis: "birth"  },
  numerology: { id: "numerology", labelCN: "数字命理",       labelEN: "Numerology",            timingBasis: "birth"  },
};

function makeRunner(id: EngineId): EngineRunner {
  const meta = META[id];
  return {
    meta,
    run(si: StandardizedInput, opts?: EngineRunOptions): EngineRunResult {
      const t0 = performance.now();
      try {
        let output;
        if (id === "tieban") {
          output = dispatchTieban(si, opts?.familyFacts as unknown as FamilyFacts | undefined);
        } else {
          const legacyName = OVERLAY_NAME[id];
          if (!legacyName) throw new Error(`no_dispatcher_for_${id}`);
          output = dispatchViaOverlay(legacyName as never, si);
        }
        return { ok: true, id, output, durationMs: Math.round(performance.now() - t0) };
      } catch (err) {
        return {
          ok: false,
          id,
          error: {
            code: "ENGINE_RUN_FAILED",
            message: err instanceof Error ? err.message : String(err),
          },
          durationMs: Math.round(performance.now() - t0),
        };
      }
    },
  };
}

export const REGISTRY: Record<EngineId, EngineRunner> = Object.fromEntries(
  ALL_ENGINES.map((id) => [id, makeRunner(id)]),
) as Record<EngineId, EngineRunner>;

export function listEngines(): EngineMeta[] {
  return ALL_ENGINES.map((id) => META[id]);
}

/** Run all (or a filtered subset). Deterministic order = ALL_ENGINES order. */
export function runAll(
  si: StandardizedInput,
  opts: EngineRunOptions = {},
): EngineRunResult[] {
  const exclude = new Set(opts.exclude ?? []);
  const only = opts.only ? new Set(opts.only) : null;
  const targets = ALL_ENGINES.filter(
    (id) => !exclude.has(id) && (!only || only.has(id)),
  );
  return targets.map((id) => REGISTRY[id].run(si, opts));
}

/** Engines that failed → ready to feed HPU-3 `degradedEngines`. */
export function degradedFrom(results: EngineRunResult[]): {
  degradedEngines: EngineId[];
  degradedReason: Partial<Record<EngineId, string>>;
} {
  const degradedEngines: EngineId[] = [];
  const degradedReason: Partial<Record<EngineId, string>> = {};
  for (const r of results) {
    if (r.ok === true) continue;
    const failed = r as Extract<EngineRunResult, { ok: false }>;
    degradedEngines.push(failed.id);
    degradedReason[failed.id] = `${failed.error.code}: ${failed.error.message}`;
  }
  return { degradedEngines, degradedReason };
}
