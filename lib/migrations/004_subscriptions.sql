-- Subscription plans and per-user usage tracking

CREATE TABLE IF NOT EXISTS subscriptions (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan         TEXT NOT NULL CHECK (plan IN ('6month', '12month')),
  status       TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  started_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at   TIMESTAMPTZ NOT NULL,
  -- Stripe / payment reference (null until payment integrated)
  payment_ref  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Per-user AI usage counters (resets are tracked by subscription window)
CREATE TABLE IF NOT EXISTS usage_events (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id TEXT REFERENCES subscriptions(id) ON DELETE SET NULL,
  event_type      TEXT NOT NULL CHECK (event_type IN ('pivot_analysis', 'job_refresh')),
  -- Approximate tokens consumed (for cost monitoring)
  tokens_in       INTEGER DEFAULT 0,
  tokens_out      INTEGER DEFAULT 0,
  provider        TEXT NOT NULL DEFAULT 'claude',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON subscriptions (user_id);
CREATE INDEX IF NOT EXISTS subscriptions_status_idx  ON subscriptions (status);
CREATE INDEX IF NOT EXISTS usage_events_user_id_idx  ON usage_events (user_id);
CREATE INDEX IF NOT EXISTS usage_events_sub_id_idx   ON usage_events (subscription_id);
