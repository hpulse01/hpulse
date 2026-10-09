# Commercial Release Gates

Last updated: 2026-08-17

## Verdict

**Blocked. Do not merge or publish a production store release.** The current branch is a free-beta audit build. Cultural rule calculations can be deterministic and source-traceable, but that is not evidence that divination or a “quantum destiny” model has scientific predictive validity.

## Executable algorithm gate

`src/core/shared/commercialReadiness.ts` is fail-closed. Every production result carries a `commercialReadiness` report. `ready` can become `true` only when all of the following hold for every declared product engine:

1. Exactly one output exists and no engine execution failed.
2. The source registry and runtime output both declare `complete`.
3. The declared product scope has no `missingRules`.
4. Registry and output source grades are A or B.
5. Registry and output include at least one stable URL, DOI, ISBN, or URN reference.
6. Completeness is at least 90, structural validation passes, and the explanation trace is non-vacuous.
7. The registry policy and an authoritative core version are attached; a failed/missing core cannot fall back to a legacy heuristic.
8. User-facing output contains no individualized mortality/lifespan claim.
9. A real generated Rust/WASM normalizer is installed and `npm run verify:runtime-assets` passes; the development TypeScript fallback cannot satisfy a commercial build.
10. Query time and IANA timezone are explicit, and the full result is byte-stable for identical input.

The gate certifies implementation evidence only. It must never be described as scientific validation or a guarantee that events will occur.

## Current algorithm blockers

The canonical details live in `ALGORITHM_VERIFICATION_MATRIX.md`. At present:

- No engine is registered as commercially complete.
- Tieban remains `needs_source_validation` and lacks a single-call authoritative core adapter.
- Several Chinese systems have declared school/rule gaps and insufficient independent golden corpora.
- Western/Vedic astronomy still needs independent numerical comparison corpora; the Vedic Lahiri ayanamsa is not release-grade.
- Numerology, Mayan and Kabbalah have declared scope gaps. Scoped Mispar Gadol and Numerology Pinnacles/Challenges are implemented; Numerology name transliteration, Mayan 819-day/Venus cycles, Kabbalah Tikkun/transliteration, independent golden corpora, and source-validation work remain open.
- The repository no longer carries a fake WASM. GitHub CI must generate the real binary, install it into the web/native bundle and pass the magic-byte gate before any distributable artifact is acceptable.
- GitHub Actions currently returns `startup_failure` before creating any job. A temporary minimal one-step workflow failed the same way and was removed, so the repository owner must restore Actions availability/permissions or private-repository runner budget before CI can supply release evidence.

## Safety gates already enforced

- Core score/provenance fields are authoritative; legacy results cannot overwrite them.
- A core failure produces a neutral, zero-confidence quarantined output with no events or time windows.
- Runtime mortality/lifespan fusion and termination logic has been removed.
- Historical Tieban source data may remain in the controlled admin corpus, but public fetch/report paths redact high-risk individualized outcome text.
- Scenario ranking is labeled as deterministic cultural-rule analysis, not quantum physics or a unique future.
- Historical `Quantum*` code identifiers are compatibility names only; the implementation is a classical exponential-weight/annealing heuristic, and public copy states that it is not quantum computing or calibrated event probability.
- Current-tree migrations contain no identity-specific signup-time super-admin grant. Privileged RPCs bind caller IDs to `auth.uid()`, revoke anonymous/public execution, and use an atomic row lock for quota consumption.

## Remaining security evidence

- Apply all migrations to an isolated Supabase staging project and run an authorization matrix for anonymous, authenticated, admin, super-admin, and service-role callers.
- Rotate the credential that was previously shared or committed and invalidate its sessions. Rewriting existing Git history is a separate destructive operation and requires explicit owner approval plus coordinated branch replacement.

## Release sequence

1. Complete every per-engine source/rule/golden-case gate.
2. Run `npm run check` and Rust/WASM tests with generated production artifacts.
3. Verify `commercialReadiness.ready === true` across fixed normal, boundary, invalid and ambiguous fixture corpora.
4. Pass Android/iOS native builds, physical-device QA, accessibility, privacy, account deletion, security and operational reviews.
5. Obtain store/legal approval and production signing.
6. Promote the draft PR only after all recorded blockers are zero; no manual bypass is permitted.
