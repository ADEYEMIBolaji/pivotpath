import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { listSessionsByUser } from '@/lib/session-store'

export const runtime = 'nodejs'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 })
  }
  const sessions = await listSessionsByUser(session.user.id)
  return NextResponse.json({ ok: true, sessions })
}
