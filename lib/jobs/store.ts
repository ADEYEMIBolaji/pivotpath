/**
 * Job persistence layer.
 *
 * Dual-mode:
 *   DATABASE_URL set → Postgres (via pg)
 *   No DATABASE_URL  → file-based JSON store in .jobs/ (dev/demo)
 *
 * Both modes implement the same JobStore interface so the pipeline
 * and API are completely agnostic.
 */

import fs from 'fs'
import path from 'path'
import { getPool } from '../db'
import type { CanonicalJob, SavedJobRow, ApplicationEventRow, SourceName } from './types'

// ─── Interface ────────────────────────────────────────────────────────────────

export interface JobStore {
  /** Insert or update (by dedupKey). Returns the canonical id. */
  upsert(job: Omit<CanonicalJob, 'id'> & { id?: string }): Promise<string>
  /** Retrieve a single job by id. */
  getById(id: string): Promise<CanonicalJob | null>
  /** List all non-dead jobs, optionally filtered. */
  list(opts?: {
    sourceFilter?: SourceName
    remoteOnly?: boolean
    maxAgeDays?: number
  }): Promise<CanonicalJob[]>
  /** Mark dead link (404 detected) */
  markDead(id: string): Promise<void>
  /** Record a saved job for a session */
  saveJob(sessionId: string, jobId: string): Promise<void>
  /** Remove a saved job */
  unsaveJob(sessionId: string, jobId: string): Promise<void>
  /** Get all saved job ids for a session */
  getSavedJobIds(sessionId: string): Promise<string[]>
  /** Record that a user clicked Apply */
  recordApplication(sessionId: string, jobId: string, source: SourceName): Promise<void>
  /** Count by source for the ingest summary */
  countBySource(): Promise<Record<string, number>>
  /** Bulk delete jobs older than maxAgeDays */
  deleteStale(maxAgeDays: number): Promise<number>
}

// JSONB columns come back from pg already parsed (arrays/objects); file store
// holds them as arrays too. Tolerate a stringified value just in case.
function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value
  if (typeof value === 'string') {
    try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed : [] } catch { return [] }
  }
  return []
}

// ─── File-based store ─────────────────────────────────────────────────────────

const JOBS_DIR = path.join(process.cwd(), '.jobs')

interface FileDb {
  jobs: Record<string, CanonicalJob>
  savedJobs: SavedJobRow[]
  applications: ApplicationEventRow[]
  lastModified: string
}

function readDb(): FileDb {
  const file = path.join(JOBS_DIR, 'db.json')
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8')) as FileDb
  } catch {
    return { jobs: {}, savedJobs: [], applications: [], lastModified: new Date().toISOString() }
  }
}

function writeDb(db: FileDb): void {
  fs.mkdirSync(JOBS_DIR, { recursive: true })
  db.lastModified = new Date().toISOString()
  fs.writeFileSync(path.join(JOBS_DIR, 'db.json'), JSON.stringify(db, null, 2))
}

class FileJobStore implements JobStore {
  async upsert(job: Omit<CanonicalJob, 'id'> & { id?: string }): Promise<string> {
    const db = readDb()
    // Find existing by dedupKey
    const existing = Object.values(db.jobs).find((j) => j.dedupKey === job.dedupKey)
    const id = existing?.id ?? job.id ?? crypto.randomUUID()
    db.jobs[id] = { ...job, id } as CanonicalJob
    writeDb(db)
    return id
  }

  async getById(id: string): Promise<CanonicalJob | null> {
    return readDb().jobs[id] ?? null
  }

  async list(opts: { sourceFilter?: SourceName; remoteOnly?: boolean; maxAgeDays?: number } = {}): Promise<CanonicalJob[]> {
    const { sourceFilter, remoteOnly, maxAgeDays = 30 } = opts
    const cutoff = Date.now() - maxAgeDays * 86_400_000
    return Object.values(readDb().jobs).filter((j) => {
      if (j.deadLink) return false
      if (new Date(j.postedAt).getTime() < cutoff) return false
      if (sourceFilter && j.primarySource !== sourceFilter && !j.alsoListedOn.includes(sourceFilter)) return false
      if (remoteOnly && j.remote !== true) return false
      return true
    })
  }

