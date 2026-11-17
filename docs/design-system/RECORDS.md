# Record sheets and process timelines — host components

These are existing functional APIs of the React host. Use the active **Technologia po ludzku** [project guide](README.md), [implementation rules](IMPLEMENTATION.md), [host catalog](HOST-COMPONENTS.md) and [status](STATUS.md). The redesign adapts their surfaces, type, tabs, header and timeline while preserving these APIs. Typography, palette and geometry for new visual work come from the active package, not the historical Poster People rules.

## RecordSheet

Owner: src/components/record-sheet.tsx; styles: src/app/records.css.

| Prop       | Contract                                                                                                                                                                       |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| label      | Accessible section and tab-list name.                                                                                                                                          |
| sections   | Nonempty array of unique `{ value, label, content }` entries. Labels are concise; content supplies its section heading and reading content. First section is initially active. |
| attachment | Optional persistent file row outside the changing panels.                                                                                                                      |
| children   | Optional integrated editor/supporting section, independent of panel mounting.                                                                                                  |
| footer     | Optional actions or terminal-state explanation.                                                                                                                                |

Use one outlined surface for related submitted materials, editing and decisions. The sheet includes a visually hidden H2 from its label; the application answer, submitted CV and recruiter note retain semantic H3 headings and associated textarea labels. Use sans reading headings, calm 12px cards, violet tab indicator and graphite record header. Do not wrap each section in another panel. Base UI Tabs owns selection, roving focus, arrows/Home/End and panel relationships; selection follows keyboard focus because all content is local; tabs compose the existing Button via `render`. Base UI owns active-panel mounting; an exiting panel may briefly remain inert during its lifecycle. Select panels by their accessible tab name in tests rather than assuming there is always exactly one panel node. Keep unsaved notes outside panels so switching tabs preserves them. Panels remain keyboard reachable. Long content wraps and retains line breaks; buttons wrap labels at small widths.

## CvAttachment

Owner: [cv-attachment.tsx](../../src/features/prototype/cv-attachment.tsx).

| Prop         | Contract                                                                                            |
| ------------ | --------------------------------------------------------------------------------------------------- |
| candidateId  | Required scenario candidate identifier.                                                             |
| fallbackText | Required full saved CV text; compare this snapshot with the fixture before choosing a prepared PDF. |
| layout       | `stack` (default) or `row`; both preserve the existing file actions.                                |
| preview      | Boolean, default false; embed the matching local PDF, otherwise render the complete custom text.    |
| contextLabel | Defaults to “CV z momentu aplikowania”; editable application uses “CV z Twojego profilu”.           |

CvAttachment's `layout="row"` supplies an unboxed icon, filename/context and existing local open/download links. Default `layout="stack"` preserves profile and submitted candidate-detail consumers; the editable application form uses the row composition. `contextLabel` describes the attachment context (default: submitted snapshot; the application form uses “CV z Twojego profilu”). Row-mode custom CVs retain their complete saved text. `preview` adds a titled, framed native PDF iframe beneath the file row, using the exact same local snapshot URL as the file links. Mount this composition inside the CV panel, not the persistent attachment slot: the Answer panel has no CV controls or viewer. Keep open/download links available when the browser cannot display an embedded PDF. No PDF parsing, remote viewer or dependency is added. Only a matching immutable fixture snapshot gets its prepared PDF; custom text snapshots with preview enabled get an explicit text descriptor and their complete text instead of an iframe. Never label a mismatched prepared PDF as the submitted CV.

## ProcessTimeline

Owner: src/components/process-timeline.tsx; styles: src/app/records.css.

`items` contains ordered `{ id, title, dateTime, content? }` records. Render a semantic ordered list, complete stage names, machine-readable time and optional preformatted note. The last recorded event has `aria-current="step"`. Dots and connecting lines are decorative. Supply actual events only, never future completed stages or invented dates. Callers enforce role boundaries before passing private notes.

## Shared application composition

[ApplicationRecord](../../src/features/prototype/application-record.tsx) composes the shared header, RecordSheet answer/CV snapshots, score and open history/summary margin. Props are `application` (explicit public snapshot fields), `companyName`, `audience`, projected `history`, optional `statusRef`, `answerSupport`, `children` and `footer`. The audience chooses role-title/candidate-name header context and the correct BackLink; it is presentation, not authorization. Controllers must apply the existing owner/company lookup first.

