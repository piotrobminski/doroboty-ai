# Account administration

## Intent and acceptance

- Provision the requested primary administrator through server configuration. Preserve existing account IDs, passwords and scenario records. Remove legacy operator access on migration and require rotation of the primary temporary password.
- Show password change in authenticated settings. Verify the current password, revoke prior sessions after a successful change and rotate the current session.
- Add a server-authorized account panel with account creation, password reset and administrative access grants and revocations. Keep recruitment roles separate from administrative access so granting access preserves historical associations. Protect the primary administrator from demotion and administrative reset.
- Keep scenario transfers free of account credentials and administrative grants. The S3 simulation retains its demo accounts and does not expose account administration.
- Reuse the existing PageTitle, FormSection, Notice, Field, FormSelect and Base UI controls from host profiles HP01, HP02, HP03 and HP06. Check 1280, 390 and 320 pixel layouts, long values, keyboard navigation and recovery.
- Verify migration, authorization, password rotation, session revocation and browser flows. Run the project verification and record any limitations.

## Implementation and review

SQLite schema version 3 stores administrative access and temporary-password status on accounts. Legacy operator profiles become candidates while preserving their account credentials. The primary account is provisioned once from private server configuration. Administrator grants stay independent of recruitment roles and scenario JSON. The primary administrator changes their own password through Settings. Other administrators can grant and revoke access, create candidate and employer accounts, and set temporary passwords on other accounts.

The local database contained both the old scenario document and the relational tables under a version-1 marker. Compared both scenario representations under the write lock and confirmed equality. Stored a private SQLite backup before discarding the duplicate table and restoring the version-2 marker. Normal startup then created a second private backup and migrated to version 3. Existing credential hashes and all relational records matched the original backup. Local login verified one administrator and the required password-change gate. The temporary password remains available for the user's first sign-in.

Verification on 2026-11-18 passed 84 unit/integration tests, 70 Chromium server journeys, 7 Chromium static-demo journeys and 9 focused authentication/administration journeys on the final build. The browser checks covered direct-route access, account creation, rejected password confirmation with keyboard focus, forced rotation, grant/revoke, session invalidation and password reset. The admin layout passed reflow checks at 1280, 390 and 320 pixels. The source and host form fields matched at all three widths for font, radius, height and background. Screenshots and measurement evidence are in ignored artifacts/account-admin. Design-system integrity, lint, types, baseline packet and both frontend builds passed.

`./scripts/verify` stopped at Prettier because the pre-existing untracked docs/production-readiness.html is unformatted. The other stages were run separately. Changed source and documentation were checked independently. Both browser bundles exclude the bootstrap secret and primary email. The standalone S3 build excludes the account administration client.

Reviewed server-side access checks, stale sessions, password reset and login races, stored hashes, migration backups, protected primary access, role projections, input validation and the build boundary. The local development server is running on port 3001.
