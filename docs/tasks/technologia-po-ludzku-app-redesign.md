# Whole-application Technologia po ludzku redesign

Date: 2026-11-13. Branch: `main` (the existing branch).

## Intent

Redesign every product route using the installed Technologia po ludzku reference. Reuse the existing React/Base UI owners and the fewest shared visual recipes. Prepare a concrete design-system extension proposal for user approval after implementation; do not modify the immutable reference package.

## Acceptance criteria

- Public home, listing/list/map/empty results, job, company, methodology, privacy, persona selection and unavailable states use the new visual language.
- Candidate/employer/operator navigation, dashboards, profile/preview/CV, saved jobs, application editor/lists/records, employer offer/company editors, settings/recovery and teaching materials share the same system.
- Source anatomy is preserved: expressive angular-alpha hero, visible search, neutral company identity plus separate C area marker, calm 12px cards, sans/mono roles, graphite job header and contextual lime application actions.
- One shared JobCard, CompanyLogo, area indicator, page heading, field, action, feedback, reading sheet, CV attachment and timeline serve their callers. Host-only recipes are documented as proposed extensions.
- Preserve HashRouter paths, current records/enums, rich salary facts, Zod, localStorage/import/export/reset, persona projections, human approval, legacy draft compatibility, immutable submitted snapshots and MatchScore bands/meaning.
- Compare source and host at 1280/390/320px. Exercise long/missing data, keyboard/focus, dialogs/select portals, validation/recovery and all personas. Keep actual evidence and distinguish untested cases.
- Update FEATURES.md and receiving documentation to match the final implementation. Run `./scripts/verify`, perform a separate review and report actual failures. No merge, publishing or reference-release approval is implied.

## Implementation plan

1. Map routes/owners/source families; preserve a pre-change filesystem snapshot because this checkout starts with untracked source files.
2. Replace legacy runtime token/type/control recipes and branding; adapt shared marketplace anatomy and reuse the approved asset.
3. Adapt every workspace/editor/record/information state using the same foundation; address company definition-list and save-state findings in scope.
4. Update source-derived visual assertions and add full-route responsive/a11y evidence, preserving functional regression coverage.
5. Run checks with Node 24 and an already provisioned Chromium if available; compare paired reference/host captures, review the complete change, and prepare the proposed system update.

## Evidence and review

Implemented on the existing `main` branch. Four new shared component exports (DiscoveryHero, FormSection, AreaIcon, AreaLabel) adapt source anatomy; existing field/page/card/record/feedback owners are reused. Removed the obsolete ResponsivePanel and old runtime font/illustration imports. Both imported inventories remain protected by design-system:check.

Source/host comparison covers listing, offer and recruiter composition at 1280/390/320px, with explicit differences for the host's functional single-page editor, actual salary model, offline map and scenario MatchScore. The portable review gallery is docs/design-system/redesign-evidence/index.html; full generated captures are under artifacts/technologia-po-ludzku/.

Additional checks cover 38 route/person/state combinations at each width, desktop axe WCAG-tagged checks, long unbroken names/locations, missing salary, broken local logos, custom CVs, empty company/saved/results, Base UI select/dialog keyboard focus, and employer salary-error focus/retention. Text-spacing overrides (line height 1.5, letter spacing .12em, word spacing .16em, paragraph spacing 2em) were tried on listing/offer/personas/unselected settings at 1280/320px with no page overflow. Forced-colors was rendered in Chromium. These checks do not constitute a manual screen-reader or full accessibility audit.

Separate review compared the complete changed-owner inventory and focused diffs to the baseline snapshot at /private/tmp/doroboty-tph-redesign-before. Domain model, persistence/store, route definitions, fixtures, filter/pagination model and presentation helpers remain byte-identical. Review found and corrected a legacy branding favicon, long inline-fact overflow, duplicate consent accessible names and prefilled textarea labeling through the shared Field owner. Source package hashes and role-specific record projections remain protected. The employer form now preserves existing salary units and focuses/identifies a Zod-invalid field while retaining entered content.

The final full-gate result is recorded below after execution. The 1.1 design-system proposal is pending user acceptance; no source release, merge, CI or publishing is claimed.

## Final gate and delivery evidence

`./scripts/verify` exited 0 on Node v24.22.1 using the already provisioned Chromium headless shell (cache revision 1208), explicitly selected through PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH. Formatting, 168 active + 67 historical reference hashes, source syntax, 10 reference tests, lint, TypeScript, 27 host unit tests, the 120-journey baseline packet, production build and all 41 browser tests passed (7 workers, 15.7 seconds for browser journeys). No browser binaries, OS dependencies or additional package manager were installed. All 180 checked receiving-document local links resolve.

Build emitted nonfatal dependency PURE-comment annotation notices and the existing advisory for a main JS chunk above 500 kB. No runtime error, failed test or reference hash mismatch remains. Local automated accessibility/keyboard evidence and screenshots do not establish screen-reader coverage, CI, human acceptance or deployment.

The exact existing branch remains main. The reference 1.1 proposal is the final user-approval step and has not been applied to either immutable package.
