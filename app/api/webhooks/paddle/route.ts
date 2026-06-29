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
import { activateSubscription, type PlanId, type BillingCycle } from '@/lib/subscription'
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
    console.error('[paddle webhook] signature verification FAILED — check PADDLE_WEBHOOK_SECRET is the destination Secret key, not its id:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (!event) return NextResponse.json({ ok: true })

  console.log('[paddle webhook] received', event.eventType)

  // Fulfil on completed OR paid (whichever Paddle sends first for a one-off)
  if (event.eventType === 'transaction.completed' || event.eventType === 'transaction.paid') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = event.data as any
    const customData = (data?.customData ?? {}) as { userId?: string; plan?: string; cycle?: string; code?: string | null }

    // Prefer plan/cycle from customData; fall back to the purchased price id
    let plan = customData.plan as PlanId | undefined
    let cycle = (customData.cycle === 'annual' ? 'annual' : customData.cycle === 'monthly' ? 'monthly' : undefined) as BillingCycle | undefined
    if (!plan || !cycle) {
      const priceId: string | undefined = data?.items?.[0]?.price?.id
      const resolved = priceId ? planForPriceId(priceId) : undefined
      if (resolved) { plan = plan ?? resolved.plan; cycle = cycle ?? resolved.cycle }
    }

    const userId = customData.userId
    const paymentRef = `paddle:${data?.id ?? signature.slice(0, 24)}`

    console.log('[paddle webhook] fulfilment', { userId: userId ?? null, plan: plan ?? null, cycle: cycle ?? null, hasCustomData: !!data?.customData })

    if (userId && plan) {
      const ok = await activateSubscription(userId, plan, paymentRef, cycle ?? 'monthly')
      if (ok && customData.code) {
        await redeemDiscount(customData.code, userId).catch(() => {})
      }
      console.log('[paddle webhook] activation', ok ? 'OK' : 'FAILED', { userId, plan, paymentRef })
    } else {
      console.error('[paddle webhook] missing userId/plan — customData was:', JSON.stringify(data?.customData ?? null))
    }
  }

  // Always 200 quickly so Paddle doesn't retry a handled event
  return NextResponse.json({ ok: true })
}
