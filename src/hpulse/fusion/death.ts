/**
 * HPU-6 — Death signal extraction & fusion.
 *
 * Pure, deterministic. Operates on the HPU-4 EngineRunResult[] plus the
 * HPU-5 WorldTree. Never throws; missing signals collapse to the default
 * lifespan (78y, weak, natural_aging) as documented in `eventFusion.ts`.
 */
import type { EngineOutput } from "@/types/prediction";
import type { EngineRunResult } from "@/hpulse/engines/runner";
import {
  ALL_ENGINES,
  type EngineId,
  type LifeStage,
} from "@/hpulse/weights/types";
import { STAGE_WINDOWS, type WorldTree } from "@/hpulse/worldtree/types";
import type {
  DeathCause,
  DeathSignal,
  DeathStrength,
  DeathWindow,
} from "./types";

const DEFAULT_LIFESPAN = 78;
const DEFAULT_BAND: [number, number] = [70, 85];

const ENGINE_INDEX = new Map<EngineId, number>(
  ALL_ENGINES.map((id, i) => [id, i]),
);

/** Quick stage lookup by representative age. */
function stageOfAge(age: number): LifeStage {
  for (const w of STAGE_WINDOWS) {
    if (age >= w.startAge && age <= w.endAge) return w.stage;
  }
  return "elder";
}

/** Heuristic: parse death/longevity hints out of an EngineOutput. */
function extractSignal(
  id: EngineId,
  out: EngineOutput,
): DeathSignal | null {
  // 1) Numeric risk: derive from health/life dimension penalties + uncertainty.
  const health = clamp(out.fateVector.health, 0, 100);
  const life = clamp(out.fateVector.life, 0, 100);
  const baseRisk = 100 - 0.6 * health - 0.4 * life; // 0..100, higher = worse

  // 2) Look for explicit death/longevity terms in eventCandidates +
  //    aspectScores for evidence; do NOT use regex on natural language for
  //    age extraction — only treat as a boost flag.
  const tokens = [
    ...(out.eventCandidates ?? []),
    ...Object.keys(out.aspectScores ?? {}),
  ].map((s) => String(s).toLowerCase());

  const hasDeath = tokens.some((t) =>
    /(death|die|终|寿|亡|殁|大限|逝|凶亡|寿元)/.test(t),
  );
  const hasIllness = tokens.some((t) =>
    /(illness|disease|疾|病|灾|险|事故|accident)/.test(t),
  );

  // 3) Pull a numeric age from aspectScores if a key explicitly mentions
  //    寿/lifespan/death and the value is in [30,120].
  let inferredAge: number | null = null;
  for (const [k, v] of Object.entries(out.aspectScores ?? {})) {
    if (/(寿|lifespan|deathAge|大限)/i.test(k) && Number.isFinite(v)) {
      if (v >= 30 && v <= 120) {
        inferredAge = Math.round(v);
        break;
      }
    }
  }

  // No signal at all? Skip.
  if (!hasDeath && !hasIllness && baseRisk < 25 && inferredAge == null) {
    return null;
  }

  // Risk amplification.
  let risk = baseRisk;
  if (hasDeath) risk += 20;
  if (hasIllness) risk += 8;
  risk = clamp(risk, 0, 100);

  // Age band: explicit inferred age dominates; otherwise derive from risk.
  let peakAge: number;
  if (inferredAge != null) {
    peakAge = inferredAge;
  } else {
    // Risk 0 → 90y, risk 100 → 45y (linear)
    peakAge = Math.round(90 - 0.45 * risk);
  }
  const halfWidth = hasDeath ? 6 : hasIllness ? 10 : 12;
  const ageBand: [number, number] = [
    Math.max(20, peakAge - halfWidth),
    Math.min(110, peakAge + halfWidth),
  ];

  const cause: DeathCause = hasDeath
    ? "natural_aging" // explicit death without injury hints
    : hasIllness
    ? "illness"
    : "unknown";

  return {
    engineId: id,
    risk: round2(risk),
    peakStage: stageOfAge(peakAge),
    ageBand,
    cause,
    evidence: out.eventCandidates?.[0] ?? null,
  };
}

