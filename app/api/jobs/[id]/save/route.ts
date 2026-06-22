/**
 * POST /api/jobs/:id/save   — save a job for a session
 * DELETE /api/jobs/:id/save — unsave
 */

import { NextRequest, NextResponse } from 'next/server'
import { getJobStore } from '@/lib/jobs/store'

export const runtime = 'nodejs'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params
  const { sessionId } = (await req.json()) as { sessionId: string }
  if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 })

  const store = getJobStore()
  const job = await store.getById(id)
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

  await store.saveJob(sessionId, id)
  return NextResponse.json({ ok: true, saved: true })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params
  const { sessionId } = (await req.json()) as { sessionId: string }
  if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 })

  await getJobStore().unsaveJob(sessionId, id)
  return NextResponse.json({ ok: true, saved: false })
}
