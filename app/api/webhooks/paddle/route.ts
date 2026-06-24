/**
 * POST /api/webhooks/paddle
 *
 * Paddle calls this when a payment completes. This is the source of truth for
 * fulfilment (not the browser redirect). We verify the signature, then activate
 * the user's subscription from the customData we attached at checkout.
 *
 * Configure in Paddle: Developer Tools → Notifications → add this URL and
 * subscribe to "transaction.completed". Put the signing secret in
 * PADDLE_WEBHOOK_SECRET.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPaddle, planForPriceId } from '@/lib/paddle'
import { activateSubscription, type PlanId } from '@/lib/subscription'
import { redeemDiscount } from '@/lib/discount'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const secret = process.env.PADDLE_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  const signature = req.headers.get('paddle-signature') ?? ''
  const rawBody = await req.text()

  let event
  try {
    // Verifies the signature and parses the payload
    event = await getPaddle().webhooks.unmarshal(rawBody, secret, signature)
  } catch (err) {
    console.error('[paddle webhook] signature verification failed', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (!event) return NextResponse.json({ ok: true })

  // We only fulfil on a completed transaction (one-off purchase)
  if (event.eventType === 'transaction.completed') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = event.data as any
    const customData = (data?.customData ?? {}) as { userId?: string; plan?: string; code?: string | null }

    // Prefer plan from customData; fall back to the purchased price id
    let plan = customData.plan as PlanId | undefined
    if (!plan) {
      const priceId: string | undefined = data?.items?.[0]?.price?.id
      if (priceId) plan = planForPriceId(priceId)
    }

    const userId = customData.userId
    const paymentRef = `paddle:${data?.id ?? signature.slice(0, 24)}`

    if (userId && plan) {
      const ok = await activateSubscription(userId, plan, paymentRef)
      if (ok && customData.code) {
        await redeemDiscount(customData.code, userId).catch(() => {})
      }
      if (!ok) console.error('[paddle webhook] activation failed for', { userId, plan, paymentRef })
    } else {
      console.error('[paddle webhook] missing userId/plan in customData', customData)
    }
  }

  // Always 200 quickly so Paddle doesn't retry a handled event
  return NextResponse.json({ ok: true })
}
