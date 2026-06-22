/**
 * Migration runner — idempotent, run any time.
 * Usage: npx tsx lib/migrations/run.ts
 */

import fs from 'fs'
import path from 'path'
import { getPool } from '../db'

const MIGRATIONS_DIR = path.join(__dirname)

async function run() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not set. Add it to .env.local first.')
    process.exit(1)
  }

  const pool = getPool()

  // Ensure migrations tracking table exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      filename TEXT PRIMARY KEY,
      ran_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort()

  for (const file of files) {
    const { rows } = await pool.query('SELECT 1 FROM _migrations WHERE filename = $1', [file])
    if (rows.length > 0) {
      console.log(`  skip  ${file} (already ran)`)
      continue
    }

    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8')
    await pool.query(sql)
    await pool.query('INSERT INTO _migrations (filename) VALUES ($1)', [file])
    console.log(`  ✓     ${file}`)
  }

  console.log('\nMigrations complete.')
  await pool.end()
}

run().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
