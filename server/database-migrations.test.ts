import { DatabaseSync } from "node:sqlite";
import { createHash, scryptSync } from "node:crypto";
import { mkdtempSync, readdirSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { initialState, stateSchema, transition, type State } from "../src/features/prototype/model";
import { accountEmail } from "../src/features/auth/contract";
import { PrototypeDatabase } from "./database";

function richState(): State {
  let state = initialState();
  const job = state.jobs[0];
  const criteria = [
    {
      id: "legacy-criterion",
      requirement: "Weryfikacja jakości odpowiedzi modelu",
      question: "Opisz własną pracę nad sprawdzaniem jakości odpowiedzi modelu.",
      sourceExcerpt: "Weryfikacja jakości",
      explanation: "Historyczne uzasadnienie wymagania.",
    },
  ];
  job.competencyCard = {
    sourceDescription: job.description,
    proposedCriteria: criteria,
    criteria,
    approvedBy: "employer-brightlabs",
    approvedAt: "2026-11-03T10:00:00.000Z",
    mode: "openai",
    model: "historical-test-model",
  };
  job.sourceBrief = "";
  job.generatedDescription = "Dawna propozycja opisu, osobna od zatwierdzonej treści.";
  job.generatedDescriptionModel = "historical-description-model";
  job.locations = ["Kraków", "Warszawa", "Zdalnie"];
  job.salaryMin = 123.456789;
  job.salaryMax = 987.654321;
  delete state.jobs[1].coordinates;
  delete state.jobs[1].salaryCurrency;
  state = transition(state, { type: "select_person", id: "candidate-anna" });
  state = transition(
    state,
    {
      type: "submit",
      jobId: job.id,
      notes: "Historyczne prywatne notatki.",
      generated: "Dawna niezależna propozycja odpowiedzi.",
      answer: "",
      consent: true,
      competencyRevision: job.competencyCard.approvedAt,
      competencyResponses: [
        {
          criterionId: criteria[0].id,
          example: "😃".repeat(20),
          materials: "Materiały tekstowe i https://example.com/synthetic",
        },
      ],
    },
    "2026-11-03T11:00:00.000Z",
    "legacy-application",
  );
  state = transition(state, { type: "select_person", id: "employer-brightlabs" });
  state = transition(
    state,
    {
      type: "stage",
      applicationId: "legacy-application",
      stage: "reviewed",
      note: "😃".repeat(20),
    },
    "2026-11-03T11:00:00.000Z",
  );
  state.people[0].name = "Zmieniona po wysłaniu Anna";
  state.people[0].bio = "Profil po wysłaniu\u0000z zachowanym znakiem.";
  state.people[0].cv = "Zmienione CV po wysłaniu. ".repeat(4);
  state.drafts = [
    {
      candidateId: "candidate-marek",
      jobId: state.jobs[1].id,
      notes: "",
      generated: "Legacy draft",
      answer: "😃",
      competencyRevision: "removed-card-revision",
      competencyResponses: [
        {
          criterionId: "removed-criterion",
          example: "Poprzedni przykład do odzyskania.",
          materials: "",
        },
      ],
    },
    {
      candidateId: "candidate-anna",
      jobId: state.jobs[2].id,
      notes: "Legacy notes",
      generated: "",
      answer: "",
    },
  ];
  const draft = {
    title: "",
    summary: "",
    description: "",
    category: "build" as const,
    function: "engineering" as const,
    remoteStatus: "remote" as const,
    seniority: "junior" as const,
    contract: "b2b" as const,
    locations: "",
    salaryMin: "",
    salaryMax: "",
    card: null,
    step: 1 as const,
  };
  state.employerDrafts = [
    { employerId: "employer-brightlabs", value: draft },
    {
      employerId: "employer-brightlabs",
      jobId: job.id,
      value: { ...draft, title: "Niedokończona edycja" },
    },
  ];
  state.saved = [
    { candidateId: "candidate-marek", jobId: state.jobs[2].id },
    { candidateId: "candidate-anna", jobId: state.jobs[1].id },
  ];
  state.applications[0].answer += "\u0000zachowany koniec";
  state.jobs.reverse();
  state.companies.reverse();
  state.activePersonId = null;
  return stateSchema.parse(state);
}
const hashes = new Map<string, string>();
function legacy(path: string, state = richState()) {
  const sql = new DatabaseSync(path);
  // Frozen version-1 layout; intentionally independent from the new schema/repository.
  sql.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
    CREATE TABLE scenario (id INTEGER PRIMARY KEY CHECK(id=1),data TEXT NOT NULL CHECK(json_valid(data)));
    CREATE TABLE users (person_id TEXT PRIMARY KEY,email TEXT NOT NULL UNIQUE COLLATE NOCASE,password_hash TEXT NOT NULL,created_at INTEGER NOT NULL);
    CREATE TABLE sessions (token_hash TEXT PRIMARY KEY,person_id TEXT NOT NULL REFERENCES users(person_id),expires_at INTEGER NOT NULL);
    CREATE INDEX sessions_expiry ON sessions(expires_at);
    CREATE TABLE login_failures (address TEXT PRIMARY KEY,attempts INTEGER NOT NULL,until_at INTEGER NOT NULL);
    PRAGMA user_version=1;`);
  sql.prepare("INSERT INTO scenario VALUES(1,?)").run(JSON.stringify(state));
  for (const person of state.people) {
    const salt = `legacy-${person.id}`;
    if (!hashes.has(person.id))
      hashes.set(
        person.id,
        `${salt}:${scryptSync("Test1234", salt, 64, { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 }).toString("hex")}`,
      );
    sql
      .prepare("INSERT INTO users VALUES(?,?,?,?)")
      .run(person.id, accountEmail(person.id), hashes.get(person.id)!, 123456789);
  }
  sql
    .prepare("INSERT INTO sessions VALUES(?,?,?)")
    .run(
      createHash("sha256").update("legacy-token").digest("hex"),
      "candidate-anna",
      Date.now() + 60_000,
    );
  sql
    .prepare("INSERT INTO login_failures VALUES(?,?,?)")
    .run("fixture-address", 3, Date.now() + 60_000);
  return sql;
}
function authRows(sql: DatabaseSync) {
  return Object.fromEntries(
    ["users", "sessions", "login_failures"].map((table) => [
      table,
      sql.prepare(`SELECT * FROM ${table} ORDER BY 1`).all(),
    ]),
  );
}
async function temporary(check: (path: string, folder: string) => void | Promise<void>) {
  const folder = mkdtempSync(join(tmpdir(), "doroboty-migrate-"));
  try {
    await check(join(folder, "source.sqlite"), folder);
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
}

describe("version-1 to relational migration", () => {
  it("preserves ordered records, snapshots, drafts, credentials and WAL sessions with a consistent private backup", async () => {
    await temporary(async (path, folder) => {
      const state = richState();
      const old = legacy(path, state);
      const before = authRows(old);
      let db: PrototypeDatabase | undefined;
      try {
        db = new PrototypeDatabase(path);
        const backupPath = db.migrationBackupPath!;
        expect(backupPath).toContain(".v1-backup-");
        expect(statSync(backupPath).mode & 0o777).toBe(0o600);
        const backup = new DatabaseSync(backupPath, { readOnly: true });
        try {
          expect(backup.prepare("PRAGMA user_version").get()!.user_version).toBe(1);
          expect(
            JSON.parse(String(backup.prepare("SELECT data FROM scenario").get()!.data)),
          ).toEqual(state);
          expect(authRows(backup)).toEqual(before);
        } finally {
          backup.close();
        }
        expect(db.read()).toEqual(state);
        expect(authRows(db.sql)).toEqual(before);
        expect(db.session("legacy-token")).toBe("candidate-anna");
        expect(db.sql.prepare("PRAGMA user_version").get()!.user_version).toBe(2);
        expect(db.sql.prepare("PRAGMA foreign_key_check").all()).toEqual([]);
        expect(
          db.sql.prepare("SELECT name FROM sqlite_schema WHERE name='scenario'").get(),
        ).toBeUndefined();
        expect(
          db.sql.prepare("SELECT * FROM applications WHERE id='legacy-application'").get(),
        ).toMatchObject({
          candidate_name_snapshot: "Anna Kowalska",
          stage: "reviewed",
          score_snapshot: 84,
          submitted_at: "2026-11-03T11:00:00.000Z",
        });
        expect(
          db.sql.prepare("SELECT salary_min FROM jobs WHERE id=?").get(initialState().jobs[0].id)!
            .salary_min,
        ).toBe(123.456789);
        expect(
          Object.keys(
            JSON.parse(String(db.sql.prepare("SELECT data FROM prototype_state").get()!.data)),
          ).sort(),
        ).toEqual(["employerDraftsPresent", "people", "version"]);
        const count = readdirSync(folder).filter((name) => name.includes(".v1-backup-")).length;
        db.close();
        db = undefined;
        db = new PrototypeDatabase(path);
        expect(db.migrationBackupPath).toBe(null);
        expect(db.read()).toEqual(state);
        expect(authRows(db.sql)).toEqual(before);
        expect(readdirSync(folder).filter((name) => name.includes(".v1-backup-")).length).toBe(
          count,
        );
        for (const person of state.people) {
          const result = await db.login(accountEmail(person.id), "Test1234", person.id);
          expect(result && "personId" in result && result.personId).toBe(person.id);
        }
      } finally {
        db?.close();
        old.close();
      }
    });
  }, 20000);
  it.each(["absent", "empty"])(
    "preserves %s optional employer drafts without creating a second JSON store",
    async (mode) => {
      await temporary((path) => {
        const state = initialState();
        if (mode === "empty") state.employerDrafts = [];
        const old = legacy(path, state);
        let db: PrototypeDatabase | undefined;
        try {
          db = new PrototypeDatabase(path);
          expect(db.read()).toEqual(state);
        } finally {
          db?.close();
          old.close();
        }
      });
    },
  );
  it("rolls schema and rows back if DDL fails, retaining the recoverable v1 backup", async () => {
    await temporary((path, folder) => {
      const state = richState(),
        old = legacy(path, state);
      try {
        old.exec("CREATE TABLE jobs(id TEXT)");
        const auth = authRows(old);
        expect(() => new PrototypeDatabase(path)).toThrow();
        expect(old.prepare("PRAGMA user_version").get()!.user_version).toBe(1);
        expect(JSON.parse(String(old.prepare("SELECT data FROM scenario").get()!.data))).toEqual(
          state,
        );
        expect(
          old.prepare("SELECT name FROM sqlite_schema WHERE name='prototype_state'").get(),
        ).toBeUndefined();
        expect(authRows(old)).toEqual(auth);
        expect(readdirSync(folder).filter((name) => name.includes(".v1-backup-")).length).toBe(1);
        old.exec("DROP TABLE jobs");
        const retry = new PrototypeDatabase(path);
        try {
          expect(retry.read()).toEqual(state);
        } finally {
          retry.close();
        }
      } finally {
        old.close();
      }
    });
  });
  it.each(["invalid scenario", "missing account"])(
    "rejects %s without inventing records or resetting credentials",
    async (mode) => {
      await temporary((path) => {
        const old = legacy(path);
        try {
          if (mode === "invalid scenario")
            old.prepare("UPDATE scenario SET data=?").run('{"version":99}');
          else old.prepare("DELETE FROM users WHERE person_id='employer-northstar'").run();
          const raw = old.prepare("SELECT data FROM scenario").get()!.data,
            auth = authRows(old);
          expect(() => new PrototypeDatabase(path)).toThrow();
          expect(old.prepare("SELECT data FROM scenario").get()!.data).toBe(raw);
          expect(authRows(old)).toEqual(auth);
          expect(old.prepare("PRAGMA user_version").get()!.user_version).toBe(1);
        } finally {
          old.close();
        }
      });
    },
  );
  it("rejects unsupported and unversioned databases without downgrading or seeding", async () => {
    await temporary((path, folder) => {
      const old = legacy(path);
      try {
        old.exec("PRAGMA user_version=77");
        const before = authRows(old);
        expect(() => new PrototypeDatabase(path)).toThrow(/Unsupported/);
        expect(old.prepare("PRAGMA user_version").get()!.user_version).toBe(77);
        expect(authRows(old)).toEqual(before);
        expect(readdirSync(folder).some((name) => name.includes(".v1-backup-"))).toBe(false);
      } finally {
        old.close();
      }
      const other = join(folder, "unversioned.sqlite"),
        raw = new DatabaseSync(other);
      try {
        raw.exec("CREATE TABLE important(value TEXT); INSERT INTO important VALUES('preserve')");
        expect(() => new PrototypeDatabase(other)).toThrow(/Unversioned/);
        expect(raw.prepare("SELECT * FROM important").get()!.value).toBe("preserve");
      } finally {
        raw.close();
      }
    });
  });
});

describe("relational integrity and transactional workflows", () => {
  it("enforces job/company references, unique applications, immutable content and append-only stage history", () => {
    const db = new PrototypeDatabase(":memory:");
    try {
      const first = db.read().applications[0];
      expect(() =>
        db.sql
          .prepare("UPDATE applications SET answer_snapshot='changed' WHERE id=?")
          .run(first.id),
      ).toThrow(/immutable/);
      expect(() =>
        db.sql
          .prepare("UPDATE application_events SET note='changed' WHERE application_id=?")
          .run(first.id),
      ).toThrow(/append-only/);
      expect(() =>
        db.sql.prepare("UPDATE applications SET stage='hired' WHERE id=?").run(first.id),
      ).toThrow(/history/);
      expect(() =>
        db.sql
          .prepare("INSERT INTO application_events VALUES(?,1,'continued',?,'')")
          .run(first.id, first.events[0].at),
      ).toThrow(/transition/);
      expect(() =>
        db.sql
          .prepare("INSERT INTO application_events VALUES(?,2,'reviewed',?,'')")
          .run(first.id, first.events[0].at),
      ).toThrow(/order/);
      const copy = (id: string, job: string, company: string, candidate = first.candidateId) =>
        db.sql
          .prepare(
            `INSERT INTO applications SELECT ?,?, ?, ?,job_title_snapshot,candidate_name_snapshot,cv_snapshot,answer_snapshot,competency_snapshot_json,source_notes,generated_answer,score_snapshot,summary_snapshot,stage,submitted_at,1 FROM applications WHERE id=?`,
          )
          .run(id, job, company, candidate, first.id);
      expect(() => copy("duplicate", first.jobId, first.companyId)).toThrow(/UNIQUE/);
      expect(() => copy("missing-job", "missing-job", first.companyId)).toThrow(/FOREIGN KEY/);
      expect(() =>
        copy("missing-candidate", first.jobId, first.companyId, "missing-account"),
      ).toThrow(/FOREIGN KEY/);
      expect(() =>
        copy("wrong-company", first.jobId, initialState().companies[1].id, "candidate-anna"),
      ).toThrow(/FOREIGN KEY/);
      expect(() => db.sql.prepare("DELETE FROM jobs WHERE id=?").run(first.jobId)).toThrow(
        /FOREIGN KEY/,
      );
      const snapshot = structuredClone(first);
      const current = db.read().jobs.find((job) => job.id === first.jobId)!;
      db.act("employer-brightlabs", {
        type: "publish",
        job: { ...current, title: "Zmienione ogłoszenie", publicationStatus: "archived" },
      });
      expect(db.read().applications[0]).toEqual(snapshot);
      db.act("employer-brightlabs", {
        type: "stage",
        applicationId: first.id,
        stage: "reviewed",
        note: "Notatka pracodawcy.",
      });
      expect(db.sql.prepare("SELECT stage FROM applications WHERE id=?").get(first.id)!.stage).toBe(
        "reviewed",
      );
      expect(db.read().applications[0].events).toHaveLength(2);
      expect(db.view("candidate-marek").applications[0].events[1].note).toBe("");
      expect(db.sql.prepare("PRAGMA foreign_key_check").all()).toEqual([]);
    } finally {
      db.close();
    }
  });
  it("rolls back submission/draft cleanup and imported accounts when a later SQL write fails", () => {
    const db = new PrototypeDatabase(":memory:");
    try {
      db.replace("operator", richState());
      let before = db.read();
      const auth = authRows(db.sql);
      db.sql.exec(
        "CREATE TRIGGER fail_saved BEFORE INSERT ON saved_jobs BEGIN SELECT RAISE(ABORT,'injected storage failure'); END",
      );
      expect(() =>
        db.act("candidate-anna", {
          type: "submit",
          jobId: before.jobs.find((job) => job.slug === "staff-ai-engineer")!.id,
          notes: "",
          generated: "",
          answer: "Własne doświadczenie potrzebne w tej roli.",
          consent: true,
        }),
      ).toThrow(/injected/);
      expect(db.read()).toEqual(before);
      expect(authRows(db.sql)).toEqual(auth);
      db.sql.exec(
        "DROP TRIGGER fail_saved; CREATE TRIGGER fail_company BEFORE INSERT ON companies WHEN NEW.name='blocked' BEGIN SELECT RAISE(ABORT,'injected import failure'); END",
      );
      const incoming = structuredClone(before);
      incoming.people.push({ ...incoming.people[0], id: "candidate-added" });
      incoming.companies[0].name = "blocked";
      expect(() => db.replace("operator", incoming)).toThrow(/injected/);
      expect(db.read()).toEqual(before);
      expect(authRows(db.sql)).toEqual(auth);
      db.sql.exec("DROP TRIGGER fail_company");
      incoming.companies[0].name = before.companies[0].name;
      db.replace("operator", incoming);
      expect(
        db.sql.prepare("SELECT person_id FROM users WHERE person_id='candidate-added'").get(),
      ).toBeDefined();
      before = db.read();
      db.reset("operator");
      expect(db.read().people).toEqual(before.people);
      expect(db.sql.prepare("PRAGMA foreign_key_check").all()).toEqual([]);
    } finally {
      db.close();
    }
  }, 10000);
  it("reads a consistent snapshot while another connection commits a change", async () => {
    await temporary((path) => {
      const reader = new PrototypeDatabase(path),
        writer = new PrototypeDatabase(path);
      try {
        const before = reader.read();
        reader.sql.exec("BEGIN");
        reader.sql.prepare("SELECT data FROM prototype_state WHERE id=1").get();
        writer.act("employer-brightlabs", {
          type: "company",
          name: "Zmieniona firma",
          description: "Nowy opis firmy",
        });
        expect(reader.read()).toEqual(before);
        expect(reader.sql.isTransaction).toBe(true);
        reader.sql.exec("ROLLBACK");
        expect(reader.read().companies.find((c) => c.id === before.companies[0].id)!.name).toBe(
          "Zmieniona firma",
        );
      } finally {
        if (reader.sql.isTransaction) reader.sql.exec("ROLLBACK");
        reader.close();
        writer.close();
      }
    });
  });
  it("does not reseed a damaged version-2 store on reopen", async () => {
    await temporary((path) => {
      const db = new PrototypeDatabase(path);
      db.sql.exec("DELETE FROM prototype_state");
      db.close();
      expect(() => new PrototypeDatabase(path)).toThrow(/metadata/);
      const raw = new DatabaseSync(path);
      try {
        expect(raw.prepare("SELECT COUNT(*) AS n FROM prototype_state").get()!.n).toBe(0);
        expect(raw.prepare("PRAGMA user_version").get()!.user_version).toBe(2);
      } finally {
        raw.close();
      }
    });
  });
});
