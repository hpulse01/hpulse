# Commercial Beta Readiness

Last updated: 2026-08-17

Current verdict: **not ready for public store submission yet**. The native foundation, privacy controls, and automated quality gates are being built, but algorithm validation, device QA, store assets, and production operations remain release blockers.

The mobile pipeline no longer depends on a checked-in placeholder WASM: local development has an explicitly reported deterministic TypeScript fallback, while CI generates and verifies the real Rust/WASM artifact for web, Android and iOS builds. A missing real WASM remains a hard commercial-release blocker.

## Implemented in the current foundation branch

- Capacitor iOS and Android projects with bundle/application ID `com.hpulse.app`.
- Local packaged web assets; the native app no longer loads a remote clear-text shell.
- CI jobs for TypeScript, lint, 76 test files / 500 tests, web build, Rust/WASM, Android debug build, and iOS simulator build.
- Historical IANA timezone handling and DST ambiguity validation.
- In-app privacy policy, terms, account-deletion page, and authenticated deletion edge function.
- User-owned prediction tables linked for deletion; new foreign keys enforce cascade for new writes without breaking on legacy orphan rows.
- Registration IP values keyed-hashed at the edge; plaintext legacy profile values are one-way transformed.
- Runtime mortality/lifespan fusion and termination logic has been removed. Historical Tieban source text remains in the controlled admin corpus, while every public report/fetch path redacts high-risk individualized outcome text.
- The one-megabyte Tieban clause import payload and its admin import route are excluded from client/native bundles; data import remains a controlled backend operation.
- Source-registry policy caps every partial/unverified engine before fusion.
- A fail-closed commercial-readiness report blocks release for missing engines, incomplete registry scope, weak/unstable sources, failed validation/core adapters, low completeness, or unsafe individualized mortality content.
- Meihua time casting now uses lunar year branch/month/day plus the local hour branch instead of Gregorian surrogate values; the local civil-day and leap-month policy is recorded in the trace.
- Optional name spelling now flows explicitly into Numerology and Kabbalah, is never inferred from an account profile, and is omitted from the persisted prediction ledger.
- Identical explicit input now produces a byte-stable full result, including execution traces and scenario timestamps.
- Public product language now describes the former “quantum” layer as classical deterministic scenario scoring, not quantum computing or event probability.

## Required before TestFlight / Play internal testing

- Resolve the GitHub Actions zero-job `startup_failure`. A minimal one-step workflow failed identically, so repository Actions availability, permissions, and private-repository billing/budget settings require owner review before CI evidence can exist.
- CI must pass on the GitHub branch, including generated Rust/WASM and both native builds.
- Replace development app icons/splash assets and add localized permission/purpose copy.
- Deploy and verify Supabase migrations/functions in a staging project; run account deletion end-to-end.
- Add crash reporting, privacy-safe analytics, uptime monitoring, and a support workflow.
- Perform physical-device QA on the supported iOS/Android matrix, including offline/poor-network, auth expiry, deep links, keyboard, accessibility, and account deletion.
- Produce a data inventory and retention test proving deletion across Auth, profile, prediction runs, actuals, and registration controls.

## Required before public commercial release

- Complete the per-engine gates in `ALGORITHM_VERIFICATION_MATRIX.md`; do not market unverified systems as accurate or complete.
- Keep the executable commercial gate at zero blockers; do not add any synthetic mortality/lifespan algorithm back into runtime output.
- Obtain legal review of privacy policy, terms, age restriction, consumer disclosures, and regional availability.
- Complete App Store / Play Store privacy declarations, screenshots, review notes, support URL, deletion URL, signing, and release automation.
- Run security review: committed-secret history, dependency/SBOM scan, RLS tests, edge-function authorization, abuse/rate limits, and incident response.
- Conduct a controlled free beta with explicit cohort size, rollback criteria, feedback handling, and no payment code enabled.

## External policy references

- Apple account deletion: https://developer.apple.com/support/offering-account-deletion-in-your-app
- Google Play account deletion: https://support.google.com/googleplay/android-developer/answer/13327111
