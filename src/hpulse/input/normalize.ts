/**
 * HPU-2 StandardizedInput normalizer — TS facade over the Rust/WASM core.
 *
 * Browser-only. The commercial build installs a generated Rust/WASM binary
 * under /public/wasm/. A deterministic TypeScript implementation keeps local
 * development usable if that generated artifact is unavailable, and reports
 * the fallback explicitly so a commercial artifact gate can reject it.
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
import { offsetMinutesAt, resolveLocalTime } from "@/core/astro-time/timezone";

type WasmModule = {
  default: (path?: string) => Promise<unknown>;
  normalize_input: (raw: unknown) => unknown;
  schema_version: () => string;
  algorithm_version: () => string;
};

let wasmPromise: Promise<WasmModule> | null = null;

const INTL_ALGORITHM_VERSION = "hpu2.normalizer.v3-intl-calculation-name";
const TS_FALLBACK_ALGORITHM_VERSION = "hpu2.normalizer.v3-intl-typescript-fallback";
const INPUT_SCHEMA_VERSION = "hpulse.input.v1";

type BirthInstantResolution =
  | {
      ok: true;
      birthUtc: string;
      offsetMinutes: number;
      ambiguous: boolean;
    }
  | {
      ok: false;
      issue: ValidationIssue;
    };

/** Resolve the birth instant with runtime IANA tzdata, including DST gaps/overlaps. */
export function resolveBirthInstant(raw: RawUserInput): BirthInstantResolution {
  const local = {
    year: Number(raw.birth_date.slice(0, 4)),
    month: Number(raw.birth_date.slice(5, 7)),
    day: Number(raw.birth_date.slice(8, 10)),
    hour: Number(raw.birth_time.slice(0, 2)),
    minute: Number(raw.birth_time.slice(3, 5)),
  };
  const resolution = resolveLocalTime(local, raw.timezone);
  if (resolution.ok === false) {
    const detail = {
      invalid_local_time: ["birth_date", "invalid_local_time", "出生日期或时间无效"],
      invalid_timezone: ["timezone", "invalid_timezone", "IANA 时区无效或当前运行环境不支持"],
      nonexistent_local_time: ["birth_time", "nonexistent_local_time", "该当地时间因夏令时切换而不存在"],
    }[resolution.reason];
    return {
      ok: false,
      issue: {
        field: detail[0],
        code: detail[1],
        message: detail[2],
        severity: "error",
      },
    };
  }

  let utc = resolution.utc;
  let offsetMinutes = resolution.offsetMinutes;
  if (resolution.ambiguous) {
    if (raw.timezone_offset_minutes == null) {
      return {
        ok: false,
        issue: {
          field: "timezone_offset_minutes",
          code: "ambiguous_local_time",
          message: "该当地时间出现两次，必须选择出生时采用的 UTC 偏移",
          severity: "error",
        },
      };
    }
    const selected = resolution.alternatives.find(
      (candidate) => offsetMinutesAt(candidate, raw.timezone) === raw.timezone_offset_minutes,
    );
    if (!selected) {
      return {
        ok: false,
        issue: {
          field: "timezone_offset_minutes",
          code: "timezone_offset_mismatch",
          message: "所选 UTC 偏移与该地点和当地时间不匹配",
          severity: "error",
        },
      };
    }
    utc = selected;
    offsetMinutes = raw.timezone_offset_minutes;
  } else if (
    raw.timezone_offset_minutes != null
    && raw.timezone_offset_minutes !== resolution.offsetMinutes
  ) {
    return {
      ok: false,
      issue: {
        field: "timezone_offset_minutes",
        code: "timezone_offset_mismatch",
        message: "UTC 偏移与 IANA 时区在出生时刻的历史偏移不匹配",
        severity: "error",
      },
    };
  }

  return {
    ok: true,
    birthUtc: utc.toISOString().replace(".000Z", "Z"),
    offsetMinutes,
    ambiguous: resolution.ambiguous,
  };
}

