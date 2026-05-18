/**
 * HPU-2 StandardizedInput normalizer — TS facade over the Rust/WASM core.
 *
 * Browser-only. Do NOT import from server/edge code: the WASM binary lives
 * under /public/wasm/ and is fetched at runtime.
 *
 * Usage:
 *   const out = await normalizeInput(rawForm);
 *   if (!out.ok) showIssues(out.issues);
 *   else passToEngines(out.input);
 */
import {
  RawUserInputSchema,
  type NormalizeOutcome,
  type RawUserInput,
  type ValidationIssue,
} from "./types";

type WasmModule = {
  default: (path?: string) => Promise<unknown>;
  normalize_input: (raw: unknown) => unknown;
  schema_version: () => string;
  algorithm_version: () => string;
};

let wasmPromise: Promise<WasmModule> | null = null;

async function loadWasm(): Promise<WasmModule> {
  if (!wasmPromise) {
    wasmPromise = (async () => {
      const mod = (await import(
        /* @vite-ignore */ "@/lib/wasm/hpulse-input/hpulse_input.js"
      )) as unknown as WasmModule;
      await mod.default();
      return mod;
    })();
  }
  return wasmPromise;
}

/** Pre-validate with Zod, then hand off to the deterministic Rust core. */
export async function normalizeInput(raw: unknown): Promise<NormalizeOutcome> {
  const parsed = RawUserInputSchema.safeParse(raw);
  if (!parsed.success) {
    const issues: ValidationIssue[] = parsed.error.issues.map((i) => ({
      field: i.path.join(".") || "$root",
      code: `zod_${i.code}`,
      message: i.message,
      severity: "error",
    }));
    return { ok: false, input: null, issues };
  }
  const wasm = await loadWasm();
  return wasm.normalize_input(parsed.data) as NormalizeOutcome;
}

export async function hpulseInputVersions() {
  const wasm = await loadWasm();
  return { schema: wasm.schema_version(), algorithm: wasm.algorithm_version() };
}

export type { NormalizeOutcome, RawUserInput, ValidationIssue };