  async markDead(id: string): Promise<void> {
    const db = readDb()
    if (db.jobs[id]) { db.jobs[id].deadLink = true; writeDb(db) }
  }

  async saveJob(sessionId: string, jobId: string): Promise<void> {
    const db = readDb()
    const already = db.savedJobs.some((r) => r.sessionId === sessionId && r.jobId === jobId)
    if (!already) {
      db.savedJobs.push({ id: crypto.randomUUID(), sessionId, jobId, savedAt: new Date().toISOString() })
      writeDb(db)
    }
  }

  async unsaveJob(sessionId: string, jobId: string): Promise<void> {
    const db = readDb()
    db.savedJobs = db.savedJobs.filter((r) => !(r.sessionId === sessionId && r.jobId === jobId))
    writeDb(db)
  }

  async getSavedJobIds(sessionId: string): Promise<string[]> {
    return readDb().savedJobs.filter((r) => r.sessionId === sessionId).map((r) => r.jobId)
  }

  async recordApplication(sessionId: string, jobId: string, source: SourceName): Promise<void> {
    const db = readDb()
    db.applications.push({ id: crypto.randomUUID(), sessionId, jobId, source, appliedAt: new Date().toISOString() })
    writeDb(db)
  }

  async countBySource(): Promise<Record<string, number>> {
    const counts: Record<string, number> = {}
    for (const j of Object.values(readDb().jobs)) {
      counts[j.primarySource] = (counts[j.primarySource] ?? 0) + 1
    }
    return counts
  }

  async deleteStale(maxAgeDays: number): Promise<number> {
    const db = readDb()
    const cutoff = Date.now() - maxAgeDays * 86_400_000
    let removed = 0
    for (const [id, job] of Object.entries(db.jobs)) {
      if (new Date(job.postedAt).getTime() < cutoff) {
        delete db.jobs[id]
        removed++
      }
    }
    if (removed > 0) writeDb(db)
    return removed
  }
}

// ─── Postgres store ───────────────────────────────────────────────────────────

class PgJobStore implements JobStore {
  private get pool() {
    // Shared singleton pool from lib/db (lazy — getPool() creates it on first use)
    return getPool()
  }

  async upsert(job: Omit<CanonicalJob, 'id'> & { id?: string }): Promise<string> {
    const id = job.id ?? crypto.randomUUID()
    const now = new Date().toISOString()
    await this.pool.query(
      `INSERT INTO jobs (
        id, dedup_key, title, employer, primary_source, primary_source_url,
        also_listed_on, location, remote, salary_min, salary_max, currency,
        posted_at, description_text, raw_skills, last_verified_at,
        last_refreshed_at, dead_link, created_at, updated_at
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$19
      )
      ON CONFLICT (dedup_key) DO UPDATE SET
        title = EXCLUDED.title,
        employer = EXCLUDED.employer,
        primary_source = EXCLUDED.primary_source,
        primary_source_url = EXCLUDED.primary_source_url,
        also_listed_on = EXCLUDED.also_listed_on,
        description_text = EXCLUDED.description_text,
        raw_skills = EXCLUDED.raw_skills,
        posted_at = EXCLUDED.posted_at,
        last_refreshed_at = EXCLUDED.last_refreshed_at,
        dead_link = EXCLUDED.dead_link,
        updated_at = EXCLUDED.updated_at
      RETURNING id`,
      [
        id, job.dedupKey, job.title, job.employer, job.primarySource,
        job.primarySourceUrl, JSON.stringify(job.alsoListedOn),
        job.location, job.remote, job.salaryMin, job.salaryMax, job.currency,
        job.postedAt, job.descriptionText, JSON.stringify(job.rawSkills),
        job.lastVerifiedAt, job.lastRefreshedAt, job.deadLink, now,
      ],
    )
    return id
  }

  async getById(id: string): Promise<CanonicalJob | null> {
    const r = await this.pool.query('SELECT * FROM jobs WHERE id = $1', [id])
    return r.rows[0] ? this.rowToJob(r.rows[0]) : null
  }

