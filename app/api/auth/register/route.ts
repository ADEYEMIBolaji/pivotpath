import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, referral } = await req.json() as { name?: string; email?: string; password?: string; referral?: string }

    if (!email?.trim() || !password?.trim()) {
      return NextResponse.json({ ok: false, error: 'Email and password are required' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ ok: false, error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ ok: false, error: 'Database not configured' }, { status: 500 })
    }

    const { query } = await import('@/lib/db')

    const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()])
    if (existing.length > 0) {
      return NextResponse.json({ ok: false, error: 'An account with this email already exists' }, { status: 409 })
    }

    // Look up the referral code (an influencer discount code) so we can attribute
    // this new user to the influencer who sent them, and let them redeem 20% off
    // once at checkout. Unknown codes are ignored — sign up should never fail on it.
    let referralCode: string | null = null
    let referralSource: string | null = null
    const rawReferral = referral?.trim().toUpperCase()
    if (rawReferral) {
      const codeRows = await query<{ code: string; influencer: string | null }>(
        'SELECT code, influencer FROM discount_codes WHERE code = $1 AND active = TRUE',
        [rawReferral],
      )
      if (codeRows[0]) {
        referralCode = codeRows[0].code
        referralSource = codeRows[0].influencer ?? null
      }
    }

    const passwordHash = await hash(password, 12)
    await query(
      `INSERT INTO users (email, name, password_hash, referral_code, referral_source, referred_at)
       VALUES ($1, $2, $3, $4, $5, CASE WHEN $4::text IS NULL THEN NULL ELSE NOW() END)`,
      [email.toLowerCase(), name?.trim() || null, passwordHash, referralCode, referralSource],
    )

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[/api/auth/register]', err)
    return NextResponse.json({ ok: false, error: 'Something went wrong' }, { status: 500 })
  }
}
