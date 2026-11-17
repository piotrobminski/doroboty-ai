# DoRoboty.ai design system — Technologia po ludzku

**Technologia po ludzku 1.1 is the required visual direction for every new or changed screen.** This replaces the older Poster People visual instructions. The complete imported package is local at [technologia-po-ludzku/](technologia-po-ludzku/); all 177 release files are present, including source CSS/ES modules, examples, illustration, employer logos, the 25-family human documentation, screenshots and verification records.

This guide governs the React/TypeScript/Vite implementation. The whole-application migration is recorded in [the redesign task](../tasks/technologia-po-ludzku-app-redesign.md) and [STATUS.md](STATUS.md). The immutable reference and its original verification remain separate from host evidence.

## Mandatory reading order

1. Root [AGENTS.md](../../AGENTS.md), [BRIEF.md](../../BRIEF.md), [case protocol](../case/CASE_PROTOCOL.md), [TODO.md](../../TODO.md) and relevant [FEATURES.md](../../FEATURES.md) entries: retain the product contract.
2. This guide, [IMPLEMENTATION.md](IMPLEMENTATION.md), [HOST-COMPONENTS.md](HOST-COMPONENTS.md) and [VERIFICATION.md](VERIFICATION.md): exact React/Base UI adoption, existing owners, data mapping and acceptance checks. For application records also read [RECORDS.md](RECORDS.md). [STATUS.md](STATUS.md) states what is and is not adopted.
3. [Agent entry point — design.md](technologia-po-ludzku/agent-kit/design.md): visual hierarchy, page composition, source/decision boundaries and imports.
4. [Component contract](technologia-po-ludzku/agent-kit/components.md): real CSS classes, markup, exports, attributes and controller responsibilities.
5. Relevant cards in the [full designer documentation](technologia-po-ludzku/docs/design-system/v1/index.html#components), [foundations](technologia-po-ludzku/docs/design-system/v1/index.html#f 02) and [open issues](technologia-po-ludzku/docs/design-system/v1/index.html#issues). The [evidence manifest](technologia-po-ludzku/docs/design-system/v1/evidence/manifest.json) identifies the 21 source captures and 33 crops.
6. Run and inspect the gallery plus the source page matching the task. Review more than the first viewport.

No global skill, external chat, home-directory path, remote font, account or network service is required to use the package.

## Authority and ambiguity resolution

- The user's current task and this repository's functional/data/security boundaries come first. For visual decisions use this receiving guide and the new package. Current React styles are implementation to migrate, not another approved target.
- The previous kit at `docs/design-system/agent-kit/` is **legacy compatibility material only**. The redesign removed its runtime font and illustration imports. Retain this byte-preserved historical package; it is not a runtime dependency. Do not select that font, pink palette or rounded Poster People recipe for new work.
- Previous integration documents are preserved under [history/poster-people-guidance/](history/poster-people-guidance/ARCHIVE.md). Old task/audit records describe their own time; they do not override the active direction or authorize unfinished work.
- The imported package is a byte-preserved standalone HTML/CSS/ESM reference. Its original absolute launch example and earlier landing notes describe its authoring environment. **Use the receiving commands and paths below.** Do not require that original folder or run a second vanilla application inside React.
- Labels P/P-spec/R/?/T and I01–I08 in the package distinguish evidence, implementation declarations, recommendations, gaps/tests and explicit package decisions. They are not all user-approved global tokens. Preserve uncertainties rather than inventing a team standard.

## Local files

| Material                                 | Exact local source                                                                                               |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Start here                               | [agent-kit/design.md](technologia-po-ludzku/agent-kit/design.md)                                                 |
| Classes, HTML and JS API                 | [agent-kit/components.md](technologia-po-ludzku/agent-kit/components.md)                                         |
| Standalone CSS entry                     | [agent-kit/foundation.css](technologia-po-ludzku/agent-kit/foundation.css)                                       |
| Tokens and aliases                       | [assets/tokens.css](technologia-po-ludzku/assets/tokens.css)                                                     |
| Base styles / listing geometry           | [styles.css](technologia-po-ludzku/styles.css)                                                                   |
| Logo and area tones                      | [icon-colors.css](technologia-po-ludzku/icon-colors.css), [icon helpers](technologia-po-ludzku/icon-schemes.mjs) |
| Candidate/form/composer styles           | [job-pages.css](technologia-po-ludzku/job-pages.css)                                                             |
| Reference card / empty state             | [listing-components.mjs](technologia-po-ludzku/listing-components.mjs)                                           |
| Reference offer composition              | [job-view.mjs](technologia-po-ludzku/job-view.mjs)                                                               |
| Alpha collage with angular edges         | [human-technology-hero-angular.png](technologia-po-ludzku/assets/human-technology-hero-angular.png)              |
| Employer logos                           | technologia-po-ludzku/assets/employers/ — fictional source examples, not this host's company records             |
| Full human documentation                 | [index.html](technologia-po-ludzku/docs/design-system/v1/index.html)                                             |
| Package verification                     | [verification.json](technologia-po-ludzku/agent-kit/verification.json) — standalone checks only                  |
| Imported inventory / receiving integrity | [technologia-po-ludzku-manifest.json](technologia-po-ludzku-manifest.json), [verify-kit.mjs](verify-kit.mjs)     |

`foundation.css` imports the existing token, listing, area and job-page modules, then applies the package's opt-in adapter under `.tph-agent-ui`. `agent-kit/examples.css` is gallery geometry only. Do not paste either global reset or gallery layout into the host wholesale.

## Preview and check from the repository root

Use Node.js 24 and the existing npm setup. No install inside the kit is needed.

```sh
npm run design-system:check
npm run design-system:dev
```

The preview uses **http://127.0.0.1:8952**:

- [/ui-examples.html](http://127.0.0.1:8952/ui-examples.html): shared components, states and interactions.
- [/ui-long-content.html](http://127.0.0.1:8952/ui-long-content.html): long role/company/tag, fallback initials and missing salary.
- [/](http://127.0.0.1:8952/): complete listing.
- [/job.html?id=forma-ai-product-designer](http://127.0.0.1:8952/job.html?id=forma-ai-product-designer): complete candidate detail and application demo.
- [/create-job.html](http://127.0.0.1:8952/create-job.html): three-stage recruiter example.
- [/docs/design-system/v1/](http://127.0.0.1:8952/docs/design-system/v1/): human documentation.

For a port conflict: `UI_KIT_PORT=8953 npm run design-system:dev`. Product `npm run dev` remains at port 3001. ES modules require HTTP; do not launch the examples through file://.

`design-system:check` verifies all 177 release file hashes, the retained legacy inventory for compatibility, mandatory entry-point links, source JS syntax and the 10 reference tests. This is not proof that the React application matches the target. The receiving [checklist](VERIFICATION.md) defines what a changed screen must demonstrate.

## Visual decisions to preserve

- **Królewski fiolet #7B2CBF** is the primary brand accent; **lime #C2F970 is secondary**. Paper #F7F5ED, card #FFFEF9, ink #171B19 and muted #596159 carry the information layer.
- Headings and body use Arial/Helvetica/sans roles, with technical mono metadata. Do not carry forward mandatory Geist Serif headings. Hero, card, reading and field roles have separate sizes; copying one font size across them loses the hierarchy.
- Expressive human entrance, quiet repeated results. Use the accepted alpha/angular collage, preserving the transition to paper; do not use the old opaque image, wavy boundary or legacy illustration as the new visual target.
- **C is the selected marker scheme:** large neutral logo=company; small colored symbol=AI work area. Build/Apply/Lead are equal areas, not seniority or quality ranks. Keep the experience text separate.
- Default actions are graphite or neutral; lime highlights contextual applying. Selected/current/featured states have their own documented treatment. Do not color every action violet or every card by category.
- Reuse actual anatomy and responsive composition. Source search remains visible; mobile categories and additional filters follow the current source, not the previous reference's required filter modal. The whole-application redesign adopts inline mobile facets using the existing Base UI FormSelect and native disclosure.

## Adoption workflow

1. Identify the route, current React owner and affected shared consumers; record intent/acceptance in docs/tasks/.
2. Map relevant source families to JSX, existing Base UI primitives and host semantic tokens. See the concrete map in [IMPLEMENTATION.md](IMPLEMENTATION.md).
3. Keep data/state in this application. Preserve lowercase taxonomy, slugs, hash routes, candidate/employer identity, Zod validation, localStorage, submissions, snapshots and decisions. The source's demo fixtures/controllers are not substitutes.
4. Implement the requested screen within scope; use the existing shared host implementation. Adapt tokens and their direct consumers together; check portals and shared components.
5. Compare against the relevant source at 1280/390/320px, exercise long/missing data and keyboard/state/error recovery, then run `./scripts/verify`. Report real evidence and remaining gaps. Installing documentation does not close old visual findings.

Keep the imported kit immutable. Write host adaptations in src/ and tokens.css. A future reference update must deliberately replace the versioned package and its reviewed manifest; do not adjust source examples to make an inconsistent host appear correct.

## Approved 1.1 release

The user accepted the [1.1 specification](PROPOSED-1.1.md). The active 177-file package adds six composition profiles within the original 25 families, explicit geometry aliases and scoped examples. Read [the current human guide](technologia-po-ludzku/docs/design-system/v1.1/index.html), [profile contract](technologia-po-ludzku/agent-kit/host-profiles.json), [examples](technologia-po-ludzku/ui-host-profiles.html) and [release verification](technologia-po-ludzku/agent-kit/verification-1.1.json). The [preserved v1 originals](history/technologia-po-ludzku-v1-originals/README.md) plus its manifest reconstruct every original byte. A future edit again requires a deliberate reviewed release; ordinary UI work adapts the host.
