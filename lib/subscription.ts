/**
 * Subscription plans, usage limits and quota enforcement.
 *
 * Three recurring tiers, each billable monthly or annually:
 *   Free        £0            → skills translation map only, no résumé output
 *   Pivot       £19/mo · £99/yr → full résumé rewrite, gap scorecard, strategy brief
 *   Accelerate  £39/mo · £179/yr → everything in Pivot + live reviews & priority support
 *
 * PRICING_CONFIG below is the single source of truth for marketing/display
 * (names, prices, features, badges, CTAs). Operational limits (analysis quota,
 * job-refresh throttle) live in PLAN_LIMITS — they aren't customer-facing copy.
 *
 * Results are cached per pivot — re-opening the same session never consumes quota.
 */

export type PlanId = 'free' | 'pivot' | 'accelerate'
export type BillingCycle = 'monthly' | 'annual'

/** Customer-facing pricing/display config — the single source of truth for the
 *  pricing page, checkout and any upgrade prompts. Prices are in GBP pence. */
export interface TierConfig {
  id: PlanId
  name: string
  monthlyPrice: number   // GBP pence (0 for free)
  annualPrice: number    // GBP pence (0 for free)
  features: string[]
  badge?: string
  cta: string
  highlighted?: boolean
}

export const PRICING_CONFIG: Record<PlanId, TierConfig> = {
  free: {
    id: 'free',
    name: 'Free',
    monthlyPrice: 0,
    annualPrice: 0,
    features: ['Skills translation map only, no résumé output'],
    cta: 'Start free',
  },
  pivot: {
    id: 'pivot',
    name: 'Pivot',
    monthlyPrice: 1900,    // £19/month
    annualPrice: 9900,     // £99/year
    features: ['Full résumé rewrite', 'Gap scorecard', 'Application strategy brief'],
    badge: 'Most popular',
    cta: 'Start 7-day trial',
    highlighted: true,
  },
  accelerate: {
    id: 'accelerate',
    name: 'Accelerate',
    monthlyPrice: 3900,    // £39/month
    annualPrice: 17900,    // £179/year
    features: ['Everything in Pivot', '3 live CV reviews', 'Priority support', 'Updated analyses'],
    badge: 'Best value',
    cta: 'Get Accelerate',
  },
}

/** Operational limits (not customer-facing copy). Tune freely — these keep AI
 *  cost within each tier's margin and throttle job-refresh abuse. */
export interface PlanLimits {
  pivotLimit: number      // max full analyses per billing window
  jobRefreshHours: number // min hours between job refreshes
}

export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  free:       { pivotLimit: 1,  jobRefreshHours: 24 },
  pivot:      { pivotLimit: 10, jobRefreshHours: 12 },
  accelerate: { pivotLimit: 30, jobRefreshHours: 6 },
}

/** Months of access granted per billing cycle (used to compute expiry). */
export const CYCLE_MONTHS: Record<BillingCycle, number> = { monthly: 1, annual: 12 }

export interface Plan extends TierConfig, PlanLimits {}

/** Merged operational view of a tier (display config + limits). */
export const PLANS: Record<PlanId, Plan> = {
  free:       { ...PRICING_CONFIG.free, ...PLAN_LIMITS.free },
  pivot:      { ...PRICING_CONFIG.pivot, ...PLAN_LIMITS.pivot },
  accelerate: { ...PRICING_CONFIG.accelerate, ...PLAN_LIMITS.accelerate },
}

/** Price (GBP pence) for a tier on a given billing cycle. */
export function priceForCycle(planId: PlanId, cycle: BillingCycle): number {
  const tier = PRICING_CONFIG[planId]
  if (!tier) return 0
  return cycle === 'annual' ? tier.annualPrice : tier.monthlyPrice
}

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
