# Action-based approval, competency evidence hint and recorded walkthrough

## User intent and acceptance

Remove the redundant review checkboxes in composer steps two and three. A validated transition to preview confirms review of the selected questions; the final Publish action approves publication. Retain approval provenance, source-change/invalid-field protection and immutable application snapshots. Keep the skill-selection and candidate-consent checkboxes.

For employer-owned PR02 applications, automatically prepare an AI-style decision-support hint comparing the submitted requirements/questions with the candidate's own examples. Continue the previously requested browser-local simulation without API credits or provider calls. Show a per-requirement evidence status, exact response excerpts and a follow-up question. Summarize textual coverage; do not claim verified skills, hiring probability, rank candidates, change the existing fixed MatchScore or make recruiting decisions. The recruiter must read evidence and record their own next-step reason. Candidate/CV/identity/protected attributes, current profile/job edits and external linked materials must not influence the analysis. No hint for ordinary applications or in candidate projections.

Record a short continuous real-browser demonstration: select recruiter, type a synthetic role description, review proposed skills, preview and publish; switch to candidate and submit own examples/materials; switch back to recruiter and open the submitted application with the new hint. Use an isolated browser scenario, never reset or overwrite the user's current browser data. Deliver a playable local video and preserve the synthetic demo scenario for optional inspection.

## UI and data boundaries

Routes: /app/oferty/nowa, /app/oferty/:id, /aplikuj/:slug and /app/kandydaci/:id. Work on existing codex/pr02-competency-card branch. Technologia po ludzku 1.1 HP02/HP03/HP04 and c08/c20/c25: reuse PageTitle, FormSection, Base UI controls and the existing RecordSheet Answer tab. Add one employer-only support region inside that tab, with violet metadata, neutral status text and readable evidence. Keep reference packages immutable. All state changes continue through existing Zod/domain operations; the derived local hint accepts only the submitted competency snapshot and is not a new score.

## Verification plan

- Unit checks for topical/partial/unrelated/missing/negative answers, exact evidence, stable snapshot-only analysis, no identity/CV/material-fetch inputs and no mutation.
- Browser checks for checkbox removal, action-based review/publish, validation/focus and stale-description recovery; automatic hints, weak/missing/long data, candidate/legacy/company boundaries, tab/reload stability and reason requirement.
- Source/host comparisons at 1280/390/320px; keyboard/focus, errors/recovery, shared callers and local video playback/extracted frames. Assert no API calls during the complete recorded flow.
- Update FEATURES.md and current product/architecture/participant/record documentation. Run ./scripts/verify and a separate diff review, recording actual results and limitations.

## Results

Implemented the requested action-based approvals and employer evidence hint. Validated Preview records review in the existing internal card flag; final Publish supplies approval identity/time. Invalid questions and changed descriptions still block advancement and focus the repair control. Skill selection and candidate consent are unchanged. No domain scoring/stage or storage schema changed.

The employer controller provides one support region through ApplicationRecord.answerSupport in the existing Answer tab. The pure local analysis uses submitted criterion/response arrays, basic Polish normalization/synonyms and related first-person-action/outcome indicators. It returns described/partial/unclear evidence, exact excerpts (maximum 450 characters), coverage counts and follow-up prompts. It does not infer actual ability, generate a hiring decision, alter MatchScore, read CV/identity or fetch materials. Candidate, ordinary and other-company views omit it. Existing next-step reason validation remains mandatory.

### Executed verification

- Six new unit checks cover described/partial/unrelated/missing/negated answers, exact ID-matched quotations, immutable/deterministic results, material independence, equivalent first-person forms, bounded long input and untrusted instructions. Added review assertions that a year/headcount alone is not an outcome and an unrelated personal action cannot establish relevant contribution.
- Five new browser journeys exercise employer hints at 1280/390/320px, keyboard disclosure/focus, reload and tab stability, current-job/profile independence, no material/provider fetches, required human reasons, candidate/legacy/other-company omissions and long unbroken data. Existing composer/journey tests now verify implicit review on Preview and publication without the two removed checkboxes.
- Focused 20-journey browser run passed. First full Node 24 ./scripts/verify passed 60 unit/server checks, 61 browser journeys and 10 reference checks. After the separate review corrections, the full gate passed again: 61 browser journeys in 30.8s plus formatting/lint/types, all 60 unit/server checks, the 120-journey baseline packet and static build. Active 177-file, legacy 67-file and reconstructed-v1 168-file inventories remain intact. Build retains the existing nonblocking Zod PURE-comment and >500KB warnings.
- Inspected the actual desktop employer screenshot and compared the existing approved composer/source anatomy with current fields/surfaces. The added region is an HP04/c20/c25 host extension: 12px card, paper surface, violet identity, readable neutral status text and native keyboard details; it does not introduce a competing score palette. New source/host evidence includes artifacts/pr02-insight/record-{1280,390,320}.png and long-320.png, plus updated artifacts/pr02-guided step captures. Automated axe checks pass at desktop; this is not a complete assistive-technology audit.

### Separate review

Reviewed the changed files against /private/tmp/doroboty-insight-before because this checkout has no baseline commit. Checked real step transitions and error focus, internal approval invalidation/recovery, snapshot-only inputs, exact-quote extraction, optional employer-only composition, candidate/legacy callers, unchanged decisions/MatchScore, no fetch/logging, bounded strings and recording isolation. Review narrowed outcome detection and bound personal actions to related sentences; those corrections passed the final gate. git diff --check reports no whitespace errors. No merge, CI, publishing or paid provider call is claimed.

### Recorded walkthrough

scripts/record-pr02-demo.mjs records genuine UI typing/clicking in a fresh Chromium context on port 3001, using the provisioned browser and ffmpeg. It does not reset or import into the user's browser. Temporary chapter captions belong only to the recording context. The continuous video shows role-description entry and actual terms, all three proposed skills, Preview/Publish without redundant checkboxes, candidate examples/materials/consent/submission, return through the Kandydaci list and the employer evidence hint with quotations and a partial-answer follow-up, then the original requirement/answer comparison. It leaves recruiting decisions to the human.

Local deliverables: artifacts/pr02-demo/pr02-workflow.webm (1440×900, VP8/WebM, 25fps), chapters.json, synthetic scenario.json and reviewed frames. The first take completed with zero API/material requests and zero page errors. A final take improves scrolling so the expanded answer quotations are fully visible. Final playback evidence is recorded after completion below.

Final recording completed successfully with eight chapter captions, zero API/material requests and zero page errors. Chromium loaded and decoded the WebM, sought to the employer-review segment and advanced playback without a MediaError (duration 79.56s, 1440×900, VP8 support reported “probably”); artifacts/pr02-demo/playback.json records these measurements. Inspected decoded frames for proposed skills, candidate answer entry and the final employer hint, including fully visible exact quotations in frame-67-final.png. The file is about 6.6MB. The isolated recording scenario is available as JSON but was not imported into the user's browser.

The local heuristic is a prototype simulation, not real model inference or validation of candidate competence. Textual overlap, action/result phrases and synthetic observations cannot establish recruiting effectiveness. The earlier provider gateway/key remains untouched and disconnected.
