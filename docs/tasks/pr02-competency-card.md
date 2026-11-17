# PR02 — approved competency cards

## Intent and authorization

Implement the user's 2026-11-13 request on `codex/pr02-competency-card`. This explicitly supersedes the implementation hold in `future-build-priorities.md`; it does not authorize a provider integration or an experiment. The repository currently has an unborn branch and untracked baseline files; do not stage or commit that baseline on the user's behalf.

Follow-up: the user subsequently configured an OpenAI key and requested the [local provider integration](pr02-openai-integration.md). That task supersedes the local-template runtime scope below; this record retains the earlier delivery evidence.

## Scope and acceptance

- The existing employer job editor accepts a pasted job description and proposes concrete criteria with questions about personal contribution. Clearly identify the deterministic local AI simulation; retain source, proposal and approved edits separately. Recruiters can add, remove and edit criteria and must explicitly approve before local publication. Editing the source or criteria revokes approval. Existing offers without a card retain their current flow.
- Candidates see the approved criteria, write their own examples and add optional material links/descriptions. Partial drafts survive save/reload and persona changes; submitted answers and approved criteria are immutable snapshots, independent of later job/profile changes. Keep legacy draft fields, consent and CV behavior.
- The employer sees each requirement beside its corresponding response, with readable stacked order on mobile. PR02 stage changes require a written reason, retained on failure and stored in employer-only event history. Preserve transitions, ownership, terminal states and scenario scores.
- Shared plain Zod schemas validate forms, operations and imports. Existing version-1 saves remain readable. No private text logging, remote requests, binary upload, candidate text generation or automatic assessment.
- Update FEATURES.md and relevant product documentation; run `./scripts/verify` and perform a separate review pass.

## Design mapping

Use the immutable Technologia po ludzku 1.1 reference: c08/c10/c20/c22/c25 and HP02/HP03/HP04/HP06. Reuse FormSection, Field, Input, Textarea, Button, Checkbox, ApplicationRecord and RecordSheet. The criterion editor and requirement/response comparison are host compositions with source-derived paper/card/ink, violet focus, sans text and technical mono metadata. Do not change shared tokens or reference assets. Compare source/editor/candidate/record at 1280/390/320px, including long/missing content, keyboard/focus, validation and recovery; exercise existing select/tab portals.

## Verification

`./scripts/verify` completed with exit 0 on Node v24.22.1, using the already provisioned Chromium headless shell selected through `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`. The final run passed formatting, lint, TypeScript, 33 host unit tests, 10 reference tests, all 50 browser journeys (15.2 seconds), the 120-journey baseline packet and the production build. The immutable active 177-file package, legacy 67-file inventory and reconstructed original 168-file inventory all passed integrity checks. No dependencies, browser binaries or OS packages were installed.

The build reports nonblocking Zod annotation warnings and the existing bundle-size advisory (>500 kB). The first browser launch was denied by the sandbox's loopback listener restriction; the authorized local rerun succeeded. The source preview command found port 8952 already occupied; source captures used the existing reference preview there.

An intermediate full gate found two legacy-draft regressions: ordinary drafts were gaining an empty `competencyResponses` property. The implementation now omits PR02 fields for ordinary drafts while preserving existing PR02 recovery data. Both original legacy tests pass unchanged. The focused recovery/regression run passed 8/8 before the final full gate.

### Executed coverage

- New unit tests cover description-derived proposals, source/approval/ownership validation, partial drafts, stale card revisions, duplicate/missing responses, persistence/import validation, immutable card/material snapshots, mandatory reasons and candidate withdrawal. Existing version-1 saves remain readable.
- The browser journey creates and edits a card through the actual form, checks approval revocation and first-invalid-field focus, adds/removes a criterion, publishes, follows the candidate-picker link to the correct form, saves/reloads a partial draft, submits examples/materials and records a reason. Tab switching retains the unsaved reason; successful mutation focuses the status; candidate rendering excludes the employer reason.
- Another journey replaces and removes a card after a draft exists. Prior examples remain recoverable, survive another save/reload and stay person-specific. Submission includes only current criteria, preserves hidden legacy fields and renders an executable-scheme material string as plain text.
- Editor, candidate form and recruiter comparison run at 1280/390/320px with a long unbroken requirement and absent materials. The tests check descendant and page overflow, runtime errors and a focused desktop axe WCAG-tagged scan. Existing shared callers, select/modal/tab keyboard behavior, terminal stages, storage denial/import/reset, CV continuity and reduced-motion journeys also pass.

### Visual evidence

Generated full-page source/host captures are in `artifacts/pr02/`:

- `source-editor-{1280,390,320}.png`, `source-candidate-{1280,390,320}.png`, `source-profiles-{1280,390,320}.png`.
- `editor-{1280,390,320}.png`, `candidate-{1280,390,320}.png`, `comparison-{1280,390,320}.png`.
- `comparison-sheet-{1280,390,320}.jpg` pairs the reference and host for visual review. `flow-editor-1280.png`, `flow-candidate-1280.png` and `flow-comparison-1280.png` show ordinary completed content.

Reviewed all three paired sheets and full-size mobile editor/candidate and desktop comparison/editor captures. The shared sans/mono hierarchy, paper/card surfaces, violet selection/focus, 12px grouping, existing controls and graphite record header remain consistent with HP02–HP04. The criterion fieldsets and two-column requirement/response layout are explicitly scoped host compositions; mobile stacks requirement before response. Source examples are anatomy references, not replacements for host operations.

### Separate review pass

After implementation, reviewed the modified domain/controller diff against saved pre-change files (Git has no baseline commit), then reviewed the new schemas, editor, response/comparison/recovery components, styles, tests and behavior-register changes. Corrected legacy-draft shape preservation, Base UI checkbox focus targeting and prior-example recovery. Shared Zod validation now covers decision reasons as well as criteria/submission. The final pass found no remaining blocker in scope; the final full gate ran after these corrections.

Durable lesson: optional workflow extensions should omit absent fields in legacy records, retain replaced draft content for recovery, and focus Base UI's actual interactive root rather than assuming its explicit ID belongs to that root.

## Delivery boundaries

FEATURES.md, BRIEF.md, the earlier priority note and the host record contract describe the implemented scope. AI remains an explicitly labeled deterministic local template with no model/provider integration; materials are links/descriptions, not transferred files. The optional card does not change existing scenario MatchScore or historical baseline data. No merge/commit, CI run, deployment, human usability experiment or full assistive-technology audit is claimed. The user's previously untracked baseline remains unstaged.
