# Prototype — Delivery Register

BRIEF.md describes the current scope. Historical milestones remain in Git history; do not resume tasks from historical documents.

## Completed frontend migration

- [x] Replace Next/server execution with Vite, React and hash routes.
- [x] Move fixtures and state to JSON/React/versioned localStorage.
- [x] Preserve job/profile/application/employer UX with scenario AI and CVs.
- [x] Add validated import/export/reset and unavailable-storage recovery.
- [x] Remove external runtime requests, backend and database setup.
- [x] Update FEATURES.md, agent instructions, participant setup, checks and CI.
- [x] Distribute only baseline evidence without source history or future stages.
- [x] Run ./scripts/verify and mobile/desktop/keyboard checks.
- [x] Complete a separate review pass and record actual evidence in docs/tasks/frontend-only.md.

## Current extensions

- [x] Add the optional local OpenAI description/PR02-criteria gateway with server-only keys, shared schemas, human approval and deterministic tests. See docs/tasks/pr02-openai-integration.md. The completed frontend-migration entries above describe the earlier baseline.

- [x] Implement the approved guided job composer with browser-local skill/question proposals, scoped recoverable drafts and preview/human publication approval. See docs/tasks/pr02-guided-local-simulation.md. The provider gateway remains disconnected from the current composer.

- [x] Replace redundant composer approval checkboxes with Preview/Publish actions and add a local employer-only competency evidence hint with exact excerpts, follow-up prompts and a recorded synthetic walkthrough. See docs/tasks/pr02-evidence-insight-and-demo.md.

- [x] Add SQLite-backed scenario/accounts/sessions, preserve existing users with initial Test1234 passwords and replace persona selection with server-verified login. See docs/tasks/database-auth.md.

## Deliberate limitations

- Human research, course release approval and publishing a participant URL remain separate activities; passing code checks does not establish these outcomes.
