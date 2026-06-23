-- NextAuth + PivotPath user tables

CREATE TABLE IF NOT EXISTS users (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name         TEXT,
  email        TEXT UNIQUE NOT NULL,
  email_verified TIMESTAMPTZ,
  image        TEXT,
  password_hash TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS accounts (
  id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id             TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type                TEXT NOT NULL,
  provider            TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  refresh_token       TEXT,
  access_token        TEXT,
  expires_at          BIGINT,
  token_type          TEXT,
  scope               TEXT,
  id_token            TEXT,
  session_state       TEXT,
  UNIQUE (provider, provider_account_id)
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  session_token TEXT UNIQUE NOT NULL,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires       TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier TEXT NOT NULL,
  token      TEXT UNIQUE NOT NULL,
  expires    TIMESTAMPTZ NOT NULL,
  UNIQUE (identifier, token)
);

CREATE INDEX IF NOT EXISTS accounts_user_id_idx         ON accounts (user_id);
CREATE INDEX IF NOT EXISTS auth_sessions_user_id_idx    ON auth_sessions (user_id);
CREATE INDEX IF NOT EXISTS auth_sessions_token_idx      ON auth_sessions (session_token);
