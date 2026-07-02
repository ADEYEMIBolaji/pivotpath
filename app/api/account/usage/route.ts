import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { checkPivotQuota, getActiveSubscription, PLANS } from '@/lib/subscription'

export const runtime = 'nodejs'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 })
  }

  const [quota, sub, referralCode] = await Promise.all([
    checkPivotQuota(session.user.id),
    getActiveSubscription(session.user.id),
    getReferralCode(session.user.id),
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
    referralCode,
  })
}

/** The influencer referral code captured for this user at sign up, if any. */
async function getReferralCode(userId: string): Promise<string | null> {
  if (!process.env.DATABASE_URL) return null
  try {
    const { query } = await import('@/lib/db')
    const rows = await query<{ referral_code: string | null }>(
      'SELECT referral_code FROM users WHERE id = $1',
      [userId],
    )
    return rows[0]?.referral_code ?? null
  } catch {
    return null
  }
}
