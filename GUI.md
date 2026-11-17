# GUI — DoRoboty.ai / Technologia po ludzku

**Build every new or changed screen from the local Technologia po ludzku design system.** The previous Poster People visual guidance is inactive. The current React host uses the new foundation across all routes; [status](docs/design-system/STATUS.md) records scope and evidence.

Read in order:

1. [Project integration](docs/design-system/README.md), [host implementation](docs/design-system/IMPLEMENTATION.md), [existing React owners](docs/design-system/HOST-COMPONENTS.md) and [acceptance checklist](docs/design-system/VERIFICATION.md).
2. [Agent design.md](docs/design-system/technologia-po-ludzku/agent-kit/design.md) and [component contract](docs/design-system/technologia-po-ludzku/agent-kit/components.md).
3. Relevant [designer documentation](docs/design-system/technologia-po-ludzku/docs/design-system/v1/index.html#components), its source captures and [open issues](docs/design-system/technologia-po-ludzku/docs/design-system/v1/index.html#issues).
4. [Record APIs](docs/design-system/RECORDS.md) when touching candidate/employer materials; [status](docs/design-system/STATUS.md) before claiming adoption or finding closure.

From root: `npm run design-system:dev` serves the complete reference on port 8952. Start with `/ui-examples.html`; also inspect `/ui-long-content.html`, the listing, candidate and recruiter pages. `npm run design-system:check` verifies the active package and examples. No global skill or extra kit dependencies are required. The product remains on port 3001.

Preserve Królewski fiolet #7B2CBF as primary, lime #C2F970 as secondary, warm paper, graphite and calm cards. Use Arial/Helvetica/sans headings/body with technical mono labels; the new target does not require Geist Serif. The approved image has alpha and angular collage edges. Large neutral icon=company; small colored marker=Build/Apply/Lead area; seniority is separate text.

Adapt source anatomy/type/state into existing React/Base UI primitives, `render` composition and host tokens. Keep HashRouter, slugs/IDs, Zod operations, real local teaching workflows, CV/application snapshots and persistent state. Do not mount vanilla controllers/string HTML, substitute demo companies/jobs or import the global source reset into React. Existing MatchScore is a host feature; do not delete it merely because the standalone reference has no score family.

Keep the new package byte-identical. The older kit remains immutable historical material; its runtime font/image consumers have been migrated. Write adaptations in src/ and the host theme layer. Record gaps and new host-only compositions explicitly. Compare 1280/390/320px, long/missing data, errors, keyboard/focus, portals and recovery, then run `./scripts/verify`. Installation and green reference checks alone do not establish visual adoption.

The user approved reference 1.1. Use [approved profiles](docs/design-system/technologia-po-ludzku/docs/design-system/v1.1/index.html), [profile examples](docs/design-system/technologia-po-ludzku/ui-host-profiles.html) and the [machine contract](docs/design-system/technologia-po-ludzku/agent-kit/host-profiles.json) alongside the original 25-family atlas. The frozen 1.1 manifest and preserved v1 reconstruction are both checked.
