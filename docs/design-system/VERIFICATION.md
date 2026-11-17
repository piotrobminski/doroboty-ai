# Technologia po ludzku — application acceptance checklist

Use with [project guidance](README.md), [implementation mapping](IMPLEMENTATION.md), [host owners](HOST-COMPONENTS.md), relevant [record contracts](RECORDS.md) and [status](STATUS.md). This is the receiving project's checklist; the imported package has its own dated verification.

## Before editing a screen

1. Record user intent, route, role/data, relevant source families, affected shared consumers, acceptance criteria and uncertainty in docs/tasks/.
2. Read the matching source pages and states. Listing S01/S02; candidate S06/S07; recruiter S11/S12/S15/S16; errors/dialogs/empty states are indexed in the [human atlas](technologia-po-ludzku/docs/design-system/v1/index.html#atlas).
3. Separate visual migration from behavior change. Preserve current routing, local data, consent, role gates, CV snapshots and domain operations unless the task explicitly changes them.

## Render and compare

Inspect 1280px desktop,390px mobile and 320px minimum, plus relevant intermediate breakpoints 1100/850/600/359. Wait for actual layout to settle before measuring. Compare source and host anatomy, type family/weight/size/line-height, color, border/radius, spacing and reading order; no-overflow alone is insufficient.

| Role            | New source checkpoint / scope                                                                                                                 |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Listing h 1     | clamp(40px,4.8vw,64px),1.04, sans 700; own mobile clamp(33px,9.7vw,53px). See source CSS rather than assuming the max at every viewport.      |
| Card title      | 21px desktop /20px narrow,1.2,700, tracking−.025em; complete wrapping.                                                                        |
| Offer h 1       | clamp(34px,4.1vw,53px),1.08, sans 700; mobile 34px.                                                                                           |
| Reading         | Intro 17px/1.75, body 16px/1.75, bullets 15px/1.75; section h 2 28px/1.15.                                                                    |
| Fields          | Label 13/600; control 14px/1.5 and 16px mobile; text error 12px; source min 46px. Package textarea uses sans.                                 |
| Select          | Reserve 42px text space on the right; chevron 16px with 14px inset in native source. Adapt equivalent space to Base UI.                       |
| Shapes / shell  | Card 12px, field 7px, modal 14/10px; source shell outer max 1304px with 32px gutters. Distinguish token declarations and actual profiles.     |
| Logo / category | Neutral firm identity + small area symbol; company and area are readable without color. Seniority separate.                                   |
| Color / inverse | Paper/card/ink + deliberate violet, secondary lime. Focus on graphite remains visible; lime text/line on paper is not automatically readable. |

These values describe source roles, not a new universal API. Host-only records/maps/scores need an explicit composition/extension decision. Do not keep old serif/pink/large-radius values solely because old assertions expect them; when a scoped migration changes a visual contract, update its focused visual tests from source evidence without weakening functional regressions.

## State and behavior matrix

| Trigger / case                             | Expected verification                                                                                                                                                         |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Long Polish title/company/single tag       | Complete wrapping and honest facts; check children, not just document scrollWidth. No fabricated skills/company/salary.                                                       |
| Missing logo or salary                     | Real initials and explicit absence; retain the host's actual currency/period/kind where provided.                                                                             |
| Save / unsave / reload                     | Stable name, aria-pressed, correct record identity, persistent host state and surviving focus. The gallery's memory-only save is not the host contract.                       |
| Search / category / facets / sort / paging | Correct combined results, existing URL/back/forward behavior, no lost query and no accidental route change.                                                                   |
| Remove chip / last chip / no results       | Remove one condition; keep other filters; meaningful recovery and predictable focus.                                                                                          |
| Dialog / mobile filter panel / select      | Names, labels, keyboard, contained focus where modal, Escape and restored trigger; overlays/portals do not clip content or hide focused controls.                             |
| Required/error/disabled fields             | Text identifies the field and repair, aria-describedby/invalid, first error focus; hidden salary disables the intended controls without silently losing values.               |
| Section URL / return                       | HashRouter-compatible full URLs, copy/open fresh, Enter, back/forward; do not paste source job.html URLs into product routes.                                                 |
| Candidate application                      | Actual job context, answer/consent validation, draft/reload, hidden legacy fields preserved and not presented as approved content; only successful local submission confirms. |
| Submitted record / CV                      | Same immutable snapshot after profile edits; CV-only file controls/viewer, complete custom text, no wrong prepared PDF.                                                       |
| Employer decisions                         | Allowed transitions and actual events only, note retained on failure, correct role projection, terminal states and status focus.                                              |
| Existing MatchScore                        | Preserve scenario meaning and values; visible number and existing model boundaries. Its host extension does not redefine area-marker colors.                                  |
| Shared controls/tokens                     | Recheck other routes, workspace states and portals; a successful single screenshot does not verify all callers.                                                               |
| Motion                                     | Keep reduced-motion behavior, success-only decoration and cleanup; no celebration on invalid input/draft save.                                                                |

## Accessibility scope

Recommended target WCAG 2.2 AA and relevant APG guidance are documented with criteria, levels and exceptions in [F04](technologia-po-ludzku/docs/design-system/v1/index.html#f 04). Test keyboard and visible/unobscured focus, names/roles/states, contrast,200% text,320px reflow, larger text spacing and relevant assistive technology.44px is the system's comfort target, not the 24px AA minimum criterion by itself. No static screenshot or ARIA attribute establishes complete compliance.

Do not add a second focus trap over Base UI merely because the vanilla kit has one. Test the actual host behavior. Report which browser/device/reader cases ran and which remain unverified.

## Gates and evidence

```sh
npm run design-system:check
./scripts/verify
```

The first checks the active 177-file package and retained legacy compatibility inventory, source syntax and 10 source tests. The full gate also checks formatting, lint, types, host units, baseline packet, production build and browser journeys. Browser journeys require provisioned Chromium; do not install OS tools automatically. Starting the app is not a reason to download browsers.

For the documentation-installation task, these gates are regression/integrity checks; they do not assert new visual adoption. For an actual UI task, store new paired source/host screenshots and targeted keyboard/state evidence; review the result separately before claiming closure. Keep historical audit evidence, record findings as closed/partial/open and never convert a missing test into a pass.

## Whole-application regression matrix

[design-system.spec.ts](../../tests/e2e/design-system.spec.ts) covers public/candidate/employer/operator route states at 1280/390/320px, descendant and page overflow, desktop axe WCAG-tagged checks, company saved-state/definition lists, public modal/select keyboard behavior, long/missing data and employer validation focus. [prototype.spec.ts](../../tests/e2e/prototype.spec.ts) retains the existing process, snapshots, role visibility, recovery and motion regressions. Source-derived typography/surface/action expectations replace the old Poster People values.

For an already provisioned Chromium outside Playwright's expected directory, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to its absolute executable path. This is an explicit launch option, never an installation or OS dependency step. Use Node 24. Review [redesign-verification.json](redesign-verification.json) and the task record for the actual result; test source alone is not evidence of execution.