/** Harvest a deterministic, ordered list of DeathSignals. */
export function collectDeathSignals(
  results: EngineRunResult[],
): DeathSignal[] {
  const map = new Map<EngineId, DeathSignal>();
  for (const r of results) {
    if (r.ok !== true) continue;
    const sig = extractSignal(r.id, r.output);
    if (sig) map.set(r.id, sig);
  }
  // Stable order = HPU-3 namespace order.
  return ALL_ENGINES
    .map((id) => map.get(id))
    .filter((s): s is DeathSignal => Boolean(s));
}

/** Fuse signals into a single DeathWindow. */
export function fuseDeathWindow(signals: DeathSignal[]): DeathWindow {
  if (signals.length === 0) {
    return {
      startAge: DEFAULT_BAND[0],
      endAge: DEFAULT_BAND[1],
      peakAge: DEFAULT_LIFESPAN,
      strength: "default",
      fusedProbability: 0.5,
      cause: "natural_aging",
      contributingEngines: [],
      causalChain: ["无明确死亡共识，默认寿限78岁（natural_aging）"],
    };
  }

  // Risk-weighted peak.
  let wSum = 0;
  let weightedAge = 0;
  let minStart = 110;
  let maxEnd = 20;
  const causeVotes: Record<DeathCause, number> = {
    natural_aging: 0,
    illness: 0,
    accident: 0,
    unknown: 0,
  };

  for (const s of signals) {
    const w = Math.max(1, s.risk); // avoid zero weight
    wSum += w;
    weightedAge += w * ((s.ageBand[0] + s.ageBand[1]) / 2);
    if (s.ageBand[0] < minStart) minStart = s.ageBand[0];
    if (s.ageBand[1] > maxEnd) maxEnd = s.ageBand[1];
    causeVotes[s.cause] += w;
  }

  const peakAge = Math.round(weightedAge / wSum);
  const cause = (Object.entries(causeVotes)
    .sort((a, b) =>
      b[1] - a[1] ||
      a[0].localeCompare(b[0]),
    )[0]?.[0] ?? "natural_aging") as DeathCause;

  // Consensus strength.
  const avgRisk = signals.reduce((s, x) => s + x.risk, 0) / signals.length;
  const n = signals.length;
  let strength: DeathStrength;
  if (n >= 3 && avgRisk >= 55) strength = "strong";
  else if (n >= 2 || avgRisk >= 45) strength = "weak";
  else strength = "illness_only";

  const fusedProbability = round2(
    Math.min(0.95, (avgRisk / 100) * (1 + Math.min(n, 5) * 0.08)),
  );

  // Causal chain — engine-ordered.
  const causalChain = signals
    .slice()
    .sort(
      (a, b) =>
        ENGINE_INDEX.get(a.engineId)! - ENGINE_INDEX.get(b.engineId)!,
    )
    .map(
      (s) =>
        `[${s.engineId}] risk=${s.risk} peakAge=${Math.round(
          (s.ageBand[0] + s.ageBand[1]) / 2,
        )} cause=${s.cause}${s.evidence ? ` · ${s.evidence}` : ""}`,
    );

  return {
    startAge: minStart,
    endAge: maxEnd,
    peakAge,
    strength,
    fusedProbability,
    cause,
    contributingEngines: signals.map((s) => s.engineId),
    causalChain,
  };
}

/** Cross-check the WorldTree's terminal-stage profile against the fused window. */
export function attenuateByTree(
  win: DeathWindow,
  tree: WorldTree,
): DeathWindow {
  const elder = tree.stages.find((s) => s.window.stage === "elder");
  if (!elder) return win;
  // Elder health < 30 ⇒ shift peak earlier by up to 5 years; > 70 ⇒ later.
  const eh = elder.fateVector.health;
  let shift = 0;
  if (eh < 30) shift = -Math.round((30 - eh) / 10);
  else if (eh > 70) shift = Math.round((eh - 70) / 10);
  if (shift === 0) return win;
  return {
    ...win,
    peakAge: clamp(win.peakAge + shift, 20, 110),
    causalChain: [
      ...win.causalChain,
      `elder.health=${eh} ⇒ Δpeak=${shift}y`,
    ],
  };
}

function clamp(n: number, lo: number, hi: number): number {
  if (!Number.isFinite(n)) return lo;
  return Math.max(lo, Math.min(hi, n));
}
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
