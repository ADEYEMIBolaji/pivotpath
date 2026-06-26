/**
 * Adzuna adapter — covers ~16M UK listings incl. NHS and Civil Service / gov.
 * Docs: https://api.adzuna.com/v1/api/jobs
 * Auth: app_id + app_key query params.
 *
 * Exposes queryAdzuna() so the NHS and Civil Service adapters can pull real
 * data from Adzuna (their own public feeds are gone) and tag it as their source.
 */

import type { SourceAdapter, RawListing, JobQuery, SourceName } from '../types'
import { extractSkills } from '../normalise'
import { MOCK_ADZUNA } from './mock-data'

interface AdzunaJob {
  id: string
  title: string
  company: { display_name: string }
  location: { display_name: string; area?: string[] }
  salary_min: number | null
  salary_max: number | null
  description: string
  redirect_url: string
  created: string
}

interface AdzunaResponse {
  results: AdzunaJob[]
  count: number
}

export function adzunaConfigured(): boolean {
  return Boolean(process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY)
}

/**
 * Low-level Adzuna search. Returns null if Adzuna isn't configured (so callers
 * can fall back to mock data); throws on a real API error.
 */
export async function queryAdzuna(opts: {
  what?: string
  whatPhrase?: string
  where: string
  perPage: number
  sourceName: SourceName
}): Promise<RawListing[] | null> {
  const appId = process.env.ADZUNA_APP_ID
  const appKey = process.env.ADZUNA_APP_KEY
  if (!appId || !appKey) return null

  const params = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    results_per_page: String(opts.perPage),
    sort_by: 'relevance',
  })
  // NOTE: `what` is a strict AND of all words, and `content_type`/`what_or`
  // params make Adzuna 400 or return 0 — keep the query simple.
  if (opts.what) params.set('what', opts.what)
  if (opts.whatPhrase) params.set('what_phrase', opts.whatPhrase)
  // The /gb/ endpoint already scopes to Great Britain. A country-level `where`
  // ("United Kingdom") matches no Adzuna location and returns 0 — only pass a
  // real place (city/region).
  const where = opts.where?.trim().toLowerCase()
  if (where && !['united kingdom', 'uk', 'great britain', 'gb', 'england'].includes(where)) {
    params.set('where', opts.where.trim())
  }

  const res = await fetch(
    `https://api.adzuna.com/v1/api/jobs/gb/search/1?${params}`,
    { signal: AbortSignal.timeout(10_000) },
  )
  if (!res.ok) throw new Error(`Adzuna API ${res.status}`)
  const data = (await res.json()) as AdzunaResponse

  return data.results.map((j): RawListing => ({
    externalId: `${opts.sourceName}-${j.id}`,
    title: j.title,
    employer: j.company?.display_name || 'Undisclosed',
    sourceName: opts.sourceName,
    sourceUrl: j.redirect_url,
    location: j.location?.display_name ?? opts.where,
    remote:
      j.title.toLowerCase().includes('remote') ||
      j.description.toLowerCase().includes('fully remote') ||
      j.description.toLowerCase().includes('remote working')
        ? true
        : null,
    salaryMin: j.salary_min != null ? Math.round(j.salary_min) : null,
    salaryMax: j.salary_max != null ? Math.round(j.salary_max) : null,
    currency: 'GBP',
    postedAt: j.created ? new Date(j.created).toISOString() : new Date().toISOString(),
    descriptionText: j.description,
    rawSkills: extractSkills(j.description),
  }))
}

export const adzunaAdapter: SourceAdapter = {
  name: 'adzuna',
  rateLimit: { requestsPerMinute: 250 },

  async fetch(query: JobQuery): Promise<RawListing[]> {
    // Search each role (target + bridge roles) and merge — `what` is strict-AND
    // so we can't combine them into one query.
    const roles = (query.keywords.length ? query.keywords : ['']).slice(0, 5)
    const perRole = Math.max(15, Math.floor((Math.min(query.maxResults ?? 50, 50)) / roles.length))
    const seen = new Set<string>()
    const merged: RawListing[] = []
    let configured = true

    for (const role of roles) {
      try {
        const listings = await queryAdzuna({
          what: role,
          where: query.location,
          perPage: perRole,
          sourceName: 'adzuna',
        })
        if (listings === null) { configured = false; break }
        for (const l of listings) {
          if (seen.has(l.externalId)) continue
          seen.add(l.externalId)
          merged.push(l)
        }
      } catch (err) {
        console.warn('[adzuna] API failed for role', role, err)
      }
    }

    if (!configured) {
      console.warn('[adzuna] ADZUNA_APP_ID/KEY not set — using mock data')
      return MOCK_ADZUNA
    }
    return merged
  },
}
