import { NextRequest, NextResponse } from 'next/server'
import { hash, compare } from 'bcryptjs'
import { auth } from '@/auth'

export const runtime = 'nodejs'

/** GET — tells the client whether this account already has a password set. */
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 })
  }
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ ok: false, error: 'Database not configured' }, { status: 500 })
  }

  try {
    const { query } = await import('@/lib/db')
    const rows = await query<{ password_hash: string | null }>(
      'SELECT password_hash FROM users WHERE id = $1',
      [session.user.id],
    )
    return NextResponse.json({ ok: true, hasPassword: !!rows[0]?.password_hash })
  } catch (err) {
    console.error('[GET /api/account/password]', err)
    return NextResponse.json({ ok: false, error: 'Failed to load account' }, { status: 500 })
  }
}

/**
 * PATCH — set or change the account password.
 *
 * Google (OAuth) users have no password, so they can set one directly, which
 * then also lets them sign in with email + password. Users who already have a
 * password must confirm their current one before changing it.
 */
export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 })
  }
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ ok: false, error: 'Database not configured' }, { status: 500 })
  }

  const body = await req.json() as { currentPassword?: string; newPassword?: string }
  const newPassword = body.newPassword ?? ''
  if (newPassword.length < 8) {
    return NextResponse.json({ ok: false, error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  try {
    const { query } = await import('@/lib/db')
    const rows = await query<{ password_hash: string | null }>(
      'SELECT password_hash FROM users WHERE id = $1',
      [session.user.id],
    )
    if (rows.length === 0) {
      return NextResponse.json({ ok: false, error: 'Account not found' }, { status: 404 })
    }

    const existingHash = rows[0].password_hash
    if (existingHash) {
      // Changing an existing password requires the current one.
      const currentPassword = body.currentPassword ?? ''
      if (!currentPassword) {
        return NextResponse.json({ ok: false, error: 'Enter your current password' }, { status: 400 })
      }
      const valid = await compare(currentPassword, existingHash)
      if (!valid) {
        return NextResponse.json({ ok: false, error: 'Current password is incorrect' }, { status: 400 })
      }
    }

    const passwordHash = await hash(newPassword, 12)
    await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [passwordHash, session.user.id])

    return NextResponse.json({ ok: true, hasPassword: true })
  } catch (err) {
    console.error('[PATCH /api/account/password]', err)
    return NextResponse.json({ ok: false, error: 'Failed to update password' }, { status: 500 })
  }
}
