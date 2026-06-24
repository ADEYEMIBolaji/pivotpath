/**
 * POST /api/checkout — start a subscription.
 *
 * Body: { plan: '6month' | '12month', code?: string }
 *
 * Behaviour:
 *  - Validates the discount code (if any).
 *  - If the final price is £0 (100%-off code), the subscription is activated
 *    immediately and the code is redeemed.
 *  - Otherwise returns { requiresPayment: true } with the final price so the
 *    client can route to the (future) Stripe checkout. Card payment is not yet
 *    wired up, so paid plans return this state for now.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { PLANS, type PlanId } from '@/lib/subscription'
import { validateDiscount, redeemDiscount } from '@/lib/discount'

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

  let finalPrice = plan.price
  let appliedCode: string | undefined

  if (code) {
    const disc = await validateDiscount(code, plan.id)
    if (!disc.valid) {
      return NextResponse.json({ ok: false, error: disc.reason ?? 'Invalid code.' }, { status: 400 })
    }
    finalPrice = disc.finalPrice ?? plan.price
    appliedCode = disc.code
  }

  // Free after discount → activate immediately
  if (finalPrice === 0) {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ ok: false, error: 'Subscriptions are unavailable right now.' }, { status: 500 })
    }
    try {
      const { query } = await import('@/lib/db')
      const expires = new Date()
      expires.setMonth(expires.getMonth() + plan.durationMonths)
      await query(
        `INSERT INTO subscriptions (user_id, plan, status, expires_at, payment_ref)
         VALUES ($1, $2, 'active', $3, $4)`,
        [session.user.id, plan.id, expires.toISOString(), appliedCode ? `discount:${appliedCode}` : 'comp'],
      )
      if (appliedCode) await redeemDiscount(appliedCode, session.user.id)
      return NextResponse.json({ ok: true, activated: true, plan: plan.id })
    } catch (err) {
      console.error('[POST /api/checkout]', err)
      return NextResponse.json({ ok: false, error: 'Could not activate your plan.' }, { status: 500 })
    }
  }

  // Paid — Stripe not yet integrated
  return NextResponse.json({
    ok: true,
    requiresPayment: true,
    finalPrice,
    appliedCode,
    plan: plan.id,
    message: 'Card payment is coming soon. Your plan and discount have been validated.',
  })
}
