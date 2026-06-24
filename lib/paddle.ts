/**
 * Paddle (Merchant of Record) server-side configuration.
 *
 * Client checkout uses Paddle.js with NEXT_PUBLIC_* vars (see lib used in
 * the /checkout page). This module is the server side: mapping plans to
 * Paddle Price IDs and verifying webhooks.
 */

import { Paddle, Environment } from '@paddle/paddle-node-sdk'
import type { PlanId } from './subscription'

export function isPaddleConfigured(): boolean {
  return Boolean(process.env.PADDLE_API_KEY && priceIdForPlan('6month') && priceIdForPlan('12month'))
}

/** Maps our internal plan id to the Paddle Price ID (pri_...). */
export function priceIdForPlan(plan: PlanId): string | undefined {
  if (plan === '6month') return process.env.NEXT_PUBLIC_PADDLE_PRICE_6MONTH || undefined
  if (plan === '12month') return process.env.NEXT_PUBLIC_PADDLE_PRICE_12MONTH || undefined
  return undefined
}

/** Reverse lookup: Paddle Price ID → our plan id (used in the webhook). */
export function planForPriceId(priceId: string): PlanId | undefined {
  if (priceId && priceId === process.env.NEXT_PUBLIC_PADDLE_PRICE_6MONTH) return '6month'
  if (priceId && priceId === process.env.NEXT_PUBLIC_PADDLE_PRICE_12MONTH) return '12month'
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
