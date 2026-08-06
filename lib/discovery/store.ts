/**
 * Discovery Mode persistence — TEST BUILD.
 *
 * Dual-mode, mirroring lib/session-store.ts:
 *   DATABASE_URL set → Postgres (discovery_* tables, migration 009)
 *   No DATABASE_URL  → JSON files under .discovery/ so the flow demos locally
 *                      with nothing but an ANTHROPIC_API_KEY.
 */

import type {
  CommitmentSource,
  DiscoveryIntake,
  DiscoveryRole,
  FunctionalSkill,
  IntakeSelections,
  Reaction,
  ShortlistEntry,
  TargetCommitment,
} from './types'

const usePg = (): boolean => Boolean(process.env.DATABASE_URL)

// ─── File-mode helpers ────────────────────────────────────────────────────────

interface FileRun {
  intake: DiscoveryIntake
  functions?: FunctionalSkill[]
  roles?: DiscoveryRole[]
  reactions?: Record<string, Reaction>
}

function filePath(runId: string): string {
  const path = require('path') as typeof import('path')
  return path.join(process.cwd(), '.discovery', `${runId}.json`)
}

function fileRead(runId: string): FileRun | null {
  try {
    const fs = require('fs') as typeof import('fs')
    return JSON.parse(fs.readFileSync(filePath(runId), 'utf-8')) as FileRun
  } catch {
    return null
  }
}

function fileWrite(runId: string, run: FileRun): void {
  const fs = require('fs') as typeof import('fs')
  const path = require('path') as typeof import('path')
  fs.mkdirSync(path.join(process.cwd(), '.discovery'), { recursive: true })
  fs.writeFileSync(filePath(runId), JSON.stringify(run, null, 2))
}

// ─── Step 1: intake ───────────────────────────────────────────────────────────

export async function saveIntake(
  runId: string,
  userId: string | null,
  selections: IntakeSelections,
  otherNotes: string | null,
): Promise<DiscoveryIntake> {
  const intake: DiscoveryIntake = {
    id: runId,
    userId,
    selections,
    otherNotes,
    createdAt: new Date().toISOString(),
  }

  if (!usePg()) {
    fileWrite(runId, { ...(fileRead(runId) ?? { intake }), intake })
    return intake
  }

  const { query } = await import('../db')
  const rows = await query<{ created_at: string }>(
    `INSERT INTO discovery_intake (id, user_id, selections, other_notes)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (id) DO UPDATE SET selections = EXCLUDED.selections, other_notes = EXCLUDED.other_notes, updated_at = NOW()
     RETURNING created_at`,
    [runId, userId, JSON.stringify(selections), otherNotes],
  )
  return { ...intake, createdAt: String(rows[0]?.created_at ?? intake.createdAt) }
}

export async function getIntake(runId: string): Promise<DiscoveryIntake | null> {
  if (!usePg()) return fileRead(runId)?.intake ?? null

  const { query } = await import('../db')
  const rows = await query<{
    id: string
    user_id: string | null
    selections: IntakeSelections
    other_notes: string | null
    created_at: string
  }>('SELECT id, user_id, selections, other_notes, created_at FROM discovery_intake WHERE id = $1', [runId])
  const row = rows[0]
  if (!row) return null
  return {
    id: row.id,
    userId: row.user_id,
    selections: row.selections,
    otherNotes: row.other_notes,
    createdAt: String(row.created_at),
  }
}

// ─── Step 2: skills map ───────────────────────────────────────────────────────

export async function saveSkillsMap(runId: string, functions: FunctionalSkill[]): Promise<void> {
  if (!usePg()) {
    const run = fileRead(runId)
    if (run) fileWrite(runId, { ...run, functions })
    return
  }

  const { query } = await import('../db')
  await query(
    `INSERT INTO discovery_skills_map (run_id, functions)
     VALUES ($1, $2)
     ON CONFLICT (run_id) DO UPDATE SET functions = EXCLUDED.functions`,
    [runId, JSON.stringify(functions)],
  )
}

export async function getSkillsMap(runId: string): Promise<FunctionalSkill[] | null> {
  if (!usePg()) return fileRead(runId)?.functions ?? null

  const { query } = await import('../db')
  const rows = await query<{ functions: FunctionalSkill[] }>(
    'SELECT functions FROM discovery_skills_map WHERE run_id = $1',
    [runId],
  )
  return rows[0]?.functions ?? null
}

// ─── Step 3: roles ────────────────────────────────────────────────────────────

