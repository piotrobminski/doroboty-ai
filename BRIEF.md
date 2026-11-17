# DoRoboty.ai AIPH3 — Prototype Brief

## Product

A forkable recruitment prototype for non-technical AIPH3 participants working with coding agents. This is separate from the public DoRoboty.ai production site.

## Primary outcome

A participant can start with Node.js 24 and npm, extend the prototype and test a coherent job → candidate application → employer decision workflow.

## Behavior

- Preserve Polish product UI, Build / Apply / Lead taxonomy, local assets and shared Base UI controls. New and changed UI follows the accepted Technologia po ludzku [design system](docs/design-system/README.md); adapt its visual roles within the requested scope while preserving the product contract. Installing the reference does not itself convert current application styling.
- Use prepared synthetic accounts. Candidates and employers authenticate by email/password and share one SQLite-backed scenario; the server enforces access by role and ownership.
- Provide operator-only reset, validated import/export and legacy browser-save recovery. Existing accounts and credentials survive scenario reset/import.
- Retain jobs, filters/list/map, companies, profiles, sample CVs, saved jobs, application drafts/submission and recruiting decisions.
- Candidates write their application answers directly; there is no candidate notes editor or AI proposal flow. Legacy candidate notes/generated text remain separate from approved answers in version-1 saves and imports, and are preserved when saving or submitting a resumed draft.
- The guided recruiter composer proposes optional PR02 competency cards locally without API access: recruiter edits role-specific criteria/questions and confirms their review by moving to preview, then approves publication by clicking Publish; candidates supply their own examples and optional material links/descriptions; recruiters compare the submitted criteria/answers and record a reason for each next step. Approved cards and responses are immutable application snapshots; the current composer sends no data to a provider. The employer receives a local, automatic textual-evidence hint with response excerpts and follow-up questions. This is decision support, not verified competence, a person ranking or an automatic recruiting decision. There is no binary upload. Existing local-template and OpenAI/model cards remain readable.
- Preserve employer source briefs separately from approved descriptions. UX demonstrations are not evidence of model quality or hiring probability.
- Keep submitted applications/CVs immutable while profiles and jobs evolve.
- Keep historical teaching evidence separate from locally created prototype records. The shipped stage is baseline only.

## Boundaries

OpenAI credentials remain in server-only local environment configuration and are excluded from static output and participant packages. Vite dev/preview includes the same-origin SQLite/session API; static assets alone cannot support authenticated persistence. Guided proposals still run locally and the optional provider gateway remains disconnected infrastructure. Runtime databases and sessions are never distributed.

## Learning

Participants investigate user needs, choose a solution, change the prototype and test it with a real person. The historical case distinguishes completed applications and text-based proxy scores from recruiting outcomes. Synthetic evidence does not establish product effectiveness.

Canonical original Polish materials in docs/source are historical instructor references, not setup instructions or participant package content.

## Success

Fresh checkout: npm ci → npm run dev. A complete workflow survives reload and server restart. Hash deep links work through the local app server. Import/reset/recovery and role/person-specific views behave consistently. ./scripts/verify passes and a separate review is completed.
