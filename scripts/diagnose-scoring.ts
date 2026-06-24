/** Check fit-score spread against a real session. npx tsx scripts/diagnose-scoring.ts */
import { readFileSync } from 'fs'
const env = readFileSync('.env.local', 'utf8')
for (const line of env.split('\n')) {
  const i = line.indexOf('='); if (i > 0 && !line.startsWith('#')) process.env[line.slice(0, i).trim()] = line.slice(i + 1).trim()
}

async function main() {
  const { Client } = await import('pg')
  const { getJobStore } = await import('../lib/jobs/store')
  const { getSession } = await import('../lib/session-store')
  const { scoreJobs } = await import('../lib/jobs/scoring')

  const db = new Client({ connectionString: process.env.DATABASE_URL })
  await db.connect()
  const row = (await db.query("SELECT id FROM sessions WHERE translation_map IS NOT NULL ORDER BY created_at DESC LIMIT 1")).rows[0]
  await db.end()
  if (!row) { console.log('no scored session found'); return }

  const session = await getSession(row.id)
  const jobs = await getJobStore().list()
  const scored = scoreJobs(jobs!, session!)

  console.log(`Session ${row.id.slice(0,8)} | target: ${session!.target.title} | ${jobs.length} jobs`)
  const buckets = { high: 0, partial: 0, neutral: 0 }
  for (const j of scored) buckets[j.fitBucket]++
  console.log('buckets:', buckets)
  console.log('score spread:', scored.map(j => j.fitScore).filter((_, i) => i % 10 === 0))
  console.log('\nTop 8:')
  for (const j of scored.slice(0, 8)) console.log(`  ${String(j.fitScore).padStart(3)}% ${j.primarySource.padEnd(13)} ${j.title.slice(0,40)}  [${j.matchedSkills.slice(0,3).join(', ')}]`)
  console.log('\nBottom 3:')
  for (const j of scored.slice(-3)) console.log(`  ${String(j.fitScore).padStart(3)}% ${j.title.slice(0,40)}`)
  process.exit(0)
}
main().catch(e => { console.error(e); process.exit(1) })
