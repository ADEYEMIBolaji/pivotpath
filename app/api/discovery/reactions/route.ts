/**
 * POST /api/discovery/reactions — Discovery Mode step 4 (swipe reactions).
 *
 * Accepts: { runId, roleId, reaction: 'like' | 'pass' | 'unsure' }
 *
 * TEST BUILD — gated behind the DISCOVERY_MODE flag.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getRoles, saveReaction } from '@/lib/discovery/store'
import { isDiscoveryEnabled, canAccessRun } from '@/lib/discovery/access'
import type { Reaction } from '@/lib/discovery/types'

export const runtime = 'nodejs'

const VALID: Reaction[] = ['like', 'pass', 'unsure']

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!isDiscoveryEnabled()) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { runId, roleId, reaction } = (await req.json()) as {
    runId?: string
    roleId?: string
    reaction?: Reaction
  }

  if (!runId || !roleId || !reaction || !VALID.includes(reaction)) {
    return NextResponse.json({ error: 'runId, roleId and a valid reaction are required.' }, { status: 400 })
  }
  if (!(await canAccessRun(runId))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // The role must belong to this run — otherwise the FK insert would fail
  // anyway in Postgres, and file mode would happily record a dangling id.
  const roles = await getRoles(runId)
  if (!roles.some((r) => r.id === roleId)) {
    return NextResponse.json({ error: 'Unknown role for this run.' }, { status: 400 })
  }

  try {
    await saveReaction(runId, roleId, reaction)
    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[/api/discovery/reactions]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
