/**
 * Paddle (Merchant of Record) server-side configuration.
 *
 * Client checkout uses Paddle.js with NEXT_PUBLIC_* vars (see lib used in
 * the /checkout page). This module is the server side: mapping plans to
 * Paddle Price IDs and verifying webhooks.
 */

import { Paddle, Environment } from '@paddle/paddle-node-sdk'
import type { PlanId, BillingCycle } from './subscription'

export function isPaddleConfigured(): boolean {
  return Boolean(
    process.env.PADDLE_API_KEY &&
      priceIdForPlan('pivot', 'monthly') &&
      priceIdForPlan('pivot', 'annual') &&
      priceIdForPlan('accelerate', 'monthly') &&
      priceIdForPlan('accelerate', 'annual'),
  )
}

/** Maps an internal plan + billing cycle to the Paddle Price ID (pri_...). */
export function priceIdForPlan(plan: PlanId, cycle: BillingCycle): string | undefined {
  const env = process.env
  if (plan === 'pivot') {
    return (cycle === 'annual' ? env.NEXT_PUBLIC_PADDLE_PRICE_PIVOT_ANNUAL : env.NEXT_PUBLIC_PADDLE_PRICE_PIVOT_MONTHLY) || undefined
  }
  if (plan === 'accelerate') {
    return (cycle === 'annual' ? env.NEXT_PUBLIC_PADDLE_PRICE_ACCELERATE_ANNUAL : env.NEXT_PUBLIC_PADDLE_PRICE_ACCELERATE_MONTHLY) || undefined
  }
  return undefined
}

/** Reverse lookup: Paddle Price ID → our plan + cycle (used in the webhook). */
export function planForPriceId(priceId: string): { plan: PlanId; cycle: BillingCycle } | undefined {
  if (!priceId) return undefined
  const env = process.env
  if (priceId === env.NEXT_PUBLIC_PADDLE_PRICE_PIVOT_MONTHLY) return { plan: 'pivot', cycle: 'monthly' }
  if (priceId === env.NEXT_PUBLIC_PADDLE_PRICE_PIVOT_ANNUAL) return { plan: 'pivot', cycle: 'annual' }
  if (priceId === env.NEXT_PUBLIC_PADDLE_PRICE_ACCELERATE_MONTHLY) return { plan: 'accelerate', cycle: 'monthly' }
  if (priceId === env.NEXT_PUBLIC_PADDLE_PRICE_ACCELERATE_ANNUAL) return { plan: 'accelerate', cycle: 'annual' }
  return undefined
}

let _paddle: Paddle | null = null

/** Lazily-constructed Paddle Node SDK client (used for webhook verification). */
export function getPaddle(): Paddle {
  if (_paddle) return _paddle
  const apiKey = process.env.PADDLE_API_KEY
  if (!apiKey) throw new Error('PADDLE_API_KEY is not set')
  const environment =
    process.env.NEXT_PUBLIC_PADDLE_ENV === 'production' ? Environment.production : Environment.sandbox
  _paddle = new Paddle(apiKey, { environment })
  return _paddle
}
