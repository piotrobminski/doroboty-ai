# Architecture

One React/TypeScript application is built by Vite into static files. HashRouter renders routes under /#/; route parameters created in the browser require no hosting rewrites. The running app uses the shared Technologia po ludzku React adaptation, system sans/mono stacks and the approved local angular-alpha collage. All new and changed UI must follow the active **Technologia po ludzku** [design system](design-system/README.md), adapted into the existing Base UI stack within the task scope. The implementation and remaining approval boundary are recorded in design-system/STATUS.md. The local Node server stores the shared scenario, accounts, sessions and login-failure limits in SQLite. An optional local-only Node gateway supplies recruiter AI proposals.

## Data flow

JSON marketplace/person fixtures → idempotent SQLite seed → same-origin API → PrototypeProvider → feature views. `server/relational-schema.ts` defines schema version 2: companies, jobs/ordered locations, applications/ordered events, candidate/employer drafts and bookmarks. `prototype_state` holds only profile data and an optional-array presence flag. `server/scenario-repository.ts` assembles the unchanged validated version-1 API/export shape within a consistent read transaction. WAL and BEGIN IMMEDIATE serialize mutations. `server/api.ts` installs the API in Vite dev/preview. Runtime databases live under ignored `.data/`; there is no browser-only fallback.

Shared plain Zod schemas validate login, discriminated action payloads and complete state. Server identity comes only from the session cookie; `select_person` is a pure model/testing helper and is rejected by the API. Domain operations enforce role/company/person ownership and immutable application/CV/competency snapshots. The server assigns submission IDs/timestamps and commits before responding; frontend callers await acknowledgment before showing success. Normal writes preserve submitted rows and append events; SQL triggers reject snapshot/history edits, invalid event sequences and stage changes without matching history. Full operator import/reset uses explicit relational replacement in foreign-key order. Composer draft writes are serialized in order.

GET /api/state returns public published jobs, own candidate records, employer-company applications or the complete operator scenario. Employer source briefs are excluded from other audiences; candidates do not receive employer event notes; employers receive submitted CVs, not other users’ current full profiles or private legacy notes. These response projections are intentionally not valid full-scenario exports; only the operator can export/import/reset. Snapshot/approval operations still use the complete validated server state.

The five existing person IDs are seeded without changing profile/role/company/CV data. Stable logins are `<person-id>@doroboty.test`; initial `Test1234` passwords are individually salted scrypt hashes. Seed creates only missing accounts. A random 256-bit session token is sent as HttpOnly/SameSite=Strict cookie; SQLite stores only its SHA-256 digest and a 12-hour expiry. Successful login rotates the current session; logout revokes it. AUTH_SECURE_COOKIE=1 adds Secure for HTTPS. Login failures are rate limited per socket address; no client-forwarded identity/IP is trusted.

Legacy localStorage is read only for operator recovery. It is never silently migrated or overwritten. Operator import validates the full scenario and requires all current account IDs, roles and company assignments; new synthetic accounts get seeded credentials in the same transaction. Reset clears scenario records while retaining account profiles/memberships/credentials. Neither operation exports/replaces session credentials. Import/export is capped at 2 MB. Back up an exact SQLite database with the server stopped; operator JSON export covers scenario content only.

## Database migration and recovery

`server/database-migrations.ts` checks PRAGMA user_version before initialization. A genuinely empty database initializes directly at version 2; version 2 is validated without reseeding; unknown versions and unversioned nonempty stores are rejected. Version-1 migration holds BEGIN IMMEDIATE before writes and uses a second read-only connection with VACUUM INTO to create `<database-path>.v1-backup-<time>-<uuid>.sqlite` with mode 0600. This captures committed WAL data while excluding other writers. Backup failure aborts migration. Successful backups remain available even when subsequent migration validation fails.

Migration validates the stored source scenario and account references, creates relational tables, preserves original IDs/order/optional values/PR02 material, verifies a complete JSON-contract round trip and foreign keys, then drops the obsolete scenario table and records version 2 in the same transaction. Any failure rolls DDL and data back. No account/hash/session/login-limit row is rewritten during migration. SQLite foreign keys and a composite job/company reference protect ownership consistency; shared Zod checks still own role, text-length and nested JSON semantics. SQL string-length checks do not replace the existing Unicode/text validation.

The backup contains credentials and sessions; keep it private, outside participant distributions. With every server using that database stopped, restore a backup to a **different path** and set DATABASE_PATH to it, retaining the original database and sidecar files for recovery. The restored version-1 backup will be backed up and migrated on startup. JSON export/import remains version 1 and excludes credentials. See [approved schema and migration evidence](tasks/jobs-applications-schema.md).

## Guided composer and proposals

