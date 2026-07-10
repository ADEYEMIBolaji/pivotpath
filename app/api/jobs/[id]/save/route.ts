/**
 * POST /api/jobs/:id/save   — save a job for a session
 * DELETE /api/jobs/:id/save — unsave
 */

import { NextRequest, NextResponse } from 'next/server'
import { getJobStore } from '@/lib/jobs/store'
import { getSession } from '@/lib/session-store'
import { viewerOwnsSession } from '@/lib/access'

export const runtime = 'nodejs'

/** Reject writes against a session the viewer doesn't own (returns null when OK). */
async function guard(sessionId: string | undefined): Promise<NextResponse | null> {
  if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 })
  const session = await getSession(sessionId)
  if (!session || !(await viewerOwnsSession(session.userId))) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }
  return null
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params
  const { sessionId } = (await req.json()) as { sessionId?: string }
  const denied = await guard(sessionId)
  if (denied) return denied

  const store = getJobStore()
  const job = await store.getById(id)
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

  await store.saveJob(sessionId!, id)
  return NextResponse.json({ ok: true, saved: true })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params
  const { sessionId } = (await req.json()) as { sessionId?: string }
  const denied = await guard(sessionId)
  if (denied) return denied

  await getJobStore().unsaveJob(sessionId!, id)
  return NextResponse.json({ ok: true, saved: false })
}
