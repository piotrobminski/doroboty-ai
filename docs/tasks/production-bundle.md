# Portable production bundle

## Intent and acceptance criteria

The user requested a production bundle that can run on another server. The current Vite frontend requires the same-origin SQLite/session API, so distributing dist alone is insufficient. Keep the teaching prototype's product behavior and prepared synthetic accounts; this is packaging, not a deployment or a new account-management flow.

- Build optimized frontend assets and a standalone Node.js 24 HTTP server containing the existing API, shared schemas, fixtures and migrations. The extracted archive must run without the repository, npm installation, Vite or platform-specific node_modules.
- Support HOST, PORT, DATABASE_PATH and AUTH_SECURE_COOKIE. Serve only public build files, preserve hash routes and API access rules, keep storage outside public files, and close SQLite on shutdown. The optional local-only provider gateway stays outside this deployment.
- Produce a portable tar.gz, SHA-256 checksum and file manifest, plus startup, reverse-proxy, persistence and recovery instructions. Exclude local databases/backups, environment secrets, Git/history, instructor materials and generated test evidence.
- Verify the extracted archive in a temporary directory with a new disposable database: assets/API, login, persistence across restart, rejected private/traversal paths and secure-cookie origin handling. Run browser journeys against the actual standalone bundle as well as ./scripts/verify.
- Review the final diff and package contents. Update FEATURES.md and relevant runtime documentation, reporting executed local checks separately from remote deployment/CI.

## Implementation plan

1. Add a bounded static HTTP host around the existing API and database; bundle its Node entry using Vite's existing build API with dependencies included.
2. Add repeatable production packaging and deployment documentation, retaining existing dev/preview commands and excluding private runtime state.
3. Add meaningful HTTP/runtime tests and an option to run existing browser journeys against the extracted production archive.
4. Run the required gate, package and extraction smoke/browser checks; complete a separate review and record actual evidence here.

References: [Vite static deployment](https://vite.dev/guide/static-deploy.html) distinguishes local preview from a production server; [Vite SSR dependency handling](https://vite.dev/guide/ssr.html) documents bundling dependencies; [Node.js 24 HTTP](https://nodejs.org/docs/latest-v24.x/api/http.html) documents the runtime server lifecycle.

## Implementation and initial verification

Added a standalone HTTP host using the existing API/database, explicit public-file inventory and canonical path validation, request/header timeouts and bounded signal shutdown. The production entry resolves its default database relative to the release, independent of the working directory. Packaging uses the existing Vite build API and bundles runtime dependencies; no package or lockfile dependency was added. The archive includes 39 hashed release files plus the manifest, a dependency-free start package, the Zod license and deployment instructions. Local databases, sessions, backups, environment files, source history and instructor materials are excluded. The optional loopback-only provider gateway is omitted.

Added three HTTP/runtime tests covering actual static/API behavior, persisted profile/session state after restart, role and origin checks, secure cookies and private/symlink/public-database rejection. The first run caught macOS temporary-directory aliases bypassing a lexical path comparison; resolving existing ancestors canonically fixed it. The targeted rerun passed. Updated existing browser configuration to support an extracted production archive and assert the deliberately absent provider endpoint. Added production tooling/docs to the participant source allowlist so its npm command remains usable.

The first full ./scripts/verify passed on Node 24.22.3 with provisioned Chromium and isolated port 3185: formatting, frozen inventories, 10 reference tests, lint, types, 78 unit/integration tests in 12 files, baseline packet, build and all 69 preview browser journeys (2.7 minutes). The initial raw archive inspection then caught macOS AppleDouble metadata; packaging now disables xattrs/mac metadata and normalizes archive ownership. The rebuilt tar contains exactly the manifest's 39 files plus manifest.json, with matching hashes, no links or metadata side files and root ownership. Its adjacent SHA-256 checksum verifies. Existing non-fatal Zod annotation and bundle-size build notices remain.

The extracted release runs in an independent temporary directory, without node_modules or npm installation. The smoke check verifies built assets, a sample PDF, public API, login, forbidden private paths, candidate role limits, profile and session retention across restart, release-relative database location from another working directory, schema version 2, all five seeded accounts, clean foreign keys, HTTPS-origin/Secure-cookie handling and graceful SIGTERM. Temporary synthetic runtime data and smoke evidence remain outside the archive. The baseline participant source package also builds and verifies independently; local provider-key values were checked in-memory against archive files with zero matches, without printing credentials.

## Final verification and separate review

The final ./scripts/verify passed again with PLAYWRIGHT_PRODUCTION_DIR pointing to the extracted release, isolated port 3187, Node 24.22.3 and the provisioned Chromium. It ran formatting, both frozen inventories/reconstruction, 10 reference tests, lint, types, all 78 unit/integration tests, baseline packet verification, frontend build and all 69 browser journeys against the actual standalone server (2.7 minutes). The production-specific provider assertion passed with 404; other flows exercised the same login, publication, applications, snapshots, employer stages, keyboard, errors/recovery and responsive widths. The HTML report is ignored under artifacts/production/e2e-report; logs and smoke JSON are also local evidence. Verification ran on macOS; no remote server or CI deployment was performed.

The final archive is artifacts/production/doroboty-ai-production.tar.gz (13,829,580 bytes), accompanied by its SHA-256 checksum. Raw tar inspection verifies exactly 40 regular files including the manifest, matching file hashes, no symlinks/AppleDouble/xattrs and normalized ownership. The checksum passes. A final in-memory scan found no configured secret value or absolute checkout path in any packaged file. The compiled server imports only Node builtins and includes its required schemas/fixtures; it runs without a dependency install. The archive contains fresh synthetic fixture data, not this machine's database or sessions.

A separate review rechecked the complete source/doc diff, realpath boundaries and symlink rejection, static MIME/cache/HEAD behavior, same-origin API/role preservation, database location and shutdown, external-import rejection, private-file exclusion, normalized archive contents, participant allowlist and deployment/recovery instructions. No unresolved blocker remains. No UI, shared domain schema, database migration, auth implementation or immutable design-system asset was changed. FEATURES.md records the new deployment/runtime tooling. Work is on codex/production-bundle; no commit, push, merge or deployment is part of this request.

Durable lessons: inspect raw archive members as well as native extraction output to catch macOS metadata files; resolve existing filesystem ancestors before enforcing storage boundaries; run browser journeys against the exact extracted runtime that will be transferred.
