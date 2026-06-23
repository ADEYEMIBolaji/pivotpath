import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 })
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ ok: false, error: 'Database not configured' }, { status: 500 })
  }

  const body = await req.json() as { name?: string }
  const name = body.name?.trim()
  if (!name || name.length < 1 || name.length > 100) {
    return NextResponse.json({ ok: false, error: 'Name must be between 1 and 100 characters' }, { status: 400 })
  }

  try {
    const { query } = await import('@/lib/db')
    await query('UPDATE users SET name = $1, updated_at = NOW() WHERE id = $2', [name, session.user.id])
    return NextResponse.json({ ok: true, name })
  } catch (err) {
    console.error('[PATCH /api/account/profile]', err)
    return NextResponse.json({ ok: false, error: 'Failed to update profile' }, { status: 500 })
  }
}
