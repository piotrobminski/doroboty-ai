# PR02 prototype walkthrough

[Watch the synthetic walkthrough](pr02-workflow.webm) (approximately 80 seconds, WebM/VP8, 1440 × 900).

The recording shows the recruiter entering a role description, reviewing proposed skills/questions, previewing and publishing; a candidate submitting personal examples and optional material references; and the recruiter opening the submitted application with an evidence hint and follow-up questions. Preview and Publish replace redundant approval checkboxes. Local templates simulate the AI-backed experience without provider calls or verified hiring assessments.

Reproduce locally with Node 24, a running development server on port 3001 and provisioned Playwright Chromium/ffmpeg: `node scripts/record-pr02-demo.mjs`. Set PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH for an alternative provisioned browser. The recorder uses an isolated browser context and never resets/imports into the user's scenario. Generated chapters, scenario exports and raw media stay under ignored artifacts/.

The historical teaching packet remains baseline-only; this repository-only demonstration and its generated records are not added to participant evidence.
