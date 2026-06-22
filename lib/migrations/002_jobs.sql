-- Jobs aggregation tables (moved from lib/jobs/migrations/001_jobs.sql)

CREATE TABLE IF NOT EXISTS jobs (
  id                  TEXT PRIMARY KEY,
  dedup_key           TEXT UNIQUE NOT NULL,
  title               TEXT NOT NULL,
  employer            TEXT NOT NULL,
  primary_source      TEXT NOT NULL,
  primary_source_url  TEXT NOT NULL,
  also_listed_on      JSONB NOT NULL DEFAULT '[]',
  location            TEXT NOT NULL,
  remote              BOOLEAN,
  salary_min          INTEGER,
  salary_max          INTEGER,
  currency            TEXT NOT NULL DEFAULT 'GBP',
  posted_at           TIMESTAMPTZ NOT NULL,
  description_text    TEXT NOT NULL DEFAULT '',
  raw_skills          JSONB NOT NULL DEFAULT '[]',
  last_verified_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_refreshed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  dead_link           BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS jobs_primary_source_idx  ON jobs (primary_source);
CREATE INDEX IF NOT EXISTS jobs_posted_at_idx       ON jobs (posted_at DESC);
CREATE INDEX IF NOT EXISTS jobs_dead_link_idx       ON jobs (dead_link) WHERE dead_link = FALSE;
CREATE INDEX IF NOT EXISTS jobs_raw_skills_gin_idx  ON jobs USING GIN (raw_skills);

CREATE TABLE IF NOT EXISTS saved_jobs (
  id          TEXT PRIMARY KEY,
  session_id  TEXT NOT NULL,
  job_id      TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  saved_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, job_id)
);

CREATE INDEX IF NOT EXISTS saved_jobs_session_idx ON saved_jobs (session_id);

CREATE TABLE IF NOT EXISTS application_events (
  id          TEXT PRIMARY KEY,
  session_id  TEXT NOT NULL,
  job_id      TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  source      TEXT NOT NULL,
  applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS application_events_session_idx ON application_events (session_id);
