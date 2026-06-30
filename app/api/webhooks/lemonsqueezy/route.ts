/**
 * POST /api/webhooks/lemonsqueezy
 *
 * Lemon Squeezy calls this on subscription events. This is the source of truth
 * for fulfilment (not the browser redirect). We verify the HMAC signature, then
 * activate or revoke the user's subscription from the customData attached at
 * checkout.
 *
 * Configure in Lemon Squeezy: Settings → Webhooks → add this URL, set the signing
 * secret as LEMONSQUEEZY_WEBHOOK_SECRET, and subscribe to: subscription_created,
 * subscription_payment_success, subscription_cancelled, subscription_expired.
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhookSignature, planForVariantId } from '@/lib/lemonsqueezy'
import { activateSubscription, cancelSubscription, type PlanId, type BillingCycle } from '@/lib/subscription'
import { redeemDiscount } from '@/lib/discount'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('x-signature')

  if (!verifyWebhookSignature(rawBody, signature)) {
    console.error('[ls webhook] signature verification FAILED — check LEMONSQUEEZY_WEBHOOK_SECRET matches the destination secret')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let payload: any
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const eventName: string = req.headers.get('x-event-name') ?? payload?.meta?.event_name ?? ''
  const custom = (payload?.meta?.custom_data ?? {}) as { user_id?: string; plan?: string; cycle?: string; code?: string | null }
  const attrs = payload?.data?.attributes ?? {}

  console.log('[ls webhook] received', eventName)

  const userId = custom.user_id

  // Resolve plan/cycle from customData, falling back to the variant id.
  let plan = custom.plan as PlanId | undefined
  let cycle = (custom.cycle === 'annual' ? 'annual' : custom.cycle === 'monthly' ? 'monthly' : undefined) as BillingCycle | undefined
  if (!plan || !cycle) {
    const resolved = attrs.variant_id ? planForVariantId(attrs.variant_id) : undefined
    if (resolved) { plan = plan ?? resolved.plan; cycle = cycle ?? resolved.cycle }
  }

  // Fulfil on every successful payment (first purchase + each renewal). The
  // invoice/event id makes the payment ref unique, so activateSubscription
  // stacks one billing period per payment and dedupes webhook retries.
  if (eventName === 'subscription_payment_success') {
    const paymentRef = `ls:${payload?.data?.id ?? signature?.slice(0, 24)}`
    console.log('[ls webhook] fulfilment', { userId: userId ?? null, plan: plan ?? null, cycle: cycle ?? null })

    if (userId && plan) {
      const ok = await activateSubscription(userId, plan, paymentRef, cycle ?? 'monthly')
      if (ok && custom.code) await redeemDiscount(custom.code, userId).catch(() => {})
      console.log('[ls webhook] activation', ok ? 'OK' : 'FAILED', { userId, plan, paymentRef })
    } else {
      console.error('[ls webhook] missing userId/plan — custom_data was:', JSON.stringify(payload?.meta?.custom_data ?? null))
    }
  }

  // Subscription ended — revoke access. LS fires subscription_cancelled when a
  // cancellation takes effect and subscription_expired at the end of the term.
  if (eventName === 'subscription_cancelled' || eventName === 'subscription_expired') {
    if (userId) {
      const ok = await cancelSubscription(userId)
      console.log('[ls webhook] cancellation', ok ? 'OK' : 'FAILED', { userId })
    } else {
      console.error('[ls webhook] cancellation missing userId — custom_data was:', JSON.stringify(payload?.meta?.custom_data ?? null))
    }
  }

  // Always 200 quickly so LS doesn't retry a handled event.
  return NextResponse.json({ ok: true })
}
