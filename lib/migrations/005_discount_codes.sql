-- Discount / promo codes for subscription checkout

CREATE TABLE IF NOT EXISTS discount_codes (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  code             TEXT UNIQUE NOT NULL,           -- stored uppercase
  percent_off      INTEGER NOT NULL CHECK (percent_off > 0 AND percent_off <= 100),
  -- Optional restriction to a single plan; null = any plan
  plan             TEXT CHECK (plan IN ('6month', '12month')),
  max_redemptions  INTEGER,                        -- null = unlimited
  redeemed_count   INTEGER NOT NULL DEFAULT 0,
  expires_at       TIMESTAMPTZ,                    -- null = never
  active           BOOLEAN NOT NULL DEFAULT TRUE,
  note             TEXT,                           -- internal note (e.g. "Launch partners")
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Track which user redeemed which code (one redemption per user per code)
CREATE TABLE IF NOT EXISTS discount_redemptions (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  code_id     TEXT NOT NULL REFERENCES discount_codes(id) ON DELETE CASCADE,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (code_id, user_id)
);

CREATE INDEX IF NOT EXISTS discount_codes_code_idx ON discount_codes (code);

-- Seed a few launch codes (idempotent)
INSERT INTO discount_codes (code, percent_off, note)
VALUES
  ('LAUNCH50', 50, 'Launch — 50% off any plan'),
  ('PIVOT100', 100, 'Beta partners — free access'),
  ('WELCOME20', 20, 'Welcome — 20% off')
ON CONFLICT (code) DO NOTHING;
