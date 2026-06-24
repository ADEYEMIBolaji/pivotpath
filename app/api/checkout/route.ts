/**
 * POST /api/checkout — start a subscription.
 *
 * Body: { plan: '6month' | '12month', code?: string }
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
import { PLANS, activateSubscription, getActiveSubscription, type PlanId } from '@/lib/subscription'
import { validateDiscount, redeemDiscount } from '@/lib/discount'
import { isPaddleConfigured, priceIdForPlan } from '@/lib/paddle'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'Please sign in to continue.' }, { status: 401 })
  }

  const { plan: planId, code } = (await req.json()) as { plan?: string; code?: string }
  const plan = PLANS[planId as PlanId]
  if (!plan || plan.id === 'free') {
    return NextResponse.json({ ok: false, error: 'Invalid plan.' }, { status: 400 })
  }

  // Prevent paying again while a plan is already active (avoids duplicate charges)
  const existing = await getActiveSubscription(session.user.id)
  if (existing) {
    return NextResponse.json({
      ok: false,
      alreadyActive: true,
      plan: existing.plan,
      expiresAt: existing.expiresAt,
      error: 'You already have an active plan.',
    }, { status: 409 })
  }

  let finalPrice = plan.price
  let appliedCode: string | undefined
  let paddleDiscountId: string | undefined

  if (code) {
    const disc = await validateDiscount(code, plan.id)
    if (!disc.valid) {
      return NextResponse.json({ ok: false, error: disc.reason ?? 'Invalid code.' }, { status: 400 })
    }
    finalPrice = disc.finalPrice ?? plan.price
    appliedCode = disc.code
    paddleDiscountId = disc.paddleDiscountId
  }

  // Free after discount → activate immediately (no payment needed)
  if (finalPrice === 0) {
    const ok = await activateSubscription(
      session.user.id,
      plan.id,
      appliedCode ? `comp:${appliedCode}:${session.user.id}` : `comp:${session.user.id}`,
    )
    if (!ok) {
      return NextResponse.json({ ok: false, error: 'Could not activate your plan.' }, { status: 500 })
    }
    if (appliedCode) await redeemDiscount(appliedCode, session.user.id)
    return NextResponse.json({ ok: true, activated: true, plan: plan.id })
  }

  // Paid — hand off to Paddle checkout (if configured)
  if (!isPaddleConfigured()) {
    return NextResponse.json({
      ok: true,
      requiresPayment: true,
      finalPrice,
      appliedCode,
      plan: plan.id,
      message: 'Card payment isn’t live yet. Your plan and discount have been validated.',
    })
  }

  return NextResponse.json({
    ok: true,
    paddle: {
      priceId: priceIdForPlan(plan.id),
      discountId: paddleDiscountId,
      email: session.user.email,
      finalPrice,
      plan: plan.id,
      // customData is echoed back to us by the webhook to fulfil the order
      customData: { userId: session.user.id, plan: plan.id, code: appliedCode ?? null },
    },
  })
}
