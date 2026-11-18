import type { DatabaseSync, SQLInputValue, SQLOutputValue, StatementSync } from "node:sqlite";
import { z } from "zod";
import { archiveDueAt, stateSchema, type State } from "../src/features/prototype/model";

type Row = Record<string, SQLOutputValue>;
type Mapping = Record<string, string>;
type Input = Record<string, SQLInputValue>;
const companyFields = {
  id: "id",
  slug: "slug",
  name: "name",
  summary: "summary",
  description: "description",
  websiteUrl: "website_url",
  location: "location",
  sizeLabel: "size_label",
  logoUrl: "logo_url",
};
const jobFields = {
  id: "id",
  slug: "slug",
  companyId: "company_id",
  title: "title",
  summary: "summary",
  description: "description",
  category: "category",
  function: "job_function",
  remoteStatus: "remote_status",
  seniority: "seniority",
  contract: "contract",
  salaryMin: "salary_min",
  salaryMax: "salary_max",
  salaryCurrency: "salary_currency",
  salaryPeriod: "salary_period",
  salaryKind: "salary_kind",
  publicationStatus: "publication_status",
  publishedAt: "published_at",
  expiryAt: "expires_at",
  recruitmentClosedAt: "recruitment_closed_at",
  verificationStatus: "verification_status",
  sourceBrief: "source_brief",
  generatedDescription: "generated_description",
  generatedDescriptionModel: "generated_description_model",
};
const applicationFields = {
  id: "id",
  candidateId: "candidate_id",
  jobId: "job_id",
  companyId: "company_id",
  jobTitle: "job_title_snapshot",
  candidateName: "candidate_name_snapshot",
  cv: "cv_snapshot",
  answer: "answer_snapshot",
  sourceNotes: "source_notes",
  generatedAnswer: "generated_answer",
  score: "score_snapshot",
  summary: "summary_snapshot",
  stage: "stage",
};
const draftFields = {
  candidateId: "candidate_id",
  jobId: "job_id",
  notes: "notes",
  generated: "generated",
  answer: "answer",
  competencyRevision: "competency_revision",
};
const metadataSchema = z
  .object({
    version: z.literal(1),
    people: stateSchema.shape.people,
    employerDraftsPresent: z.boolean(),
  })
  .strict();
const json = (value: unknown): string | null =>
  value === undefined ? null : JSON.stringify(value);
const optionalJson = (value: SQLOutputValue) =>
  value === null ? undefined : JSON.parse(String(value));
function encode(value: object, mapping: Mapping): Input {
  const object = value as Record<string, SQLInputValue | undefined>;
  return Object.fromEntries(
    Object.entries(mapping).map(([property, column]) => [column, object[property] ?? null]),
  );
}
function decode(row: Row, mapping: Mapping): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(mapping)
      .filter(([, column]) => row[column] !== null)
      .map(([property, column]) => [property, row[column]]),
  );
}
export function transaction<T>(db: DatabaseSync, mode: "read" | "write", operation: () => T): T {
  if (db.isTransaction) return operation();
  db.exec(mode === "write" ? "BEGIN IMMEDIATE" : "BEGIN");
  try {
    const result = operation();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    if (db.isTransaction) db.exec("ROLLBACK");
    throw error;
  }
}
export function assertForeignKeys(db: DatabaseSync) {
  if (db.prepare("PRAGMA foreign_key_check").all().length)
    throw new Error("Database references are inconsistent; no data was replaced.");
}

