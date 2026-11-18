import { describe, expect, it } from "vitest";
import { createStaticDemo, DEMO_STORAGE_KEY } from "./static-demo";
import { accountEmail } from "../auth/contract";
import { ARCHIVE_DELAY_MS, initialState } from "./model";
import { STORAGE_KEY } from "./storage";

function memory() {
  const values = new Map<string, string>();
  return {
    values,
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
}
const login = (demo: ReturnType<typeof createStaticDemo>, id: string) =>
  demo.request("/api/auth/login", { email: accountEmail(id), password: "Test1234" });

describe("explicit static browser demo", () => {
  it("archives overdue local offers on opening and preserves application history", () => {
    const storage = memory();
    const state = initialState();
    const closedAt = new Date(Date.now() - ARCHIVE_DELAY_MS - 1000).toISOString();
    state.jobs[0] = {
      ...state.jobs[0],
      publicationStatus: "hidden",
      recruitmentClosedAt: closedAt,
    };
    state.applications[0].stage = "withdrawn";
    state.applications[0].events = [
      { stage: "submitted", at: closedAt, note: "" },
      { stage: "withdrawn", at: closedAt, note: "" },
    ];
    state.activePersonId = state.applications[0].candidateId;
    storage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state));
    const view = createStaticDemo(storage).request();
    expect(view.jobs.find((job) => job.id === state.jobs[0].id)?.publicationStatus).toBe(
      "archived",
    );
    const persisted = JSON.parse(storage.getItem(DEMO_STORAGE_KEY)!);
    expect(persisted.jobs[0].publicationStatus).toBe("archived");
    expect(persisted.applications).toEqual(state.applications);
  });
  it("preserves synthetic publication/application/history workflows across role changes and reload, isolated from other browsers", () => {
    const storage = memory();
    storage.values.set(STORAGE_KEY, "untouched legacy save");
    const demo = createStaticDemo(storage);
    expect(demo.request().activePersonId).toBe(null);
    expect(() =>
      demo.request("/api/auth/login", { email: accountEmail("candidate-anna"), password: "wrong" }),
    ).toThrow(/Nieprawidłowy/);
    const full = initialState();
    const job = full.jobs.find((item) => item.slug === "ai-product-manager")!;
    const employer = full.people.find(
      (person) => person.role === "employer" && person.companyId === job.companyId,
    )!;
    login(demo, employer.id);
    const published = {
      ...job,
      id: "demo-published",
      slug: "demo-published",
      title: "Demo publication",
    };
    demo.request("/api/actions", { type: "publish", job: published });
    login(demo, "candidate-anna");
    const submitted = demo.request("/api/actions", {
      type: "submit",
      jobId: published.id,
      notes: "private source",
      generated: "legacy material",
      answer: "Własne doświadczenie w realizacji podobnego projektu.",
      consent: true,
    });
    const snapshot = submitted.applications[0];
    demo.request("/api/actions", {
      type: "profile",
      value: {
        ...full.people[0],
        name: "Changed after submission",
        bio: "Persistent local profile",
      },
    });
    expect(() =>
      demo.request("/api/actions", {
        type: "submit",
        jobId: published.id,
        notes: "",
        generated: "",
        answer: "Własne doświadczenie w realizacji podobnego projektu.",
        consent: true,
      }),
    ).toThrow(/już wysłana/);
    const employerView = login(demo, employer.id);
    expect(employerView.applications.find((item) => item.id === snapshot.id)?.sourceNotes).toBe("");
    demo.request("/api/actions", {
      type: "stage",
      applicationId: snapshot.id,
      stage: "reviewed",
      note: "Employer private note",
    });
    const candidate = login(demo, "candidate-anna");
    expect(candidate.applications[0]).toMatchObject({
      cv: snapshot.cv,
      candidateName: snapshot.candidateName,
      stage: "reviewed",
    });
    expect(candidate.applications[0].events[1].note).toBe("");
    const reopened = createStaticDemo(storage).request();
    expect(reopened.activePersonId).toBe("candidate-anna");
    expect(reopened.people.find((person) => person.id === "candidate-anna")?.bio).toBe(
      "Persistent local profile",
    );
    expect(
      createStaticDemo(memory())
        .request()
        .jobs.some((item) => item.id === published.id),
    ).toBe(false);
    expect(storage.values.get(STORAGE_KEY)).toBe("untouched legacy save");
    expect(storage.values.get(DEMO_STORAGE_KEY)).not.toContain("Test1234");
  });

  it("preserves corrupt saves until an explicit operator recovery and fails safely without storage", () => {
    const storage = memory();
    storage.values.set(DEMO_STORAGE_KEY, "corrupt original");
    const demo = createStaticDemo(storage);
    expect(demo.original).toBe("corrupt original");
    expect(demo.issue).toContain("nie zostaną nadpisane");
    login(demo, "candidate-anna");
    expect(() =>
      demo.request("/api/actions", { type: "toggle_saved", jobId: initialState().jobs[0].id }),
    ).toThrow(/zablokowany/);
    expect(storage.values.get(DEMO_STORAGE_KEY)).toBe("corrupt original");
    login(demo, "operator");
    expect(() => demo.request("/api/scenario/import", { version: 99 })).toThrow();
    expect(storage.values.get(DEMO_STORAGE_KEY)).toBe("corrupt original");
    demo.request("/api/scenario/reset", {});
    expect(demo.issue).toBe("");
    expect(demo.original).toBe(null);
    expect(JSON.parse(storage.values.get(DEMO_STORAGE_KEY)!).version).toBe(1);
    const unavailable = createStaticDemo(null);
    expect(login(unavailable, "operator").activePersonId).toBe("operator");
    expect(() => unavailable.request("/api/scenario/reset", {})).toThrow(/Nie udało się zapisać/);
  });

  it("does not acknowledge a failed write or replace state on invalid import", () => {
    const storage = memory();
    const demo = createStaticDemo(storage);
    login(demo, "candidate-anna");
    const before = demo.request();
    const fail = () => {
      throw new Error("quota");
    };
    storage.setItem = fail;
    expect(() =>
      demo.request("/api/actions", {
        type: "profile",
        value: { ...initialState().people[0], bio: "Not stored" },
      }),
    ).toThrow(/Nie udało się zapisać/);
    expect(demo.request()).toEqual(before);
    storage.setItem = (key, value) => {
      storage.values.set(key, value);
    };
    login(demo, "operator");
    const operator = demo.request();
    const invalid = initialState();
    invalid.people = invalid.people.filter((person) => person.id !== "candidate-anna");
    expect(() => demo.request("/api/scenario/import", invalid)).toThrow(
      /zachować istniejące konta/,
    );
    expect(demo.request()).toEqual(operator);
  });
});
