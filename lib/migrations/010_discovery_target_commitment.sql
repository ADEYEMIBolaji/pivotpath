-- Discovery Mode — target-role commitment bridge — TEST BUILD
--
-- Additive only; doesn't touch any existing table, including the four from
-- migration 009. Never applied against any real database — safe to amend in
-- place if this needs to change before it ever ships.
--
-- This is the missing link after Discovery Mode's shortlist: the rest of the
-- funnel (positioning, applications, interview prep) assumes ONE committed
-- target role. Both personas converge on this single table:
--
--   Persona A ("The Unsure")  — commits from a Discovery Mode shortlist via
--                               /discovery-test. run_id and role_id are set;
--                               plain_language_line is copied from the role.
--   Persona B ("The Decided") — commits directly via /target-role free text,
--                               skipping Discovery Mode entirely. run_id and
--                               role_id are null.
--
-- `id` is upserted, not append-only — "change target role" (a stub for now)
-- re-submits the same id so the row updates rather than accumulating history.
CREATE TABLE IF NOT EXISTS discovery_target_commitment (
  id                   TEXT PRIMARY KEY,
  user_id              TEXT,                       -- null for anonymous commitments
  run_id               TEXT REFERENCES discovery_intake (id) ON DELETE SET NULL,
  role_id              TEXT REFERENCES discovery_roles (id) ON DELETE SET NULL,
  source               TEXT NOT NULL CHECK (source IN ('discovery', 'direct')),
  role_title           TEXT NOT NULL,
  plain_language_line  TEXT,                        -- set for Persona A, null for Persona B's free text
  committed_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS discovery_target_commitment_user_idx
  ON discovery_target_commitment (user_id, committed_at DESC);
