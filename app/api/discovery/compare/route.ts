/**
 * POST /api/discovery/compare — bridge step: enrich the shortlisted roles
 * with day-to-day / entry-barrier / demand content so the person has
 * something to compare before committing to one.
 *
 * STUB: content is Claude reasoning from general knowledge, not live market
 * data — see the TODO in lib/discovery/pipeline.ts. Also NOT persisted: it's
 * regenerated on every visit to the comparison screen, an acceptable
 * simplification for a test build but a re-cost worth knowing about before
 * this goes further.
 *
 * TEST BUILD — gated behind the DISCOVERY_MODE flag.
 */

import { NextRequest, NextResponse } from 'next/server'
import { enrichShortlistForComparison } from '@/lib/discovery/pipeline'
import { getShortlist, getSkillsMap } from '@/lib/discovery/store'
import { isDiscoveryEnabled, canAccessRun } from '@/lib/discovery/access'
import { checkRateLimit, getClientIp } from '@/lib/discovery/rate-limit'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!isDiscoveryEnabled()) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { runId } = (await req.json()) as { runId?: string }
  if (!runId || !(await canAccessRun(runId))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Unlike skills/roles, this endpoint is never cached — every visit to the
  // comparison screen re-pays for a real Claude call — so it's checked before
  // any work happens, not just before a fresh generation.
  const rate = await checkRateLimit(getClientIp(req), 'compare')
  if (!rate.allowed) {
    return NextResponse.json({ error: 'Too many requests, try again later.' }, { status: 429 })
  }

  try {
    const [shortlist, functions] = await Promise.all([getShortlist(runId), getSkillsMap(runId)])
    if (shortlist.length === 0) {
      return NextResponse.json({ enrichment: {} })
    }

    const enrichment = await enrichShortlistForComparison(
      shortlist.map((entry) => entry.role),
      functions ?? [],
    )
    return NextResponse.json({ enrichment })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[/api/discovery/compare]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
