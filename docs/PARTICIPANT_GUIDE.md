# Participant guide

## Start

Use the prepared baseline package and Node.js 24 with npm.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:3001. If Node or registry access is blocked by your organization, ask your instructor/IT rather than bypassing the policy.

## Try a complete flow

1. Choose Anna Kowalska and browse offers.
2. Save an offer, edit the profile and submit your own approved application answer.
3. Choose Karolina Wiśniewska for BrightLabs and review its candidates.
4. Record review, invitation, conversation and the next decision.
5. Return to Anna and inspect the application history.

Karolina and Tomasz see their respective companies in the interface; this is role simulation. Scenario records remain local and synthetic. CVs are prepared text examples, not real uploads. Scores and summaries simulate the scenario. The guided recruiter form proposes skills/questions locally without contacting a provider; candidates write their own answers.

## Guided recruiter form

Use synthetic descriptions. In step one, enter the general description (minimum 30 characters), title and terms. Step two suggests skills and personal-contribution questions from that description. Edit, add/remove or skip questions, review each and continue to preview to confirm the review. Step three shows the offer and selected questions; clicking Publish confirms publication. These two actions replace the former approval checkboxes. No API key, credit balance or network connection is needed to prepare proposals. This simulates the experience, not model quality.

The form saves progress per recruiter/offer; reload restores text and selected questions and requires approval again. Changing the description preserves your edits until you choose to retain/review them or confirm replacement. Export/import/reset includes partial forms. Candidates still write their own examples and materials; recruiters record the reason for each next step. In the employer Answer tab, the local AI-style hint summarizes textual evidence per requirement, quotes the response and suggests what to clarify. Review the full answer: it does not verify skills or facts and does not make the decision. CVs and linked materials are not analyzed.

The earlier server gateway remains disconnected from the form. Existing keys stay private and unused by this workflow; see [technical setup](../README.md#optional-recruiter-ai).

## Save, share and recover

Changes survive reload in this browser. Settings can export a JSON file, import a scenario or reset to fixtures. Import/reset asks before replacing state. If a save is incompatible, download the original before resetting. Storage failure is shown explicitly; export before closing the tab. Use one editing tab at a time.

A URL shares the interface, not your local changes. To transfer a scenario, share the exported file and import it in the other browser. Exports include all personas, applications and notes; never enter real personal data.

## Static build

Run npm run build. Serve dist/ through any static HTTP host. No provider account is needed for the complete guided local-proposal workflow. A plain static host does not include the optional disconnected OpenAI gateway. Do not open index.html via file://; ES modules need HTTP. Hash links work without route rewrite configuration.

## Verification

Run ./scripts/verify or npm run check. Browser tests require provisioned Playwright Chromium; a missing test browser does not prevent npm run dev. Do not let an agent install system dependencies automatically.
