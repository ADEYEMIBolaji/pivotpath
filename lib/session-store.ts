/**
 * Session persistence — dual-mode:
 *   DATABASE_URL set → Postgres
 *   No DATABASE_URL  → file-based JSON store in .sessions/ (dev/demo)
 *
 * All functions are async so callers are consistent regardless of backend.
 */

import type { AnalysisSession } from './types'

// ─── File-based store ─────────────────────────────────────────────────────────

function fileSave(id: string, session: AnalysisSession): void {
  const fs = require('fs') as typeof import('fs')
  const path = require('path') as typeof import('path')
  const dir = path.join(process.cwd(), '.sessions')
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, `${id}.json`), JSON.stringify(session, null, 2))
}

function fileGet(id: string): AnalysisSession | null {
  try {
    const fs = require('fs') as typeof import('fs')
    const path = require('path') as typeof import('path')
    const raw = fs.readFileSync(path.join(process.cwd(), '.sessions', `${id}.json`), 'utf-8')
    return JSON.parse(raw) as AnalysisSession
  } catch {
    return null
  }
}

// ─── Postgres store ───────────────────────────────────────────────────────────

function rowToSession(row: Record<string, unknown>): AnalysisSession {
  return {
    id:             row.id as string,
    userId:         row.user_id as string | null,
    profile:        row.profile as AnalysisSession['profile'],
    target:         row.target as AnalysisSession['target'],
    translationMap: row.translation_map as AnalysisSession['translationMap'] ?? undefined,
    gapScorecard:   row.gap_scorecard as AnalysisSession['gapScorecard'] ?? undefined,
    resume:         row.resume as AnalysisSession['resume'] ?? undefined,
    strategy:       row.strategy as AnalysisSession['strategy'] ?? undefined,
    createdAt:      row.created_at as string,
    updatedAt:      row.updated_at as string,
  }
}

async function pgSave(session: AnalysisSession): Promise<void> {
  const { getPool } = await import('./db')
  const pool = getPool()
  const now = new Date().toISOString()
  await pool.query(
    `INSERT INTO sessions
       (id, user_id, profile, target, translation_map, gap_scorecard, resume, strategy, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$9)
     ON CONFLICT (id) DO UPDATE SET
       profile        = EXCLUDED.profile,
       target         = EXCLUDED.target,
       translation_map = EXCLUDED.translation_map,
       gap_scorecard  = EXCLUDED.gap_scorecard,
       resume         = EXCLUDED.resume,
       strategy       = EXCLUDED.strategy,
       updated_at     = EXCLUDED.updated_at`,
    [
      session.id,
      session.userId ?? null,
      JSON.stringify(session.profile),
      JSON.stringify(session.target),
      session.translationMap ? JSON.stringify(session.translationMap) : null,
      session.gapScorecard   ? JSON.stringify(session.gapScorecard)   : null,
      session.resume         ? JSON.stringify(session.resume)         : null,
      session.strategy       ? JSON.stringify(session.strategy)       : null,
      now,
    ],
  )
}

async function pgGet(id: string): Promise<AnalysisSession | null> {
  const { getPool } = await import('./db')
  const pool = getPool()
  const result = await pool.query('SELECT * FROM sessions WHERE id = $1', [id])
  if (!result.rows[0]) return null
  return rowToSession(result.rows[0] as Record<string, unknown>)
}

// ─── Public API ───────────────────────────────────────────────────────────────

const USE_PG = !!process.env.DATABASE_URL

export async function saveSession(id: string, session: AnalysisSession): Promise<void> {
  if (USE_PG) {
    await pgSave({ ...session, id })
  } else {
    fileSave(id, session)
  }
}

export async function getSession(id: string): Promise<AnalysisSession | null> {
  if (USE_PG) {
    return pgGet(id)
  }
  return fileGet(id)
}

export async function updateSession(id: string, patch: Partial<AnalysisSession>): Promise<void> {
  const existing = await getSession(id)
  if (!existing) throw new Error(`Session ${id} not found`)
  await saveSession(id, { ...existing, ...patch, updatedAt: new Date().toISOString() })
}
