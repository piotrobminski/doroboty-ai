# Technologia po ludzku 1.1 — accepted release specification

Status: **accepted by the user on 2026-11-13** with “Akceptuję propozycję design system 1.1”. This authorizes the deliberate source-package release, manifest, documentation/examples and verification described below. See [release and audit record](../tasks/design-system-1.1-release-and-audit.md).

## Accepted decision

Keep the existing 25 source families. Extend them with reusable composition profiles for the working React application, rather than introducing a separate component for each route. Retain the existing source palette, C markers, sans/mono hierarchy and angular-alpha collage.

The implementation adds only four shared component exports: DiscoveryHero, FormSection, AreaIcon and AreaLabel. PageTitle, Notice, Empty, Shell and all data/record controls extend existing owners. PublicHeader is an internal Shell composition. The unused mobile-only ResponsivePanel is removed. Icons do not constitute a second control library.

## Approved composition profiles

| Source family                 | Accepted addition                                                         | Implemented owner and contract                                                                                                                                  | Responsive/state contract                                                                                                                                                               |
| ----------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| c01 Navigation                | Public and persona-workspace shells                                       | `Shell`; public desktop links, shared arrow wordmark; existing role/person navigation                                                                           | Public mobile menu uses one named Base UI Dialog, Escape and trigger return. Workspace mobile navigation remains an inline expanded menu with Escape return. No security claim.         |
| c03 Context headers           | Task and submitted-record profiles                                        | `PageTitle({children,action?,description?,eyebrow?})`; one H1 and optional action. `ApplicationRecord` uses graphite for the immutable record context.          | Task H1 43px/1.05, narrow 34px. Actions wrap; long identities remain complete. DiscoveryHero retains the source clamp and collage; the collage is not repeated in task screens.         |
| c20/c25 Panels and groups     | One form with named sections                                              | `FormSection({index,title,eyebrow?,description?,children})`; semantic section/H2 with a generated unique heading ID. Profile, company and job editors reuse it. | Three visible job groups do not masquerade as sequential steps. User input, approvals and domain validation stay with the host. Supporting recruiter context reflows below the form.    |
| c20/c25 Reading surfaces      | Shared submitted-material sheet                                           | Existing `RecordSheet` and Base UI Tabs, `CvAttachment`, `ApplicationRecord`                                                                                    | One surface; answer/CV and note/actions share it. Only CV has file actions/preview. Custom snapshots keep full text. Keyboard tabs, note retention and immutable submitted data remain. |
| c19 Process                   | Recorded-event profile, separate from the source's static company process | Existing `ProcessTimeline({items})` with ordered actual events, machine-readable times and `aria-current=step` on the latest event                              | Candidate controller removes employer notes before rendering. Materials precede history on narrow screens. No invented future milestones.                                               |
| c22/c24 Feedback and recovery | Persistent info/success/warning notice, empty/unavailable contexts        | Existing `Notice({children,tone?})` and `Empty({children})`; existing error/confirmation primitives                                                             | Text explains what happened and the next action. Import/reset remain confirmed; failures preserve data. Native/local operations alone trigger success.                                  |

## Existing host extensions to document explicitly

- **Scenario MatchScore:** keep the existing noninteractive percentage and bands: 0–39 red `#FF6B79`, 40–59 orange `#FFB15C`, 60–79 yellow `#FFE45B`, 80–100 green `#00C853`, with ink text. These are scenario facts, separate from area tones and hiring probability. Do not add these colors to Build/Apply/Lead.
- **Offline map:** retain the local illustrated map, grouped location buttons and complete job links. Use the shared tokens/buttons and inline listing filters; no remote tiles, geocoding or location inference.
- **SalaryFact:** preserve the host's PLN/EUR, gross/net, month/year and agreement data. The reference's PLN/month fixture is not a universal salary schema.

## Accepted clarifications for all consumers

1. Use one source C icon mapping for both the small company marker and visible area label. Company identity remains neutral; experience is always separate. Host logos and fallback initials remain host data.
2. Name the geometry profiles explicitly: cards 12px; fields/selects 7px; actions 8px; modal 14px, narrow modal 10px. Keep token declarations distinct from source component profiles.
3. Default actions are graphite; contextual application submission is lime. Violet is the brand, focus and selected indicator. Do not color every primary action violet.
4. Use the existing Base UI FormSelect for single-value facets, with an explicit All value and native details/summary for More filters. Keep search visible at every width. No duplicate mobile filter state or dialog implementation.
5. Save toggles have a stable accessible name and `aria-pressed`; every candidate-visible JobCard resolves the current candidate's state, including company/home/related results.
6. Preserve the source adapter decisions I01–I08 by their intent: sans textarea, darker placeholder, inverse focus, wrapping metadata, shared renderers, stable save names, isolated examples and contained/restored modal focus. Base UI owns modal focus in React; do not layer the vanilla trap over it.

## Release boundary

The user accepted these profiles and clarifications for reference 1.1.0. The original v1 bytes are preserved by its complete manifest plus changed-file originals. Once the new reference is frozen, the application audit uses that fixed contract; implementation findings do not authorize changing the source to hide a discrepancy.

[Implementation and validation record](../tasks/technologia-po-ludzku-app-redesign.md) · [current adoption status](STATUS.md) · [host owners](HOST-COMPONENTS.md).
