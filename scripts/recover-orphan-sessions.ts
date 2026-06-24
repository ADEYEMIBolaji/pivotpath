/**
 * Recover pivots that were saved with user_id = null (before sessions were
 * linked to accounts).
 *
 * How: when an authenticated user ran a pivot, a usage_events row was written
 * with the correct user_id at the same instant the session was saved. We match
 * each orphaned session to the usage_event created within a few seconds of it
 * and restore the owner.
 *
 *   Dry run (default, no changes):  npx tsx scripts/recover-orphan-sessions.ts
 *   Apply the matches:              npx tsx scripts/recover-orphan-sessions.ts --apply
 *
 * Reads DATABASE_URL from .env.local.
 */

import { readFileSync } from 'fs'
import { Client } from 'pg'

const env = readFileSync('.env.local', 'utf8')
function v(key: string): string {
  const line = env.split('\n').find((l) => l.startsWith(key + '='))
  return line ? line.slice(key.length + 1).trim() : ''
}

const APPLY = process.argv.includes('--apply')
const WINDOW_SECONDS = 20

async function main() {
  const dbUrl = v('DATABASE_URL')
  if (!dbUrl) throw new Error('DATABASE_URL missing in .env.local')

  const db = new Client({ connectionString: dbUrl })
  await db.connect()

  const orphans = (await db.query(
    `SELECT id, created_at, profile->>'name' AS name, target->>'title' AS target
     FROM sessions WHERE user_id IS NULL ORDER BY created_at`,
  )).rows

  console.log(`\nFound ${orphans.length} orphaned pivot(s) (user_id IS NULL).\n`)
  if (orphans.length === 0) { await db.end(); return }

  let matched = 0
  let unmatched = 0

  for (const o of orphans) {
    const m = (await db.query(
      `SELECT ue.user_id, u.email
       FROM usage_events ue
       LEFT JOIN users u ON u.id = ue.user_id
       WHERE ue.event_type = 'pivot_analysis'
         AND ue.created_at BETWEEN $1::timestamptz - interval '${WINDOW_SECONDS} seconds'
                               AND $1::timestamptz + interval '${WINDOW_SECONDS} seconds'
       ORDER BY ABS(EXTRACT(EPOCH FROM (ue.created_at - $1::timestamptz)))
       LIMIT 1`,
      [o.created_at],
    )).rows[0]

    const label = `${o.name ?? '?'} → ${o.target ?? '?'} (${new Date(o.created_at).toISOString().slice(0, 16)})`

    if (m?.user_id) {
      matched++
      console.log(`  ✓ ${o.id.slice(0, 8)}  ${label}  →  ${m.email ?? m.user_id}`)
      if (APPLY) {
        await db.query('UPDATE sessions SET user_id = $1 WHERE id = $2', [m.user_id, o.id])
      }
    } else {
      unmatched++
      console.log(`  – ${o.id.slice(0, 8)}  ${label}  →  no owner found (was anonymous)`)
    }
  }

  console.log(`\n${matched} recoverable, ${unmatched} anonymous (can't attribute).`)
  console.log(APPLY ? '\n✓ Applied — owners restored.' : '\nDry run only. Re-run with --apply to restore owners.')
  await db.end()
}

main().catch((err) => { console.error(err); process.exit(1) })
