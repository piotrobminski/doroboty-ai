# Application compliance audit — Technologia po ludzku 1.1

Date: 2026-11-13. Branch: `main`. Result: **three findings corrected; no open discrepancy in the tested scope**.

The user accepted the 1.1 reference update and requested this audit after its implementation. The audit compares the application with that frozen reference, including the approved host profiles. It does not infer acceptance from the earlier redesign or change the reference to match a failing screen.

## Reference and evidence

- Active reference: **1.1.0**, 177 files, 25 base families and six composition profiles. [Current human guide](../../technologia-po-ludzku/docs/design-system/v1.1/index.html), [machine contract](../../technologia-po-ludzku/agent-kit/host-profiles.json), [package verification](../../technologia-po-ludzku/agent-kit/verification-1.1.json).
- Frozen manifest SHA-256: `9f87a8a73869b91686f4e5db00042a7f60459b188b97d86a8b50c3b24caf2e3b`. Before and after measurements use the same hash.
- [Before measurements](before/report.json): 128 checks, 11 failed measurements grouped into three findings. [After measurements](after/report.json): **128/128 passed**, no focused axe violations or runtime errors.
- Paired source/host captures cover listing, task/form and submitted-material compositions at **1280/390/320px**. [Visual review](index.html).
- The full route matrix covers **38 route/person/state combinations at each width** (114 views), including public/candidate/employer/operator routes, redirects, unavailable records, wrong-role/person states, settings without a selected persona and empty lists. Long/missing data has additional coverage.

## Findings and corrections

| ID      | Source requirement                                  | Before                                                                                                                                            | Shared correction                                                                                                                                                                        | Status |
| ------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| DS11-01 | c10 and the 1.1 comfortable target: 44px            | Employer approval label measured 24px high at 1280 and 390px. This met the 24px AA minimum; the finding concerns the system's 44px design target. | One checkbox-field recipe gives candidate/employer consent labels a 44px minimum and consistent label geometry. Measured 44px at all three widths; full-label activation is checked.     | Closed |
| DS11-02 | c14: readable criteria and meaningful removal names | Chips exposed storage enums such as remote and senior in visible text and accessible names.                                                       | Existing canonical presentation dictionaries supply Zdalnie, Senior, Umowa o pracę, etc. The persisted enums, hash URL, combined filtering and keyboard focus recovery remain unchanged. | Closed |
| DS11-03 | c16: job article associated with its own title      | The six listing cards had no aria-labelledby association at all three widths, unlike the source card contract.                                    | The single JobCard owner gives every article a unique associated H3. All callers reuse it; save toggles preserve the heading ID and focused control.                                     | Closed |

No new component family or parallel implementation was required. The receiving token bridge may use different aliases; actual rendered values were compared with the source roles. The added 1.1 field/modal aliases do not require wholesale renaming of host tokens.

## Family coverage

“Conformant” below means conformity within the rendered, measured and exercised scope. It is not a complete WCAG or assistive-technology certification.

