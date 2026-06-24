/**
 * Diagnostic: run the job ingest pipeline against the configured DB and report
 * what each source returned and how many jobs ended up in the store.
 *   npx tsx scripts/diagnose-jobs.ts
 */
import { readFileSync } from 'fs'

const env = readFileSync('.env.local', 'utf8')
for (const line of env.split('\n')) {
  const i = line.indexOf('=')
  if (i > 0 && !line.startsWith('#')) process.env[line.slice(0, i).trim()] = line.slice(i + 1).trim()
}
process.env.SKIP_LINK_VERIFICATION = 'true'

async function main() {
  const { runIngestPipeline } = await import('../lib/jobs/pipeline')
  const { getJobStore } = await import('../lib/jobs/store')

  console.log('Running pipeline (keywords: project manager / data analyst)…\n')
  const summary = await runIngestPipeline({
    keywords: ['project manager', 'data analyst'],
    location: 'United Kingdom',
    maxResults: 50,
  })

  console.log('\n=== Ingest summary ===')
  console.log('total fetched:', summary.totalFetched)
  console.log('duplicates merged:', summary.duplicatesMerged)
  console.log('stale removed:', summary.staleRemoved)
  console.log('per source:', JSON.stringify(summary.bySource, null, 2))

  const store = getJobStore()
  const all = await store.list()
  console.log('\n=== Store now contains', all.length, 'jobs ===')
  for (const j of all.slice(0, 8)) {
    console.log(`  ${j.primarySource.padEnd(13)} ${j.title} @ ${j.employer}`)
  }
  process.exit(0)
}

main().catch((err) => { console.error(err); process.exit(1) })
