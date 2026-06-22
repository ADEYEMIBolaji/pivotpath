-- Sessions table
-- Each row holds a full AnalysisSession as JSONB columns for flexibility.

CREATE TABLE IF NOT EXISTS sessions (
  id               TEXT PRIMARY KEY,
  user_id          TEXT,
  profile          JSONB NOT NULL,
  target           JSONB NOT NULL,
  translation_map  JSONB,
  gap_scorecard    JSONB,
  resume           JSONB,
  strategy         JSONB,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sessions_updated_at_idx ON sessions (updated_at DESC);
