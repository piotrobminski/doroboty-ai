# PostHog wizard setup

## Intent

Run `npx -y @posthog/wizard@latest` in the DoRoboty.ai teaching prototype. If the wizard cannot complete, connect the prototype using the documented PostHog event API.

## Acceptance criteria

- Keep analytics limited to synthetic prototype flows. Exclude private free text, account details, credentials, and case evidence from telemetry.
- Preserve authentication, role and ownership checks, and the standalone browser demo. Keep the prototype usable when analytics is unconfigured or unavailable.
- Review the integration diff, update affected behavior entries in `FEATURES.md`, and run `./scripts/verify`. Record the actual verification result.

## Implementation

PostHog sign-in succeeded. Wizard 2.94.0 reported `PHW_AGENT_ORCHESTRATOR_SKILL_VARIANT_MISSING` with React Router. The npm release age setting prevented installation of 2.96.0, and the automatic approval review rejected another wizard run because it would send source files to Anthropic and OpenAI. The server connects directly to the [PostHog capture API](https://posthog.com/tutorials/api-capture-events) using the configured project's write-only token.

The integration sends event counts after successful authorized writes. Each payload contains a fixed event name, source name and random event identifier. Person processing and geolocation are disabled. Delivery is best effort with a three-second timeout and eight concurrent requests at most. It does not affect the API response or use the browser, historical case data, or participant configuration. The privacy page retains the existing HP02 PageTitle and text layout with a Polish disclosure for the server-backed prototype.

## Review and verification

- Configured the PostHog EU project token in ignored `.env.local`. Using a temporary SQLite database, a synthetic application submission returned HTTP 200 from the prototype and HTTP 200 with `status: "Ok"` from PostHog. The `application submitted` event was visible in PostHog Events. The temporary database was removed.
- Reviewed the diff for role checks, the order of persistence and capture, the event payload, and configuration boundaries. The production HTTP test verified that rejected and repeated submissions send nothing, accepted submissions send only the expected fields, and a PostHog outage does not affect the response.
- `./scripts/verify` on Node.js 24.14.0 passed formatting, design system inventory and 10 reference tests, lint and type checks. Its unit test stage passed 86 tests and failed three unchanged migration/import tests in `server/database-migrations.test.ts` with a relational round-trip integrity error. The same migration test file passed all 12 tests on Node.js 26.13.0 in isolation. The Node.js 24 gate remains unsuccessful.
- The baseline check, Vite build, production archive and participant package passed separately. The configured token is absent from the production and static outputs, and the participant package excludes `.env.local`. The integration endpoint is present only in the server bundle.
- All 72 server browser journeys and seven static demo journeys passed with the existing provisioned Chromium binary selected explicitly. The installed Playwright default expected a newer binary. The privacy page matched HP02 heading typography at 1280, 390 and 320 pixels, reflowed without horizontal overflow, and retained visible keyboard focus. The full journey suite also exercised long and missing data, portals, errors and recovery.

Before merge, the project setting `Enable autocapture for web` was confirmed on in PostHog EU. The application uses server-only event capture. It has no browser SDK and does not emit `$autocapture` events. The Node.js 24 migration failures above were addressed separately in [the SQLite text round-trip task](sqlite-text-round-trip.md).
