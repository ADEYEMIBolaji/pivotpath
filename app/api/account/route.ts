import { NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function DELETE() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 })
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ ok: false, error: 'Database not configured' }, { status: 500 })
  }

  try {
    const { query } = await import('@/lib/db')
    // Cascade deletes accounts, auth_sessions, and sessions via FK or direct delete
    await query('DELETE FROM sessions WHERE user_id = $1', [session.user.id])
    await query('DELETE FROM users WHERE id = $1', [session.user.id])
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/account]', err)
    return NextResponse.json({ ok: false, error: 'Failed to delete account' }, { status: 500 })
  }
}
