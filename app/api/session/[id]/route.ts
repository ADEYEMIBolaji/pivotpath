import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session-store'
import { viewerHasPaidPlan } from '@/lib/access'
import type { ApiResult, AnalysisSession } from '@/lib/types'

export const runtime = 'nodejs'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<ApiResult<AnalysisSession> & { locked?: boolean }>> {
  const { id } = await params
  const session = await getSession(id)
  if (!session) {
    return NextResponse.json({ ok: false, error: 'Session not found' }, { status: 404 })
  }

  // The full résumé rewrite is a paid feature. For free viewers, strip it on the
  // server (so it never reaches the browser) and flag the response as locked —
  // the résumé page renders the upgrade gate instead.
  if (!(await viewerHasPaidPlan())) {
    return NextResponse.json({ ok: true, data: { ...session, resume: undefined }, locked: true })
  }

  return NextResponse.json({ ok: true, data: session })
}
