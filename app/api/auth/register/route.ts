import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json() as { name?: string; email?: string; password?: string }

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

    const passwordHash = await hash(password, 12)
    await query(
      'INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3)',
      [email.toLowerCase(), name?.trim() || null, passwordHash],
    )

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[/api/auth/register]', err)
    return NextResponse.json({ ok: false, error: 'Something went wrong' }, { status: 500 })
  }
}
