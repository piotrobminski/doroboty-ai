# Guided job composer and local contribution-question proposals

## Intent and scope

Implement the user-selected “Krok po kroku” direction from the reviewed form mockups. The recruiter first writes a general job description, then reviews suggested skills and personal-contribution questions one at a time, then previews and explicitly publishes. Default proposals run locally without an API key, credits or network requests. Provider mechanics are absent from the recruiter form. The optional existing OpenAI gateway remains isolated infrastructure, with its server tests retained.

Routes: /app/oferty/nowa and /app/oferty/:id. Preserve employer/company ownership, all existing offer terms and salary units, source/generated history, PR02 approval and application snapshots, candidate examples/materials and recruiter decision reasons. Use synthetic data only.

## Acceptance criteria

- Three accessible sequential steps: Stanowisko; Umiejętności i pytania; Podgląd. Validate before advancing and focus the first problem. Back/step navigation preserves input and does not publish.
- Propose up to three readable skills grounded in the actual description, with source excerpts and editable requirements/questions. Support selection, removal/addition up to six, and explicit human approval. Description changes require deliberate regeneration or retention/review of existing edits; no silent overwrite.
- Preserve existing offer fields, multiple existing locations, non-PLN/year/net salary semantics and source/generated history on edit. Preview shows actual selected questions/terms; publishing saves only approved selections with internal local provenance.
- No provider requests or technical mode labels in the composer. Work in static builds, with missing keys and offline. No candidate assessment is introduced.
- Recover in-progress employer form data on reload, scoped to person and offer, integrated into validated scenario export/import/reset. Old version-1 saves remain accepted.
- Compare approved mock/source and host at 1280/390/320px. Test keyboard/focus, empty/invalid/long data, deselection/editing/regeneration, reload, preview and the complete publication → candidate → employer-reason flow. Check shared fields/select portals and legacy offers.
- Update FEATURES.md and current setup/privacy docs; keep historical evidence and immutable design packages unchanged. Run ./scripts/verify, review the final diff separately and record actual evidence and limitations.

## Design mapping

Technologia po ludzku 1.1: HP02 PageTitle, HP03 FormSection, field/action/checkbox/selection families and source three-stage composer S11/S12/S15/S16. The approved guided single-skill composition is a host extension using existing React/Base UI owners, graphite actions, violet current-step/skill selection, paper/card/ink and sans/mono roles. No source controllers or demo fixtures enter product React.

## Implementation

- Replaced the former brief/generated-description/card/terms page with the approved three-step workflow. Description entry is direct; the optional summary uses the beginning of the description when empty. Existing source/generated/model history remains stored separately on edit.
- Added bounded local skill templates with exact source excerpts, plain explanations, editable questions and a generic fallback for unfamiliar work. No fetch or provider fallback exists in the composer. Explicitly negated requirements and benefit-only sentences do not select a specialist template.
- Kept the earlier server gateway and its injected-provider tests; removed the unused browser request hook and transport mocks. No key/configuration file was read or changed for this task.
- Added partial employer drafts to the optional version-1 state contract, with person/offer uniqueness and ownership, shared schemas and recovery after reload. Approval is reset on recovery. A successful publication removes only its matching draft. Legacy saves without this field remain accepted.
- Retained approved selections and original proposals in the existing PR02 domain operation. Candidate own examples/materials and employer reasons still use immutable application snapshots. Explicitly skipping all questions retains the ordinary application flow.
- Updated the behavior register, setup/architecture/security/participant/privacy content and host component/record contracts. Both immutable reference kits are unchanged.

## Visual and interaction evidence

Compared the approved wizard mock with the React host, and separately captured the frozen 1.1 create-job source and host at 1280/390/320px. Local pairs are under `artifacts/pr02-guided/review/source-{width}.png` and `host-step-{1,2,3}-{width}.png`; measurements are in `metrics.json`. Source/host fields both use Arial/Helvetica/sans, 7px radius and measured heights of 47px desktop / 50px narrow. The host deliberately retains its workspace navigation and actual company/offer data, uses the approved violet selection treatment and stacks steps/actions on narrow screens. Editable skill names and add/remove/skip controls extend the simplified mock to preserve existing human editing.

New browser checks capture each step at all three widths, test offline proposals with zero API/provider requests, selection, editing/approval revocation, reload, required-field and approval focus, preview/publish and preservation of existing EUR/year/net salary, multiple locations and source/generated history. The PR02 journey covers approved publication → candidate draft/reload/examples/materials/submission → recruiter comparison/reason → candidate-safe history. Long unbroken criteria and missing salary are covered across editor/candidate/recruiter views. Existing shared-control, portal, storage-error, import/reset, snapshot and cross-company regressions remain in the full suite.

A separate smoke pass used the running dev app on port 3001 and reference on 8952 with isolated browser contexts. It exercised the employer Base UI select with ArrowDown/End/Enter and focus return, captured the exact approved example at all widths and measured zero API requests and zero document overflow. It did not publish into a user's browser scenario.

## Verification and separate review

The first complete Node 24 `./scripts/verify` passed: 54 unit/server tests, 56 browser tests, 10 reference tests, formatting/lint/types/build, the 120-journey baseline packet and all immutable inventories (177 active, 67 legacy, 168 reconstructed v1 hashes). Early focused runs exposed duplicate accessible checkbox names, fixed by using the existing labelled-by pattern; one test assumed a particular third skill rather than the actual description-derived result and was corrected. No failing run is counted as acceptance.

The separate review compared changed files with `/private/tmp/doroboty-wizard-before` because this checkout has no baseline commit. Reviewed routes, Zod/data boundaries, draft ownership/export/reset, source-change recovery, selected/original criteria, old provenance, salary/location/history preservation and provider-call removal. Review added rejection of cardless later-step imports, revalidation of step-one details before preview, required-field semantics, nonempty OpenAI provenance for imported drafts and conservative handling of explicitly unnecessary skills. A final full gate after these corrections is recorded below.

Final gate after the separate review: Node 24 `./scripts/verify` passed again on 2026-11-13 (54 unit/server tests, 56 Chromium browser journeys in 25.2s, 10 reference tests, formatting, lint, types, packet and static build). The regeneration-confirmation journey also verifies focus reaches the new skill heading. `git diff --check` reported no whitespace errors; the checkout remains on `codex/pr02-competency-card` with its original uncommitted baseline. The dev app on port 3001 was confirmed reachable and the new workflow was exercised there without API calls.

Existing nonblocking build warnings concern Zod PURE comments and the >500KB bundle. Local Chromium checks and automated axe checks are evidence for these paths, not CI, deployment, a complete screen-reader/browser audit, real-model quality or recruiting outcomes. The local proposals use bounded keyword/template matching; human review remains necessary. No real provider generation was attempted and no paid requests were made.
