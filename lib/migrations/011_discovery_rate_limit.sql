-- Discovery Mode — per-IP rate limiting — TEST BUILD
--
-- Additive only. Backs lib/discovery/rate-limit.ts's Postgres path. IPs are
-- stored as a SHA-256 hash, never in the clear.
CREATE TABLE IF NOT EXISTS discovery_rate_limit (
  ip_hash      TEXT NOT NULL,
  route        TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  count        INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (ip_hash, route)
);