| Family                 | Host owner / evidence                                                                                                | Result                                                                                    |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| c01 Navigation         | Shell public/workspace shells; desktop/mobile navigation, named modal containment/Escape/return, persona selection   | Conformant; HP01                                                                          |
| c02 Return/context     | BackLink; copied hash-section URLs, history and section focus; application/record context returns                    | Conformant                                                                                |
| c03 Context headers    | Source/host discovery sizing, graphite offer, PageTitle and ApplicationRecord typography at three widths             | Conformant; HP02                                                                          |
| c04 Actions            | Graphite defaults, lime application CTA, radius and target size, disabled/error/success and reduced-motion paths     | Conformant                                                                                |
| c05 Employer identity  | Shared CompanyLogo, neutral genuine marks, initials/broken-local-image fallback, long company name                   | Conformant                                                                                |
| c06 Work-area marker   | Source/host Build/Apply/Lead color pairs; same C symbols in marker/label; separate seniority                         | Conformant                                                                                |
| c07 Informational tags | Shared card facts/function/seniority, wrapping metadata, noninteractive facts                                        | Conformant                                                                                |
| c08 Fields             | Explicit label/control IDs, prefilled textarea name, sans sizing/radius, errors/focus/input retention                | Conformant; HP03                                                                          |
| c09 Select             | Existing Base UI owner; 42px right reserve, 16px chevron, 14px inset; keyboard portal/Escape/return                  | Conformant                                                                                |
| c10 Choices            | Shared consent labels, pointer/keyboard state and 44px label target                                                  | Conformant after DS11-01                                                                  |
| c11 File materials     | CvAttachment matching local PDFs, download identity and full custom-text snapshots                                   | Approved HP04 adaptation; source upload demo is not a host upload feature                 |
| c12 Search             | Query/location stay visible, combined filtering, reset/reload/back-forward and narrow reflow                         | Conformant                                                                                |
| c13 Filters            | Inline categories and existing single-value FormSelect, explicit All value, native disclosure                        | Conformant                                                                                |
| c14 Active criterion   | Canonical visible/removal names, remove-one behavior, surviving filters and focus recovery                           | Conformant after DS11-02                                                                  |
| c15 Results            | Real count, current list/map mode, paging and empty recovery; no source fixture substitution                         | Conformant                                                                                |
| c16 Job card           | One JobCard across home/list/company/related/saved, shared salary facts, named unique title, stable save state/focus | Conformant after DS11-03                                                                  |
| c17 Facts              | Actual salary amount/currency/basis/period and honest absence; immutable record context                              | Conformant; approved SalaryFact extension                                                 |
| c18 Reading            | Complete description, paragraph/list/type hierarchy, source-width reading roles and long data                        | Conformant                                                                                |
| c19 Process            | ProcessTimeline actual events, semantic times/current step, candidate-safe projection and mobile order               | Conformant; HP05                                                                          |
| c20 Panels             | Calm cards, application conditions/context, one material sheet and recruiter support panel                           | Conformant; HP03/HP04                                                                     |
| c21 Stages             | Host keeps its functional single-page grouped editor; actual material tabs use Base UI                               | Approved HP03 variation; the standalone demo's three steps are not required host behavior |
| c22 Feedback           | Info/success/warning notices, inline validation/first error focus, storage/import/reset recovery                     | Conformant; HP06                                                                          |
| c23 Dialog             | Base UI semantics, focus containment, Escape/return and narrow radius; no duplicate vanilla trap                     | Conformant in exercised browser/keyboard cases                                            |
| c24 Empty/success      | No results, empty saved/applications/company, wrong/unavailable records, submitted/terminal/recovery states          | Conformant; HP06                                                                          |
| c25 Groups/preview     | Shared FormSection/Field; unique heading IDs, true approval/source/proposal separation and live offer context        | Conformant; HP03/HP04                                                                     |

## Executed checks and limits

The focused audit ran nine axe view/width combinations (listing, employer editor and candidate record at all three widths), source/host style measurements and paired captures. The broader route suite applies axe WCAG-tagged checks to 36 desktop route/person states. Existing journeys cover publication → draft → submission → employer decision, legacy drafts, custom and immutable CVs, wrong-role/person visibility, recovery/import/reset, notes across tabs, terminal states, withdrawal and motion.

The [1.1 regression tests](../../../../tests/e2e/design-system-1.1.spec.ts) exercise label activation/geometry, named cards/focus and canonical criteria/enum URL behavior. [The audit command](../../../../scripts/audit-design-system.mjs) reproduces measurements against the running local host and reference and rejects a changed reference hash between phases.

No manual screen-reader session, physical-device test or complete WCAG audit was performed. CI, deployment and recruiting effectiveness are outside this local evidence. The source's original v1 issues remain historical unless resolved by an explicit 1.1 rule; this report does not relabel every old issue as closed.

Final `./scripts/verify` execution and release review are recorded in [the release task](../../../tasks/design-system-1.1-release-and-audit.md).

## Final validation result

`./scripts/verify` exited 0 on Node 24.22.1: all **44 browser tests**, **27 host unit tests**, **10 source tests**, 120 baseline journeys, formatting, lint, types, source integrity and production build passed. Browser checks used the existing provisioned Chromium; no browser or OS dependency was installed. The final audit-command rerun also passed 128/128 measurements with the unchanged reference hash. [Machine-readable final verification](verification.json).

Separate review confirmed the exact 11 changed v1 files, nine additive 1.1 files, all 168 reconstructable v1 hashes and the three shared host corrections. The release ZIP matches all 177 active source hashes and all 16 embedded signatures. Model, routes, persistence/store and fixture bytes remain unchanged. Existing nonfatal build notices concern Zod PURE comments and the main-JS chunk size advisory; no failed check remains.
