import type { State } from "./model";

// UI projection; browser-demo views are not an access-control boundary.
export function projectState(full: State, personId: string | null): State {
  const state = structuredClone(full);
  const person = state.people.find((p) => p.id === personId);
  state.activePersonId = person?.id ?? null;
  if (person?.role === "operator") return state;
  state.applications = state.applications.filter((a) =>
    person?.role === "candidate"
      ? a.candidateId === person.id
      : person?.role === "employer" && a.companyId === person.companyId,
  );
  if (person?.role === "candidate")
    state.applications = state.applications.map((a) => ({
      ...a,
      events: a.events.map((e) => ({ ...e, note: "" })),
    }));
  if (person?.role === "employer")
    state.applications = state.applications.map((a) => ({
      ...a,
      sourceNotes: "",
      generatedAnswer: "",
    }));
  state.saved = state.saved.filter(
    (s) => person?.role === "candidate" && s.candidateId === person.id,
  );
  state.drafts = state.drafts.filter(
    (s) => person?.role === "candidate" && s.candidateId === person.id,
  );
  state.employerDrafts = state.employerDrafts?.filter(
    (d) => person?.role === "employer" && d.employerId === person.id,
  );
  const referencedJobs = new Set(
    [...state.applications, ...state.saved, ...state.drafts].map((r) => r.jobId),
  );
  state.jobs = state.jobs.filter(
    (j) =>
      j.publicationStatus === "published" ||
      (person?.role === "employer" && j.companyId === person.companyId) ||
      referencedJobs.has(j.id),
  );
  // Source briefs/model history are employer-only, even on published offers.
  state.jobs = state.jobs.map((job) =>
    person?.role === "employer" && job.companyId === person.companyId
      ? job
      : {
          ...job,
          sourceBrief: undefined,
          generatedDescription: undefined,
          generatedDescriptionModel: undefined,
        },
  );
  const candidates = new Set(state.applications.map((a) => a.candidateId));
  state.people = state.people
    .filter((p) => p.id === person?.id || p.role === "employer" || candidates.has(p.id))
    .map((p) =>
      p.id === person?.id ? p : { ...p, bio: "", cv: "", exampleScore: 0, exampleSummary: "" },
    );
  return state;
}
