/**
 * Subscription usage limits, quota enforcement and activation.
 *
 * The pure pricing model (tier config, prices, limits, types) lives in
 * ./pricing — a client-safe module with no database dependency. We re-export it
 * here so server callers can keep importing everything from one place, while
 * client components import directly from ./pricing and never pull in `pg`.
 *
 * Results are cached per pivot — re-opening the same session never consumes quota.
 */

export type { PlanId, BillingCycle, TierConfig, PlanLimits, Plan } from './pricing'
export { PRICING_CONFIG, PLAN_LIMITS, CYCLE_MONTHS, PLANS, priceForCycle } from './pricing'

import { PLANS, CYCLE_MONTHS, type PlanId, type BillingCycle } from './pricing'

// ─── Quota check ─────────────────────────────────────────────────────────────

export interface QuotaResult {
  allowed: boolean
  reason?: string
  used: number
  limit: number
  planId: PlanId
}

export interface ActiveSubscription {
  plan: PlanId
  expiresAt: string
}

/** Returns the user's active paid subscription, or null if they're on the free tier. */
export async function getActiveSubscription(userId: string): Promise<ActiveSubscription | null> {
  if (!process.env.DATABASE_URL) return null
  try {
    const { query } = await import('./db')
    const rows = await query<{ plan: PlanId; expires_at: string }>(
      `SELECT plan, expires_at FROM subscriptions
       WHERE user_id = $1 AND status = 'active' AND expires_at > NOW()
       ORDER BY expires_at DESC LIMIT 1`,
      [userId],
    )
    const sub = rows[0]
    return sub ? { plan: sub.plan, expiresAt: sub.expires_at } : null
  } catch {
    return null
  }
}

export async function checkPivotQuota(userId: string): Promise<QuotaResult> {
  if (!process.env.DATABASE_URL) {
    // File-based / dev mode: always allow (no subscription tracking)
    return { allowed: true, used: 0, limit: 99, planId: 'free' }
  }

  // Reviewer demo account — unlimited runs so approval teams can explore freely.
  const { isDemoUser } = await import('./demo')
  if (isDemoUser(userId)) {
    return { allowed: true, used: 0, limit: 99, planId: 'accelerate' }
  }

  try {
    const { query } = await import('./db')

    // Find active subscription
    const subs = await query<{ id: string; plan: PlanId; expires_at: string }>(
      `SELECT id, plan, expires_at FROM subscriptions
       WHERE user_id = $1 AND status = 'active' AND expires_at > NOW()
       ORDER BY expires_at DESC LIMIT 1`,
      [userId],
    )

    const sub = subs[0]
    const planId: PlanId = sub?.plan ?? 'free'
    const plan = PLANS[planId]
    const subId = sub?.id ?? null

    // Count analyses used in this subscription window
    const windowStart = subId
      ? (await query<{ started_at: string }>(
          'SELECT started_at FROM subscriptions WHERE id = $1',
          [subId],
        ))[0]?.started_at
      : null

    const countRows = await query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM usage_events
       WHERE user_id = $1
         AND event_type = 'pivot_analysis'
         ${windowStart ? `AND created_at >= $2` : ''}`,
      windowStart ? [userId, windowStart] : [userId],
    )

    const used = parseInt(countRows[0]?.count ?? '0', 10)

    if (used >= plan.pivotLimit) {
      return {
        allowed: false,
        reason: subId
          ? `You've used all ${plan.pivotLimit} pivot analyses included in your ${plan.name} plan. Upgrade or wait for renewal.`
          : `Free accounts include 1 pivot analysis. Subscribe to run more.`,
        used,
        limit: plan.pivotLimit,
        planId,
      }
    }

    return { allowed: true, used, limit: plan.pivotLimit, planId }
  } catch {
    // DB error — allow the request through (fail open, not closed)
    return { allowed: true, used: 0, limit: 99, planId: 'free' }
  }
}

/**
 * Activates a subscription for a user. Used by:
 *  - the comp-code path in /api/checkout (100%-off codes)
 *  - the Paddle webhook once a payment completes
 *
 * Extend / upgrade behaviour: if the user already has an active plan, the new
 * plan's duration is stacked on top of their remaining time (so unused time
 * carries forward), and the usage window resets to now (granting the new
 * plan's full analysis allowance).
 *
 * Idempotent-ish: a duplicate webhook with the same paymentRef won't double-insert.
 */
export async function activateSubscription(
  userId: string,
  planId: PlanId,
  paymentRef: string,
  cycle: BillingCycle = 'monthly',
): Promise<boolean> {
  if (!process.env.DATABASE_URL) return false
  const plan = PLANS[planId]
  if (!plan || plan.id === 'free') return false
  try {
    const { query } = await import('./db')

    // Skip if we've already processed this exact payment (webhook retries)
    if (paymentRef) {
      const existing = await query<{ id: string }>(
        'SELECT id FROM subscriptions WHERE payment_ref = $1 LIMIT 1',
        [paymentRef],
      )
      if (existing.length > 0) return true
    }

    // Stack on top of any remaining time from a current active plan
    const current = await getActiveSubscription(userId)
    const base = current ? new Date(Math.max(Date.now(), new Date(current.expiresAt).getTime())) : new Date()
    const expires = new Date(base)
    expires.setMonth(expires.getMonth() + CYCLE_MONTHS[cycle])

    await query(
      `INSERT INTO subscriptions (user_id, plan, status, started_at, expires_at, payment_ref)
       VALUES ($1, $2, 'active', NOW(), $3, $4)`,
      [userId, plan.id, expires.toISOString(), paymentRef],
    )
    return true
  } catch (err) {
    console.error('[activateSubscription]', err)
    return false
  }
}

/**
 * Revokes a user's active subscription(s). Called from the Paddle webhook when
 * Paddle reports the subscription has ended (subscription.canceled) — which, for
 * a customer-requested cancellation, fires at the end of the paid period, so
 * access naturally runs until then. Marking the rows 'cancelled' makes
 * getActiveSubscription return null on the next check.
 *
 * Idempotent: a duplicate cancel event is a harmless no-op.
 */
export async function cancelSubscription(userId: string): Promise<boolean> {
  if (!process.env.DATABASE_URL) return false
  try {
    const { query } = await import('./db')
    await query(
      `UPDATE subscriptions SET status = 'cancelled'
       WHERE user_id = $1 AND status = 'active'`,
      [userId],
    )
    return true
  } catch (err) {
    console.error('[cancelSubscription]', err)
    return false
  }
}

export async function recordPivotUsage(
  userId: string,
  provider: string,
  tokensIn = 0,
  tokensOut = 0,
): Promise<void> {
  if (!process.env.DATABASE_URL) return
  try {
    const { query } = await import('./db')
    const subs = await query<{ id: string }>(
      `SELECT id FROM subscriptions WHERE user_id = $1 AND status = 'active' AND expires_at > NOW() ORDER BY expires_at DESC LIMIT 1`,
      [userId],
    )
    await query(
      `INSERT INTO usage_events (user_id, subscription_id, event_type, tokens_in, tokens_out, provider)
       VALUES ($1, $2, 'pivot_analysis', $3, $4, $5)`,
      [userId, subs[0]?.id ?? null, tokensIn, tokensOut, provider],
    )
  } catch { /* non-critical */ }
}
