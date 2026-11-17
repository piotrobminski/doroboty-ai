@AGENTS.md

Read the repository instructions and current product contract before work. Keep durable task intent/acceptance/evidence in docs/tasks and review the actual diff before claiming completion.

## Required UI authority: Technologia po ludzku

All new and changed screens must use the complete local package at **docs/design-system/technologia-po-ludzku/**. This supersedes the earlier Poster People visual direction; the host now uses the new system across all routes, with legacy font/image imports removed.

Read [project integration](docs/design-system/README.md), [host implementation](docs/design-system/IMPLEMENTATION.md), [existing owners](docs/design-system/HOST-COMPONENTS.md), [acceptance checks](docs/design-system/VERIFICATION.md), then [agent design.md](docs/design-system/technologia-po-ludzku/agent-kit/design.md), [component contract](docs/design-system/technologia-po-ludzku/agent-kit/components.md) and relevant [human documentation](docs/design-system/technologia-po-ludzku/docs/design-system/v1/index.html#components). [GUI.md](GUI.md) summarizes the same rule. No global skill, previous chat or external source path is required.

Use Królewski fiolet #7B2CBF primary, lime #C2F970 secondary, warm paper, graphite, sans type and the approved alpha/angular human illustration. Neutral logo=company; small colored symbol=Build/Apply/Lead area; seniority is separate. Follow documented anatomy, spacing, responsive profiles and states, not just the palette. Treat source estimates/recommendations and I01–I08 decisions according to their stated status.

Preserve React/TypeScript/Vite, Base UI `render`, HashRouter URLs, Zod, actual scenario data and persistent workflows/snapshots. Adapt source roles into existing components/tokens; do not mount vanilla controllers/string renderers or replace local host operations with standalone demo behavior. The source has no MatchScore family; this does not authorize removing the host's existing scenario score.

From root: `npm run design-system:check` verifies integrity/source examples; `npm run design-system:dev` serves the new reference at port 8952, including /ui-examples.html, /ui-long-content.html and full listing/candidate/recruiter examples. Main app remains `npm run dev` at port 3001. Keep the new snapshot immutable, implement host changes in src/ and tokens.css, and preserve the immutable historical inventory.

For UI work compare 1280/390/320px and long/missing content; exercise keyboard/focus, errors, recovery and shared consumers/portals. Run `./scripts/verify`, update FEATURES.md for actual behavior changes and report what ran. [STATUS.md](docs/design-system/STATUS.md) distinguishes installed reference from runtime adoption. Documentation installation alone does not redesign the application or close old findings.

The user approved reference 1.1. Use [approved profiles](docs/design-system/technologia-po-ludzku/docs/design-system/v1.1/index.html), [profile examples](docs/design-system/technologia-po-ludzku/ui-host-profiles.html) and the [machine contract](docs/design-system/technologia-po-ludzku/agent-kit/host-profiles.json) alongside the original 25-family atlas. The frozen 1.1 manifest and preserved v1 reconstruction are both checked.
