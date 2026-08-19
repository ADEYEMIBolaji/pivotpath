/**
 * POST /api/discovery/commit — commit to a single target role. Shared by both
 * personas, converging on one data model (discovery_target_commitment):
 *
 *   Persona A (Discovery Mode) — { runId, roleId, roleTitle }
 *     roleTitle is accepted but ignored/overridden: the server re-resolves
 *     the role's title + plainLanguageLine from the run's stored roles, the
 *     same "never trust client-sent derived text" principle as chip
 *     resolution in the intake route — a tampered roleTitle can't diverge
 *     from what was actually shown on the card.
 *   Persona B (direct entry)   — { roleTitle }  (no runId/roleId — free text)
 *
 * Upserts by commitmentId (if supplied) so "change target role" updates the
 * existing row instead of creating a new one. A fresh id is generated when
 * none is supplied.
 *
 * GET /api/discovery/commit?commitmentId=… — read back a commitment for the
 * confirmation screen.
 *
 * TEST BUILD — gated behind the DISCOVERY_MODE flag.
 */

import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { auth } from '@/auth'
import { getCommitment, getRoles, saveCommitment } from '@/lib/discovery/store'
import { isDiscoveryEnabled, canAccessRun, canAccessCommitment } from '@/lib/discovery/access'
import type { CommitmentSource } from '@/lib/discovery/types'

export const runtime = 'nodejs'

const MAX_TITLE_CHARS = 200

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!isDiscoveryEnabled()) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = (await req.json()) as {
    commitmentId?: string
    runId?: string
    roleId?: string
    roleTitle?: string
  }

  if (body.commitmentId && !(await canAccessCommitment(body.commitmentId))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  let source: CommitmentSource = 'direct'
  let runId: string | null = null
  let roleId: string | null = null
  let plainLanguageLine: string | null = null
  let roleTitle = body.roleTitle?.trim().slice(0, MAX_TITLE_CHARS) ?? ''

  if (body.runId && body.roleId) {
    if (!(await canAccessRun(body.runId))) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    const roles = await getRoles(body.runId)
    const role = roles.find((r) => r.id === body.roleId)
    if (!role) {
      return NextResponse.json({ error: 'Unknown role for this run.' }, { status: 400 })
    }
    source = 'discovery'
    runId = body.runId
    roleId = role.id
    roleTitle = role.title
    plainLanguageLine = role.plainLanguageLine
  }

  if (!roleTitle) {
    return NextResponse.json({ error: 'roleTitle is required.' }, { status: 400 })
  }

  const session = await auth()
  const commitmentId = body.commitmentId ?? randomUUID()

  try {
    const commitment = await saveCommitment(commitmentId, session?.user?.id ?? null, {
      runId,
      roleId,
      source,
      roleTitle,
      plainLanguageLine,
    })
    return NextResponse.json({ commitmentId: commitment.id })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[/api/discovery/commit]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!isDiscoveryEnabled()) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const commitmentId = req.nextUrl.searchParams.get('commitmentId')
  if (!commitmentId || !(await canAccessCommitment(commitmentId))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ commitment: await getCommitment(commitmentId) })
}
