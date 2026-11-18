import { nextStages, stages } from "../src/features/prototype/model";

const values = (items: readonly string[]) => items.map((value) => `'${value}'`).join(", ");
export const AUTH_SCHEMA = `
  CREATE TABLE users (
    person_id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL, created_at INTEGER NOT NULL
  );
  CREATE TABLE sessions (
    token_hash TEXT PRIMARY KEY, person_id TEXT NOT NULL REFERENCES users(person_id), expires_at INTEGER NOT NULL
  );
  CREATE INDEX sessions_expiry ON sessions(expires_at);
  CREATE TABLE login_failures (address TEXT PRIMARY KEY, attempts INTEGER NOT NULL, until_at INTEGER NOT NULL);
`;
export const APPLICATION_COLUMNS = [
  "id",
  "job_id",
  "candidate_id",
  "company_id",
  "job_title_snapshot",
  "candidate_name_snapshot",
  "cv_snapshot",
  "answer_snapshot",
  "competency_snapshot_json",
  "source_notes",
  "generated_answer",
  "score_snapshot",
  "summary_snapshot",
  "submitted_at",
  "list_position",
] as const;
const previousStage =
  "(SELECT stage FROM application_events WHERE application_id = NEW.application_id ORDER BY position DESC LIMIT 1)";
const allowedTransition = Object.entries(nextStages)
  .filter(([, next]) => next.length)
  .map(([before, next]) => `(${previousStage} = '${before}' AND NEW.stage IN (${values(next)}))`)
  .join(" OR ");
export const RECRUITMENT_CLOSURE_COLUMN =
  "recruitment_closed_at TEXT CHECK(recruitment_closed_at IS NULL OR publication_status IN ('hidden','archived'))";

