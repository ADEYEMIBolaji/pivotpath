-- Migrate pricing model: one-off 6month/12month → recurring free/pivot/accelerate tiers.
-- Relaxes the plan CHECK constraints to the new tier ids. Existing rows (if any)
-- on the legacy ids are remapped: 6month → pivot, 12month → accelerate.

-- subscriptions.plan
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_check;
UPDATE subscriptions SET plan = 'pivot'      WHERE plan = '6month';
UPDATE subscriptions SET plan = 'accelerate' WHERE plan = '12month';
ALTER TABLE subscriptions
  ADD CONSTRAINT subscriptions_plan_check CHECK (plan IN ('pivot', 'accelerate'));

-- discount_codes.plan (nullable — a null plan means "any plan")
ALTER TABLE discount_codes DROP CONSTRAINT IF EXISTS discount_codes_plan_check;
UPDATE discount_codes SET plan = 'pivot'      WHERE plan = '6month';
UPDATE discount_codes SET plan = 'accelerate' WHERE plan = '12month';
ALTER TABLE discount_codes
  ADD CONSTRAINT discount_codes_plan_check CHECK (plan IN ('pivot', 'accelerate'));
