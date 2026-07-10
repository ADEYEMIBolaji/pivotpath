/**
 * POST /api/jobs/:id/apply
 * Records an application event (funnel tracking) and returns the source URL.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getJobStore } from '@/lib/jobs/store'
import { getSession } from '@/lib/session-store'
import { viewerOwnsSession } from '@/lib/access'

export const runtime = 'nodejs'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params
  const { sessionId } = (await req.json()) as { sessionId?: string }

  const store = getJobStore()
  const job = await store.getById(id)
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

  // Only record the application-funnel event against a session the viewer owns.
  // The apply URL itself is public info, so a bad sessionId just skips tracking.
  if (sessionId) {
    const session = await getSession(sessionId)
    if (session && (await viewerOwnsSession(session.userId))) {
      await store.recordApplication(sessionId, id, job.primarySource)
    }
  }

  return NextResponse.json({ ok: true, sourceUrl: job.primarySourceUrl, source: job.primarySource })
}
