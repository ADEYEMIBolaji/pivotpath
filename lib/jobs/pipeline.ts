/**
 * Ingest pipeline:
 *   1. Fetch all adapters in parallel (rate-limited)
 *   2. Dedup: collapse cross-postings into one CanonicalJob
 *   3. Freshness: drop anything > 30 days old
 *   4. Link verification: HEAD-check each URL, mark dead links
 *   5. Upsert into store
 */

import { ADAPTERS } from './registry'
import { getJobStore } from './store'
import { dedupKey, titlesMatch } from './normalise'
import type {
  RawListing, CanonicalJob, IngestSummary, SourceName, JobQuery,
} from './types'

const MAX_AGE_DAYS = 30
const LINK_CHECK_TIMEOUT_MS = 5_000
const LINK_CHECK_CONCURRENCY = 10

// ─── Step 1: Fetch all adapters ───────────────────────────────────────────────

async function fetchAll(query: JobQuery): Promise<Map<SourceName, RawListing[]>> {
  const results = new Map<SourceName, RawListing[]>()

  await Promise.allSettled(
    ADAPTERS.map(async (adapter) => {
      try {
        const listings = await adapter.fetch(query)
        results.set(adapter.name, listings)
        console.log(`[pipeline] ${adapter.name}: fetched ${listings.length} listings`)
      } catch (err) {
        console.error(`[pipeline] ${adapter.name} failed:`, err)
        results.set(adapter.name, [])
      }
    }),
  )

  return results
}

// ─── Step 2: Dedup ────────────────────────────────────────────────────────────

interface DedupBucket {
  listings: (RawListing & { _key: string })[]
}

/**
 * Merge all raw listings into deduplicated CanonicalJob candidates.
 * Algorithm:
 *   a) Build a primary dedup key from normalised(employer + title + location)
 *   b) For listings whose key hasn't been seen, also check fuzzy title matching
 *      against existing buckets for the same employer — catches "APM" vs "Associate PM"
 *   c) Within each bucket, the freshest listing becomes primarySource
 *   d) Others become alsoListedOn
 */
function dedup(allListings: RawListing[]): { jobs: CanonicalJob[]; duplicatesMerged: number } {
  // Map from dedupKey → RawListing[]
  const buckets = new Map<string, RawListing[]>()

  for (const listing of allListings) {
    const key = dedupKey(listing.employer, listing.title, listing.location)

    if (buckets.has(key)) {
      buckets.get(key)!.push(listing)
      continue
    }

    // Fuzzy check against same-employer buckets
    let merged = false
    for (const [existingKey, existingListings] of buckets) {
      const rep = existingListings[0]
      if (
        rep.employer.toLowerCase().trim() === listing.employer.toLowerCase().trim() &&
        titlesMatch(rep.title, listing.title)
      ) {
        existingListings.push(listing)
        merged = true
        break
      }
    }

    if (!merged) {
      buckets.set(key, [listing])
    }
  }

  let duplicatesMerged = 0
  const now = new Date().toISOString()
  const jobs: CanonicalJob[] = []

  for (const [key, listings] of buckets) {
    // Sort freshest first
    listings.sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime())
    const [primary, ...dupes] = listings
    if (dupes.length > 0) duplicatesMerged += dupes.length

    const alsoListedOn = [
      ...new Set(dupes.map((d) => d.sourceName).filter((s) => s !== primary.sourceName)),
    ] as SourceName[]

    jobs.push({
      id: crypto.randomUUID(),
      dedupKey: key,
      title: primary.title,
      employer: primary.employer,
      primarySource: primary.sourceName,
      primarySourceUrl: primary.sourceUrl,
      alsoListedOn,
      location: primary.location,
      remote: primary.remote,
      salaryMin: primary.salaryMin,
      salaryMax: primary.salaryMax,
      currency: 'GBP',
      postedAt: primary.postedAt,
      descriptionText: primary.descriptionText,
      rawSkills: [...new Set([...primary.rawSkills, ...dupes.flatMap((d) => d.rawSkills)])],
      lastVerifiedAt: now,
      lastRefreshedAt: now,
      deadLink: false,
    })
  }

  return { jobs, duplicatesMerged }
}

// ─── Step 3: Freshness filter ─────────────────────────────────────────────────

function filterStale(jobs: CanonicalJob[]): { fresh: CanonicalJob[]; staleRemoved: number } {
  const cutoff = Date.now() - MAX_AGE_DAYS * 86_400_000
  const fresh: CanonicalJob[] = []
  let staleRemoved = 0

  for (const job of jobs) {
    if (new Date(job.postedAt).getTime() < cutoff) {
      staleRemoved++
    } else {
      fresh.push(job)
    }
  }

  return { fresh, staleRemoved }
}

// ─── Step 4: Link verification ────────────────────────────────────────────────

async function verifyLinks(
  jobs: CanonicalJob[],
): Promise<{ verified: CanonicalJob[]; deadLinksRemoved: number }> {
  let deadLinksRemoved = 0

  // Process in batches to respect concurrency limit
  const results: CanonicalJob[] = []
  for (let i = 0; i < jobs.length; i += LINK_CHECK_CONCURRENCY) {
    const batch = jobs.slice(i, i + LINK_CHECK_CONCURRENCY)
    const checked = await Promise.all(
      batch.map(async (job) => {
        try {
          const res = await fetch(job.primarySourceUrl, {
            method: 'HEAD',
            redirect: 'follow',
            signal: AbortSignal.timeout(LINK_CHECK_TIMEOUT_MS),
          })
          if (res.status === 404) {
            deadLinksRemoved++
            return { ...job, deadLink: true }
          }
          return { ...job, lastVerifiedAt: new Date().toISOString() }
        } catch {
          // Network error — don't mark as dead, just skip verification
          return job
        }
      }),
    )
    results.push(...checked)
  }

  return { verified: results, deadLinksRemoved }
}

// ─── Step 5: Upsert ──────────────────────────────────────────────────────────

async function upsertAll(jobs: CanonicalJob[]): Promise<void> {
  const store = getJobStore()
  await Promise.all(jobs.filter((j) => !j.deadLink).map((j) => store.upsert(j)))
}

// ─── Public entry point ───────────────────────────────────────────────────────

export async function runIngestPipeline(query: JobQuery): Promise<IngestSummary> {
  const fetchedAt = new Date().toISOString()

  // 1. Fetch
  const bySource = await fetchAll(query)
  const allListings = [...bySource.values()].flat()
  const totalFetched = allListings.length

  // 2. Dedup
  const { jobs: dedupedJobs, duplicatesMerged } = dedup(allListings)

  // 3. Freshness
  const { fresh, staleRemoved } = filterStale(dedupedJobs)

  // 4. Link verification (skip in test/mock mode for speed)
  const skipVerify = process.env.SKIP_LINK_VERIFICATION === 'true'
  let verified: CanonicalJob[]
  let deadLinksRemoved = 0
  if (skipVerify) {
    verified = fresh
  } else {
    ;({ verified, deadLinksRemoved } = await verifyLinks(fresh))
  }

  // 5. Upsert
  await upsertAll(verified)

  // Build bySource summary
  const bySrcSummary = Object.fromEntries(
    ADAPTERS.map((a) => [
      a.name,
      {
        fetched: bySource.get(a.name)?.length ?? 0,
        new: 0,     // would need pre/post store count to compute accurately
        updated: 0,
      },
    ]),
  ) as IngestSummary['bySource']

  return {
    fetchedAt,
    totalFetched,
    duplicatesMerged,
    staleRemoved,
    deadLinksRemoved,
    bySource: bySrcSummary,
  }
}
