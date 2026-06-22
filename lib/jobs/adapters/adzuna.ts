/**
 * Adzuna adapter — covers Indeed UK and ~16M UK job listings
 * Docs: https://api.adzuna.com/v1/api/jobs
 * Auth: app_id + app_key query params
 */

import type { SourceAdapter, RawListing, JobQuery } from '../types'
import { parseSalaryString, extractSkills } from '../normalise'
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

export const adzunaAdapter: SourceAdapter = {
  name: 'adzuna',
  rateLimit: { requestsPerMinute: 250 },

  async fetch(query: JobQuery): Promise<RawListing[]> {
    const appId  = process.env.ADZUNA_APP_ID
    const appKey = process.env.ADZUNA_APP_KEY
    if (!appId || !appKey) {
      console.warn('[adzuna] ADZUNA_APP_ID/ADZUNA_APP_KEY not set — using mock data')
      return MOCK_ADZUNA
    }

    const perPage = Math.min(query.maxResults ?? 50, 50)
    const params = new URLSearchParams({
      app_id: appId,
      app_key: appKey,
      what: query.keywords.join(' OR '),
      where: query.location,
      results_per_page: String(perPage),
      content_type: 'application/json',
      ...(query.remoteOnly ? { what_and: 'remote' } : {}),
    })

    const res = await fetch(
      `https://api.adzuna.com/v1/api/jobs/gb/search/1?${params}`,
      { signal: AbortSignal.timeout(10_000) },
    )

    if (!res.ok) throw new Error(`Adzuna API ${res.status}: ${await res.text()}`)
    const data = (await res.json()) as AdzunaResponse

    return data.results.map((j): RawListing => {
      const sal = parseSalaryString('')
      return {
        externalId: j.id,
        title: j.title,
        employer: j.company.display_name,
        sourceName: 'adzuna',
        sourceUrl: j.redirect_url,
        location: j.location.display_name,
        remote: j.title.toLowerCase().includes('remote') || j.description.toLowerCase().includes('fully remote') ? true : null,
        salaryMin: j.salary_min ?? sal.min,
        salaryMax: j.salary_max ?? sal.max,
        currency: 'GBP',
        postedAt: new Date(j.created).toISOString(),
        descriptionText: j.description,
        rawSkills: extractSkills(j.description),
      }
    })
  },
}
