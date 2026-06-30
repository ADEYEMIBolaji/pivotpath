/**
 * Lemon Squeezy (Merchant of Record) server-side integration.
 *
 * Replaces Paddle. Checkouts are created server-side via the LS API (so variant
 * IDs and the API key never reach the browser), then opened in the Lemon.js
 * overlay on the client. Fulfilment is driven by signed webhooks.
 *
 * Dashboard → Settings → API for the API key; Settings → Webhooks for the signing
 * secret; Products → your subscription variants for the variant IDs.
 */

import crypto from 'crypto'
import type { PlanId, BillingCycle } from './subscription'

const LS_API = 'https://api.lemonsqueezy.com/v1'

export function isLemonConfigured(): boolean {
  return Boolean(
    process.env.LEMONSQUEEZY_API_KEY &&
      process.env.LEMONSQUEEZY_STORE_ID &&
      variantIdForPlan('pivot', 'monthly') &&
      variantIdForPlan('pivot', 'annual') &&
      variantIdForPlan('accelerate', 'monthly') &&
      variantIdForPlan('accelerate', 'annual'),
  )
}

/** Maps an internal plan + billing cycle to the Lemon Squeezy variant id. */
export function variantIdForPlan(plan: PlanId, cycle: BillingCycle): string | undefined {
  const env = process.env
  if (plan === 'pivot') {
    return (cycle === 'annual' ? env.LEMONSQUEEZY_VARIANT_PIVOT_ANNUAL : env.LEMONSQUEEZY_VARIANT_PIVOT_MONTHLY) || undefined
  }
  if (plan === 'accelerate') {
    return (cycle === 'annual' ? env.LEMONSQUEEZY_VARIANT_ACCELERATE_ANNUAL : env.LEMONSQUEEZY_VARIANT_ACCELERATE_MONTHLY) || undefined
  }
  return undefined
}

/** Reverse lookup: LS variant id → our plan + cycle (used as a webhook fallback). */
export function planForVariantId(variantId: string | number): { plan: PlanId; cycle: BillingCycle } | undefined {
  if (!variantId) return undefined
  const id = String(variantId)
  const env = process.env
  if (id === env.LEMONSQUEEZY_VARIANT_PIVOT_MONTHLY) return { plan: 'pivot', cycle: 'monthly' }
  if (id === env.LEMONSQUEEZY_VARIANT_PIVOT_ANNUAL) return { plan: 'pivot', cycle: 'annual' }
  if (id === env.LEMONSQUEEZY_VARIANT_ACCELERATE_MONTHLY) return { plan: 'accelerate', cycle: 'monthly' }
  if (id === env.LEMONSQUEEZY_VARIANT_ACCELERATE_ANNUAL) return { plan: 'accelerate', cycle: 'annual' }
  return undefined
}

export interface CreateCheckoutArgs {
  plan: PlanId
  cycle: BillingCycle
  email?: string | null
  /** Echoed back to us in the webhook's meta.custom_data to fulfil the order. */
  custom: { userId: string; plan: PlanId; cycle: BillingCycle; code?: string | null }
  /** Optional LS discount code (must exist as a discount in the LS store). */
  discountCode?: string | null
  redirectUrl: string
}

/**
 * Creates a hosted checkout and returns its URL (open it in the Lemon.js overlay).
 * Throws on misconfiguration or a non-2xx from the LS API.
 */
export async function createCheckout(args: CreateCheckoutArgs): Promise<string> {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY
  const storeId = process.env.LEMONSQUEEZY_STORE_ID
  const variantId = variantIdForPlan(args.plan, args.cycle)
  if (!apiKey || !storeId || !variantId) throw new Error('Lemon Squeezy is not configured')

  // LS custom_data values must be strings.
  const custom: Record<string, string> = {
    user_id: args.custom.userId,
    plan: args.custom.plan,
    cycle: args.custom.cycle,
  }
  if (args.custom.code) custom.code = args.custom.code

  const body = {
    data: {
      type: 'checkouts',
      attributes: {
        checkout_data: {
          ...(args.email ? { email: args.email } : {}),
          custom,
          ...(args.discountCode ? { discount_code: args.discountCode } : {}),
        },
        product_options: {
          redirect_url: args.redirectUrl,
          enabled_variants: [Number(variantId)],
        },
        checkout_options: { embed: true, dark: true },
      },
      relationships: {
        store: { data: { type: 'stores', id: String(storeId) } },
        variant: { data: { type: 'variants', id: String(variantId) } },
      },
    },
  }

  const res = await fetch(`${LS_API}/checkouts`, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`LS checkout failed (${res.status}): ${text.slice(0, 300)}`)
  }

  const json = (await res.json()) as { data?: { attributes?: { url?: string } } }
  const url = json.data?.attributes?.url
  if (!url) throw new Error('LS checkout response had no url')
  return url
}

/**
 * Verifies a Lemon Squeezy webhook signature (HMAC-SHA256 of the raw body with
 * the signing secret, compared in constant time to the X-Signature header).
 */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET
  if (!secret || !signature) return false
  const digest = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  const a = Buffer.from(digest, 'utf8')
  const b = Buffer.from(signature, 'utf8')
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}