export const RELATIONAL_SCHEMA = `
  CREATE TABLE prototype_state (
    id INTEGER PRIMARY KEY CHECK(id = 1), data TEXT NOT NULL CHECK(json_valid(data) AND json_type(data) = 'object')
  ) STRICT;
  CREATE TABLE companies (
    id TEXT PRIMARY KEY NOT NULL, slug TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
    summary TEXT NOT NULL, description TEXT NOT NULL, website_url TEXT NOT NULL,
    location TEXT NOT NULL, size_label TEXT NOT NULL, logo_url TEXT,
    list_position INTEGER NOT NULL CHECK(list_position >= 0)
  ) STRICT;
  CREATE TABLE jobs (
    id TEXT PRIMARY KEY NOT NULL, slug TEXT NOT NULL UNIQUE,
    company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    title TEXT NOT NULL, summary TEXT NOT NULL, description TEXT NOT NULL,
    category TEXT NOT NULL CHECK(category IN ('build','apply','lead')),
    job_function TEXT NOT NULL CHECK(job_function IN ('product','engineering','data','design','marketing','operations')),
    remote_status TEXT NOT NULL CHECK(remote_status IN ('onsite','hybrid','remote')),
    seniority TEXT NOT NULL CHECK(seniority IN ('junior','mid','senior','lead')),
    contract TEXT NOT NULL CHECK(contract IN ('employment','b2b','mandate')),
    salary_min REAL CHECK(salary_min >= 0), salary_max REAL CHECK(salary_max >= 0),
    salary_currency TEXT CHECK(salary_currency IN ('PLN','EUR')),
    salary_period TEXT CHECK(salary_period IN ('month','year')),
    salary_kind TEXT CHECK(salary_kind IN ('gross','net')),
    latitude REAL CHECK(latitude BETWEEN -90 AND 90), longitude REAL CHECK(longitude BETWEEN -180 AND 180),
    publication_status TEXT NOT NULL CHECK(publication_status IN ('draft','review','published','hidden','expired','archived')),
    published_at TEXT NOT NULL, expires_at TEXT NOT NULL,
    ${RECRUITMENT_CLOSURE_COLUMN},
    verification_status TEXT NOT NULL CHECK(verification_status IN ('unverified','editorial','employer_verified')),
    source_brief TEXT, generated_description TEXT, generated_description_model TEXT,
    competency_card_json TEXT CHECK(competency_card_json IS NULL OR (json_valid(competency_card_json) AND json_type(competency_card_json) = 'object')),
    list_position INTEGER NOT NULL CHECK(list_position >= 0),
    CHECK(salary_min IS NULL OR salary_max IS NULL OR salary_min <= salary_max),
    CHECK((latitude IS NULL) = (longitude IS NULL)), UNIQUE(id, company_id)
  ) STRICT;
  CREATE INDEX jobs_publication ON jobs(publication_status, published_at DESC);
  CREATE INDEX jobs_company ON jobs(company_id, publication_status);
  CREATE TABLE job_locations (
    job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    position INTEGER NOT NULL CHECK(position BETWEEN 0 AND 9), label TEXT NOT NULL,
    PRIMARY KEY(job_id, position)
  ) STRICT;
  CREATE TABLE applications (
    id TEXT PRIMARY KEY NOT NULL,
    job_id TEXT NOT NULL, company_id TEXT NOT NULL,
    candidate_id TEXT NOT NULL REFERENCES users(person_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    job_title_snapshot TEXT NOT NULL, candidate_name_snapshot TEXT NOT NULL,
    cv_snapshot TEXT NOT NULL, answer_snapshot TEXT NOT NULL,
    competency_snapshot_json TEXT CHECK(competency_snapshot_json IS NULL OR (json_valid(competency_snapshot_json) AND json_type(competency_snapshot_json) = 'object')),
    source_notes TEXT NOT NULL, generated_answer TEXT NOT NULL,
    score_snapshot INTEGER NOT NULL CHECK(score_snapshot BETWEEN 0 AND 100), summary_snapshot TEXT NOT NULL,
    stage TEXT NOT NULL CHECK(stage IN (${values(stages)})), submitted_at TEXT NOT NULL,
    list_position INTEGER NOT NULL CHECK(list_position >= 0),
    UNIQUE(candidate_id, job_id),
    FOREIGN KEY(job_id, company_id) REFERENCES jobs(id, company_id) ON DELETE RESTRICT ON UPDATE RESTRICT
  ) STRICT;
  CREATE INDEX applications_company ON applications(company_id, stage, submitted_at DESC);
  CREATE INDEX applications_job ON applications(job_id, company_id, submitted_at DESC);
  CREATE TABLE application_events (
    application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    position INTEGER NOT NULL CHECK(position BETWEEN 0 AND 29),
    stage TEXT NOT NULL CHECK(stage IN (${values(stages)})), at TEXT NOT NULL, note TEXT NOT NULL,
    PRIMARY KEY(application_id, position)
  ) STRICT;
  CREATE TABLE application_drafts (
    candidate_id TEXT NOT NULL REFERENCES users(person_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    notes TEXT NOT NULL, generated TEXT NOT NULL, answer TEXT NOT NULL,
    competency_responses_json TEXT CHECK(competency_responses_json IS NULL OR (json_valid(competency_responses_json) AND json_type(competency_responses_json) = 'array')),
    competency_revision TEXT, list_position INTEGER NOT NULL CHECK(list_position >= 0),
    PRIMARY KEY(candidate_id, job_id)
  ) STRICT;
  CREATE INDEX application_drafts_job ON application_drafts(job_id);
  CREATE TABLE job_editor_drafts (
    id INTEGER PRIMARY KEY, employer_id TEXT NOT NULL REFERENCES users(person_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    job_id TEXT REFERENCES jobs(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    draft_json TEXT NOT NULL CHECK(json_valid(draft_json) AND json_type(draft_json) = 'object'),
    list_position INTEGER NOT NULL CHECK(list_position >= 0)
  ) STRICT;
  CREATE UNIQUE INDEX job_editor_existing ON job_editor_drafts(employer_id, job_id) WHERE job_id IS NOT NULL;
  CREATE UNIQUE INDEX job_editor_new ON job_editor_drafts(employer_id) WHERE job_id IS NULL;
  CREATE INDEX job_editor_job ON job_editor_drafts(job_id);
  CREATE TABLE saved_jobs (
    candidate_id TEXT NOT NULL REFERENCES users(person_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    list_position INTEGER NOT NULL CHECK(list_position >= 0), PRIMARY KEY(candidate_id, job_id)
  ) STRICT;
  CREATE INDEX saved_jobs_job ON saved_jobs(job_id);

  CREATE TRIGGER applications_immutable BEFORE UPDATE ON applications
  WHEN ${APPLICATION_COLUMNS.map((column) => `NEW.${column} IS NOT OLD.${column}`).join(" OR ")}
  BEGIN SELECT RAISE(ABORT, 'Submitted application snapshots are immutable'); END;
  CREATE TRIGGER applications_stage_from_history BEFORE UPDATE OF stage ON applications
  WHEN NEW.stage IS NOT COALESCE((SELECT stage FROM application_events WHERE application_id = OLD.id ORDER BY position DESC LIMIT 1), OLD.stage)
  BEGIN SELECT RAISE(ABORT, 'Application stage must match its history'); END;
  CREATE TRIGGER application_events_immutable BEFORE UPDATE ON application_events
  BEGIN SELECT RAISE(ABORT, 'Application history is append-only'); END;
  CREATE TRIGGER application_events_sequence BEFORE INSERT ON application_events
  BEGIN
    SELECT CASE WHEN NEW.position <> COALESCE((SELECT MAX(position) + 1 FROM application_events WHERE application_id = NEW.application_id), 0)
      THEN RAISE(ABORT, 'Application event order is invalid') END;
    SELECT CASE WHEN NEW.position = 0 AND (NEW.stage <> 'submitted' OR NEW.at <> (SELECT submitted_at FROM applications WHERE id = NEW.application_id))
      THEN RAISE(ABORT, 'Application must begin with submission') END;
    SELECT CASE WHEN NEW.position > 0 AND NOT (${allowedTransition} OR (NEW.stage = 'withdrawn' AND ${previousStage} NOT IN ('hired','rejected','withdrawn')))
      THEN RAISE(ABORT, 'Invalid application transition') END;
    SELECT CASE WHEN NEW.position > 0 AND NEW.at < (SELECT at FROM application_events WHERE application_id = NEW.application_id ORDER BY position DESC LIMIT 1)
      THEN RAISE(ABORT, 'Application timestamps are out of order') END;
  END;
  CREATE TRIGGER application_events_stage AFTER INSERT ON application_events
  BEGIN UPDATE applications SET stage = NEW.stage WHERE id = NEW.application_id; END;
`;
