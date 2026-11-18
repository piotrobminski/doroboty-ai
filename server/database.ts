import { projectState } from "../src/features/prototype/projection";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import {
  randomBytes,
  randomUUID,
  createHash,
  scrypt,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import {
  initialState,
  stateSchema,
  transition,
  type State,
  type ServerAction,
} from "../src/features/prototype/model";
import { initializeDatabase, assertRoundTrip } from "./database-migrations";
import { ScenarioRepository, assertForeignKeys, transaction } from "./scenario-repository";
import {
  accountEmail,
  type AccountAccess,
  type AccountCommand,
  type AccountSummary,
} from "../src/features/auth/contract";
import {
  PRIMARY_ADMIN_EMAIL,
  PRIMARY_ADMIN_ID,
  primaryAdminProfile,
  removeLegacyOperatorRoles,
} from "./admin-bootstrap";

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
export const PASSWORD_RESET_TTL_MS = 30 * 60_000;
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
  private readonly repository: ScenarioRepository;
  private readonly archiveTimer: ReturnType<typeof setInterval>;
  readonly migrationBackupPath: string | null;
  constructor(path: string, adminPassword = process.env.AUTH_ADMIN_PASSWORD) {
    if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
    this.sql = new DatabaseSync(path);
    try {
      this.sql.exec("PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;");
      this.migrationBackupPath = initializeDatabase(this.sql, path, (state) =>
        this.seedAccounts(state),
      );
      this.repository = new ScenarioRepository(this.sql);
      if (adminPassword) this.bootstrapAdmin(adminPassword);
      this.archiveDueRecruitments();
    } catch (error) {
      this.sql.close();
      throw error;
    }
    this.dummyHash = hashPassword(randomBytes(32).toString("hex"));
    this.archiveTimer = setInterval(() => {
      try {
        this.archiveDueRecruitments();
      } catch {
        console.error("Could not archive completed recruitments. The next check will retry.");
      }
    }, 60_000).unref();
  }
  close() {
    clearInterval(this.archiveTimer);
    this.sql.close();
  }
  archiveDueRecruitments(now = Date.now()) {
    this.repository.archiveDue(now);
  }
  private atomic<T>(operation: () => T): T {
    return transaction(this.sql, "write", operation);
  }
  read(): State {
    return this.repository.read();
  }
  private save(state: State, previous?: State) {
    const next = stateSchema.parse({ ...state, activePersonId: null });
    if (Buffer.byteLength(JSON.stringify(next)) > 2_000_000)
      throw new OperationFailure("Dane przekraczają limit 2 MB. Wyeksportuj scenariusz.");
    this.repository.write(next, previous);
    assertRoundTrip(this.repository, next);
    assertForeignKeys(this.sql);
  }
  private seedAccounts(state: State) {
    for (const person of state.people) {
      if (!this.sql.prepare("SELECT person_id FROM users WHERE person_id = ?").get(person.id)) {
        this.sql
          .prepare(
            "INSERT INTO users (person_id, email, password_hash, created_at) VALUES (?, ?, ?, ?)",
          )
          .run(person.id, accountEmail(person.id), hashPassword("Test1234"), Date.now());
      }
    }
  }
  private bootstrapAdmin(password: string) {
    this.atomic(() => {
      if (this.access(PRIMARY_ADMIN_ID).admin) return;
      if (password.length > 128)
        throw new Error("AUTH_ADMIN_PASSWORD exceeds the supported length.");
      if (
        this.sql
          .prepare("SELECT 1 FROM users WHERE person_id = ? OR email = ?")
          .get(PRIMARY_ADMIN_ID, PRIMARY_ADMIN_EMAIL)
      )
        throw new Error("The primary administrator account is reserved.");
      const previous = this.read();
      this.sql
        .prepare(
          `
        INSERT INTO users (person_id, email, password_hash, created_at, is_admin, must_change_password)
        VALUES (?, ?, ?, ?, 1, 1)
      `,
        )
        .run(PRIMARY_ADMIN_ID, PRIMARY_ADMIN_EMAIL, hashPassword(password), Date.now());
      this.save({ ...previous, people: [...previous.people, primaryAdminProfile()] }, previous);
    });
  }
  access(personId: string | null): AccountAccess {
    const row =
      personId &&
      this.sql
        .prepare("SELECT is_admin, must_change_password FROM users WHERE person_id = ?")
        .get(personId);
    return {
      admin: !!(row && row.is_admin),
      mustChangePassword: !!(row && row.must_change_password),
    };
  }
  private requireAdmin(personId: string) {
    const access = this.access(personId);
    if (!access.admin || access.mustChangePassword)
      throw new OperationFailure("Wymagane aktywne konto administratora.");
  }
  accounts(personId: string): AccountSummary[] {
    this.requireAdmin(personId);
    const people = new Map(this.read().people.map((person) => [person.id, person]));
    return this.sql
      .prepare("SELECT person_id, email, is_admin FROM users ORDER BY email")
      .all()
      .flatMap((row) => {
        const person = people.get(String(row.person_id));
        if (!person) return [];
        return [
          {
            id: person.id,
            name: person.name,
            email: String(row.email),
            role: person.role,
            companyId: person.companyId,
            admin: !!row.is_admin,
            primary: person.id === PRIMARY_ADMIN_ID,
          },
        ];
      });
  }
  manageAccount(actorId: string, command: AccountCommand) {
    return this.atomic(() => {
      this.requireAdmin(actorId);
      if (command.type === "create") {
        const previous = this.read();
        if (
          command.email === PRIMARY_ADMIN_EMAIL ||
          this.sql.prepare("SELECT 1 FROM users WHERE email = ?").get(command.email)
        )
          throw new OperationFailure("Konto o tym adresie e-mail już istnieje.");
        if (previous.people.length >= 100) throw new OperationFailure("Osiągnięto limit 100 kont.");
        if (
          command.role === "employer" &&
          !previous.companies.some((company) => company.id === command.companyId)
        )
          throw new OperationFailure("Wybierz firmę pracodawcy.");
        const person: State["people"][number] = {
          id: randomUUID(),
          name: command.name,
          role: command.role,
          companyId: command.role === "employer" ? command.companyId : undefined,
          headline: command.role === "candidate" ? "Kandydat" : "Pracodawca",
          location: "—",
          cv: "Przykładowe CV na potrzeby prototypu szkoleniowego.",
          bio: "",
          exampleScore: 0,
          exampleSummary: "",
        };
        this.sql
          .prepare(
            `
          INSERT INTO users (person_id, email, password_hash, created_at, must_change_password)
          VALUES (?, ?, ?, ?, 1)
        `,
          )
          .run(person.id, command.email, hashPassword(command.password), Date.now());
        this.save({ ...previous, people: [...previous.people, person] }, previous);
      } else {
        if (command.id === PRIMARY_ADMIN_ID || command.id === actorId)
          throw new OperationFailure(
            "Własne hasło zmienisz w ustawieniach. Główne konto zachowuje prawa administratora.",
          );
        if (!this.sql.prepare("SELECT 1 FROM users WHERE person_id = ?").get(command.id))
          throw new OperationFailure("Nie znaleziono konta.");
        if (command.type === "set-admin") {
          this.sql
            .prepare("UPDATE users SET is_admin = ? WHERE person_id = ?")
            .run(Number(command.admin), command.id);
        } else {
          this.replacePassword(command.id, command.password, true);
        }
        this.sql.prepare("DELETE FROM sessions WHERE person_id = ?").run(command.id);
      }
      return this.accounts(actorId);
    });
  }
  async changePassword(personId: string, sessionToken: string, current: string, next: string) {
    const limitKey = `password-change:${personId}`;
    const now = Date.now();
    this.sql
      .prepare("DELETE FROM login_failures WHERE address = ? AND until_at <= ?")
      .run(limitKey, now);
    const failures = this.sql
      .prepare("SELECT attempts FROM login_failures WHERE address = ?")
      .get(limitKey);
    if (failures && Number(failures.attempts) >= 10)
      throw new OperationFailure("Zbyt wiele prób. Spróbuj ponownie za 15 minut.");
    const row = this.sql
      .prepare("SELECT password_hash FROM users WHERE person_id = ?")
      .get(personId);
    const oldHash = String(row?.password_hash);
    if (!row || !(await matches(current, oldHash))) {
      this.sql
        .prepare(
          `
        INSERT INTO login_failures VALUES (?, 1, ?) ON CONFLICT(address) DO UPDATE SET attempts = attempts + 1
      `,
        )
        .run(limitKey, now + 15 * 60_000);
      throw new OperationFailure("Obecne hasło jest nieprawidłowe.");
    }
    if (current === next) throw new OperationFailure("Wybierz inne hasło niż obecne.");
    return this.atomic(() => {
      if (
        this.session(sessionToken) !== personId ||
        this.sql.prepare("SELECT password_hash FROM users WHERE person_id = ?").get(personId)
          ?.password_hash !== oldHash
      )
        throw new OperationFailure("Sesja lub hasło uległy zmianie. Zaloguj się ponownie.");
      this.replacePassword(personId, next);
      return this.createSession(personId, Date.now());
    });
  }
  private replacePassword(personId: string, password: string, temporary = false) {
    this.sql
      .prepare("UPDATE users SET password_hash = ?, must_change_password = ? WHERE person_id = ?")
      .run(hashPassword(password), Number(temporary), personId);
    this.sql.prepare("DELETE FROM sessions WHERE person_id = ?").run(personId);
    this.sql.prepare("DELETE FROM password_resets WHERE person_id = ?").run(personId);
    this.sql
      .prepare("DELETE FROM login_failures WHERE address = ?")
      .run(`password-change:${personId}`);
  }
  issuePasswordReset(email: string, address: string, now = Date.now()) {
    return this.atomic(() => {
      this.sql.prepare("DELETE FROM password_resets WHERE expires_at <= ?").run(now);
      this.sql.prepare("DELETE FROM login_failures WHERE until_at <= ?").run(now);
      const count = this.sql.prepare("SELECT attempts FROM login_failures WHERE address = ?");
      const byAddress = `recovery-ip:${address}`;
      const byEmail = `recovery-email:${digest(email)}`;
      if (
        Number(count.get(byAddress)?.attempts ?? 0) >= 10 ||
        Number(count.get(byEmail)?.attempts ?? 0) >= 3
      )
        return null;
      const record = this.sql.prepare(`
        INSERT INTO login_failures VALUES (?, 1, ?)
        ON CONFLICT(address) DO UPDATE SET attempts = attempts + 1
      `);
      record.run(byAddress, now + 15 * 60_000);
      record.run(byEmail, now + 15 * 60_000);
      const user = this.sql
        .prepare("SELECT person_id, email FROM users WHERE email = ?")
        .get(email);
      if (!user) return null;
      const token = randomBytes(32).toString("hex");
      this.sql
        .prepare("INSERT INTO password_resets VALUES (?, ?, ?)")
        .run(digest(token), user.person_id, now + PASSWORD_RESET_TTL_MS);
      return { token, email: String(user.email) };
    });
  }
  resetPassword(token: string, password: string, now = Date.now()) {
    return this.atomic(() => {
      const row = this.sql
        .prepare("SELECT person_id FROM password_resets WHERE token_hash = ? AND expires_at > ?")
        .get(digest(token), now);
      if (!row) throw new OperationFailure("Link wygasł lub został już użyty. Poproś o nowy.");
      this.replacePassword(String(row.person_id), password);
    });
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
    return this.atomic(() => {
      const id = String(user.person_id);
      if (
        this.sql.prepare("SELECT password_hash FROM users WHERE person_id = ?").get(id)
          ?.password_hash !== user.password_hash
      )
        return null;
      this.sql.prepare("DELETE FROM login_failures WHERE address = ?").run(address);
      this.sql.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(now);
      return { token: this.createSession(id, now), personId: id };
    });
  }
  private createSession(personId: string, now: number) {
    const token = randomBytes(32).toString("hex");
    this.sql
      .prepare("INSERT INTO sessions VALUES (?, ?, ?)")
      .run(digest(token), personId, now + SESSION_SECONDS * 1000);
    return token;
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
      this.save(next, state);
      return this.view(personId);
    });
  }
  replace(personId: string, incoming: State) {
    return this.atomic(() => {
      this.requireAdmin(personId);
      const current = this.read();
      const next = stateSchema.parse(incoming);
      removeLegacyOperatorRoles(next);
      const primary = current.people.find((person) => person.id === PRIMARY_ADMIN_ID);
      if (primary) {
        next.people = next.people.filter((person) => person.id !== PRIMARY_ADMIN_ID);
        next.people.push(primary);
      } else if (next.people.some((person) => person.id === PRIMARY_ADMIN_ID))
        throw new OperationFailure("Identyfikator administratora jest zarezerwowany.");
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
      this.seedAccounts(next);
      this.save(next);
      return this.view(personId);
    });
  }
  reset(personId: string) {
    return this.atomic(() => {
      const next = initialState();
      const current = this.read();
      next.people = current.people;
      // Retain organizations referenced by imported accounts.
      for (const company of current.companies)
        if (!next.companies.some((c) => c.id === company.id)) next.companies.push(company);
      return this.replace(personId, next);
    });
  }
  view(personId: string | null): State {
    this.archiveDueRecruitments();
    return projectState(this.read(), personId);
  }
  sessionView(personId: string | null) {
    const access = this.access(personId);
    const state = this.view(access.mustChangePassword ? null : personId);
    return {
      ...state,
      activePersonId: access.mustChangePassword ? personId : state.activePersonId,
      ...(access.mustChangePassword
        ? { people: this.read().people.filter((person) => person.id === personId) }
        : {}),
      account: access,
    };
  }
  scenario(personId: string) {
    this.requireAdmin(personId);
    this.archiveDueRecruitments();
    return this.read();
  }
}
