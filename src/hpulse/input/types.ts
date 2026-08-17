import { z } from "zod";

/** HPU-2 RawUserInput Zod schema — client-side fast-fail before WASM call. */
export const RawUserInputSchema = z.object({
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "出生日期需 YYYY-MM-DD"),
  birth_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "出生时间需 HH:MM"),
  // Lunar-date conversion is not yet implemented in HPU-2. Reject it instead
  // of interpreting lunar components as Gregorian and producing a wrong chart.
  calendar: z.literal("gregorian").default("gregorian"),
  location_name: z.string().trim().min(1).max(120),
  latitude: z.number().gte(-90).lte(90),
  longitude: z.number().gte(-180).lte(180),
  timezone: z.string().trim().min(1, "需要 IANA 时区"),
  /** Required only when a DST fall-back local time is ambiguous. */
  timezone_offset_minutes: z.number().int().gte(-840).lte(840).optional(),
  // Current traditional-school adapters require the binary direction rule.
  // Do not silently coerce unsupported values into either branch.
  gender: z.enum(["male", "female"]),
  query_time_utc: z.string().datetime({ offset: true }),
  query_type: z.enum(["natal", "instant", "forecast"]).default("natal"),
  granularity: z.enum(["minute", "hour", "day", "month", "year"]).default("day"),
  user_id: z.string().optional(),
  locale: z.string().optional(),
});

export type RawUserInput = z.infer<typeof RawUserInputSchema>;

export interface BirthData {
  date_iso: string;
  time_iso: string;
  calendar: string;
  timezone: string;
  latitude: number;
  longitude: number;
  gender: string;
  location_label: string;
  birth_utc: string;
  tz_offset_minutes: number;
}
export interface QueryContext {
  query_time_utc: string;
  query_type: string;
  granularity: string;
}
export interface UserIdentity {
  user_id?: string;
  locale: string;
}
export interface StandardizedInput {
  schema_version: string;
  algorithm_version: string;
  birth: BirthData;
  query: QueryContext;
  identity: UserIdentity;
  seed_material: string;
  raw: RawUserInput;
}
export interface ValidationIssue {
  field: string;
  code: string;
  message: string;
  severity: "error" | "warning";
}
export interface NormalizeOutcome {
  ok: boolean;
  input: StandardizedInput | null;
  issues: ValidationIssue[];
}
