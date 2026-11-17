# PR02 — local OpenAI integration

## Intent and authorization

On 2026-11-13 the user configured a local API key and asked to continue connecting both recruiter AI actions to OpenAI. Work continues on `codex/pr02-competency-card`. This authorizes bounded live checks using synthetic role text. Never print, export, bundle or commit the key. Existing PR02 delivery evidence describes the earlier local-template implementation.

## Acceptance criteria

- Both description and criterion proposals call OpenAI through a server-only, loopback/same-origin endpoint during local development and preview. Read OPENAI_API_KEY from `.env.local` or the process environment; never expose it through VITE variables, state, browser responses, logs or participant packages.
- Validate requests and structured responses with shared plain Zod schemas; bound input, output, request time and concurrency. Do not transmit candidate data, browser state or CVs. No automatic request/retry on mounting, typing or failure.
- Show clear data requirements before disabled controls, actual pending/success/error states and retry/cancel recovery. Preserve recruiter edits and existing proposals on failures or stale responses. Generation does not imply human approval, replace approved descriptions automatically or change scenario scores.
- Keep version-1 local-template cards/imports readable and record real OpenAI provenance on new cards. Static hosting retains manual editing and honest AI-unavailable feedback; local preview provides the optional server endpoint.
- Use existing Technologia po ludzku controls, FormSection and HP03/HP06 recipes. Compare source/host at 1280/390/320px and exercise keyboard, pending/errors, stale results and other shared callers.
- Run deterministic server/client/browser tests without paid calls, then bounded live synthetic checks with the configured key, `./scripts/verify`, participant-package checks and a separate review. Update FEATURES.md and setup/architecture/security guidance.

## Implementation decisions

Use a small Vite Node middleware for dev/preview; there is no new database, login or remote hosting. Native server fetch calls the Responses API with strict JSON output and store:false. Default to the documented gpt-5-mini model; allow a server-only OPENAI_MODEL override. The optional endpoint is local development infrastructure, not an authenticated public API. Keep synthetic data and explicit recruiter approval.

## Verification and review

Implementation and deterministic verification are complete. Live generation is externally blocked by an exhausted OpenAI API credit balance; a successful model proposal has not been observed on this account.

### Commands and evidence

- Final `./scripts/verify`: exit 0 on Node v24.22.1 with the already provisioned Chromium selected via PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH. Formatting, lint, TypeScript, 50 host/server unit tests, 10 reference tests, the 120-journey baseline packet, production build and all 56 browser journeys passed (15.6 seconds for browsers). Both immutable reference inventories and reconstructed v1 hashes passed. No dependency/browser/OS installation occurred.
- Sixteen server tests use a fake provider and exercise strict inputs/output, same-origin/loopback boundaries, unsupported types/methods, oversized/extra fields, missing configuration, cancellation, concurrency/rate limits and redacted authentication/rate/billing/refusal/incomplete/invalid-response failures.
- Browser tests replace paid transports explicitly; the preview disables the real key with PROTOTYPE_AI_DISABLE=1. Tests cover disabled-input explanations, pending/cancel, keyboard focus, errors and retries at 1280/390/320px, preservation of prior/human content, stale responses, approval, OpenAI provenance and the unchanged full candidate/recruiter journey. The 320px case verifies the specific missing-credit message. Focused axe and all shared-route regressions pass.
- A pristine participant package was generated outside the repository and its hash manifest/baseline verified. The package includes server source and the empty .env.example, excludes .env.local/history/instructor materials, and contains no configured key. The build and package were scanned in memory against the configured secret without printing it. The local environment-file URL returned HTTP 403 and did not expose the secret.
- The local dev server was restarted on Node 24 at http://127.0.0.1:3001. GET /api/recruiter-ai reports configured=true and the model name only; it makes no provider call.

The build still reports the nonblocking Zod annotation and >500 kB bundle advisories. An intermediate gate caught an omitted client error-code declaration while adding the current billing code; the declaration and a browser regression were added and the final gate passes.

### Actual live result

Three explicit synthetic description-generation checks reached the provider. The first UI smoke and an intermediate diagnostic received HTTP 429 mapped to a general limit error. Official current documentation distinguishes newer billing error codes from the older insufficient_quota code; after implementing that mapping, the final diagnostic returned HTTP 429 / credits, corresponding specifically to credit_balance_exhausted. No automatic retry loop was used. These failures do not establish successful generation, model output quality or candidate/recruiter outcomes. The user must add API credits before a healthy live proposal and the live two-generator journey can be verified. There is no reason to resend or reveal the key.

Local evidence: artifacts/pr02-openai/live-verification.json, live-diagnostic.json, live-diagnostic-current-codes.json, live-error.png and package-verification.json. The live smoke stopped at the first failed generation and did not publish a job or transmit candidate/CV data.

### Visual review

Compared the unchanged reference HP03/HP06 profiles with updated editor pending/error/result states at 1280/390/320px. Full captures are artifacts/pr02-openai/{pending,error,editor}-{1280,390,320}.png; paired source/host contact sheets are source-host-{1280,390,320}.jpg, using the unchanged 1.1 source captures from the earlier PR02 task. Existing FormSection, Field, Base UI buttons/checkboxes and the HP03/HP06 help/status/error recipes are reused; no tokens, reference kit assets or source controllers changed. Long result content and missing state, cancellation, focus, shared select/tab/modal consumers and the revised settings/privacy text are covered by the full route suite. No human/assistive-technology audit or design approval is inferred.

### Separate review pass

Reviewed the changed controllers/configuration against saved pre-change snapshots, then separately reviewed server request boundaries, fixed upstream URL/secret loading, response parsing/redaction, cancellation/stale-result handling, approval provenance, legacy imports, tests and participant packaging. Tightened origin comparison to include the scheme, and updated error mapping from current official documentation rather than treating every HTTP 429 as a transient rate limit. A final pass found no remaining implementation blocker in scope. The unresolved live credit failure remains explicit.

Durable lessons: test suites must disable configured paid providers independently of browser mocks; billing and throttling share HTTP 429 but need different recovery; a passing mocked workflow cannot be reported as successful live generation.

## Sources and delivery boundaries

Primary documentation checked: [Responses structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs), [GPT-5 mini support](https://developers.openai.com/api/docs/models/gpt-5-mini), [current OpenAI error codes](https://developers.openai.com/api/docs/guides/error-codes), [server-side authentication guidance](https://developers.openai.com/api/reference/overview#authentication).

FEATURES.md, BRIEF.md, README.md, TODO.md, architecture, security, participant guidance, privacy/settings copy and the host record contract reflect the optional integration. Core data remains browser-local; no remote database/authentication, candidate answer generation, binary upload or automated assessment is added. Static hosting supports manual flows; configured generation requires local dev/preview. No merge/commit, deployment, CI result, live success or experiment outcome is claimed. The existing untracked baseline and local key are left unstaged.
