# Working on DoRoboty.ai Case

This is an AIPH3 teaching prototype, separate from the public production portal.
Read BRIEF.md, docs/case/CASE_PROTOCOL.md, TODO.md and relevant FEATURES.md entries before product work.

## Start and boundaries

- Participant setup: Node.js 24, npm ci, npm run dev (http://127.0.0.1:3001).
- Role selection is a simulation, not security.
- Share plain Zod schemas between forms and domain operations.
- Preserve human editing and approval. Use synthetic data only.
- Keep historical case evidence separate from prototype state. Include only baseline in participant packages; source history and instructor materials must not be distributed.

## Workflow

1. Record intent and acceptance criteria in docs/tasks/ for changes larger than one line.
2. Do not let multiple agents write in one worktree.
3. Implement and run ./scripts/verify before claiming completion; explain actual failures.
4. Perform a separate review pass before merging. Record durable lessons when useful.

## Product behavior register

FEATURES.md describes current behavior, not a roadmap. Update it in the same change/commit for added, changed, removed or simulated flows. Preserve stable IDs, route/role/data boundaries and source/test references. Do not equate source coverage with an executed test or deployment. For changes without behavioral impact, record that the register was reviewed and did not need updating.

## Required design system — Technologia po ludzku

For every new or changed screen, use **Technologia po ludzku**, the active system installed locally in [docs/design-system/technologia-po-ludzku/](docs/design-system/technologia-po-ludzku/). Read [project integration](docs/design-system/README.md), [host implementation](docs/design-system/IMPLEMENTATION.md), [host owners](docs/design-system/HOST-COMPONENTS.md) and [acceptance checklist](docs/design-system/VERIFICATION.md), then [design.md](docs/design-system/technologia-po-ludzku/agent-kit/design.md), [component contract](docs/design-system/technologia-po-ludzku/agent-kit/components.md) and relevant [human reference cards](docs/design-system/technologia-po-ludzku/docs/design-system/v1/index.html#components). [GUI.md](GUI.md) is the short entry point.

This replaces Poster People as the visual authority. The old kit remains for history only; runtime consumers now use the new host adaptation. Do not restore pink/serif styling as the target for new UI. The complete 177-file 1.1 package includes all CSS/modules/assets, source screenshots,25-family documentation and runnable listing/candidate/recruiter examples. No external chat, global skill or authoring-machine directory is needed.

Preserve the hierarchy: Królewski fiolet #7B2CBF primary, lime #C2F970 secondary, paper/card/ink, sans headings/body, technical mono detail, approved alpha/angular human collage. Use C markers: neutral company identity + small colored area marker; experience stays separate. Exact source imports/roles, declared differences and I01–I08 decisions are documented in the kit.

Adapt the source anatomy and states into this project's React/TypeScript/Vite, existing Base UI `render` primitives and host tokens. Do not import vanilla controllers, fixtures, global reset or HTML string renderers into product React. Preserve hash routes, real host data, Zod, localStorage, role/person boundaries, application/CV snapshots and employer workflows. Source demo-only behavior does not replace functional host operations; keep existing host MatchScore semantics as an explicitly documented extension.

Run `npm run design-system:dev` for the standalone reference on port 8952 (start at /ui-examples.html); `npm run design-system:check` verifies its complete inventory, compatibility assets and source examples. Keep the new kit immutable; implement product changes in src/ and the host token layer. Runtime legacy font/image imports have been migrated; preserve both immutable reference inventories. Read [STATUS.md](docs/design-system/STATUS.md): installing a reference does not itself redesign or validate the app.

For each UI task compare source/host at 1280/390/320px, include long/missing data, and test focus/keyboard, states, errors, recovery and affected portals/shared callers. Run `./scripts/verify`, review the diff and report actual evidence. The kit's original verification is not acceptance of a new React screen.

## Standards

- Code, comments and authored engineering documentation are English; end-user UI and canonical AIPH source wording are Polish.
- Use npm, Node.js 24 and package-lock.json. No second package manager.
- Features belong in src/features; src/components/ui contains shared Base UI primitives.
- For UI changes follow GUI.md and docs/design-system/README.md; use the active Technologia po ludzku design system with the existing Base UI components and render composition API. Do not restore the removed theme guides or require global design skills.
- Use React Router hash routes.
- Never log private free text or introduce secrets into the frontend.

## Validation

- npm run check verifies formatting, lint, types, unit tests, static build and browser journeys. ./scripts/verify runs the same gate.
- npm run dev never installs browser binaries or system tools. Browser tests require a provisioned Playwright Chromium; if missing, report it. Do not install OS dependencies automatically.
- Check mobile/desktop, keyboard access, error states and data recovery.
- Report what actually ran. Local checks do not prove CI, publishing or human approval.

The user approved reference 1.1. Use [approved profiles](docs/design-system/technologia-po-ludzku/docs/design-system/v1.1/index.html), [profile examples](docs/design-system/technologia-po-ludzku/ui-host-profiles.html) and the [machine contract](docs/design-system/technologia-po-ludzku/agent-kit/host-profiles.json) alongside the original 25-family atlas. The frozen 1.1 manifest and preserved v1 reconstruction are both checked.
