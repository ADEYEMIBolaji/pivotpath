import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { checkPivotQuota, getActiveSubscription, PLANS } from '@/lib/subscription'

export const runtime = 'nodejs'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 })
  }

  const [quota, sub] = await Promise.all([
    checkPivotQuota(session.user.id),
    getActiveSubscription(session.user.id),
  ])
  const plan = PLANS[quota.planId]

  return NextResponse.json({
    ok: true,
    planId: quota.planId,
    planName: plan.name,
    used: quota.used,
    limit: quota.limit,
    remaining: Math.max(0, quota.limit - quota.used),
    expiresAt: sub?.expiresAt ?? null,
  })
}
