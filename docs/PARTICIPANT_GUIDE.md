# Participant guide

## Start

Use the prepared baseline package and Node.js 24 with npm.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:3001. If Node or registry access is blocked by your organization, ask your instructor/IT rather than bypassing the policy.

## Try a complete flow

1. Log in as Anna Kowalska (`candidate-anna@doroboty.test`) and browse offers.
2. Save an offer, edit the profile and submit your own approved application answer.
3. Log in as Karolina Wiśniewska (`employer-brightlabs@doroboty.test`) for BrightLabs and review its candidates.
4. Record review, invitation, conversation and the next decision.
5. Log back in as Anna and inspect the application history.

All prepared accounts use initial password `Test1234`; see the [account list](../README.md#prepared-accounts-and-database). Karolina and Tomasz receive only their companies’ applications. Scenario records remain synthetic and are stored on the local app server in SQLite. CVs are prepared text examples, not real uploads. Scores and summaries simulate the scenario. The guided recruiter form proposes skills/questions locally without contacting a provider; candidates write their own answers.

## Guided recruiter form

Use synthetic descriptions. In step one, enter the general description (minimum 30 characters), title and terms. Step two suggests skills and personal-contribution questions from that description. Edit, add/remove or skip questions, review each and continue to preview to confirm the review. Step three shows the offer and selected questions; clicking Publish confirms publication. These two actions replace the former approval checkboxes. No API key, credit balance or network connection is needed to prepare proposals. This simulates the experience, not model quality.

The form saves progress per recruiter/offer; reload restores text and selected questions and requires approval again. Changing the description preserves your edits until you choose to retain/review them or confirm replacement. Export/import/reset includes partial forms. Candidates still write their own examples and materials; recruiters record the reason for each next step. In the employer Answer tab, the local AI-style hint summarizes textual evidence per requirement, quotes the response and suggests what to clarify. Review the full answer: it does not verify skills or facts and does not make the decision. CVs and linked materials are not analyzed.

The earlier server gateway remains disconnected from the form. Existing keys stay private and unused by this workflow; see [technical setup](../README.md#optional-recruiter-ai).

## Save, share and recover

Changes survive reload and server restart. Startup automatically migrates older databases to relational tables after creating a private SQLite backup; an unsuccessful migration leaves the previous database intact. Migration backups contain account/session data and must not be shared as scenario exports. Operator settings can export a JSON scenario, import one or reset scenario records. Import/reset asks before replacing the shared scenario; accounts and passwords are retained. Previous browser saves are left untouched and can be downloaded or explicitly migrated by the operator. Failed server writes preserve form input for retry. Use one editing tab at a time.

Browsers connected to the same server share the scenario subject to account access. To transfer it to another server, the operator exports/imports the JSON file. Exports include all profiles, applications and notes, but no passwords/sessions; never enter real personal data.

## Local build

Run `npm run build` followed by `npm run preview` (or `npm start`). The same server serves dist/ and the database/auth API. Static hosting alone cannot support this version. No provider account is needed for the complete guided local-proposal workflow. A plain static host does not include the optional disconnected OpenAI gateway. Do not open index.html via file://; ES modules need HTTP. Hash links work without route rewrite configuration.

## Verification

Run ./scripts/verify or npm run check. Browser tests require provisioned Playwright Chromium; a missing test browser does not prevent npm run dev. Do not let an agent install system dependencies automatically.
