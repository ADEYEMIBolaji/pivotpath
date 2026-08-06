/**
 * POST /api/discovery/intake — Discovery Mode step 1 (chip selections).
 *
 * Accepts: {
 *   runId?: string,
 *   selections: { [promptId]: { chipId: string, note?: string }[] },
 *   otherNotes?: string,
 * }
 * Returns: { runId: string }
 *
 * The client sends chip *ids* only — labels and the hidden functional-skill
 * signal are resolved server-side from lib/discovery/chip-seed.ts. This also
 * validates that every chipId actually belongs to its claimed prompt, so a
 * tampered request can't inject arbitrary label/signal text into the Claude
 * prompt built in step 2.
 *
 * TEST BUILD — gated behind the DISCOVERY_MODE flag.
 */

import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { auth } from '@/auth'
import { saveIntake } from '@/lib/discovery/store'
import { isDiscoveryEnabled, canAccessRun } from '@/lib/discovery/access'
import { findChip } from '@/lib/discovery/chip-seed'
import type { IntakeSelections } from '@/lib/discovery/types'

export const runtime = 'nodejs'

const MAX_NOTE_CHARS = 300
const MAX_OTHER_NOTES_CHARS = 2000
const MIN_CHIPS = 3

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!isDiscoveryEnabled()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = (await req.json()) as {
    runId?: string
    selections?: Record<string, { chipId?: string; note?: string }[]>
    otherNotes?: string
  }

  // Rebuild selections from only the parts we trust: a chipId that resolves
  // against the seed bank for that promptId. Anything else is dropped rather
  // than erroring — a stale chip id (seed data changed under a resumed run)
  // shouldn't fail the whole submission.
  const selections: IntakeSelections = {}
  let chipCount = 0
  for (const [promptId, picks] of Object.entries(body.selections ?? {})) {
    if (!Array.isArray(picks)) continue
    const valid = picks
      .filter((p) => typeof p.chipId === 'string' && findChip(promptId, p.chipId))
      .map((p) => ({
        chipId: p.chipId as string,
        note: typeof p.note === 'string' && p.note.trim() ? p.note.trim().slice(0, MAX_NOTE_CHARS) : undefined,
      }))
    if (valid.length > 0) {
      selections[promptId] = valid
      chipCount += valid.length
    }
  }

  const otherNotes =
    typeof body.otherNotes === 'string' && body.otherNotes.trim()
      ? body.otherNotes.trim().slice(0, MAX_OTHER_NOTES_CHARS)
      : null

  if (chipCount < MIN_CHIPS) {
    return NextResponse.json(
      { error: `Select at least ${MIN_CHIPS} chips across the prompts — the skills map needs evidence to work from.` },
      { status: 400 },
    )
  }

  // Re-submitting an existing run must not let one visitor overwrite another's.
  if (body.runId && !(await canAccessRun(body.runId))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const session = await auth()
  const runId = body.runId ?? randomUUID()

  try {
    await saveIntake(runId, session?.user?.id ?? null, selections, otherNotes)
    return NextResponse.json({ runId })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[/api/discovery/intake]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
