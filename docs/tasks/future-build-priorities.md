# Future build priorities — DoRoboty.ai

## Intent

Keep the product-discovery decisions from the supplied Supersprint conversation available when scoping future prototype work. This note records priority context; it does not authorize or start implementation.

## Current business outcome

The case explores increasing employers' paid repeat purchase within 90 days from a stated 30% to a 60% target. The baseline definition, including its cohort and denominator, remains unconfirmed. This is a business outcome for the case, not a result that a prototype can claim to have achieved. The supplied historical data and interview materials are synthetic or fictional and do not establish prevalence or causal impact.

## Priority decisions

- **Opportunity selected: O01 — help recruiters recognize candidates' practical AI skills and fit for the role.** The reviewed PRES comparison tied O01 with O02 at 15 points; O03 scored 14. The user chose O01 after reviewing the comparison. O02, reducing the effort of deciding whom to contact, remains a close alternative; the scores alone did not settle the choice.
- **Ideas selected: I01 and I03.** I01 is a role-specific competency card. An AI assistant helps the recruiter turn a job description into concrete tasks, skills, expected responsibility and useful examples. The recruiter edits and approves the card; the candidate supplies their own examples and supporting materials; the recruiter uses the responses when recording the next step. This may improve the information available for assessment, but it cannot guarantee that a candidate's claims are true.
- **I03 remains a separate, later direction:** a recruiter-tailored work sample, with candidate effort reduced either by reusing a relevant prior result or by sending the task after an initial conversation. These variants remain unresolved. The risk that extra work reduces candidate completion is central.
- I02, a standalone chatbot, was rejected. The earlier I04/I05 ideas were also rejected.

## Immediate prototype priority

The user selected **PR02 — a small working competency-card prototype with an AI assistant** for further consideration. Its proposed flow is:

1. Recruiter provides a job description; AI proposes role criteria and questions about the candidate's own contribution.
2. Recruiter edits and approves the competency card.
3. Candidate completes the form with examples and materials.
4. Recruiter reviews the criteria beside the candidate's responses and records a reason for the next step.

PR02 was preferred over PR01 (a clickable, mostly prefilled flow) because it can test whether recruiters share the card, candidates complete it, and recruiters use the returned information in selection. PR03 (a work-sample module with possible reuse of results) stays a distinct alternative aligned with I03.

**Historical build status: explicitly on hold at the time of this note.** The conversation says to stop after confirming the PR02 choice and not generate the prototype yet. The AI provider, model, integration details, participant access, timeline, budget and success thresholds are not settled. The PR01/PR02/PR03 choice is not approval to build or run an experiment.

The user explicitly requested implementation on 2026-11-13. The [PR02 delivery record](pr02-competency-card.md) supersedes this implementation hold with a local simulation scope. The user subsequently authorized the [local OpenAI integration](pr02-openai-integration.md). Experiments remain a separate decision.

## Research status and limits

- E01–E04 were proposed as tests for I01 and I03; none was selected or run. E01, testing the quality of AI-assisted role criteria against the recruiter's usual process, was only recommended as the first test.
- No proposed experiment currently measures whether the product changes paid repeat purchase.
- The future prototype should preserve recruiter editing and approval, use synthetic data, and keep candidate evidence separate from the recruiter's assessment. It must not present AI output as verified truth or a hiring recommendation.
- In this repository, the current product is a teaching prototype. Its existing product brief says candidate answers are written directly by candidates and there is no candidate answer-generation flow or configured AI provider. Any future change must be separately scoped against that contract; this note does not change current behavior.

## Acceptance criteria for this context note

- Preserve the user-selected O01 focus and PR02 prototype priority, with their rationale and alternatives.
- Keep the 90-day 30% to 60% outcome separate from prototype success claims.
- Record the unresolved questions and explicit hold so a later task does not infer build authorization.
- Do not modify product code, start the app, generate a prototype, or run implementation checks as part of this note.

## Source and register review

Source: user-supplied Supersprint conversation in `Wklejony tekst.txt` (included in the prompt). Project constraints checked against [BRIEF.md](../../BRIEF.md), [CASE_PROTOCOL.md](../case/CASE_PROTOCOL.md), [TODO.md](../../TODO.md), and [FEATURES.md](../../FEATURES.md). The behavior register was reviewed and does not need updating because this note changes no product behavior.
