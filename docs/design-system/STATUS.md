# Design-system adoption status — November 13, 2026

## Runtime implementation

The whole application now uses **Technologia po ludzku 1.1** through a shared React/Base UI adaptation. Public discovery/list/map/job/company/information/persona routes, candidate and employer workspaces, application/CV records, settings/recovery, unavailable states and operator materials use the same tokens, typography, controls and surfaces.

Runtime source: [tokens](../../tokens.css), [foundation](../../src/app/design-system.css), [marketplace](../../src/app/marketplace.css), [workspace](../../src/app/workspace.css), [application](../../src/app/application.css) and [records](../../src/app/records.css). The implementation keeps HashRouter, scenario data/enums, Zod operations, local persistence/import/export, human approval, persona projections and immutable application/CV snapshots. MatchScore remains an explicitly documented scenario extension.

Shared additions are DiscoveryHero, FormSection and the AreaIcon/AreaLabel exports. Existing PageTitle, controls, CompanyLogo, JobCard, SalaryFact, BackLink, Notice/Empty, RecordSheet, CvAttachment and ProcessTimeline remain their single owners. The old mobile-only ResponsivePanel has been replaced with inline native disclosure plus existing Base UI facet selects. No source controllers, string HTML renderers or source fixture store are mounted in React.

## Source package and approval boundary

The complete 177-file [Technologia po ludzku reference](technologia-po-ludzku/) and 67-file [historical kit](agent-kit/) remain byte-preserved against their manifests. Runtime Geist Serif and legacy illustration imports have been removed. The approved angular-alpha collage is resolved by Vite; fonts use system sans/mono stacks.

The user **accepted** the [1.1 specification](PROPOSED-1.1.md) on 2026-11-13. The new package is frozen with six profiles within the existing 25 families. The preserved v1 manifest plus archived changed-file originals reconstruct all 168 original file hashes. See the [release and audit task](../tasks/design-system-1.1-release-and-audit.md); the application audit follows the reference release.

## Previously open company findings

| ID    | Current implementation / evidence                                                                                                                                  |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| NH-01 | Grouped dl/dt/dd facts; website navigation outside dl. Dedicated DOM assertion and route accessibility check.                                                      |
| NH-02 | Source-derived paper/card/line roles and 12px surface; company screenshots at 1280/390/320px.                                                                      |
| NH-03 | Shared neutral CompanyLogo, genuine local marks and initials/error fallback; separate C markers on job cards. Long/missing-data case includes a broken local logo. |
| NH-04 | Candidate save action/state is resolved inside the single JobCard across company/home/related/list/saved callers. Dedicated save/reload/cross-route regression.    |
| NH-05 | Synthetic-company context and honest empty-company copy with a working return to all jobs; populated and empty-company screenshots.                                |

These are implemented and locally tested findings; user design acceptance remains separate. The original audits retain their dated evidence.

## Verification evidence

The [redesign task](../tasks/technologia-po-ludzku-app-redesign.md) records actual commands, results, source/host comparison and separate review. The [portable verification record](redesign-verification.json) contains the final gate result and limitations. Representative captures are in [redesign-evidence/](redesign-evidence/index.html); the full local matrix is generated under artifacts/technologia-po-ludzku/ by [the route checks](../../tests/e2e/design-system.spec.ts).

The prior [installation record](installation-verification.json) remains historical: its missing-browser failure describes that installation, not the current redesign. Neither the original kit checks nor a green automated gate establishes a full assistive-technology audit, human research result, CI result, publishing or source-release approval.

## 1.1 compliance audit

The separate audit follows the frozen reference release. Read [the audit report](audits/1.1/AUDIT.md) for measured before/after findings, family coverage and actual remaining limitations. Its evidence is separate from the original redesign delivery.

The completed 1.1 audit closed three findings through existing shared owners. All 128 focused measurements and the full gate (44 browser tests, 27 host units, 10 reference tests) pass. See [final audit verification](audits/1.1/verification.json). The reference hash stayed fixed throughout the application corrections.

## Database/auth extension — November 17, 2026

The persona-picker composition is replaced by LoginPage using HP02/HP03 and c08/c22 fields/errors. Existing Shell HP01 navigation exposes account switching/logout. Persistence and authorization now use the server database/API; older dated persona/localStorage descriptions above record the previous baseline. The frozen 1.1 package remains unchanged. New validation and comparison evidence belongs to [the database/auth task](../tasks/database-auth.md).
