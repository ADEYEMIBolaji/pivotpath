-- Link our discount codes to a Paddle discount (dsc_...) so paid-plan
-- discounts can be applied inside the Paddle checkout. Codes without a
-- Paddle id (e.g. 100%-off comp codes) are still activated in-app.

ALTER TABLE discount_codes ADD COLUMN IF NOT EXISTS paddle_discount_id TEXT;
