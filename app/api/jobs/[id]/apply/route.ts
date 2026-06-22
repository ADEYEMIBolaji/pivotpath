/**
 * POST /api/jobs/:id/apply
 * Records an application event (funnel tracking) and returns the source URL.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getJobStore } from '@/lib/jobs/store'

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

  if (sessionId) {
    await store.recordApplication(sessionId, id, job.primarySource)
  }

  return NextResponse.json({ ok: true, sourceUrl: job.primarySourceUrl, source: job.primarySource })
}
