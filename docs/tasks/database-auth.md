# SQLite persistence and account authentication

## Intent and acceptance

User request (2026-11-17): implement a database and login on a new branch, preserving every existing user and setting their initial password to `Test1234`.

- Branch: `codex/database-auth`. The supplied checkout has no commits; all pre-existing files were untracked. Preserve them and do not invent a baseline commit.
- Use Node 24 built-in SQLite, with no additional database service. Persist scenario records, account hashes and sessions outside frontend assets in an ignored `.data/` directory.
- Seed all existing person IDs, roles, company relationships and profile/CV fields unchanged. Give each account a stable `<person-id>@doroboty.test` login. Seed salted password hashes only for new accounts; server restart must not reset existing hashes/data.
- Replace persona selection with a Polish email/password form, logout and reload-persistent server sessions. Preserve hash deep links and safe internal return paths.
- Enforce role and ownership at the API, including denying browser-supplied identity changes. Public responses contain published records only; candidates receive their own records, employers their company's applications, and operators the complete teaching scenario. Credentials/sessions never enter scenario exports or frontend bundles.
- All scenario changes go through server-side shared Zod/domain validation and an atomic SQLite transaction. Show success only after acknowledged persistence; retain form input on failures.
- Keep legacy localStorage intact. Offer an operator-confirmed migration/import and raw recovery download; never silently import an arbitrary browser's scenario into the shared database.
- Operator-only export/import/reset retain confirmation and validation. Existing accounts survive scenario resets/imports.
- Preserve synthetic evidence, immutable submissions, competency snapshots, manual approvals and guided local proposals.

## UI and design

Login is a host composition of HP02 PageTitle, HP03 FormSection/Field, c04 actions, c08 fields and HP06 error/recovery. Reuse existing React/Base UI controls and host tokens. No frozen-kit edits. Account navigation reuses HP01 desktop and mobile shells. Check source/host at 1280/390/320px, long/invalid values, required fields, wrong credentials, keyboard submission, reload, logout and expiry. Relevant reference: v1 families c01/c04/c08/c22/c24/c25 and approved v1.1 HP01/HP02/HP03/HP06.

## Validation plan

1. Unit/integration checks: idempotent seed, unique salted hashes, failed/successful auth, cookie policy, expiry/logout, malformed/oversized requests, cross-origin writes, role/record isolation, atomic failure and persistence after reopening SQLite.
2. Browser journeys: real login across all five existing accounts, candidate → employer workflow, reload persistence, denied role, recovery and responsive/keyboard checks; adapt previous persona/localStorage journeys to the new server contract.
3. Run `./scripts/verify`, inspect diff separately and record actual results. No merge or deployment requested.

## Evidence

Implemented on `codex/database-auth`; all acceptance criteria above have local synthetic-scenario evidence.

