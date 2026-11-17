# Design system 1.1 release and application audit

Date: 2026-11-13. Branch: `main`.

## Authorization and intent

The user explicitly accepted PROPOSED-1.1.md, authorizing a deliberate versioned reference update, new manifest, documentation/examples and verification. The user then requested an application compliance audit after that package update. Preserve v1 evidence and existing product behavior.

## Acceptance criteria

- Release the accepted composition profiles and clarifications as Technologia po ludzku 1.1.0, retaining the 25 source families and the current palette/C markers.
- Preserve every previous v1 byte through the original hash manifest plus archived originals of changed files; verify the reconstructed v1 as well as the new active inventory.
- Provide a portable opt-in profile stylesheet, honest examples, current agent/component contracts, versioned human documentation and export/build support. React/Base UI remains the behavioral owner in the application.
- Record the user's acceptance and remove pending-approval language from current guidance without rewriting historical verification.
- After freezing 1.1, independently audit the application at 1280/390/320px against source anatomy, tokens/type/geometry, all public/persona routes, states, keyboard/focus, errors/recovery, long/missing data and shared/portal callers.
- Record findings as closed/partial/open with source/host evidence; fix bounded implementation discrepancies without altering the reference to match failures.
- Run design-system checks, portable export validation, ./scripts/verify and a separate review. Report actual limitations; no publishing or CI result is implied.

## Plan

1. Preserve original changed-file bytes and the complete v1 manifest; implement the approved 1.1 package and export path.
2. Freeze and verify the new manifest; validate examples in the browser and review the release diff.
3. Conduct the application audit against the frozen 1.1 contract; collect paired screenshots and measured results.
4. Apply bounded fixes if needed, rerun relevant/full checks and finalize the audit/status records.

## Evidence

Reference release completed before the application audit. The active manifest is 1.1.0 with 177 files; all 168 original v1 hashes reconstruct from shared unchanged files plus 11 archived originals. The 67-file Poster People archive remains unchanged. Portable build and export each contain all 177 files and valid embedded signatures. New profile/documentation browser checks passed at 1280/390/320px with no axe violations or overflow. The standalone offer save name is stable across toggle/reload. The exact source release ZIP is artifacts/design-system/technologia-po-ludzku-1.1.0.zip.

The reference was frozen at SHA-256 9f87a8a73869b91686f4e5db00042a7f60459b188b97d86a8b50c3b24caf2e3b before the application audit. The before audit recorded 128 measurements, 11 failed measurements grouped into three findings, zero axe violations in nine focused view/width combinations and no runtime errors. Source/host paired captures and raw results are in docs/design-system/audits/1.1/before/.

Bounded fixes reuse existing owners: c10 consent labels now share a 44px minimum target, c14 chips map persisted enum values through canonical presentation labels, and c16 JobCard uses a unique heading association. Application routes, data model, state store, persistence and fixture content remain unchanged. FEATURES.md records these UI/tooling changes under its stable IDs.

The after audit passed all 128 measurements at the same frozen reference hash, with zero focused axe violations and runtime errors. Source was not changed to accommodate findings. A permanent audit command and three focused browser regressions cover the repaired contracts. The 25-family coverage, declared host variations and limitations are in docs/design-system/audits/1.1/AUDIT.md.

Separate review checked the source diff against the 11 preserved originals, scoped CSS imports, stable save behavior, shared packaging inventory and export signatures. The application review checked the three shared fixes and their unaffected data/route boundaries. Full-gate result is recorded after execution below. The original redesign and installation verification remain dated historical records.

## Final gate

`./scripts/verify` exited 0 using Node v24.22.1 and the already provisioned Chromium selected through PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH. All 44 browser tests passed (7 workers, 15.1 seconds), alongside 27 host units, 10 reference tests, formatting, lint, types, all reference hashes, the 120-journey baseline packet and production build. The final audit CLI rerun passed 128/128 measurements, zero focused axe violations and zero runtime errors against the unchanged frozen hash. No browser/OS installation, merge, CI or deployment is claimed.

The source release ZIP has 177 exact source-file hashes and 16 valid embedded signatures. A separate review confirmed the changed-file whitelist and three shared application corrections; domain/route/store/storage/fixture bytes remain unchanged. The final audit report and its limits are in docs/design-system/audits/1.1/AUDIT.md. Existing nonfatal dependency PURE-comment and bundle-size notices remain advisory.
