//! HPU-2: StandardizedInput normalizer for H-Pulse.
//!
//! Deterministic transformation:
//!     RawUserInput  ->  StandardizedInput  +  Vec<ValidationIssue>
//!
//! Contract:
//! - No Math.random, no system clock. Time only flows in through `query_time_utc`.
//! - Output is byte-stable for identical inputs.
//! - Every output carries `schema_version`, `algorithm_version`, `seed_material`.

use chrono::{DateTime, Datelike, NaiveDate, NaiveTime, Timelike, Utc};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use wasm_bindgen::prelude::*;

pub const SCHEMA_VERSION: &str = "hpulse.input.v1";
pub const ALGORITHM_VERSION: &str = "hpu2.normalizer.v2-offset-injection";

// ============================================================================
// Raw input (untrusted, from UI / API)
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RawUserInput {
    /// Public-calendar date string: "YYYY-MM-DD"
    pub birth_date: String,
    /// Local clock at the birth location: "HH:MM" (24h)
    pub birth_time: String,
    /// "gregorian" (lunar input is rejected until an explicit converter ships)
    #[serde(default = "default_calendar")]
    pub calendar: String,
    /// Free-form location name as typed by the user (for audit only)
    pub location_name: String,
    pub latitude: f64,
    pub longitude: f64,
    /// IANA timezone, e.g. "Asia/Shanghai"
    pub timezone: String,
    /// Historical offset resolved by the host IANA tzdata. Required for DST
    /// overlaps and preferred over the small WASM fallback table.
    #[serde(default)]
    pub timezone_offset_minutes: Option<i32>,
    /// "male" | "female" (required by the current school-direction rules)
    pub gender: String,
    /// ISO-8601 UTC instant for the query. Required — never read system clock.
    pub query_time_utc: String,
    /// "natal" | "instant" | "forecast"
    #[serde(default = "default_query_type")]
    pub query_type: String,
    /// "minute" | "hour" | "day" | "month" | "year"
    #[serde(default = "default_granularity")]
    pub granularity: String,
    #[serde(default)]
    pub user_id: Option<String>,
    #[serde(default)]
    pub locale: Option<String>,
}

fn default_calendar() -> String { "gregorian".into() }
fn default_query_type() -> String { "natal".into() }
fn default_granularity() -> String { "day".into() }

