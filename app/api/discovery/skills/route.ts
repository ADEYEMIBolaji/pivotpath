/**
 * POST /api/discovery/skills — Discovery Mode step 2 (functional skills map).
 * GET  /api/discovery/skills?runId=… — read back a previously generated map.
 *
 * TEST BUILD — gated behind the DISCOVERY_MODE flag.
 */

import { NextRequest, NextResponse } from 'next/server'
import { extractSkillsMap } from '@/lib/discovery/pipeline'
import { getIntake, getSkillsMap, saveSkillsMap } from '@/lib/discovery/store'
import { isDiscoveryEnabled, canAccessRun } from '@/lib/discovery/access'
import { checkRateLimit, getClientIp } from '@/lib/discovery/rate-limit'

export const runtime = 'nodejs'
export const maxDuration = 120

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!isDiscoveryEnabled()) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { runId } = (await req.json()) as { runId?: string }
  if (!runId || !(await canAccessRun(runId))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    // Idempotent: re-running the flow shouldn't re-pay for the same extraction.
    const existing = await getSkillsMap(runId)
    if (existing) return NextResponse.json({ functions: existing })

    const intake = await getIntake(runId)
    if (!intake) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Only a genuinely new generation counts against the limit — the
    // idempotent-resume return above never does.
    const rate = await checkRateLimit(getClientIp(req), 'skills')
    if (!rate.allowed) {
      return NextResponse.json({ error: 'Too many requests — try again later.' }, { status: 429 })
    }

    const functions = await extractSkillsMap(intake.selections, intake.otherNotes)
    await saveSkillsMap(runId, functions)
    return NextResponse.json({ functions })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[/api/discovery/skills]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!isDiscoveryEnabled()) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const runId = req.nextUrl.searchParams.get('runId')
  if (!runId || !(await canAccessRun(runId))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ functions: (await getSkillsMap(runId)) ?? null })
}