export async function saveRoles(runId: string, roles: DiscoveryRole[]): Promise<void> {
  if (!usePg()) {
    const run = fileRead(runId)
    if (run) fileWrite(runId, { ...run, roles, reactions: {} })
    return
  }

  const { getPool } = await import('../db')
  const client = await getPool().connect()
  try {
    await client.query('BEGIN')
    // Regenerating replaces the previous deck; reactions cascade away with it.
    await client.query('DELETE FROM discovery_roles WHERE run_id = $1', [runId])
    for (const r of roles) {
      await client.query(
        `INSERT INTO discovery_roles (id, run_id, rank, title, industry, plain_language_line, why_fits, functions_used, gap)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          r.id,
          r.runId,
          r.rank,
          r.title,
          r.industry,
          r.plainLanguageLine,
          r.whyFits,
          JSON.stringify(r.functionsUsed),
          r.gap,
        ],
      )
    }
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export async function getRoles(runId: string): Promise<DiscoveryRole[]> {
  if (!usePg()) return fileRead(runId)?.roles ?? []

  const { query } = await import('../db')
  const rows = await query<{
    id: string
    run_id: string
    rank: number
    title: string
    industry: string | null
    plain_language_line: string
    why_fits: string
    functions_used: string[]
    gap: string
  }>(
    `SELECT id, run_id, rank, title, industry, plain_language_line, why_fits, functions_used, gap
     FROM discovery_roles WHERE run_id = $1 ORDER BY rank ASC`,
    [runId],
  )
  return rows.map((r) => ({
    id: r.id,
    runId: r.run_id,
    rank: r.rank,
    title: r.title,
    industry: r.industry ?? '',
    plainLanguageLine: r.plain_language_line,
    whyFits: r.why_fits,
    functionsUsed: r.functions_used,
    gap: r.gap,
  }))
}

// ─── Step 4: reactions + shortlist ────────────────────────────────────────────

export async function saveReaction(
  runId: string,
  roleId: string,
  reaction: Reaction,
): Promise<void> {
  if (!usePg()) {
    const run = fileRead(runId)
    if (run) fileWrite(runId, { ...run, reactions: { ...(run.reactions ?? {}), [roleId]: reaction } })
    return
  }

  const { query } = await import('../db')
  await query(
    `INSERT INTO discovery_reactions (run_id, role_id, reaction)
     VALUES ($1, $2, $3)
     ON CONFLICT (run_id, role_id) DO UPDATE SET reaction = EXCLUDED.reaction`,
    [runId, roleId, reaction],
  )
}

export async function getReactions(runId: string): Promise<Record<string, Reaction>> {
  if (!usePg()) return fileRead(runId)?.reactions ?? {}

  const { query } = await import('../db')
  const rows = await query<{ role_id: string; reaction: Reaction }>(
    'SELECT role_id, reaction FROM discovery_reactions WHERE run_id = $1',
    [runId],
  )
  return Object.fromEntries(rows.map((r) => [r.role_id, r.reaction]))
}

/**
 * Ranked shortlist: liked roles first, then unsure, each group in original
 * suggestion order. Passed roles are dropped.
 */
export async function getShortlist(runId: string): Promise<ShortlistEntry[]> {
  const [roles, reactions] = await Promise.all([getRoles(runId), getReactions(runId)])
  const weight: Record<Reaction, number> = { like: 0, unsure: 1, pass: 2 }

  return roles
    .filter((r) => reactions[r.id] === 'like' || reactions[r.id] === 'unsure')
    .map((role) => ({ role, reaction: reactions[role.id] }))
    .sort((a, b) => weight[a.reaction] - weight[b.reaction] || a.role.rank - b.role.rank)
}

// ─── Bridge: single target-role commitment ────────────────────────────────────
// Persona A (Discovery) and Persona B (/target-role direct entry) both land
// here, keyed by their own commitment id — not by runId, since Persona B has
// no discovery run at all. File-mode stores commitments separately from run
// files (a subdirectory, not the top-level .discovery/<runId>.json shape).

function commitmentFilePath(id: string): string {
  const path = require('path') as typeof import('path')
  return path.join(process.cwd(), '.discovery', 'commitments', `${id}.json`)
}

function fileReadCommitment(id: string): TargetCommitment | null {
  try {
    const fs = require('fs') as typeof import('fs')
    return JSON.parse(fs.readFileSync(commitmentFilePath(id), 'utf-8')) as TargetCommitment
  } catch {
    return null
  }
}

function fileWriteCommitment(id: string, commitment: TargetCommitment): void {
  const fs = require('fs') as typeof import('fs')
  const path = require('path') as typeof import('path')
  fs.mkdirSync(path.join(process.cwd(), '.discovery', 'commitments'), { recursive: true })
  fs.writeFileSync(commitmentFilePath(id), JSON.stringify(commitment, null, 2))
}

export async function saveCommitment(
  id: string,
  userId: string | null,
  input: {
    runId: string | null
    roleId: string | null
    source: CommitmentSource
    roleTitle: string
    plainLanguageLine: string | null
  },
): Promise<TargetCommitment> {
  const commitment: TargetCommitment = { id, userId, committedAt: new Date().toISOString(), ...input }

  if (!usePg()) {
    fileWriteCommitment(id, commitment)
    return commitment
  }

  const { query } = await import('../db')
  const rows = await query<{ committed_at: string }>(
    `INSERT INTO discovery_target_commitment (id, user_id, run_id, role_id, source, role_title, plain_language_line)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (id) DO UPDATE SET
       run_id = EXCLUDED.run_id,
       role_id = EXCLUDED.role_id,
       source = EXCLUDED.source,
       role_title = EXCLUDED.role_title,
       plain_language_line = EXCLUDED.plain_language_line,
       updated_at = NOW()
     RETURNING committed_at`,
    [id, userId, input.runId, input.roleId, input.source, input.roleTitle, input.plainLanguageLine],
  )
  return { ...commitment, committedAt: String(rows[0]?.committed_at ?? commitment.committedAt) }
}

export async function getCommitment(id: string): Promise<TargetCommitment | null> {
  if (!usePg()) return fileReadCommitment(id)

  const { query } = await import('../db')
  const rows = await query<{
    id: string
    user_id: string | null
    run_id: string | null
    role_id: string | null
    source: CommitmentSource
    role_title: string
    plain_language_line: string | null
    committed_at: string
  }>(
    `SELECT id, user_id, run_id, role_id, source, role_title, plain_language_line, committed_at
     FROM discovery_target_commitment WHERE id = $1`,
    [id],
  )
  const row = rows[0]
  if (!row) return null
  return {
    id: row.id,
    userId: row.user_id,
    runId: row.run_id,
    roleId: row.role_id,
    source: row.source,
    roleTitle: row.role_title,
    plainLanguageLine: row.plain_language_line,
    committedAt: String(row.committed_at),
  }
}
