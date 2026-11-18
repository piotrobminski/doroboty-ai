import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it, vi } from "vitest";
import { ARCHIVE_DELAY_MS } from "../src/features/prototype/model";
import { PrototypeDatabase } from "./database";

it("upgrades a v3 store, then archives a closed offer and its submissions together at the 90-day boundary", () => {
  const folder = mkdtempSync(join(tmpdir(), "doroboty-archive-"));
  const path = join(folder, "test.sqlite");
  const closedAt = Date.parse("2026-11-10T12:13:14.123Z");
  vi.setSystemTime(closedAt);
  let db = new PrototypeDatabase(path);
  try {
    const { jobs, applications } = db.read();
    const job = jobs[0];
    // Version 3 had the same relational records, without the closure column.
    db.sql.exec(
      "DROP TABLE password_resets; ALTER TABLE jobs DROP COLUMN recruitment_closed_at; PRAGMA user_version = 3;",
    );
    db.close();
    db = new PrototypeDatabase(path);
    expect(db.migrationBackupPath).toContain(".v3-backup-");
    expect(db.read().jobs).toEqual(jobs);
    const close = { type: "close_recruitment", jobId: job.id } as const;
    expect(() => db.act("employer-northstar", close)).toThrow(/swojej firmy/);
    expect(() => db.act("employer-brightlabs", close)).toThrow(/zakończ wszystkie aplikacje/);
    const existing = applications[0];
    db.act("employer-brightlabs", {
      type: "stage",
      applicationId: existing.id,
      stage: "rejected",
      note: "Wynik rekrutacji",
    });
    expect(db.read().jobs[0].publicationStatus).toBe("published");
    db.act("candidate-anna", {
      type: "submit",
      jobId: job.id,
      notes: "",
      generated: "",
      answer: "Projektowałam i wdrażałam automatyzację procesów obsługi.",
      consent: true,
    });
    const anna = db.read().applications.find((item) => item.candidateId === "candidate-anna")!;
    db.act("candidate-anna", { type: "withdraw", applicationId: anna.id });
    db.act("employer-brightlabs", close);
    expect(db.read().jobs[0]).toMatchObject({
      publicationStatus: "hidden",
      recruitmentClosedAt: new Date(closedAt).toISOString(),
    });
    expect(() => db.act("employer-brightlabs", close)).toThrow(/opublikowaną/);
    expect(() => db.act("employer-brightlabs", { type: "publish", job })).toThrow(/do odczytu/);
    expect(() =>
      db.act("candidate-anna", {
        type: "submit",
        jobId: job.id,
        notes: "",
        generated: "",
        answer: anna.answer,
        consent: true,
      }),
    ).toThrow(/Oferta nie jest dostępna/);
    const snapshots = db.read().applications;
    db.archiveDueRecruitments(closedAt + ARCHIVE_DELAY_MS - 1);
    expect(db.read().jobs[0].publicationStatus).toBe("hidden");
    db.close();
    vi.setSystemTime(closedAt + ARCHIVE_DELAY_MS);
    db = new PrototypeDatabase(path);
    expect(db.read().jobs[0].publicationStatus).toBe("archived");
    expect(db.read().jobs.slice(1)).toEqual(jobs.slice(1));
    expect(db.read().applications).toEqual(snapshots);
    expect(db.view(null).jobs.some((item) => item.id === job.id)).toBe(false);
    expect(db.view("employer-northstar").applications).toEqual([]);
    expect(db.view("employer-brightlabs").applications).toHaveLength(2);
    expect(db.view("candidate-marek").applications[0].events.at(-1)?.note).toBe("");
    expect(() => db.act("candidate-anna", { type: "withdraw", applicationId: anna.id })).toThrow(
      /Archiwalna/,
    );
    db.archiveDueRecruitments(closedAt + 2 * ARCHIVE_DELAY_MS);
    expect(db.read().applications).toEqual(snapshots);
    expect(db.sql.prepare("PRAGMA foreign_key_check").all()).toEqual([]);
  } finally {
    db.close();
    vi.useRealTimers();
    rmSync(folder, { recursive: true, force: true });
  }
});
