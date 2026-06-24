/**
 * Discount code validation and redemption.
 *
 * A code reduces the one-off plan price by a percentage. A 100%-off code
 * grants free access (used for beta partners). Codes can be limited to a
 * plan, capped by total redemptions, and given an expiry.
 */

import { PLANS, type PlanId } from './subscription'

export interface DiscountResult {
  valid: boolean
  reason?: string
  code?: string
  percentOff?: number
  originalPrice?: number  // pence
  finalPrice?: number     // pence
}

export async function validateDiscount(rawCode: string, planId: PlanId): Promise<DiscountResult> {
  const code = rawCode.trim().toUpperCase()
  const plan = PLANS[planId]
  if (!plan || plan.price === 0) {
    return { valid: false, reason: 'Discounts apply to paid plans only.' }
  }
  if (!code) return { valid: false, reason: 'Enter a code.' }

  if (!process.env.DATABASE_URL) {
    return { valid: false, reason: 'Discount codes are unavailable right now.' }
  }

  try {
    const { query } = await import('./db')
    const rows = await query<{
      id: string
      percent_off: number
      plan: string | null
      max_redemptions: number | null
      redeemed_count: number
      expires_at: string | null
      active: boolean
    }>(
      'SELECT id, percent_off, plan, max_redemptions, redeemed_count, expires_at, active FROM discount_codes WHERE code = $1',
      [code],
    )

    const dc = rows[0]
    if (!dc || !dc.active) return { valid: false, reason: 'That code isn’t valid.' }
    if (dc.expires_at && new Date(dc.expires_at) < new Date()) {
      return { valid: false, reason: 'That code has expired.' }
    }
    if (dc.plan && dc.plan !== planId) {
      return { valid: false, reason: `That code only applies to the ${PLANS[dc.plan as PlanId]?.name ?? dc.plan} plan.` }
    }
    if (dc.max_redemptions !== null && dc.redeemed_count >= dc.max_redemptions) {
      return { valid: false, reason: 'That code has been fully redeemed.' }
    }

    const finalPrice = Math.round(plan.price * (1 - dc.percent_off / 100))
    return {
      valid: true,
      code,
      percentOff: dc.percent_off,
      originalPrice: plan.price,
      finalPrice,
    }
  } catch {
    return { valid: false, reason: 'Couldn’t check that code. Try again.' }
  }
}

/** Marks a code redeemed by a user and bumps the counter. Idempotent per user/code. */
export async function redeemDiscount(rawCode: string, userId: string): Promise<boolean> {
  const code = rawCode.trim().toUpperCase()
  if (!process.env.DATABASE_URL) return false
  try {
    const { query } = await import('./db')
    const rows = await query<{ id: string }>('SELECT id FROM discount_codes WHERE code = $1', [code])
    const codeId = rows[0]?.id
    if (!codeId) return false

    // One redemption per user per code
    const inserted = await query<{ id: string }>(
      `INSERT INTO discount_redemptions (code_id, user_id) VALUES ($1, $2)
       ON CONFLICT (code_id, user_id) DO NOTHING RETURNING id`,
      [codeId, userId],
    )
    if (inserted.length > 0) {
      await query('UPDATE discount_codes SET redeemed_count = redeemed_count + 1 WHERE id = $1', [codeId])
    }
    return true
  } catch {
    return false
  }
}