- Final `./scripts/verify`: PASS with Node 24.22.3 and the already provisioned Chromium headless shell selected through PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH. Formatting, reference integrity, lint, types, 64 unit/integration tests in 10 files, baseline-packet verification, production build and all 69 browser tests passed. The 10 frozen-reference tests also passed. No browser/OS dependencies were installed.
- New database tests verify every preserved user/password, unique salted hashes, reopen persistence without reseeding, session expiry/logout, rollback on invalid ownership/import, role projections, strict command rejection, cookie policy, cross-origin rejection, oversized/malformed payloads, throttling and direct database/custom-path HTTP blocking.
- New auth browser tests exercise all five accounts, empty/invalid/long inputs, keyboard submission, 1280/390/320px, cookie/reload/logout, offline write failure/retry, expired-session input preservation, initial-connection retry and confirmed legacy migration without overwriting the original browser save. Existing candidate/employer/competency/snapshot/CV/recovery journeys use authenticated API fixtures and still pass.
- Source/host comparison: `artifacts/auth/source-form-{1280,390,320}.png`, `login-{1280,390,320}.png`, `login-error-{1280,390,320}.png` and `source-host.json`. Visually inspected each source/host width and the narrow error state. Exact shared field measurements: Arial/Helvetica/sans, 14px desktop /16px narrow, 7px radius, 46px minimum height and card background rgb(255,254,249). The deliberate host composition is a 640px-max account form, rather than the source's full-width recruiter example. No frozen-kit files changed.
- Real dev server smoke at port 3001: all five existing logins authenticate with Test1234 and log out successfully. Direct, encoded and /@fs requests for SQLite/WAL files return 403. The default database is `.data/doroboty.sqlite`; browser tests use isolated `.data/e2e.sqlite`.
- Frontend bundle scan found no Test1234 seed constant, password_hash SQL column, node:sqlite import or database path. Git ignores runtime databases and generated screenshots. Participant-package creation and pristine manifest checks pass; the package contains no runtime database, .data, Git history or instructor sources.
- Earlier checks exposed old persona-picker expectations and assertions forbidding the newly required local API; these were replaced with actual login/role/provider-boundary assertions. One sandboxed test attempt could not listen on localhost; the successful gate ran with local-server permission. No paid provider call or deployment was performed.
- Build completes with non-fatal Zod pure-annotation and >500kB bundle notices. No outstanding check failure remains. Automated axe and keyboard checks do not establish a complete assistive-technology audit; CI, human approval and production deployment were not executed.

## Separate review

Reviewed the final server/API boundaries, SQL parameterization, hash/session storage, audience projections, queued and acknowledged writes, duplicate-submission guard, return navigation, UI error recovery and package allowlist in a separate pass. The review found and fixed direct SQLite-file exposure through Vite source serving; the new guard covers default/custom paths, sidecar files, encoded paths and /@fs, with retained Vite secret-file denies. Dependency scanning is scoped to the product index.html so frozen historical HTML examples are not treated as product entries. Employer default navigation remains /app/oferty; candidates retain safe return paths.

A Git diff-based review is unavailable: this supplied repository has no commits or tracked files, so `git diff` is empty. Inspected the scoped implementation directly and ran the full gate; no baseline commit was invented and no files were committed/merged. Existing unrelated untracked files were preserved.

Durable lesson: ignoring a local database in Git does not stop a development HTTP server from serving it. Treat filesystem serving restrictions and artifact/package exclusion as separate controls.

## Merge into main — November 17, 2026

The user explicitly requested merging `codex/database-auth` into main. This supersedes the earlier no-merge boundary. The original checkout still had an unborn HEAD, but the separately published PR02 work is now available as origin/main at 90cb9fc. Attached the feature branch to that existing history with a mixed reset that preserved all working files; no synthetic baseline commit was created. Restored only three missing main files (the PR02 demo/readme and publication record), preserving their existing contents.

Acceptance for this integration: commit only the SQLite/authentication change, retain the current main's history and demonstration files, preserve its configurable Playwright test port and origin assertions, run the complete gate on the integrated tree, inspect the actual diff and exclude runtime databases/secrets. Browser tests remain serialized for the shared database and use a separate SQLite path per test port. FEATURES.md was reviewed; this merge integration changes no product behavior beyond the documented authentication feature. Create a reviewable PR, wait for applicable CI, merge without bypassing checks, and verify local/remote main contains the result.

The integrated `./scripts/verify` passed on Node 24.22.3 and the existing Chromium executable, using PROTOTYPE_TEST_PORT=3178: all 64 unit/integration tests, 69 browser journeys and 10 reference tests passed alongside formatting, lint, types, packet checks and build. The retained main demo/readme and publication record have no diff. Both frozen reference inventories remain unchanged. A separate review covered the actual 38-file change against 90cb9fc, including API identity/ownership, transaction acknowledgment, legacy-save recovery and the port integration. An in-memory scan found no configured API secret or forbidden runtime/database path among commit candidates. No unresolved review blocker remains.

This section records the completed pre-merge validation. Commit, CI and merge outcomes are recorded in the pull request and Git history; no deployment or data reset is part of the merge.
