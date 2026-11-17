import { DatabaseSync } from "node:sqlite";
import { openSync, closeSync, rmSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import { initialState, stateSchema, type State } from "../src/features/prototype/model";
import { AUTH_SCHEMA, RELATIONAL_SCHEMA } from "./relational-schema";
import { ScenarioRepository, assertForeignKeys, transaction } from "./scenario-repository";

export const DATABASE_VERSION = 2;
const version = (db: DatabaseSync) => Number(db.prepare("PRAGMA user_version").get()!.user_version);
function assertAccounts(db: DatabaseSync, state: State) {
  const accounts = new Set(
    db
      .prepare("SELECT person_id FROM users")
      .all()
      .map((row) => row.person_id),
  );
  if (state.people.some((person) => !accounts.has(person.id)))
    throw new Error(
      "Existing profiles have missing accounts; migration cannot invent or replace credentials.",
    );
}
export function assertRoundTrip(repository: ScenarioRepository, expected: State) {
  // JavaScript-only explicit undefined properties are absent in the existing JSON contract.
  const exported = stateSchema.parse(
    JSON.parse(JSON.stringify({ ...expected, activePersonId: null })),
  );
  if (!isDeepStrictEqual(repository.read(), exported))
    throw new Error(
      "Relational persistence did not preserve the complete scenario; the transaction was rolled back.",
    );
}
function backupLockedDatabase(path: string): string {
  // The caller holds BEGIN IMMEDIATE, before any writes. A second read-only connection
  // VACUUMs the committed WAL snapshot while other writers remain excluded.
  const target = `${path}.v1-backup-${Date.now()}-${randomUUID()}.sqlite`;
  const source = new DatabaseSync(path, { readOnly: true });
  let created = false;
  try {
    closeSync(openSync(target, "wx", 0o600));
    created = true;
    source.prepare("VACUUM main INTO ?").run(target);
    return target;
  } catch (error) {
    if (created) rmSync(target, { force: true });
    throw error;
  } finally {
    source.close();
  }
}

/** Runs once per database, retaining account/session tables and the complete v1 backup. */
export function initializeDatabase(
  db: DatabaseSync,
  path: string,
  seedAccounts: (state: State) => void,
): string | null {
  const currentVersion = version(db);
  if (![0, 1, DATABASE_VERSION].includes(currentVersion))
    throw new Error("Unsupported database schema version; no data was changed.");
  if (
    currentVersion === 0 &&
    db
      .prepare("SELECT name FROM sqlite_schema WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")
      .all().length
  )
    throw new Error("Unversioned nonempty database; no data was seeded or replaced.");
  db.exec("PRAGMA journal_mode = WAL");
  const repository = new ScenarioRepository(db);
  return transaction(db, currentVersion === DATABASE_VERSION ? "read" : "write", () => {
    // Another process may have completed migration while this connection waited for its lock.
    const lockedVersion = version(db);
    if (lockedVersion === DATABASE_VERSION) {
      if (db.prepare("SELECT name FROM sqlite_schema WHERE name = 'scenario'").get())
        throw new Error("Database has two scenario stores; refusing ambiguous data.");
      assertAccounts(db, repository.read());
      assertForeignKeys(db);
      return null;
    }
    if (lockedVersion !== 0 && lockedVersion !== 1)
      throw new Error("Unsupported database schema version; no data was changed.");
    let backup: string | null = null;
    let state: State;
    if (lockedVersion === 1) {
      if (path === ":memory:")
        throw new Error("Legacy migration requires a persistent database for its backup.");
      backup = backupLockedDatabase(path);
      const row = db.prepare("SELECT data FROM scenario WHERE id = 1").get();
      if (!row) throw new Error("Legacy scenario is missing; no data was reset.");
      state = stateSchema.parse(JSON.parse(String(row.data)));
      assertAccounts(db, state);
      assertForeignKeys(db);
    } else {
      if (
        db
          .prepare(
            "SELECT name FROM sqlite_schema WHERE type = 'table' AND name NOT LIKE 'sqlite_%'",
          )
          .all().length
      )
        throw new Error("Database became nonempty; no data was replaced.");
      state = initialState();
      db.exec(AUTH_SCHEMA);
      seedAccounts(state);
    }
    db.exec(RELATIONAL_SCHEMA);
    repository.write(state);
    assertRoundTrip(repository, state);
    assertForeignKeys(db);
    if (lockedVersion === 1) db.exec("DROP TABLE scenario");
    db.exec(`PRAGMA user_version = ${DATABASE_VERSION}`);
    return backup;
  });
}
