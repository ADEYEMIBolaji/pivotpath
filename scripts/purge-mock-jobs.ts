/**
 * One-off: remove leftover mock jobs (placeholder example.com apply URLs and
 * the retired linkedin/otta sources) from the jobs table.
 *   npx tsx scripts/purge-mock-jobs.ts
 */
import { readFileSync } from 'fs'
import { Client } from 'pg'

const env = readFileSync('.env.local', 'utf8')
const v = (k: string) => {
  const l = env.split('\n').find((x) => x.startsWith(k + '='))
  return l ? l.slice(k.length + 1).trim() : ''
}

async function main() {
  const db = new Client({ connectionString: v('DATABASE_URL') })
  await db.connect()
  const r = await db.query(
    `DELETE FROM jobs
     WHERE primary_source_url LIKE '%example.com%'
        OR primary_source IN ('linkedin', 'otta')
     RETURNING id`,
  )
  console.log(`Deleted ${r.rowCount} mock/retired job(s).`)
  const left = await db.query('SELECT primary_source, COUNT(*)::int FROM jobs GROUP BY primary_source ORDER BY 2 DESC')
  console.log('Remaining by source:', Object.fromEntries(left.rows.map((x) => [x.primary_source, x.count])))
  await db.end()
}

main().catch((e) => { console.error(e); process.exit(1) })