/** Maps relational rows to the unchanged, validated version-1 domain/export shape. */
export class ScenarioRepository {
  private readonly statements = new Map<string, StatementSync>();
  constructor(private readonly db: DatabaseSync) {}
  private statement(sql: string) {
    let statement = this.statements.get(sql);
    if (!statement) {
      statement = this.db.prepare(sql);
      this.statements.set(sql, statement);
    }
    return statement;
  }
  private insert(table: string, row: Input, upsert = false) {
    // Identifiers come exclusively from the fixed mappings in this module, never request data.
    const columns = Object.keys(row);
    const update = upsert
      ? ` ON CONFLICT(id) DO UPDATE SET ${columns
          .filter((column) => column !== "id")
          .map((column) => `${column} = excluded.${column}`)
          .join(", ")}`
      : "";
    this.statement(
      `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${columns.map(() => "?").join(", ")})${update}`,
    ).run(...Object.values(row));
  }
  private rows(table: string, columns: string[], order = "list_position") {
    // Node.js 24.14 can truncate TEXT results at a null character. Read affected UTF-8
    // values as bytes while retaining SQLite's original storage types for other values.
    const fields = columns.map((column) => {
      const field = `${table}.${column}`;
      return `CASE WHEN typeof(${field}) = 'text' AND instr(${field}, char(0)) > 0
        THEN CAST(${field} AS BLOB) ELSE ${field} END AS ${column}`;
    });
    const rows = this.statement(
      `SELECT ${fields.join(", ")} FROM ${table} ORDER BY ${order}`,
    ).all();
    for (const row of rows) {
      for (const [column, value] of Object.entries(row)) {
        if (value instanceof Uint8Array) row[column] = Buffer.from(value).toString("utf8");
      }
    }
    return rows;
  }
  archiveDue(now: number) {
    const due = this.statement(
      "SELECT id, recruitment_closed_at FROM jobs WHERE publication_status = 'hidden' AND recruitment_closed_at IS NOT NULL",
    )
      .all()
      .filter((job) => archiveDueAt(String(job.recruitment_closed_at)) <= now);
    if (!due.length) return;
    transaction(this.db, "write", () => {
      const archive = this.statement(
        "UPDATE jobs SET publication_status = 'archived' WHERE id = ? AND publication_status = 'hidden' AND recruitment_closed_at = ?",
      );
      for (const job of due) archive.run(job.id, job.recruitment_closed_at);
    });
  }
  read(): State {
    return transaction(this.db, "read", () => {
      const row = this.statement("SELECT data FROM prototype_state WHERE id = 1").get();
      if (!row) throw new Error("Database profile metadata is missing; no data was reset.");
      const metadata = metadataSchema.parse(JSON.parse(String(row.data)));
      const locations = this.rows(
        "job_locations",
        ["job_id", "label"],
        "job_locations.job_id, position",
      );
      const events = this.rows(
        "application_events",
        ["application_id", "stage", "at", "note"],
        "application_events.application_id, position",
      );
      return stateSchema.parse({
        version: 1,
        activePersonId: null,
        people: metadata.people,
        companies: this.rows("companies", Object.values(companyFields)).map((company) =>
          decode(company, companyFields),
        ),
        jobs: this.rows("jobs", [
          ...Object.values(jobFields),
          "latitude",
          "longitude",
          "competency_card_json",
        ]).map((job) => ({
          ...decode(job, jobFields),
          locations: locations
            .filter((location) => location.job_id === job.id)
            .map((location) => location.label),
          ...(job.latitude === null
            ? {}
            : { coordinates: { latitude: job.latitude, longitude: job.longitude } }),
          ...(job.competency_card_json === null
            ? {}
            : { competencyCard: optionalJson(job.competency_card_json) }),
        })),
        applications: this.rows("applications", [
          ...Object.values(applicationFields),
          "competency_snapshot_json",
        ]).map((application) => ({
          ...decode(application, applicationFields),
          ...(application.competency_snapshot_json === null
            ? {}
            : { competency: optionalJson(application.competency_snapshot_json) }),
          events: events
            .filter((event) => event.application_id === application.id)
            .map((event) => ({ stage: event.stage, at: event.at, note: event.note })),
        })),
        drafts: this.rows("application_drafts", [
          ...Object.values(draftFields),
          "competency_responses_json",
        ]).map((draft) => ({
          ...decode(draft, draftFields),
          ...(draft.competency_responses_json === null
            ? {}
            : { competencyResponses: optionalJson(draft.competency_responses_json) }),
        })),
        saved: this.rows("saved_jobs", ["candidate_id", "job_id"]).map((saved) => ({
          candidateId: saved.candidate_id,
          jobId: saved.job_id,
        })),
        ...(metadata.employerDraftsPresent
          ? {
              employerDrafts: this.rows("job_editor_drafts", [
                "employer_id",
                "job_id",
                "draft_json",
              ]).map((draft) => ({
                employerId: draft.employer_id,
                ...(draft.job_id === null ? {} : { jobId: draft.job_id }),
                value: optionalJson(draft.draft_json),
              })),
            }
          : {}),
      });
    });
  }
  write(state: State, previous?: State) {
    if (!this.db.isTransaction)
      throw new Error("Scenario writes require an enclosing transaction.");
    if (!previous) {
      // Full replacement is called only by initialization/migration or authorized operator restore.
      for (const table of [
        "application_events",
        "applications",
        "application_drafts",
        "job_editor_drafts",
        "saved_jobs",
        "job_locations",
        "jobs",
        "companies",
        "prototype_state",
      ])
        this.db.exec(`DELETE FROM ${table}`);
    } else {
      for (const key of ["companies", "jobs", "applications"] as const)
        if (previous[key].some((before) => !state[key].some((after) => after.id === before.id)))
          throw new Error("Normal writes cannot remove submitted or referenced records.");
      for (const table of [
        "application_drafts",
        "job_editor_drafts",
        "saved_jobs",
        "job_locations",
      ])
        this.db.exec(`DELETE FROM ${table}`);
    }
    this.insert(
      "prototype_state",
      {
        id: 1,
        data: JSON.stringify({
          version: 1,
          people: state.people,
          employerDraftsPresent: state.employerDrafts !== undefined,
        }),
      },
      true,
    );
    state.companies.forEach((company, list_position) =>
      this.insert("companies", { ...encode(company, companyFields), list_position }, true),
    );
    state.jobs.forEach((job, list_position) => {
      this.insert(
        "jobs",
        {
          ...encode(job, jobFields),
          latitude: job.coordinates?.latitude ?? null,
          longitude: job.coordinates?.longitude ?? null,
          competency_card_json: json(job.competencyCard),
          list_position,
        },
        true,
      );
      job.locations.forEach((label, position) =>
        this.insert("job_locations", { job_id: job.id, position, label }),
      );
    });
    const oldApplications = new Map(
      previous?.applications.map((application) => [application.id, application]),
    );
    state.applications.forEach((application, list_position) => {
      const before = oldApplications.get(application.id);
      if (!before) {
        this.insert("applications", {
          ...encode(application, applicationFields),
          competency_snapshot_json: json(application.competency),
          submitted_at: application.events[0].at,
          list_position,
        });
      } else {
        const { events: beforeEvents, stage: beforeStage, ...beforeSnapshot } = before;
        const { events, stage, ...snapshot } = application;
        if (
          JSON.stringify(snapshot) !== JSON.stringify(beforeSnapshot) ||
          events.length < beforeEvents.length ||
          JSON.stringify(events.slice(0, beforeEvents.length)) !== JSON.stringify(beforeEvents)
        )
          throw new Error("Submitted snapshots and existing history are immutable.");
        // Stage is derived by the append trigger; no ordinary write may bypass the history.
        if (beforeStage !== stage && events.length === beforeEvents.length)
          throw new Error("A stage change requires a new event.");
      }
      application.events.slice(before?.events.length ?? 0).forEach((event, offset) =>
        this.insert("application_events", {
          application_id: application.id,
          position: (before?.events.length ?? 0) + offset,
          ...event,
        }),
      );
    });
    state.drafts.forEach((draft, list_position) =>
      this.insert("application_drafts", {
        ...encode(draft, draftFields),
        competency_responses_json: json(draft.competencyResponses),
        list_position,
      }),
    );
    state.employerDrafts?.forEach((draft, list_position) =>
      this.insert("job_editor_drafts", {
        employer_id: draft.employerId,
        job_id: draft.jobId ?? null,
        draft_json: JSON.stringify(draft.value),
        list_position,
      }),
    );
    state.saved.forEach((saved, list_position) =>
      this.insert("saved_jobs", {
        candidate_id: saved.candidateId,
        job_id: saved.jobId,
        list_position,
      }),
    );
  }
}
