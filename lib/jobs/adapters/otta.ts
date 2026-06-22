/**
 * Otta adapter
 * Otta's partner API requires approval. Falls back to mock data.
 */

import type { SourceAdapter, RawListing, JobQuery } from '../types'
import { extractSkills, parseSalaryString } from '../normalise'
import { MOCK_OTTA } from './mock-data'

export const ottaAdapter: SourceAdapter = {
  name: 'otta',
  rateLimit: { requestsPerMinute: 60 },

  async fetch(query: JobQuery): Promise<RawListing[]> {
    const token = process.env.OTTA_API_KEY
    if (!token) {
      console.warn('[otta] OTTA_API_KEY not set — using mock data')
      return MOCK_OTTA
    }

    const res = await fetch('https://api.otta.com/graphql', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `query Jobs($keywords: [String!]!, $location: String, $remote: Boolean) {
          jobs(keywords: $keywords, location: $location, remoteEligible: $remote, limit: 50) {
            id title company { name } location remote salary { min max }
            externalUrl description skills { value }
            publishedAt
          }
        }`,
        variables: {
          keywords: query.keywords,
          location: query.location,
          remote: query.remoteOnly ?? null,
        },
      }),
      signal: AbortSignal.timeout(10_000),
    })

    if (!res.ok) throw new Error(`Otta API ${res.status}`)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = (await res.json()) as { data: { jobs: any[] } }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.jobs.map((j: any): RawListing => {
      const sal = j.salary
        ? { min: j.salary.min ?? null, max: j.salary.max ?? null }
        : parseSalaryString(j.description ?? '')
      const desc = j.description ?? ''
      return {
        externalId: j.id,
        title: j.title,
        employer: j.company?.name ?? '',
        sourceName: 'otta',
        sourceUrl: j.externalUrl ?? '',
        location: j.location ?? '',
        remote: j.remote ?? null,
        salaryMin: sal.min,
        salaryMax: sal.max,
        currency: 'GBP',
        postedAt: new Date(j.publishedAt).toISOString(),
        descriptionText: desc,
        rawSkills: [...(j.skills?.map((s: { value: string }) => s.value.toLowerCase()) ?? []), ...extractSkills(desc)],
      }
    })
  },
}
