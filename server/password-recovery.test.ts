import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { expect, it } from "vitest";
import { accountEmail } from "../src/features/auth/contract";
import { PASSWORD_RESET_TTL_MS, PrototypeDatabase } from "./database";

it("migrates v4 without changing credentials and rejects expired or superseded links", async () => {
  const directory = mkdtempSync(join(tmpdir(), "doroboty-recovery-"));
  const path = join(directory, "recovery.sqlite");
  let db = new PrototypeDatabase(path, "");
  try {
    const before = db.read();
    db.sql.exec("DROP TABLE password_resets; PRAGMA user_version = 4;");
    db.close();
    db = new PrototypeDatabase(path, "");
    expect(db.migrationBackupPath).toContain(".v4-backup-");
    expect(db.read()).toEqual(before);
    const id = "candidate-anna";
    const email = accountEmail(id);
    const now = Date.now();
    const expired = db.issuePasswordReset(email, "test-ip", now - PASSWORD_RESET_TTL_MS)!;
    expect(() => db.resetPassword(expired.token, "Expired-Password", now)).toThrow(/wygasł/);
    const link = db.issuePasswordReset(email, "test-ip", now)!;
    const login = await db.login(email, "Test1234", "test-ip");
    if (!login || !("token" in login)) throw new Error("Existing credential failed");
    await db.changePassword(id, login.token, "Test1234", "Changed-Password");
    expect(() => db.resetPassword(link.token, "Another-Password")).toThrow(/wygasł/);
    expect(db.sql.prepare("PRAGMA foreign_key_check").all()).toEqual([]);
  } finally {
    db.close();
    rmSync(directory, { recursive: true, force: true });
  }
}, 15000);
