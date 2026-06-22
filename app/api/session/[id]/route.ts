import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session-store'
import type { ApiResult, AnalysisSession } from '@/lib/types'

export const runtime = 'nodejs'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<ApiResult<AnalysisSession>>> {
  const { id } = await params
  const session = await getSession(id)
  if (!session) {
    return NextResponse.json({ ok: false, error: 'Session not found' }, { status: 404 })
  }
  return NextResponse.json({ ok: true, data: session })
}
