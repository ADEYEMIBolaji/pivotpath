/**
 * POST /api/discovery/intake — Discovery Mode step 1.
 *
 * Accepts: { runId?: string, answers: Record<questionId, string> }
 * Returns: { runId: string }
 *
 * TEST BUILD — gated behind the DISCOVERY_MODE flag.
 */

import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { auth } from '@/auth'
import { saveIntake } from '@/lib/discovery/store'
import { isDiscoveryEnabled, canAccessRun } from '@/lib/discovery/access'
import { INTAKE_QUESTIONS, type IntakeAnswers } from '@/lib/discovery/types'

export const runtime = 'nodejs'

const MAX_ANSWER_CHARS = 2000

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!isDiscoveryEnabled()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { runId: existingId, answers: raw } = (await req.json()) as {
    runId?: string
    answers?: IntakeAnswers
  }

  // Only accept known question ids, and cap length so a run row stays sane.
  const answers: IntakeAnswers = {}
  for (const q of INTAKE_QUESTIONS) {
    const value = raw?.[q.id]
    if (typeof value === 'string' && value.trim()) {
      answers[q.id] = value.trim().slice(0, MAX_ANSWER_CHARS)
    }
  }

  if (Object.keys(answers).length < 3) {
    return NextResponse.json(
      { error: 'Answer at least three questions — the skills map needs evidence to work from.' },
      { status: 400 },
    )
  }

  // Re-submitting an existing run must not let one visitor overwrite another's.
  if (existingId && !(await canAccessRun(existingId))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const session = await auth()
  const runId = existingId ?? randomUUID()

  try {
    await saveIntake(runId, session?.user?.id ?? null, answers)
    return NextResponse.json({ runId })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[/api/discovery/intake]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
