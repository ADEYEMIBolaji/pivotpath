-- Discovery Mode ("Skills Translator") — TEST BUILD
--
-- Purely additive: four new tables, no changes to any existing table.
-- Safe to run against the production schema without affecting existing users;
-- nothing in the main app reads or writes these tables.
--
-- A "run" is one pass through the Discovery flow. It is keyed by its own id
-- (generated client-side and kept in localStorage) so signed-out visitors can
-- complete the flow; user_id is filled in opportunistically when the visitor
-- happens to be signed in.

-- ─── Step 1: evidence intake ──────────────────────────────────────────────────
-- Selection-first: users tap pointer chips (seeded in lib/discovery/chip-seed.ts,
-- not this schema) rather than starting from a blank text box. `selections`
-- stores only chip ids + optional one-line notes — labels and the hidden
-- functional-skill signal are resolved server-side from the seed data, never
-- trusted from the client. `other_notes` is the single free-standing optional
-- field at the end of the form.
CREATE TABLE IF NOT EXISTS discovery_intake (
  id           TEXT PRIMARY KEY,            -- the discovery run id
  user_id      TEXT,                        -- null for anonymous runs
  selections   JSONB NOT NULL,              -- { [promptId]: [{ chipId, note? }] }
  other_notes  TEXT,                        -- optional final "anything else?" field
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS discovery_intake_user_idx
  ON discovery_intake (user_id, created_at DESC);

-- ─── Step 2: functional skills map ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS discovery_skills_map (
  run_id       TEXT PRIMARY KEY REFERENCES discovery_intake (id) ON DELETE CASCADE,
  functions    JSONB NOT NULL,              -- [{ name, summary, evidence[] }]
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Step 3: surfaced adjacent roles ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS discovery_roles (
  id             TEXT PRIMARY KEY,          -- run_id + ':' + rank
  run_id         TEXT NOT NULL REFERENCES discovery_intake (id) ON DELETE CASCADE,
  rank           INTEGER NOT NULL,          -- original suggestion order (0-based)
  title          TEXT NOT NULL,
  industry       TEXT,
  why_fits       TEXT NOT NULL,
  functions_used JSONB NOT NULL,            -- string[] — which functions transfer
  gap            TEXT NOT NULL,             -- one honest translation challenge
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (run_id, rank)
);

CREATE INDEX IF NOT EXISTS discovery_roles_run_idx ON discovery_roles (run_id, rank);

-- ─── Step 4: swipe reactions ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS discovery_reactions (
  run_id       TEXT NOT NULL REFERENCES discovery_intake (id) ON DELETE CASCADE,
  role_id      TEXT NOT NULL REFERENCES discovery_roles (id) ON DELETE CASCADE,
  reaction     TEXT NOT NULL CHECK (reaction IN ('like', 'pass', 'unsure')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (run_id, role_id)
);
