# Commercial Beta Readiness

Last updated: 2026-08-17

Current verdict: **not ready for public store submission yet**. The native foundation, privacy controls, and automated quality gates are being built, but algorithm validation, device QA, store assets, and production operations remain release blockers.

## Implemented in the current foundation branch

- Capacitor iOS and Android projects with bundle/application ID `com.hpulse.app`.
- Local packaged web assets; the native app no longer loads a remote clear-text shell.
- CI jobs for TypeScript, lint, 72 test files, web build, Rust/WASM, Android debug build, and iOS simulator build.
- Historical IANA timezone handling and DST ambiguity validation.
- In-app privacy policy, terms, account-deletion page, and authenticated deletion edge function.
- User-owned prediction tables linked for deletion; new foreign keys enforce cascade for new writes without breaking on legacy orphan rows.
- Registration IP values keyed-hashed at the edge; plaintext legacy profile values are one-way transformed.
- Public result surface hides raw death age, lifespan, cause, terminus tree, yearly terminal output, and unvalidated deep panels. Super-admin retains them for audit only.
- The one-megabyte Tieban clause import payload and its admin import route are excluded from client/native bundles; data import remains a controlled backend operation.
- Source-registry policy caps every partial/unverified engine before fusion.

## Required before TestFlight / Play internal testing

- CI must pass on the GitHub branch, including generated Rust/WASM and both native builds.
- Replace development app icons/splash assets and add localized permission/purpose copy.
- Deploy and verify Supabase migrations/functions in a staging project; run account deletion end-to-end.
- Add crash reporting, privacy-safe analytics, uptime monitoring, and a support workflow.
- Perform physical-device QA on the supported iOS/Android matrix, including offline/poor-network, auth expiry, deep links, keyboard, accessibility, and account deletion.
- Produce a data inventory and retention test proving deletion across Auth, profile, prediction runs, actuals, and registration controls.

## Required before public commercial release

- Complete the per-engine gates in `ALGORITHM_VERIFICATION_MATRIX.md`; do not market unverified systems as accurate or complete.
- Remove or redesign synthetic lifespan/death algorithms rather than relying only on UI hiding.
- Obtain legal review of privacy policy, terms, age restriction, consumer disclosures, and regional availability.
- Complete App Store / Play Store privacy declarations, screenshots, review notes, support URL, deletion URL, signing, and release automation.
- Run security review: committed-secret history, dependency/SBOM scan, RLS tests, edge-function authorization, abuse/rate limits, and incident response.
- Conduct a controlled free beta with explicit cohort size, rollback criteria, feedback handling, and no payment code enabled.

## External policy references

- Apple account deletion: https://developer.apple.com/support/offering-account-deletion-in-your-app
- Google Play account deletion: https://support.google.com/googleplay/android-developer/answer/13327111