`job-editor.tsx` implements the approved three-step composer using the existing React/Base UI fields, step buttons with aria-current, review and final publication. `job-proposals.ts` creates up to three description-matched local criteria with exact excerpts and editable questions; unmatched roles get a generic source-based question. It performs no fetch, scoring or automatic approval. Question generation remains browser-local; persistence/publication requires the API.

`job-editor-state.ts` supplies plain Zod schemas for partial fields, draft criteria and exclusions. Optional version-1 employerDrafts are scoped to recruiter/offer and validated for unique identity and ownership. They participate in scenario persistence/export/import/reset. Reload restores editing before preview; publication removes only the matching draft. Opening preview after validation records question review in the existing draft approval flag; the final Publish action records publication approval/provenance without redundant checkboxes. Source changes retain human edits until explicit retention or confirmed regeneration. Selected approved criteria are validated by the existing PR02 domain schema before publication; zero selection retains the legacy ordinary application flow. Existing source/generated history, locations, salary semantics and immutable application snapshots remain intact.

## Submitted competency evidence support

`competency-insight.ts` derives a deterministic local hint from submitted criterion/response arrays only. It uses bounded lexical/synonym matching plus first-person action and described-outcome indicators. It returns per-requirement textual statuses, exact excerpts (up to 450 characters) and follow-up prompts, with no person score, ranking or stage recommendation. These heuristics cannot establish semantic understanding, factual correctness or skill level. Negated/no-response/unrelated text receives cautious gaps; linked materials are never fetched.

The authorized RecruitingApplication controller supplies CompetencyInsightPanel through ApplicationRecord.answerSupport in the existing RecordSheet Answer tab. CandidateApplication never supplies this region. Current job/profile/CV/identity/MatchScore do not enter the analysis; changing them cannot rewrite submitted evidence. The hint is derived, not persisted or auto-inserted into employer notes. Existing explicit stage operations and reason validation remain unchanged. No browser/provider network request or secret is used.

## Optional recruiter AI infrastructure

`vite.config.ts` loads server-side OPENAI_API_KEY/OPENAI_MODEL and installs `server/recruiter-ai.ts` in local dev/preview. The current composer is disconnected from this endpoint. Merely configuring a key never enables provider calls or a paid fallback. The former unused browser hook and fake browser-transport fixture have been removed.

The retained gateway accepts discriminated title/brief or description requests under `ai-contract.ts`, calls a fixed Responses URL using strict JSON Schema and store:false, and validates output. It requires a loopback peer/local Host and same-origin POST, bounds payload/output/time/concurrency/rate and cancels on disconnect. Errors are fixed codes; credentials and free text are not logged or exported. This is not public authentication. A future UI connection requires its own transfer disclosure and validation.

## Features

src/features/prototype owns model/storage/state and page compositions. src/features/jobs retains reusable presentation/filter/description logic; src/components/ui owns Base UI controls. Keep changes small.

Browsers connected to the same server share database records; reload reads the current role projection. There is no push-based cross-tab synchronization or edit conflict UI. Close stale editing tabs before import/reset. Hash links identify records in the receiving server database.

## Evidence and distribution

The baseline historical CSV and JSON are separate from interactive state. Future evidence must arrive in a separately reviewed package. package:participant copies only explicit allowed files/directories, including the complete docs/design-system guide/kit, and omits docs/source, historical task notes, agent run history and .git. A packet verifier checks the baseline data; packaging also verifies a pristine file/hash manifest. Ordinary checks permit participants to edit code and generate build/test output without invalidating a distribution fingerprint. Instructor repository history is never participant-safe.

## Checks

npm run check and ./scripts/verify run formatting, design-system reference integrity/example checks, lint, types, unit tests, build and Playwright against the preview server and SQLite API. Playwright disables the real key with PROTOTYPE_AI_DISABLE=1 and verifies actual local proposals, including persistence failure/retry and zero provider requests. Server tests inject fake provider fetch calls; neither suite makes paid requests. Playwright checks external requests, complete workflows, error/recovery behavior, keyboard controls and mobile layout. No test starts system services. npm run dev starts Vite, including its optional local AI middleware.

## Current visual implementation

The whole application uses the local Technologia po ludzku foundation and shared React/Base UI owners. `tokens.css` maps source --tph-* values into the existing --gui-* bridge. No vanilla page controller, HTML-string renderer, reference fixture store or global source reset is mounted in React. DiscoveryHero/FormSection/AreaIcon/AreaLabel are shared additions; PageTitle, JobCard, reading sheets, CV and actual timelines retain their existing owners. The user-approved [1.1 specification](design-system/PROPOSED-1.1.md) is now included in the frozen source reference and its versioned profiles. See [status](design-system/STATUS.md) for actual evidence and limits.
