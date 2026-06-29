/**
 * GET /api/jobs?sessionId=&source=&remoteOnly=&sort=fit|date
 *
 * 1. Loads the session (for scoring context)
 * 2. Triggers a pipeline refresh if the store is empty or stale (> 1 hour)
 * 3. Lists jobs from the store (fresh, non-dead)
 * 4. Scores each job against the session's translated profile
 * 5. Returns grouped, sorted results
 *
 * POST /api/jobs/refresh?sessionId= — manual pipeline trigger
 */

import { NextRequest, NextResponse } from 'next/server'
import { getJobStore } from '@/lib/jobs/store'
import { runIngestPipeline } from '@/lib/jobs/pipeline'
import { scoreJobs, groupByBridgeRole } from '@/lib/jobs/scoring'
import { getSession } from '@/lib/session-store'
import { viewerHasPaidPlan } from '@/lib/access'
import type { JobsApiResponse, SourceName } from '@/lib/jobs/types'

export const runtime = 'nodejs'
export const maxDuration = 60

const REFRESH_INTERVAL_MS = 60 * 60 * 1000  // 1 hour

// Track last refresh time in-process (good enough for single-instance/dev)
let lastRefreshAt = 0

async function maybeRefresh(keywords: string[]): Promise<void> {
  const store = getJobStore()
  const jobs = await store.list()
  const shouldRefresh = jobs.length === 0 || Date.now() - lastRefreshAt > REFRESH_INTERVAL_MS

  if (!shouldRefresh) return

  console.log('[/api/jobs] Running pipeline refresh…')
  await runIngestPipeline({
    keywords,
    location: 'United Kingdom',
    maxResults: 50,
  })
  lastRefreshAt = Date.now()
}

export async function GET(req: NextRequest): Promise<NextResponse<JobsApiResponse | { error: string }>> {
  try {
    // Matched jobs are a paid feature. Gate before the (costly) pipeline refresh
    // so free viewers never trigger job-board API calls — the page shows the gate.
    if (!(await viewerHasPaidPlan())) {
      return NextResponse.json({
        jobs: [],
        groups: [],
        locked: true,
        meta: { total: 0, lastRefreshedAt: new Date().toISOString(), duplicatesMerged: 0, staleRemoved: 0 },
      })
    }

    const { searchParams } = req.nextUrl
    const sessionId  = searchParams.get('sessionId') ?? ''
    const source     = searchParams.get('source') as SourceName | null
    const remoteOnly = searchParams.get('remoteOnly') === 'true'
    const sort       = (searchParams.get('sort') ?? 'fit') as 'fit' | 'date'

    const session = sessionId ? await getSession(sessionId) : null

    // Search the target role AND the strategy's bridge roles (stepping stones),
    // across industries — so Matched Jobs surfaces both destination and bridge
    // opportunities, not just the single target title.
    const keywords = session?.target
      ? [...new Set(
          [
            session.target.title,
            ...(session.strategy?.bridgeRoles?.map((b) => b.title) ?? []),
            session.target.function,
          ].map((k) => k?.trim()).filter((k): k is string => Boolean(k)),
        )].slice(0, 5)
      : ['product manager', 'operations manager', 'digital health']

    await maybeRefresh(keywords)

    const store = getJobStore()
    // Always score the FULL set (remote constraint aside) so the recommended
    // list is computed once across all sources. The source filter is then just
    // a view on that set — selecting Reed shows the Reed jobs within the
    // recommended set, not a fresh top-N of only Reed.
    const rawJobs = await store.list({
      remoteOnly,
      maxAgeDays: 30,
    })

    const savedIds = sessionId ? await store.getSavedJobIds(sessionId) : []

    // Score jobs against the session (or use default 50% readiness if no session)
    const scored = session
      ? scoreJobs(rawJobs, session)
      : rawJobs.map((j) => ({
          ...j,
          fitScore: 50,
          fitBucket: 'neutral' as const,
          matchedSkills: [],
          gapFlags: [],
          bridgeRoleGroup: null,
        }))

    // Recommend only roles worth applying to (good fit), not the whole market.
    // `scored` is already fit-sorted; fall back to the top matches so the list
    // is never empty even when nothing clears the bucket threshold.
    // Show all good-fit matches under "All sources" (capped high for safety);
    // fall back to the top matches if nothing clears the bucket threshold.
    const RECOMMEND_MIN = 12
    const RECOMMEND_MAX = 100
    let recommended = scored
    if (session) {
      const goodFit = scored.filter((j) => j.fitBucket !== 'neutral')
      recommended = (goodFit.length >= RECOMMEND_MIN ? goodFit : scored.slice(0, RECOMMEND_MIN)).slice(0, RECOMMEND_MAX)
    }

    // Per-source counts within the recommended set (for the filter chips)
    const bySource: Record<string, number> = {}
    for (const j of recommended) {
      for (const s of [j.primarySource, ...j.alsoListedOn]) bySource[s] = (bySource[s] ?? 0) + 1
    }

    // Source filter = a view on the recommended set
    const viewed = source
      ? recommended.filter((j) => j.primarySource === source || j.alsoListedOn.includes(source))
      : recommended

    // Apply sort
    const sorted = sort === 'date'
      ? [...viewed].sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime())
      : viewed

    // Attach saved state
    const withSaved = sorted.map((j) => ({ ...j, saved: savedIds.includes(j.id) }))

    const bridgeRoles = session?.strategy?.bridgeRoles ?? []
    const groups = groupByBridgeRole(withSaved, bridgeRoles)

    const duplicatesMerged = 0  // pipeline summary not persisted — would need a table

    return NextResponse.json({
      jobs: withSaved,
      groups,
      meta: {
        total: withSaved.length,
        lastRefreshedAt: new Date(lastRefreshAt || Date.now()).toISOString(),
        duplicatesMerged,
        staleRemoved: 0,
        bySource,
        savedCount: savedIds.length,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[/api/jobs]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { keywords } = (await req.json()) as { keywords?: string[] }
    const summary = await runIngestPipeline({
      keywords: keywords ?? ['product manager', 'operations manager'],
      location: 'United Kingdom',
      maxResults: 100,
    })
    lastRefreshAt = Date.now()
    return NextResponse.json({ ok: true, summary })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
