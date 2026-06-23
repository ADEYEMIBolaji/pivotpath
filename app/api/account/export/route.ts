import { NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  let sessions: unknown[] = []

  if (process.env.DATABASE_URL) {
    try {
      const { query } = await import('@/lib/db')
      sessions = await query('SELECT * FROM sessions WHERE user_id = $1 ORDER BY created_at DESC', [session.user.id])
    } catch { /* table might not exist */ }
  }

  const payload = {
    exportedAt: new Date().toISOString(),
    account: { email: session.user.email, name: session.user.name },
    sessions,
  }

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="pivotpath-export.json"',
    },
  })
}
