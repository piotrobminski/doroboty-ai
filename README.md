# DoRoboty.ai — AIPH3 prototype

A SQLite-backed job marketplace for participants to extend and test, with local recruiter-question proposals and an optional, disconnected OpenAI gateway. Built with React, TypeScript and Vite, using Base UI components. The required visual direction for new and changed screens is the accepted **Technologia po ludzku** design system.

## Design system — start here for UI work

**Build all new and changed screens from Technologia po ludzku.** Start with [project integration](docs/design-system/README.md), [host mapping](docs/design-system/IMPLEMENTATION.md), [existing owners](docs/design-system/HOST-COMPONENTS.md) and [acceptance checklist](docs/design-system/VERIFICATION.md), then [design.md](docs/design-system/technologia-po-ludzku/agent-kit/design.md), [component contract](docs/design-system/technologia-po-ludzku/agent-kit/components.md) and the [25-family human documentation](docs/design-system/technologia-po-ludzku/docs/design-system/v1/index.html).

The complete 177-file 1.1 agent package is checked in at docs/design-system/technologia-po-ludzku/: original source styles/modules, assets, illustration/logo examples, runnable screens, source screenshots and verification. No other chat or global skill is required. The required direction is Królewski fiolet #7B2CBF, secondary lime #C2F970, warm paper/graphite, sans typography and the alpha/angular human collage. Company and area markers have separate meanings.

```sh
npm run design-system:check
npm run design-system:dev
```

Use Node 24; no installation inside the kit is needed. The preview serves at http://127.0.0.1:8952/ui-examples.html. Also inspect /ui-long-content.html, /, /job.html?id=forma-ai-product-designer and /create-job.html. Use `UI_KIT_PORT=8953` for a conflict. Main product development remains port 3001.

Adapt the reference into the existing React/Base UI components and host tokens while preserving hash routing and application behavior. Do not paste the vanilla controllers, global reset or fixture state into React. The current React host implements the new system; the old Poster People kit is retained for compatibility/history, not as an alternative new-screen target. Root AGENTS.md, CLAUDE.md and GUI.md enforce the same instruction.

[Integration status](docs/design-system/STATUS.md) records the whole-application migration and the accepted 1.1 release and separate application audit. Each UI task still needs actual source/host comparison, relevant state/keyboard checks and `./scripts/verify`.

## Run

Requirements: **Node.js 24 and npm**.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:3001. The local server creates `.data/doroboty.sqlite` automatically. No database service, environment file or provider account is required. Package installation requires access to the npm registry.

Log in using one of the prepared accounts below. Publish a job, apply, switch accounts and record the employer decision. Changes persist in SQLite across browser reloads and server restarts. The operator settings provide confirmed export/import/reset and migration of previous browser saves. Scores and summaries remain fixed scenario examples. The guided job composer proposes questions locally, with no API key or credits. Use synthetic descriptions and example CVs only.

## Prepared accounts and database

Every existing account starts with password **`Test1234`**:

| Person              | Login                               |
| ------------------- | ----------------------------------- |
| Anna Kowalska       | `candidate-anna@doroboty.test`      |
| Marek Nowak         | `candidate-marek@doroboty.test`     |
| Karolina Wiśniewska | `employer-brightlabs@doroboty.test` |
| Tomasz Zieliński    | `employer-northstar@doroboty.test`  |
| Prowadzący          | `operator@doroboty.test`            |

Account identifiers, roles, company assignments, profile fields and CVs are preserved. Login uses salted scrypt hashes and an opaque HttpOnly/SameSite session cookie, expiring after 12 hours; logout revokes the session. Shared initial passwords are for this synthetic teaching prototype. There is no registration or password recovery flow.

The ignored `.data/` directory holds the database and WAL files; never commit or distribute it. `DATABASE_PATH` can select a different persistent path. Set `AUTH_SECURE_COOKIE=1` for an HTTPS origin; local HTTP uses the default. Options can be set in `.env.local` or the process environment. Restart never resets hashes or scenario records.

The server is authoritative. Clearing browser storage signs out the user but does not delete the scenario. A previous `doroboty.prototype.v1` save stays untouched; the operator can download or explicitly import it in Settings after reviewing it. Import/reset affect the shared database, preserve existing account IDs/roles/memberships and never import/export passwords or sessions. Reset retains account profiles. For a scenario backup, use operator export; for an exact SQLite backup, stop the server before copying the `.data/` directory and restore it with the server stopped.

## Guided recruiter proposals

Create an offer in three steps: describe the role and terms; review suggested skills/questions; preview and approve publication. Local templates use the actual description and show source excerpts. Edit, add/remove or skip questions. Moving to preview confirms their review; clicking Publish approves the offer. There are no additional approval checkboxes. No provider API key or credits are needed. The local app server is required for persistence and publication. These proposals simulate the experience; they do not demonstrate model quality or assess candidates.

Partial forms are stored per recruiter and offer within the scenario. Reload restores text and selection, requiring review again. Export/import/reset includes these drafts. Existing source briefs, generated descriptions and model provenance are preserved on edit without being presented as new approved content.

For submitted competency-question applications, the employer sees an automatic local evidence hint in the Answer tab: requirement-by-requirement statuses, exact answer excerpts and follow-up questions. It compares the submitted text, not verified ability, and leaves the next-step decision/reason with the recruiter. It does not analyze CVs, open materials, rank people or change the fixed scenario MatchScore. No provider request is made.

## Optional recruiter AI

The existing server-only `/api/recruiter-ai` gateway remains available for future integration, but the current form never calls it, even when a key is configured. Keep an existing `.env.local` private. Do not paste keys into chat, browser fields, source or a `VITE_*` variable. [.env.example](.env.example) contains empty/sample values only. OPENAI_API_KEY and optional OPENAI_MODEL (default gpt-5-mini) are read only by Vite's Node middleware in local dev/preview; no key enters dist/ or participant packages.

The gateway accepts bounded loopback/same-origin job-text requests and validates structured output. It is not a public authenticated service. Reconnecting a provider to the UI requires an explicit product change and transfer disclosure; local proposal generation has no paid fallback.

## Build and verify

```sh
npm run build
npm run preview
./scripts/verify
```

The frontend output is dist/. Run `npm run preview` (or `npm start`) to serve it with the SQLite/auth API. Serving dist/ alone does not provide login or persistence. Automated browser checks explicitly disable the real key and exercise the local proposals, including offline behavior; server tests inject a fake provider. They make no paid API calls. Browser checks require an already provisioned Playwright Chromium; starting the app never installs it. See [participant guide](docs/PARTICIPANT_GUIDE.md), [architecture](docs/architecture.md), [current features](FEATURES.md) and [case protocol](docs/case/CASE_PROTOCOL.md).

To distribute a baseline participant package, run npm run package:participant -- /absolute/output/directory. This excludes Git history and instructor source material. Never distribute this repository’s history as a stage-safe packet.

For an already provisioned alternative Chromium, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/absolute/path/to/executable` when running `./scripts/verify`. The default continues to use Playwright's provisioned browser; this option never downloads or installs browsers.

The [1.1 documentation](docs/design-system/technologia-po-ludzku/docs/design-system/v1.1/index.html) and [profile gallery](docs/design-system/technologia-po-ludzku/ui-host-profiles.html) are part of the frozen reference. With the local app and reference servers running, `npm run audit:design-system -- after` reproduces the source/host measurements using an already provisioned Chromium.
