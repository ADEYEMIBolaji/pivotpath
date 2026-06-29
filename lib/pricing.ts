/**
 * Pricing model — pure, client-safe config and types.
 *
 * This module has NO server/database dependency, so it's safe to import from
 * client components (the pricing page, checkout UI). Operational quota logic and
 * anything that touches the database lives in ./subscription, which re-exports
 * everything here for server callers.
 *
 * Three recurring tiers, each billable monthly or annually:
 *   Free        £0            → skills translation map only, no résumé output
 *   Pivot       £19/mo · £99/yr → full résumé rewrite, gap scorecard, strategy brief
 *   Accelerate  £39/mo · £179/yr → everything in Pivot + live reviews & priority support
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
    cta: 'Get Pivot',
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
