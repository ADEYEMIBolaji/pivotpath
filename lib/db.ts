/**
 * Shared Postgres pool — singleton, safe for Next.js hot reload.
 *
 * Configured for serverless (Vercel):
 *   max: 1     — don't hold open a large pool between lambda invocations
 *   ssl        — required by Neon, Supabase, Railway, etc.
 */

import { Pool } from 'pg'

declare global {
  // Persist pool across Next.js hot reloads in dev
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined
}

export function getPool(): Pool {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL is not set. Copy .env.local.example to .env.local and add your Postgres connection string.',
    )
  }

  if (!global.__pgPool) {
    global.__pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 1,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5_000,
      idleTimeoutMillis: 10_000,
    })

    global.__pgPool.on('error', (err) => {
      console.error('[pg pool] unexpected error', err)
    })
  }

  return global.__pgPool
}

/** Run raw SQL — useful in migration scripts and route handlers */
export async function query<T extends object = Record<string, unknown>>(
  sql: string,
  values?: unknown[],
): Promise<T[]> {
  const pool = getPool()
  const result = await pool.query<T>(sql, values)
  return result.rows
}
