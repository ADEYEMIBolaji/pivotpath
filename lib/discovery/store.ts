/**
 * Discovery Mode persistence — TEST BUILD.
 *
 * Dual-mode, mirroring lib/session-store.ts:
 *   DATABASE_URL set → Postgres (discovery_* tables, migration 009)
 *   No DATABASE_URL  → JSON files under .discovery/ so the flow demos locally
 *                      with nothing but an ANTHROPIC_API_KEY.
 */

import type {
  DiscoveryIntake,
  DiscoveryRole,
  FunctionalSkill,
  IntakeAnswers,
  Reaction,
  ShortlistEntry,
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
  answers: IntakeAnswers,
): Promise<DiscoveryIntake> {
  const intake: DiscoveryIntake = {
    id: runId,
    userId,
    answers,
    createdAt: new Date().toISOString(),
  }

  if (!usePg()) {
    fileWrite(runId, { ...(fileRead(runId) ?? { intake }), intake })
    return intake
  }

  const { query } = await import('../db')
  const rows = await query<{ created_at: string }>(
    `INSERT INTO discovery_intake (id, user_id, answers)
     VALUES ($1, $2, $3)
     ON CONFLICT (id) DO UPDATE SET answers = EXCLUDED.answers, updated_at = NOW()
     RETURNING created_at`,
    [runId, userId, JSON.stringify(answers)],
  )
  return { ...intake, createdAt: String(rows[0]?.created_at ?? intake.createdAt) }
}

export async function getIntake(runId: string): Promise<DiscoveryIntake | null> {
  if (!usePg()) return fileRead(runId)?.intake ?? null

  const { query } = await import('../db')
  const rows = await query<{
    id: string
    user_id: string | null
    answers: IntakeAnswers
    created_at: string
  }>('SELECT id, user_id, answers, created_at FROM discovery_intake WHERE id = $1', [runId])
  const row = rows[0]
  if (!row) return null
  return {
    id: row.id,
    userId: row.user_id,
    answers: row.answers,
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
        `INSERT INTO discovery_roles (id, run_id, rank, title, industry, why_fits, functions_used, gap)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [r.id, r.runId, r.rank, r.title, r.industry, r.whyFits, JSON.stringify(r.functionsUsed), r.gap],
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
    why_fits: string
    functions_used: string[]
    gap: string
  }>(
    `SELECT id, run_id, rank, title, industry, why_fits, functions_used, gap
     FROM discovery_roles WHERE run_id = $1 ORDER BY rank ASC`,
    [runId],
  )
  return rows.map((r) => ({
    id: r.id,
    runId: r.run_id,
    rank: r.rank,
    title: r.title,
    industry: r.industry ?? '',
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
