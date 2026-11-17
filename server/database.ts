import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { randomBytes, createHash, scrypt, scryptSync, timingSafeEqual } from "node:crypto";
import {
  initialState,
  stateSchema,
  transition,
  type State,
  type ServerAction,
} from "../src/features/prototype/model";
import { accountEmail } from "../src/features/auth/contract";

const scryptOptions = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };
const derive = (password: string, salt: string) =>
  new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, 64, scryptOptions, (error, key) =>
      error ? reject(error) : resolve(key),
    );
  });
export class OperationFailure extends Error {}
const digest = (token: string) => createHash("sha256").update(token).digest("hex");
export const SESSION_SECONDS = 12 * 60 * 60;
function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64, scryptOptions).toString("hex");
  return `${salt}:${hash}`;
}
async function matches(password: string, encoded: string) {
  const [salt, hash] = encoded.split(":");
  const actual = await derive(password, salt);
  return timingSafeEqual(actual, Buffer.from(hash, "hex"));
}

export class PrototypeDatabase {
  readonly sql: DatabaseSync;
  private readonly dummyHash: string;
  constructor(path: string) {
    if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
    this.sql = new DatabaseSync(path);
    this.sql.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;
      PRAGMA busy_timeout = 5000;
      CREATE TABLE IF NOT EXISTS scenario (id INTEGER PRIMARY KEY CHECK(id = 1), data TEXT NOT NULL CHECK(json_valid(data)));
      CREATE TABLE IF NOT EXISTS users (
        person_id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE COLLATE NOCASE,
        password_hash TEXT NOT NULL, created_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS sessions (
        token_hash TEXT PRIMARY KEY, person_id TEXT NOT NULL REFERENCES users(person_id), expires_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at);
      CREATE TABLE IF NOT EXISTS login_failures (address TEXT PRIMARY KEY, attempts INTEGER NOT NULL, until_at INTEGER NOT NULL);
      PRAGMA user_version = 1;
    `);
    this.atomic(() => {
      if (!this.sql.prepare("SELECT id FROM scenario WHERE id = 1").get())
        this.save(initialState());
      this.seedAccounts(this.read());
    });
    this.dummyHash = hashPassword(randomBytes(32).toString("hex"));
  }
  close() {
    this.sql.close();
  }
  private atomic<T>(operation: () => T): T {
    this.sql.exec("BEGIN IMMEDIATE");
    try {
      const result = operation();
      this.sql.exec("COMMIT");
      return result;
    } catch (error) {
      this.sql.exec("ROLLBACK");
      throw error;
    }
  }
  read(): State {
    const row = this.sql.prepare("SELECT data FROM scenario WHERE id = 1").get()!;
    return stateSchema.parse(JSON.parse(row.data as string));
  }
  private save(state: State) {
    const data = JSON.stringify(stateSchema.parse({ ...state, activePersonId: null }));
    if (Buffer.byteLength(data) > 2_000_000)
      throw new OperationFailure("Dane przekraczają limit 2 MB. Wyeksportuj scenariusz.");
    this.sql
      .prepare(
        "INSERT INTO scenario VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data",
      )
      .run(data);
  }
  private seedAccounts(state: State) {
    for (const person of state.people) {
      if (!this.sql.prepare("SELECT person_id FROM users WHERE person_id = ?").get(person.id)) {
        this.sql
          .prepare("INSERT INTO users VALUES (?, ?, ?, ?)")
          .run(person.id, accountEmail(person.id), hashPassword("Test1234"), Date.now());
      }
    }
  }
  session(token: string | undefined, now = Date.now()) {
    if (!token) return null;
    const row = this.sql
      .prepare("SELECT person_id FROM sessions WHERE token_hash = ? AND expires_at > ?")
      .get(digest(token), now);
    return row ? String(row.person_id) : null;
  }
  async login(email: string, password: string, address: string, now = Date.now()) {
    this.sql.prepare("DELETE FROM login_failures WHERE until_at <= ?").run(now);
    const failure = this.sql
      .prepare("SELECT attempts FROM login_failures WHERE address = ?")
      .get(address);
    if (failure && Number(failure.attempts) >= 10) return { limited: true } as const;
    const user = this.sql
      .prepare("SELECT person_id, password_hash FROM users WHERE email = ? COLLATE NOCASE")
      .get(email);
    const valid = await matches(password, user ? String(user.password_hash) : this.dummyHash);
    if (!user || !valid) {
      this.sql
        .prepare(
          `INSERT INTO login_failures VALUES (?, 1, ?) ON CONFLICT(address) DO UPDATE SET attempts = attempts + 1`,
        )
        .run(address, now + 15 * 60_000);
      return null;
    }
    this.sql.prepare("DELETE FROM login_failures WHERE address = ?").run(address);
    this.sql.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(now);
    const token = randomBytes(32).toString("hex");
    this.sql
      .prepare("INSERT INTO sessions VALUES (?, ?, ?)")
      .run(digest(token), user.person_id, now + SESSION_SECONDS * 1000);
    return { token, personId: String(user.person_id) };
  }
  logout(token: string | undefined) {
    if (token) this.sql.prepare("DELETE FROM sessions WHERE token_hash = ?").run(digest(token));
  }
  act(personId: string, action: ServerAction) {
    return this.atomic(() => {
      const state = this.read();
      state.activePersonId = personId;
      if (
        (action.type === "toggle_saved" || action.type === "draft") &&
        !state.jobs.some((j) => j.id === action.jobId && j.publicationStatus === "published")
      )
        throw new OperationFailure("Oferta nie jest dostępna.");
      let next: State;
      try {
        next = transition(state, action);
      } catch (error) {
        throw new OperationFailure(
          error instanceof Error && error.name !== "ZodError"
            ? error.message
            : "Sprawdź poprawność danych.",
        );
      }
      this.save(next);
      return this.view(personId);
    });
  }
  replace(personId: string, incoming: State) {
    return this.atomic(() => {
      const current = this.read();
      if (current.people.find((p) => p.id === personId)?.role !== "operator")
        throw new OperationFailure("Wymagane konto prowadzącego.");
      const next = stateSchema.parse(incoming);
      for (const person of current.people) {
        const replacement = next.people.find((p) => p.id === person.id);
        if (
          !replacement ||
          person.role !== replacement.role ||
          person.companyId !== replacement.companyId
        )
          throw new OperationFailure(
            "Import musi zachować istniejące konta, ich role i przypisania do firm.",
          );
      }
      this.save(next);
      this.seedAccounts(next);
      return this.view(personId);
    });
  }
  reset(personId: string) {
    const next = initialState();
    const current = this.read();
    next.people = current.people;
    // Retain organizations referenced by imported accounts.
    for (const company of current.companies)
      if (!next.companies.some((c) => c.id === company.id)) next.companies.push(company);
    return this.replace(personId, next);
  }
  view(personId: string | null): State {
    const state = this.read();
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
}
