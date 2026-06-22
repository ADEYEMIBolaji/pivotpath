/**
 * POST /api/migrate — run all pending SQL migrations.
 * Protected by MIGRATE_SECRET so it can only be called intentionally.
 * Call once after deploying: curl -X POST https://your-app.vercel.app/api/migrate \
 *   -H "Authorization: Bearer $MIGRATE_SECRET"
 */

import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { getPool } from '@/lib/db'

export const runtime = 'nodejs'

export async function POST(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.MIGRATE_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'MIGRATE_SECRET not configured' }, { status: 500 })
  }

  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const pool = getPool()

    await pool.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        filename TEXT PRIMARY KEY,
        ran_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)

    const migrationsDir = path.join(process.cwd(), 'lib', 'migrations')
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort()

    const applied: string[] = []
    const skipped: string[] = []

    for (const file of files) {
      const { rows } = await pool.query(
        'SELECT 1 FROM _migrations WHERE filename = $1',
        [file],
      )
      if (rows.length > 0) {
        skipped.push(file)
        continue
      }
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8')
      await pool.query(sql)
      await pool.query('INSERT INTO _migrations (filename) VALUES ($1)', [file])
      applied.push(file)
    }

    return NextResponse.json({ ok: true, applied, skipped })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[/api/migrate]', message)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