async function sha256Hex(value: string): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new Error("web_crypto_unavailable");
  const digest = await subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function utf8Hex(value: string): string {
  return Array.from(new TextEncoder().encode(value), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function canonicalSeedProjection(input: NonNullable<NormalizeOutcome["input"]>): string {
  return `v1|birth_utc=${input.birth.birth_utc}`
    + `|lat=${input.birth.latitude.toFixed(6)}`
    + `|lng=${input.birth.longitude.toFixed(6)}`
    + `|cal=${input.birth.calendar}`
    + `|gender=${input.birth.gender}`
    + `|cname_hex=${utf8Hex(input.calculation_name ?? "")}`
    + `|qt=${input.query.query_time_utc}`
    + `|qtype=${input.query.query_type}`
    + `|gran=${input.query.granularity}`;
}

async function buildTypeScriptFallback(
  raw: RawUserInput,
  birthInstant: Extract<BirthInstantResolution, { ok: true }>,
  cause: unknown,
): Promise<NormalizeOutcome> {
  const queryDate = new Date(raw.query_time_utc);
  const queryTimeUtc = queryDate.toISOString().replace(/\.000Z$/, "Z");
  const input: NonNullable<NormalizeOutcome["input"]> = {
    schema_version: INPUT_SCHEMA_VERSION,
    algorithm_version: TS_FALLBACK_ALGORITHM_VERSION,
    birth: {
      date_iso: raw.birth_date,
      time_iso: raw.birth_time,
      calendar: raw.calendar,
      timezone: raw.timezone,
      latitude: raw.latitude,
      longitude: raw.longitude,
      gender: raw.gender,
      location_label: raw.location_name,
      birth_utc: birthInstant.birthUtc,
      tz_offset_minutes: birthInstant.offsetMinutes,
    },
    query: {
      query_time_utc: queryTimeUtc,
      query_type: raw.query_type,
      granularity: raw.granularity,
    },
    identity: {
      user_id: raw.user_id,
      locale: raw.locale ?? "zh-CN",
    },
    calculation_name: raw.calculation_name,
    seed_material: "",
    raw,
  };
  input.seed_material = await sha256Hex(canonicalSeedProjection(input));
  const detail = cause instanceof Error ? cause.message : String(cause);
  return {
    ok: true,
    input,
    issues: [{
      field: "$runtime",
      code: "wasm_unavailable_typescript_fallback",
      message: `Rust/WASM 标准化器不可用，已使用等价的确定性 TypeScript 路径；商业构建必须安装真实 WASM 产物。${detail ? ` (${detail})` : ""}`,
      severity: "warning",
    }],
  };
}

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
  const birthInstant = resolveBirthInstant(parsed.data);
  if (birthInstant.ok === false) {
    return { ok: false, input: null, issues: [birthInstant.issue] };
  }

  let wasm: WasmModule;
  try {
    wasm = await loadWasm();
  } catch (error) {
    return buildTypeScriptFallback(parsed.data, birthInstant, error);
  }
  const outcome = wasm.normalize_input(parsed.data) as NormalizeOutcome;
  if (!outcome.ok || !outcome.input) return outcome;

  // The Rust core has only a fixed-offset fallback table. Replace that
  // timestamp with the historical IANA resolution before any engine runs.
  outcome.input.birth.birth_utc = birthInstant.birthUtc;
  outcome.input.birth.tz_offset_minutes = birthInstant.offsetMinutes;
  outcome.input.algorithm_version = INTL_ALGORITHM_VERSION;
  outcome.input.raw = parsed.data;
  outcome.input.calculation_name = parsed.data.calculation_name;
  outcome.input.seed_material = await sha256Hex(canonicalSeedProjection(outcome.input));
  return outcome;
}

export async function hpulseInputVersions() {
  try {
    const wasm = await loadWasm();
    return {
      schema: wasm.schema_version(),
      algorithm: INTL_ALGORITHM_VERSION,
      wasmAlgorithm: wasm.algorithm_version(),
    };
  } catch {
    return {
      schema: INPUT_SCHEMA_VERSION,
      algorithm: TS_FALLBACK_ALGORITHM_VERSION,
      wasmAlgorithm: null,
    };
  }
}

export type { NormalizeOutcome, RawUserInput, ValidationIssue };
