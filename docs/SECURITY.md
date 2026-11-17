# Prototype data boundary

The browser-local scenario has no real authentication or remote data store. Role-specific UI and local transition checks organize the scenario; anyone using the browser can inspect all stored data. Use synthetic data only.

No API keys, credentials, real CVs or private material belong in frontend source, JSON, localStorage or exports. Exports include private-in-the-UI source/recruiter notes.

Render imported text through React text nodes, validate imports with shared Zod schemas, reject unsupported versions, duplicate IDs, broken references and oversized files. Never overwrite an unreadable save automatically.

The employer-only competency evidence hint is computed locally from submitted criterion/response snapshots. It does not send candidate text, CVs, identity or protected attributes to a provider, fetch material links, log free text, rank people or mutate recruiting decisions. Persona projections organize visibility and are not confidentiality.

## Local OpenAI gateway

OPENAI_API_KEY is read only by the optional Node middleware in Vite dev/preview. Keep it in an untracked `.env.local` or process environment; never use VITE_* for a secret. Participant packaging uses an explicit allowlist that includes `.env.example` but excludes `.env.local`; the client build imports no server module or credential configuration.

The endpoint requires a loopback socket, local Host and matching Origin for POST. It accepts only validated recruiter job-text requests, caps payload/output/concurrency/rate/time and exposes fixed errors without raw upstream details. It does not accept candidate state/CVs or browser-provided credentials, model URLs or arbitrary provider prompts. There is no automatic retry, telemetry or free-text server logging. The Responses request sets store:false; the local server does not persist prompts/results. Provider processing policies still apply.

The current guided form never calls this endpoint, even with a configured key; proposals run locally. Any future provider reconnection requires an explicit transfer disclosure in the UI. Responses are untrusted proposals parsed with shared schemas and rendered as React text; human editing/approval remains mandatory. The local gateway is not an authenticated public API: a deployed integration would require its own server, secret configuration and access controls. Plain static hosting contains no key or working provider endpoint.
