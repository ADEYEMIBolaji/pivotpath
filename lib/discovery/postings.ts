/**
 * Real-postings lookup for Discovery Mode's Step 3 roles — TEST BUILD.
 *
 * Resolves the single biggest gap flagged before this build could go live:
 * Step 3's role titles were pure Claude reasoning with no check against
 * whether anyone is actually hiring for them. This grounds each candidate
 * title in a real UK postings count (and a few samples) via Adzuna — the
 * same provider and credentials as lib/jobs/, which already integrates it
 * for the main app's job matching.
 *
 * Deliberately calls Adzuna directly here rather than going through
 * lib/jobs/adapters/adzuna.ts's queryAdzuna(): that function is tuned for the
 * main pipeline's needs (merges results across up to 5 roles per call,
 * discards the total `count`). Discovery Mode needs, per individual role
 * title: the total live count plus a couple of samples — kept as its own
 * small client so a future change to the main pipeline's merging behaviour
 * doesn't silently change what Discovery Mode shows, and vice versa. Both
 * read the same ADZUNA_APP_ID / ADZUNA_APP_KEY env vars — no new credential.
 *
 * TODO (partial — still worth revisiting before production): Adzuna is a UK
 * jobs aggregator, so this only grounds UK-market roles; a global launch
 * would need a per-region source or an explicit "UK data only" disclosure.
 * NHS and Civil Service postings are already folded into Adzuna's UK coverage
 * (see lib/jobs/adapters/adzuna.ts's header comment), so this one source
 * covers the same three of the main app's four active adapters.
 */

import { adzunaConfigured } from '../jobs/adapters/adzuna'
import type { RolePosting } from './types'

const ADZUNA_SEARCH_URL = 'https://api.adzuna.com/v1/api/jobs/gb/search/1'

interface AdzunaSearchResponse {
  count: number
  results: {
    title: string
    company?: { display_name?: string }
    location?: { display_name?: string }
    redirect_url: string
    salary_min: number | null
    salary_max: number | null
  }[]
}

/**
 * Looks up one role title. Returns null when Adzuna isn't configured or the
 * request fails — the caller must treat null as "no data", never fabricate a
 * count. `what_phrase` (exact-phrase match) is used instead of `what` (AND of
 * words) so a niche/invented-sounding title gets an honest signal rather than
 * a falsely-inflated count from a loose word match.
 */
export async function lookupRolePostings(
  title: string,
): Promise<{ count: number; samples: RolePosting[] } | null> {
  if (!adzunaConfigured()) return null

  const params = new URLSearchParams({
    app_id: process.env.ADZUNA_APP_ID!,
    app_key: process.env.ADZUNA_APP_KEY!,
    results_per_page: '3',
    sort_by: 'relevance',
    what_phrase: title,
  })

  try {
    const res = await fetch(`${ADZUNA_SEARCH_URL}?${params}`, { signal: AbortSignal.timeout(8_000) })
    if (!res.ok) return null
    const data = (await res.json()) as AdzunaSearchResponse
    return {
      count: data.count ?? 0,
      samples: (data.results ?? []).slice(0, 3).map((j) => ({
        title: j.title,
        employer: j.company?.display_name || 'Undisclosed',
        location: j.location?.display_name ?? 'UK',
        url: j.redirect_url,
        salaryMin: j.salary_min != null ? Math.round(j.salary_min) : null,
        salaryMax: j.salary_max != null ? Math.round(j.salary_max) : null,
      })),
    }
  } catch (err) {
    console.warn('[discovery/postings] Adzuna lookup failed for', title, err)
    return null
  }
}

/**
 * Attaches real-postings data to each role in parallel. Never throws and
 * never blocks the whole deck on one failed lookup — a role that couldn't be
 * checked just keeps postingCount: null, exactly as if this lookup didn't
 * exist yet.
 */
export async function attachRealPostings<T extends { title: string }>(
  roles: T[],
): Promise<(T & { postingCount: number | null; samplePostings: RolePosting[] })[]> {
  const results = await Promise.all(roles.map((r) => lookupRolePostings(r.title)))
  return roles.map((r, i) => ({
    ...r,
    postingCount: results[i]?.count ?? null,
    samplePostings: results[i]?.samples ?? [],
  }))
}
