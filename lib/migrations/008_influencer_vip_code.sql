-- A shareable 100%-off code for influencers to explore the full product for free.
-- 100% off means /api/checkout activates the plan immediately with no payment.
-- max_redemptions caps total uses so a leaked code can't be drained; bump or set
-- NULL (unlimited) any time, or set active = FALSE to disable it.

INSERT INTO discount_codes (code, percent_off, plan, max_redemptions, note)
VALUES
  ('PIVOTVIP', 100, NULL, 25, 'Influencer VIP — full free access to explore the product')
ON CONFLICT (code) DO UPDATE
  SET percent_off     = EXCLUDED.percent_off,
      max_redemptions = EXCLUDED.max_redemptions,
      note            = EXCLUDED.note,
      active          = TRUE;