  async list(opts: { sourceFilter?: SourceName; remoteOnly?: boolean; maxAgeDays?: number } = {}): Promise<CanonicalJob[]> {
    const { sourceFilter, remoteOnly, maxAgeDays = 30 } = opts
    const cutoff = new Date(Date.now() - maxAgeDays * 86_400_000).toISOString()
    const conditions = ['dead_link = false', 'posted_at > $1']
    const params: unknown[] = [cutoff]
    if (remoteOnly) { params.push(true); conditions.push(`remote = $${params.length}`) }
    if (sourceFilter) {
      params.push(sourceFilter)
      const pText = params.length
      params.push(JSON.stringify(sourceFilter)) // jsonb scalar, e.g. '"nhs"'
      const pJson = params.length
      conditions.push(`(primary_source = $${pText} OR also_listed_on @> $${pJson}::jsonb)`)
    }
    const r = await this.pool.query(
      `SELECT * FROM jobs WHERE ${conditions.join(' AND ')} ORDER BY posted_at DESC`,
      params,
    )
    return r.rows.map(this.rowToJob)
  }

  private rowToJob(row: Record<string, unknown>): CanonicalJob {
    return {
      id: row.id as string,
      dedupKey: row.dedup_key as string,
      title: row.title as string,
      employer: row.employer as string,
      primarySource: row.primary_source as SourceName,
      primarySourceUrl: row.primary_source_url as string,
      alsoListedOn: asArray(row.also_listed_on) as SourceName[],
      location: row.location as string,
      remote: row.remote as boolean | null,
      salaryMin: row.salary_min as number | null,
      salaryMax: row.salary_max as number | null,
      currency: 'GBP',
      postedAt: row.posted_at as string,
      descriptionText: row.description_text as string,
      rawSkills: asArray(row.raw_skills) as string[],
      lastVerifiedAt: row.last_verified_at as string,
      lastRefreshedAt: row.last_refreshed_at as string,
      deadLink: row.dead_link as boolean,
    }
  }

  async markDead(id: string): Promise<void> {
    await this.pool.query('UPDATE jobs SET dead_link = true WHERE id = $1', [id])
  }

  async saveJob(sessionId: string, jobId: string): Promise<void> {
    await this.pool.query(
      `INSERT INTO saved_jobs (id, session_id, job_id, saved_at)
       VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
      [crypto.randomUUID(), sessionId, jobId, new Date().toISOString()],
    )
  }

  async unsaveJob(sessionId: string, jobId: string): Promise<void> {
    await this.pool.query('DELETE FROM saved_jobs WHERE session_id=$1 AND job_id=$2', [sessionId, jobId])
  }

  async getSavedJobIds(sessionId: string): Promise<string[]> {
    const r = await this.pool.query('SELECT job_id FROM saved_jobs WHERE session_id=$1', [sessionId])
    return r.rows.map((row) => row.job_id as string)
  }

  async recordApplication(sessionId: string, jobId: string, source: SourceName): Promise<void> {
    await this.pool.query(
      `INSERT INTO application_events (id, session_id, job_id, source, applied_at)
       VALUES ($1,$2,$3,$4,$5)`,
      [crypto.randomUUID(), sessionId, jobId, source, new Date().toISOString()],
    )
  }

  async countBySource(): Promise<Record<string, number>> {
    const r = await this.pool.query('SELECT primary_source, COUNT(*)::int FROM jobs GROUP BY primary_source')
    return Object.fromEntries(r.rows.map((row) => [row.primary_source as string, row.count as number]))
  }

  async deleteStale(maxAgeDays: number): Promise<number> {
    const cutoff = new Date(Date.now() - maxAgeDays * 86_400_000).toISOString()
    const r = await this.pool.query('DELETE FROM jobs WHERE posted_at < $1 RETURNING id', [cutoff])
    return r.rowCount ?? 0
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

let _store: JobStore | null = null

export function getJobStore(): JobStore {
  if (_store) return _store
  _store = process.env.DATABASE_URL ? new PgJobStore() : new FileJobStore()
  return _store
}
