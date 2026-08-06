-- Discovery Mode — real-postings grounding for Step 3 roles — TEST BUILD
--
-- Additive ALTER on discovery_roles only (nullable columns, no data loss for
-- existing rows). Migration 009 has already been applied to the test branch,
-- so this ships as its own migration rather than editing 009 in place.
--
-- Backs lib/discovery/postings.ts: each role's title is checked against real
-- UK postings via Adzuna. posting_count is null when Adzuna wasn't configured
-- or the lookup failed — never a fabricated number.
ALTER TABLE discovery_roles
  ADD COLUMN IF NOT EXISTS posting_count INTEGER,
  ADD COLUMN IF NOT EXISTS sample_postings JSONB NOT NULL DEFAULT '[]'::jsonb;
