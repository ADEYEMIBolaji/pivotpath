/**
 * POST /api/checkout — start a subscription.
 *
 * Body: { plan: 'pivot' | 'accelerate', cycle?: 'monthly' | 'annual', code?: string, extend?: boolean }
 *
 * Behaviour:
 *  - Validates the discount code (if any).
 *  - If the final price is £0 (100%-off code), the subscription is activated
 *    immediately and the code is redeemed.
 *  - Otherwise returns a Paddle payload (priceId, optional discountId, customer
 *    email) so the client opens the Paddle overlay checkout. The subscription is
 *    activated by the Paddle webhook once payment completes.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { PLANS, priceForCycle, activateSubscription, getActiveSubscription, type PlanId, type BillingCycle } from '@/lib/subscription'
import { validateDiscount, redeemDiscount } from '@/lib/discount'
import { isLemonConfigured, createCheckout } from '@/lib/lemonsqueezy'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'Please sign in to continue.' }, { status: 401 })
  }

  const { plan: planId, cycle: rawCycle, code, extend } = (await req.json()) as { plan?: string; cycle?: string; code?: string; extend?: boolean }
  const plan = PLANS[planId as PlanId]
  if (!plan || plan.id === 'free') {
    return NextResponse.json({ ok: false, error: 'Invalid plan.' }, { status: 400 })
  }
  const cycle: BillingCycle = rawCycle === 'annual' ? 'annual' : 'monthly'

  // If a plan is already active, block accidental re-purchase — unless the user
  // explicitly chose to extend/upgrade (extend:true). Extending stacks the new
  // term on top of their remaining time (handled in activateSubscription).
  const existing = await getActiveSubscription(session.user.id)
  if (existing && !extend) {
    return NextResponse.json({
      ok: false,
      alreadyActive: true,
      plan: existing.plan,
      expiresAt: existing.expiresAt,
      error: 'You already have an active plan.',
    }, { status: 409 })
  }

  let finalPrice = priceForCycle(plan.id, cycle)
  let appliedCode: string | undefined

  if (code) {
    const disc = await validateDiscount(code, plan.id, cycle)
    if (!disc.valid) {
      return NextResponse.json({ ok: false, error: disc.reason ?? 'Invalid code.' }, { status: 400 })
    }
    finalPrice = disc.finalPrice ?? priceForCycle(plan.id, cycle)
    appliedCode = disc.code
  }

  // Free after discount → activate immediately (no payment needed)
  if (finalPrice === 0) {
    const ok = await activateSubscription(
      session.user.id,
      plan.id,
      appliedCode ? `comp:${appliedCode}:${session.user.id}` : `comp:${session.user.id}`,
      cycle,
    )
    if (!ok) {
      return NextResponse.json({ ok: false, error: 'Could not activate your plan.' }, { status: 500 })
    }
    if (appliedCode) await redeemDiscount(appliedCode, session.user.id)
    return NextResponse.json({ ok: true, activated: true, plan: plan.id })
  }

  // Paid — hand off to Lemon Squeezy checkout (if configured)
  if (!isLemonConfigured()) {
    return NextResponse.json({
      ok: true,
      requiresPayment: true,
      finalPrice,
      appliedCode,
      plan: plan.id,
      message: 'Card payment isn’t live yet. Your plan and discount have been validated.',
    })
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.pivotpath.uk').replace(/\/$/, '')
  const redirectUrl = `${siteUrl}/checkout?plan=${plan.id}&cycle=${cycle}&success=1`

  try {
    const checkoutUrl = await createCheckout({
      plan: plan.id,
      cycle,
      email: session.user.email,
      // custom is echoed back to us by the webhook to fulfil the order
      custom: { userId: session.user.id, plan: plan.id, cycle, code: appliedCode ?? null },
      discountCode: appliedCode ?? null,
      redirectUrl,
    })
    return NextResponse.json({ ok: true, checkout: { url: checkoutUrl }, plan: plan.id })
  } catch (err) {
    console.error('[/api/checkout] LS checkout error:', err)
    return NextResponse.json({ ok: false, error: 'Could not start checkout. Please try again.' }, { status: 502 })
  }
}