// ============================================================================
// Standardized input (the only thing engines may consume downstream)
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BirthData {
    pub date_iso: String,        // "1990-04-15"
    pub time_iso: String,        // "08:30"
    pub calendar: String,        // "gregorian"
    pub timezone: String,        // "Asia/Shanghai"
    pub latitude: f64,
    pub longitude: f64,
    pub gender: String,
    pub location_label: String,  // sanitized, length-capped
    /// UTC instant of birth, computed from date+time+tz (offset folded in).
    /// Stored as ISO-8601 with Z suffix.
    pub birth_utc: String,
    /// Numeric offset minutes used for the conversion. Kept for audit.
    pub tz_offset_minutes: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QueryContext {
    pub query_time_utc: String,
    pub query_type: String,
    pub granularity: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserIdentity {
    pub user_id: Option<String>,
    pub locale: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StandardizedInput {
    pub schema_version: String,
    pub algorithm_version: String,
    pub birth: BirthData,
    pub query: QueryContext,
    pub identity: UserIdentity,
    /// 64-hex sha256 of a canonical projection of (birth + query). Drives all
    /// seeded RNG in downstream engines.
    pub seed_material: String,
    /// Echo of raw input, kept verbatim for audit / replay.
    pub raw: RawUserInput,
}

// ============================================================================
// Validation issues
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum Severity { Error, Warning }

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationIssue {
    pub field: String,
    pub code: String,
    pub message: String,
    pub severity: Severity,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NormalizeOutcome {
    pub ok: bool,
    pub input: Option<StandardizedInput>,
    pub issues: Vec<ValidationIssue>,
}

// ============================================================================
// Normalization
// ============================================================================

fn err(field: &str, code: &str, msg: &str) -> ValidationIssue {
    ValidationIssue { field: field.into(), code: code.into(), message: msg.into(), severity: Severity::Error }
}
fn warn(field: &str, code: &str, msg: &str) -> ValidationIssue {
    ValidationIssue { field: field.into(), code: code.into(), message: msg.into(), severity: Severity::Warning }
}

fn cap_str(s: &str, max: usize) -> String {
    let t = s.trim();
    if t.chars().count() <= max { t.to_string() } else { t.chars().take(max).collect() }
}

/// Best-effort IANA offset lookup. Browser/Node already runs `Intl.DateTimeFormat`
/// for full DST handling; in WASM we use a curated table for the most common
/// zones and fall back to a `tz_offset_unknown` warning.
fn tz_offset_minutes(tz: &str) -> Option<i32> {
    match tz {
        "UTC" | "Etc/UTC" | "GMT" => Some(0),
        "Asia/Shanghai" | "Asia/Hong_Kong" | "Asia/Taipei" | "Asia/Singapore" | "Asia/Macau" => Some(8 * 60),
        "Asia/Tokyo" | "Asia/Seoul" => Some(9 * 60),
        "Asia/Kolkata" => Some(5 * 60 + 30),
        "Asia/Bangkok" | "Asia/Jakarta" => Some(7 * 60),
        "Asia/Dubai" => Some(4 * 60),
        "Europe/London" => Some(0),
        "Europe/Paris" | "Europe/Berlin" | "Europe/Rome" | "Europe/Madrid" | "Europe/Amsterdam" => Some(60),
        "Europe/Moscow" => Some(3 * 60),
        "America/New_York" => Some(-5 * 60),
        "America/Chicago" => Some(-6 * 60),
        "America/Denver" => Some(-7 * 60),
        "America/Los_Angeles" => Some(-8 * 60),
        "America/Sao_Paulo" => Some(-3 * 60),
        "Australia/Sydney" => Some(10 * 60),
        "Pacific/Auckland" => Some(12 * 60),
        _ => None,
    }
}

fn canonical_seed_material(birth: &BirthData, query: &QueryContext) -> String {
    // Order-stable, locale-free string. Anything not here cannot influence the seed.
    let canonical = format!(
        "v1|birth_utc={}|lat={:.6}|lng={:.6}|cal={}|gender={}|qt={}|qtype={}|gran={}",
        birth.birth_utc,
        birth.latitude,
        birth.longitude,
        birth.calendar,
        birth.gender,
        query.query_time_utc,
        query.query_type,
        query.granularity,
    );
    let digest = Sha256::digest(canonical.as_bytes());
    hex::encode(digest)
}

fn validate_date(s: &str) -> Result<NaiveDate, ValidationIssue> {
    NaiveDate::parse_from_str(s, "%Y-%m-%d").map_err(|_| err(
        "birth_date", "birth_date_format",
        "出生日期必须是 YYYY-MM-DD 格式",
    ))
}
fn validate_time(s: &str) -> Result<NaiveTime, ValidationIssue> {
    NaiveTime::parse_from_str(s, "%H:%M").map_err(|_| err(
        "birth_time", "birth_time_format",
        "出生时间必须是 HH:MM 24小时制",
    ))
}
fn validate_query_time(s: &str) -> Result<DateTime<Utc>, ValidationIssue> {
    DateTime::parse_from_rfc3339(s)
        .map(|dt| dt.with_timezone(&Utc))
        .map_err(|_| err(
            "query_time_utc", "query_time_format",
            "queryTimeUtc 必须是 ISO-8601 UTC 字符串（含 Z 或时区偏移）",
        ))
}

pub fn normalize(raw: RawUserInput) -> NormalizeOutcome {
    let mut issues: Vec<ValidationIssue> = Vec::new();

    let date = match validate_date(&raw.birth_date) {
        Ok(d) => Some(d),
        Err(e) => { issues.push(e); None }
    };
    let time = match validate_time(&raw.birth_time) {
        Ok(t) => Some(t),
        Err(e) => { issues.push(e); None }
    };
    let qtime = match validate_query_time(&raw.query_time_utc) {
        Ok(t) => Some(t),
        Err(e) => { issues.push(e); None }
    };

    if let Some(d) = date {
        if d.year() < 1900 || d.year() > 2100 {
            issues.push(err("birth_date", "birth_year_range",
                "出生年份必须在 1900-2100 之间"));
        }
    }
    if let Some(t) = time {
        if t.hour() == 0 && t.minute() == 0 {
            issues.push(warn("birth_time", "midnight_default",
                "出生时间为 00:00，请确认是否为占位默认值"));
        }
    }
    if raw.latitude < -90.0 || raw.latitude > 90.0 {
        issues.push(err("latitude", "latitude_range", "纬度必须在 -90..90"));
    }
    if raw.longitude < -180.0 || raw.longitude > 180.0 {
        issues.push(err("longitude", "longitude_range", "经度必须在 -180..180"));
    }
    if raw.latitude == 0.0 && raw.longitude == 0.0 {
        issues.push(warn("latitude", "null_island",
            "坐标为 (0,0)，疑似未解析的占位值"));
    }
    if raw.timezone.trim().is_empty() {
        issues.push(err("timezone", "timezone_required", "必须提供 IANA 时区"));
    }
    match raw.calendar.as_str() {
        "gregorian" => {},
        _ => issues.push(err("calendar", "calendar_unknown",
            "当前版本仅支持 gregorian；不得将农历日期按公历解释")),
    }
    if let Some(offset) = raw.timezone_offset_minutes {
        if !(-840..=840).contains(&offset) {
            issues.push(err("timezone_offset_minutes", "timezone_offset_range",
                "timezone_offset_minutes 必须在 -840..840 之间"));
        }
    }
    match raw.gender.as_str() {
        "male" | "female" => {},
        _ => issues.push(err("gender", "gender_unknown",
            "gender 必须是 male 或 female；当前规则不支持静默映射其他值")),
    }
    match raw.query_type.as_str() {
        "natal" | "instant" | "forecast" => {},
        _ => issues.push(err("query_type", "query_type_unknown",
            "queryType 必须是 natal / instant / forecast")),
    }
    match raw.granularity.as_str() {
        "minute" | "hour" | "day" | "month" | "year" => {},
        _ => issues.push(err("granularity", "granularity_unknown",
            "granularity 必须是 minute / hour / day / month / year")),
    }

    let has_error = issues.iter().any(|i| i.severity == Severity::Error);
    if has_error {
        return NormalizeOutcome { ok: false, input: None, issues };
    }

    let date = date.unwrap();
    let time = time.unwrap();
    let qtime = qtime.unwrap();

    let offset_minutes = match raw.timezone_offset_minutes {
        Some(m) => m,
        None => match tz_offset_minutes(&raw.timezone) {
            Some(m) => m,
            None => {
                issues.push(warn("timezone", "tz_offset_unknown",
                    "未识别的 IANA 时区，使用 UTC 偏移 0 作为审计占位，引擎层应在调用前注入真实偏移"));
                0
            }
        },
    };

    // birth_utc = local naive - offset
    let local = date.and_time(time);
    let birth_utc_naive = local - chrono::Duration::minutes(offset_minutes as i64);
    let birth_utc = DateTime::<Utc>::from_naive_utc_and_offset(birth_utc_naive, Utc);

    let birth = BirthData {
        date_iso: date.format("%Y-%m-%d").to_string(),
        time_iso: time.format("%H:%M").to_string(),
        calendar: raw.calendar.clone(),
        timezone: raw.timezone.clone(),
        latitude: raw.latitude,
        longitude: raw.longitude,
        gender: raw.gender.clone(),
        location_label: cap_str(&raw.location_name, 120),
        birth_utc: birth_utc.format("%Y-%m-%dT%H:%M:%SZ").to_string(),
        tz_offset_minutes: offset_minutes,
    };
    let query = QueryContext {
        query_time_utc: qtime.format("%Y-%m-%dT%H:%M:%SZ").to_string(),
        query_type: raw.query_type.clone(),
        granularity: raw.granularity.clone(),
    };
    let identity = UserIdentity {
        user_id: raw.user_id.clone(),
        locale: raw.locale.clone().unwrap_or_else(|| "zh-CN".to_string()),
    };

    let seed_material = canonical_seed_material(&birth, &query);

    let std_input = StandardizedInput {
        schema_version: SCHEMA_VERSION.into(),
        algorithm_version: ALGORITHM_VERSION.into(),
        birth,
        query,
        identity,
        seed_material,
        raw,
    };

    NormalizeOutcome { ok: true, input: Some(std_input), issues }
}

// ============================================================================
// WASM bindings
// ============================================================================

#[wasm_bindgen]
pub fn schema_version() -> String { SCHEMA_VERSION.into() }

#[wasm_bindgen]
pub fn algorithm_version() -> String { ALGORITHM_VERSION.into() }

/// Accepts a JS object matching `RawUserInput`, returns a JS object matching
/// `NormalizeOutcome`. Errors during deserialization surface as a single
/// error-severity issue so the caller still gets structured output.
#[wasm_bindgen]
pub fn normalize_input(raw_js: JsValue) -> JsValue {
    let raw: RawUserInput = match serde_wasm_bindgen::from_value(raw_js) {
        Ok(v) => v,
        Err(e) => {
            let outcome = NormalizeOutcome {
                ok: false,
                input: None,
                issues: vec![ValidationIssue {
                    field: "$root".into(),
                    code: "raw_input_shape".into(),
                    message: format!("RawUserInput JSON 反序列化失败: {}", e),
                    severity: Severity::Error,
                }],
            };
            return serde_wasm_bindgen::to_value(&outcome).unwrap();
        }
    };
    let outcome = normalize(raw);
    serde_wasm_bindgen::to_value(&outcome).unwrap()
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    fn sample() -> RawUserInput {
        RawUserInput {
            birth_date: "1990-04-15".into(),
            birth_time: "08:30".into(),
            calendar: "gregorian".into(),
            location_name: "上海".into(),
            latitude: 31.2304,
            longitude: 121.4737,
            timezone: "Asia/Shanghai".into(),
            timezone_offset_minutes: None,
            gender: "male".into(),
            query_time_utc: "2026-05-18T12:00:00Z".into(),
            query_type: "natal".into(),
            granularity: "day".into(),
            user_id: Some("u_42".into()),
            locale: Some("zh-CN".into()),
        }
    }

    #[test]
    fn ok_path() {
        let out = normalize(sample());
        assert!(out.ok, "issues={:?}", out.issues);
        let s = out.input.unwrap();
        assert_eq!(s.schema_version, SCHEMA_VERSION);
        assert_eq!(s.birth.birth_utc, "1990-04-15T00:30:00Z");
        assert_eq!(s.birth.tz_offset_minutes, 480);
        assert_eq!(s.seed_material.len(), 64);
    }

    #[test]
    fn deterministic_seed() {
        let a = normalize(sample()).input.unwrap().seed_material;
        let b = normalize(sample()).input.unwrap().seed_material;
        assert_eq!(a, b);
    }

    #[test]
    fn seed_changes_with_minute() {
        let mut r = sample(); r.birth_time = "08:31".into();
        let a = normalize(sample()).input.unwrap().seed_material;
        let b = normalize(r).input.unwrap().seed_material;
        assert_ne!(a, b);
    }

    #[test]
    fn bad_date_blocks_output() {
        let mut r = sample(); r.birth_date = "1990/04/15".into();
        let out = normalize(r);
        assert!(!out.ok);
        assert!(out.input.is_none());
        assert!(out.issues.iter().any(|i| i.code == "birth_date_format"));
    }

    #[test]
    fn unknown_tz_warns_not_fails() {
        let mut r = sample(); r.timezone = "Mars/Olympus_Mons".into();
        let out = normalize(r);
        assert!(out.ok);
        assert!(out.issues.iter().any(|i| i.code == "tz_offset_unknown" && i.severity == Severity::Warning));
    }

    #[test]
    fn injected_historical_offset_is_authoritative() {
        let mut r = sample();
        r.birth_date = "1990-06-15".into();
        r.birth_time = "14:30".into();
        r.timezone_offset_minutes = Some(540);
        let out = normalize(r).input.unwrap();
        assert_eq!(out.birth.birth_utc, "1990-06-15T05:30:00Z");
        assert_eq!(out.birth.tz_offset_minutes, 540);
    }

    #[test]
    fn lunar_input_is_rejected_instead_of_misinterpreted() {
        let mut r = sample();
        r.calendar = "lunar".into();
        let out = normalize(r);
        assert!(!out.ok);
        assert!(out.issues.iter().any(|i| i.code == "calendar_unknown"));
    }
}
