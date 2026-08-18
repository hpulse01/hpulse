/**
 * HPU-7 — Adapter: HPU-2 StandardizedInput ⇄ legacy `@/types/prediction`
 *
 * The new core (src/hpulse/*) keeps its own `StandardizedInput` shape
 * (`@/hpulse/input/types`). Existing engine adapters under src/core/* still
 * expect the legacy shape from `@/types/prediction`. This adapter bridges
 * them — purely structural, deterministic, no I/O.
 */
import type {
  StandardizedInput as LegacyStandardizedInput,
  QueryType,
  Gender as LegacyGender,
} from "@/types/prediction";
import type { StandardizedInput as HpulseStandardizedInput } from "@/hpulse/input/types";

const QUERY_TYPE_MAP: Record<string, QueryType> = {
  natal: "natalAnalysis",
  instant: "instantDecision",
  forecast: "annualForecast",
};

function toLegacyGender(g: string): LegacyGender {
  if (g === "male" || g === "female") return g;
  throw new Error("unsupported_gender_for_legacy_engines");
}

/** Split an ISO local datetime into Y/M/D/H/Min components (local). */
function splitLocal(dateIso: string, timeIso: string) {
  const [y, m, d] = dateIso.split("-").map((s) => parseInt(s, 10));
  const [hh, mm] = timeIso.split(":").map((s) => parseInt(s, 10));
  return { year: y, month: m, day: d, hour: hh, minute: mm };
}

/** Convert HPU-2 StandardizedInput → legacy `@/types/prediction` shape. */
export function toLegacyInput(
  si: HpulseStandardizedInput,
): LegacyStandardizedInput {
  return {
    calculationName: si.calculation_name,
    birthLocalDateTime: splitLocal(si.birth.date_iso, si.birth.time_iso),
    birthUtcDateTime: si.birth.birth_utc,
    geoLatitude: si.birth.latitude,
    geoLongitude: si.birth.longitude,
    timezoneIana: si.birth.timezone,
    timezoneOffsetMinutesAtBirth: si.birth.tz_offset_minutes,
    gender: toLegacyGender(si.birth.gender),
    normalizedLocationName: si.birth.location_label,
    queryType: QUERY_TYPE_MAP[si.query.query_type] ?? "natalAnalysis",
    queryTimeUtc: si.query.query_time_utc,
    sourceMetadata: {
      provider: "hpulse-input-wasm",
      confidence: 1,
      normalizedLocationName: si.birth.location_label,
      timezoneIana: si.birth.timezone,
      standardOffsetMinutes: si.birth.tz_offset_minutes,
      timezoneResolutionNotes: `schema=${si.schema_version} algo=${si.algorithm_version}`,
      rawInput: si.raw as unknown as Record<string, unknown>,
    },
  };
}
