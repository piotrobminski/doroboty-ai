import { describe, expect, it } from "vitest";
import { proposeJobSkills } from "./job-proposals";
import { competencyCardSchema } from "./competency";
import { initialState, transition, stateSchema } from "./model";
import { parseState, serializeState } from "./storage";
import { jobEditorDraftSchema } from "./job-editor-state";

const description =
  "Uporządkujesz obsługę zgłoszeń i skrócisz czas odpowiedzi. Sprawdzisz jakość odpowiedzi. Ważna jest współpraca z zespołem operacyjnym.";
const draft = jobEditorDraftSchema.parse({
  title: "Rola operacyjna",
  description,
  summary: "",
  category: "apply",
  function: "operations",
  remoteStatus: "hybrid",
  seniority: "mid",
  contract: "employment",
  locations: "Warszawa; Kraków",
  salaryMin: "",
  salaryMax: "",
  card: null,
  step: 1,
});
describe("local job proposals and editor recovery", () => {
  it("grounds readable skills in source excerpts and produces a publishable local card", () => {
    const criteria = proposeJobSkills(description);
    expect(criteria.map((item) => item.requirement)).toEqual([
      "Usprawnianie obsługi klienta",
      "Sprawdzanie jakości rezultatów",
      "Współpraca przy realizacji zadań",
    ]);
    for (const item of criteria) {
      expect(description).toContain(item.sourceExcerpt);
      expect(item.question).not.toContain("AI");
    }
    expect(new Set(criteria.map((item) => item.id)).size).toBe(3);
    expect(
      competencyCardSchema.safeParse({
        sourceDescription: description,
        proposedCriteria: criteria,
        criteria,
        mode: "local-template",
        approvedBy: "employer-brightlabs",
        approvedAt: "2026-11-13T12:00:00.000Z",
      }).success,
    ).toBe(true);
  });
  it("adapts to data and programming work instead of reusing customer-service skills", () => {
    const data = proposeJobSkills(
      "Analizujesz dane sprzedażowe, przygotowujesz raporty i wyciągasz wnioski dla odbiorców.",
    );
    expect(data[0].requirement).toBe("Wyciąganie wniosków z danych");
    expect(data.some((item) => item.requirement.includes("obsługi"))).toBe(false);
    expect(
      proposeJobSkills(
        "Tworzysz aplikacje frontendowe. Piszesz testy i sprawdzasz błędy w oprogramowaniu.",
      ).map((item) => item.requirement),
    ).toContain("Tworzenie rozwiązań programistycznych");
  });
  it("rejects invalid sources and uses an honest generic question for an unfamiliar role", () => {
    expect(() => proposeJobSkills("krótko")).toThrow();
    expect(() => proposeJobSkills("x".repeat(12001))).toThrow();
    const unfamiliar = "Układasz bukiety z kwiatów sezonowych według zamówień naszych odbiorców.";
    const [item] = proposeJobSkills(unfamiliar);
    expect(item.requirement).toBe("Własny wkład w realizację zadania");
    expect(item.question).toContain(unfamiliar);
    const long = "x".repeat(2000) + " Analizujesz dane sprzedażowe. ";
    expect(long).toContain(proposeJobSkills(long)[0].sourceExcerpt);
    expect(proposeJobSkills(long)[0].sourceExcerpt).toContain("Analizujesz");
    expect(
      proposeJobSkills(
        "Nie wymagamy programowania ani pisania kodu. Przygotowujesz treści kampanii.",
      ).map((item) => item.requirement),
    ).not.toContain("Tworzenie rozwiązań programistycznych");
  });
  it("persists partial human edits per employer/offer and clears the matching draft only after publication", () => {
    let state = transition(initialState(), { type: "select_person", id: "employer-brightlabs" });
    state = transition(state, { type: "job_editor_draft", value: draft });
    const job = state.jobs[0];
    state = transition(state, {
      type: "job_editor_draft",
      jobId: job.id,
      value: { ...draft, title: "Inna poprawka", step: 1 },
    });
    expect(parseState(serializeState(state)).employerDrafts).toHaveLength(2);
    const other = transition(state, { type: "select_person", id: "employer-northstar" });
    expect(() =>
      transition(other, { type: "job_editor_draft", jobId: job.id, value: draft }),
    ).toThrow();
    const invalid = structuredClone(state);
    invalid.employerDrafts![0].employerId = "candidate-anna";
    expect(stateSchema.safeParse(invalid).success).toBe(false);
    expect(transition(state, { type: "publish", job }).employerDrafts).toHaveLength(1);
    expect(initialState().employerDrafts).toBeUndefined();
    expect(jobEditorDraftSchema.safeParse({ ...draft, step: 2, card: null }).success).toBe(false);
  });
});
