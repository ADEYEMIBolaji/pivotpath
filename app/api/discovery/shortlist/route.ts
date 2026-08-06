/**
 * GET /api/discovery/shortlist?runId=… — Discovery Mode step 4 result.
 *
 * Liked roles first, then unsure, each group in original suggestion order.
 * This shortlist is what would feed the target-role input of the main pivot
 * funnel — that hand-off is not wired up in this test build.
 *
 * TEST BUILD — gated behind the DISCOVERY_MODE flag.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getShortlist } from '@/lib/discovery/store'
import { isDiscoveryEnabled, canAccessRun } from '@/lib/discovery/access'

export const runtime = 'nodejs'

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!isDiscoveryEnabled()) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const runId = req.nextUrl.searchParams.get('runId')
  if (!runId || !(await canAccessRun(runId))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ shortlist: await getShortlist(runId) })
}