[CandidateApplication](../../src/features/prototype/candidate-application.tsx) projects each event to stage/date before passing history. It never supplies employer notes, source notes or generated drafts to reading panels or timeline. Its footer owns two-step withdrawal; confirm/cancel focus and surviving status focus follow the action. Terminal states omit actions. [RecruitingApplication](../../src/features/prototype/recruiting-application.tsx) supplies authorized employer history and owns its note editor and existing stage operations. Shared layout/snapshots must not be copied into another role-specific page.

For PR02 applications, the optional `competency` snapshot selects the shared `CompetencyComparison` inside the existing Answer tab. The guided composer now produces local-template cards; existing OpenAI/model cards remain readable. Optional sourceExcerpt/explanation fields ground proposals in the role description and do not assess candidates. Proposal generation never approves a card. The validated Preview action confirms question review; Publish confirms publication, replacing the redundant composer checkboxes. Each approved requirement/question is paired with the candidate-authored example and optional material references; columns stack below 600px. This is a host composition of c08/c20/c25 and HP04, not a new reference family. HTTP(S) material links are explicit navigation, not binary-upload/file controls. Both candidate and employer read the same immutable criteria/responses; employer reasons remain controller-projected event content.

The employer controller may provide CompetencyInsightPanel through answerSupport before the original requirement/response comparison. It automatically summarizes textual evidence coverage and offers exact quotations and follow-up prompts. This local heuristic is an employer-only decision aid; it is not verified competence or a new MatchScore. Candidate/ordinary records omit it. Native details retain keyboard/focus behavior; no external material is fetched, and the original answer/CV snapshots remain the reading authority.

Both roles preserve semantic H3 answer/CV headings, CV-only local preview/actions and complete custom-text fallback. The candidate view retains immutable submitted material even if the current profile changes. Candidate ownership checks and the user's existing local application IDs/data remain unchanged.

## Employer composition and states

Owner: src/features/prototype/recruiting-application.tsx. At wide widths, open history/summary margin sits left of a single sheet. At <=950px, materials precede history in both DOM and visual reading order; history and summary share two columns until <=600px, then stack. Header and actions wrap; narrow pages retain complete content at 320px. At Wojtek’s request the unchanged scenario Match Score is a noninteractive supporting-fact tag in the metadata row below the candidate name; the visible “Wynik przykładowy” caption is removed. The summary stays below history. This placement does not add automated assessment behavior.

PR02 records require a reason of at least 20 trimmed characters for each employer stage change; the shared domain operation and import schema enforce the same condition. Existing records retain optional notes.

Keep actual available transitions from `nextStages`. Notes append only on successful stage mutation and then clear; failure retains them. Move focus to the updated status after action buttons change, announce success politely and omit note/actions at terminal stages. Candidate and employer controllers share ApplicationRecord but retain their separate action and history-visibility boundaries. Preserve ownership checks before rendering this composition. A role label describes this scenario's UI visibility, not secure storage.

Validate keyboard tabs/focus, note retention, local PDF snapshot identity, custom/long imported content, terminal states, mobile order, role omissions and persistence. Run the project gate and compare real screenshots against the selected composition and source foundations. Test results do not establish human design acceptance.

## MatchScore

Owner: src/features/prototype/match-score.tsx; host styles: src/app/design-system.css; host tokens: tokens.css. `score` is a validated domain percentage (integer 0–100). Reuse this noninteractive pill in both role lists/details and employer header metadata. The percentage remains visible text; color is supplementary. Preserve the existing band boundaries: 0–39 red (#ff 6b 79), 40–59 orange (#ffb 15c), 60–79 yellow (#ffe 45b), 80–100 vivid green (#00c 853). All fills use ink text for contrast. Recalculated against current ink #171B19, opaque sRGB contrast is 6.32:1 red, 9.69:1 orange, 13.67:1 yellow and 7.78:1 green. These pair calculations do not replace a component accessibility audit. These are existing host-extension colors, not area-marker tones or newly approved global source tokens. The migrated treatment retains the model/thresholds, readable percentage and original band fills. Do not implement a second score renderer or equate a category marker with score. The underlying scenario score and summary remain unchanged.
