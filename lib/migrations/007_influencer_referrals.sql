-- Influencer referral codes: a discount code doubles as a referral tag so we can
-- track which social-media influencer a new user came from.

-- Label the influencer a code belongs to (null = not an influencer code)
ALTER TABLE discount_codes ADD COLUMN IF NOT EXISTS influencer TEXT;

-- Capture the referral on the user record at sign up, so we can attribute a new
-- user to an influencer even if they never reach checkout.
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code   TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_source TEXT;   -- influencer name
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_at     TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS users_referral_source_idx ON users (referral_source);

-- Seed the three influencer codes: 20% off any plan, once per user.
-- max_redemptions stays null (unlimited total shares); the unique redemption per
-- user in discount_redemptions enforces "usable once" per person.
INSERT INTO discount_codes (code, percent_off, influencer, note)
VALUES
  ('PIVOTESTHER20',  20, 'Esther',   'Influencer — Esther (pharmacy → product manager)'),
  ('PIVOTKIARA20',   20, 'Kiara',    'Influencer — Kiara (student)'),
  ('PIVOTKATHURA20', 20, 'Kathura',  'Influencer — Kathura (student)')
ON CONFLICT (code) DO UPDATE
  SET percent_off = EXCLUDED.percent_off,
      influencer  = EXCLUDED.influencer,
      note        = EXCLUDED.note,
      active      = TRUE;
