/**
 * Subscription plans, usage limits and quota enforcement.
 *
 * Usage limits are designed to keep AI costs within the margin of each plan:
 *   6-month  £5  → max 3 pivot analyses  (leaves ~£2.50 margin after API costs)
 *   12-month £9  → max 7 pivot analyses  (leaves ~£3.50 margin after API costs)
 *   Free tier    → max 1 pivot analysis  (demo / trial)
 *
 * Job refresh is throttled to once per 24 hours per user (API cost is low but
 * prevents abuse from repeat calls).
 *
 * Results are cached per pivot — re-opening the same session never consumes quota.
 */

export type PlanId = 'free' | '6month' | '12month'

export interface Plan {
  id: PlanId
  name: string
  price: number          // GBP pence
  durationMonths: number
  pivotLimit: number     // max full analyses per subscription window
  jobRefreshHours: number // min hours between job refreshes
  badge?: string
}

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    durationMonths: 0,
    pivotLimit: 1,
    jobRefreshHours: 24,
  },
  '6month': {
    id: '6month',
    name: '6 months',
    price: 500,   // £5.00
    durationMonths: 6,
    pivotLimit: 3,
    jobRefreshHours: 12,
    badge: 'Most popular',
  },
  '12month': {
    id: '12month',
    name: '12 months',
    price: 900,   // £9.00
    durationMonths: 12,
    pivotLimit: 7,
    jobRefreshHours: 6,
    badge: 'Best value',
  },
}

// ─── Quota check ─────────────────────────────────────────────────────────────

export interface QuotaResult {
  allowed: boolean
  reason?: string
  used: number
  limit: number
  planId: PlanId
}

export async function checkPivotQuota(userId: string): Promise<QuotaResult> {
  if (!process.env.DATABASE_URL) {
    // File-based / dev mode: always allow (no subscription tracking)
    return { allowed: true, used: 0, limit: 99, planId: 'free' }
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
 * Idempotent-ish: a duplicate webhook with the same paymentRef won't double-insert.
 */
export async function activateSubscription(
  userId: string,
  planId: PlanId,
  paymentRef: string,
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

    const expires = new Date()
    expires.setMonth(expires.getMonth() + plan.durationMonths)
    await query(
      `INSERT INTO subscriptions (user_id, plan, status, expires_at, payment_ref)
       VALUES ($1, $2, 'active', $3, $4)`,
      [userId, plan.id, expires.toISOString(), paymentRef],
    )
    return true
  } catch (err) {
    console.error('[activateSubscription]', err)
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
