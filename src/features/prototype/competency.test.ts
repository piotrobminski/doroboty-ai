import { describe, expect, it } from "vitest";
import { competencyCardSchema, proposeCriteria } from "./competency";
import { initialState, stateSchema, transition, type State } from "./model";
import { parseState, serializeState } from "./storage";

const time = "2026-11-13T10:00:00.000Z";
const description =
  "Projektujesz proces automatyzacji obsługi zgłoszeń. Analizujesz jakość odpowiedzi i błędy modelu.";
function select(state: State, id: string) {
  return transition(state, { type: "select_person", id });
}
function prepared() {
  const state = select(initialState(), "employer-brightlabs");
  const proposedCriteria = proposeCriteria(description);
  const card = competencyCardSchema.parse({
    sourceDescription: description,
    proposedCriteria,
    criteria: proposedCriteria,
    mode: "local-template",
    approvedAt: time,
    approvedBy: "employer-brightlabs",
  });
  const job = { ...state.jobs[0], description, competencyCard: card };
  return transition(state, { type: "publish", job }, time);
}
function input(state: State) {
  const job = state.jobs[0];
  return {
    type: "submit" as const,
    jobId: job.id,
    notes: "Legacy private notes",
    generated: "Legacy generated text",
    answer: "",
    consent: true,
    competencyRevision: time,
    competencyResponses: job.competencyCard!.criteria.map((criterion) => ({
      criterionId: criterion.id,
      example:
        "Samodzielnie zaprojektowałam i sprawdziłam jakość odpowiedzi na syntetycznym zestawie.",
      materials: "https://example.com/synthetic-result",
    })),
  };
}
function submitted() {
  const state = select(prepared(), "candidate-anna");
  return transition(state, input(state), time, "pr02-anna");
}

describe("PR02 competency workflow", () => {
  it("uses actual task excerpts, rejects short sources and retains original proposals beside edits", () => {
    expect(() => proposeCriteria("Short")).toThrow();
    const state = prepared();
    const card = state.jobs[0].competencyCard!;
    expect(card.criteria).toHaveLength(2);
    expect(card.criteria[0].requirement).toBe(description.split(". ")[0] + ".");
    card.criteria = card.criteria.map((criterion, index) =>
      index ? criterion : { ...criterion, requirement: "Ręcznie poprawione wymaganie rekrutera." },
    );
    expect(
      stateSchema.parse(state).jobs[0].competencyCard?.proposedCriteria[0].requirement,
    ).toContain("Projektujesz");
  });
  it("requires approval fields, matching source and the current employer", () => {
    const state = prepared();
    const job = state.jobs[0];
    expect(() =>
      transition(state, {
        type: "publish",
        job: { ...job, description: description + " Zmiana zakresu roli." },
      }),
    ).toThrow();
    expect(() =>
      transition(state, {
        type: "publish",
        job: { ...job, competencyCard: { ...job.competencyCard!, approvedBy: "candidate-anna" } },
      }),
    ).toThrow();
    expect(
      competencyCardSchema.safeParse({ ...job.competencyCard, approvedAt: undefined }).success,
    ).toBe(false);
  });
  it("keeps partial drafts and legacy text through persistence without allowing incomplete submission", () => {
    const state = select(prepared(), "candidate-anna");
    const action = input(state);
    const partial = [{ ...action.competencyResponses[0], example: "Szkic" }];
    const saved = transition(state, { ...action, type: "draft", competencyResponses: partial });
    expect(parseState(serializeState(saved)).drafts[0].competencyResponses).toEqual(partial);
    expect(saved.drafts[0].notes).toBe(action.notes);
    expect(() => transition(saved, { ...action, competencyResponses: partial })).toThrow();
    expect(() => transition(saved, { ...action, competencyRevision: "old" })).toThrow("zmieniła");
    expect(() =>
      transition(saved, {
        ...action,
        competencyResponses: [...action.competencyResponses, action.competencyResponses[0]],
      }),
    ).toThrow();
    expect(select(saved, "candidate-marek").drafts[0].candidateId).toBe("candidate-anna");
  });
  it("snapshots approved requirements, personal examples, materials and CV independently of job edits", () => {
    const state = submitted();
    const application = state.applications.at(-1)!;
    const employer = select(state, "employer-brightlabs");
    const edited = transition(employer, {
      type: "publish",
      job: { ...employer.jobs[0], competencyCard: undefined, title: "Changed future role" },
    });
    expect(edited.applications.at(-1)).toEqual(application);
    expect(application.competency?.responses[0].materials).toBe(
      "https://example.com/synthetic-result",
    );
    expect(parseState(serializeState(edited)).applications.at(-1)?.competency).toEqual(
      application.competency,
    );
    const invalid = structuredClone(edited);
    invalid.applications.at(-1)!.competency!.responses[0].criterionId = "unknown";
    expect(stateSchema.safeParse(invalid).success).toBe(false);
  });
  it("requires an evidence-based reason for every employer stage, preserving ownership and withdrawal", () => {
    const state = select(submitted(), "employer-brightlabs");
    const action = {
      type: "stage" as const,
      applicationId: "pr02-anna",
      stage: "reviewed" as const,
      note: " ",
    };
    expect(() => transition(state, action, time)).toThrow("Uzasadnij");
    const result = transition(
      state,
      {
        ...action,
        note: "Przykład pokazuje własną analizę jakości; sprawdzę sposób doboru próby.",
      },
      time,
    );
    expect(result.applications.at(-1)?.events.at(-1)?.note).toContain("Przykład");
    expect(state.applications.at(-1)?.stage).toBe("submitted");
    expect(() =>
      transition(
        select(state, "employer-northstar"),
        { ...action, note: "Długie uzasadnienie obcego pracodawcy." },
        time,
      ),
    ).toThrow();
    expect(
      transition(
        select(state, "candidate-anna"),
        { type: "withdraw", applicationId: "pr02-anna" },
        time,
      ).applications.at(-1)?.stage,
    ).toBe("withdrawn");
  });
  it("still accepts version-1 saves without competency fields", () => {
    const state = initialState();
    expect(parseState(serializeState(state))).toEqual(state);
  });
  it("requires model provenance for OpenAI cards while preserving old local-template imports", () => {
    const state = prepared();
    const card = state.jobs[0].competencyCard!;
    expect(competencyCardSchema.safeParse({ ...card, mode: "openai" }).success).toBe(false);
    state.jobs[0].competencyCard = { ...card, mode: "openai", model: "gpt-5-mini-test" };
    expect(parseState(serializeState(state)).jobs[0].competencyCard?.model).toBe("gpt-5-mini-test");
    expect(competencyCardSchema.safeParse(card).success).toBe(true);
  });
});
