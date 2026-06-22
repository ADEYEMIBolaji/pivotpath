/**
 * LinkedIn Jobs adapter
 * LinkedIn's Jobs API requires an approved partner agreement.
 * Falls back to mock data when LINKEDIN_API_TOKEN is not set.
 * When a token is provided it calls the /jobSearch endpoint.
 */

import type { SourceAdapter, RawListing, JobQuery } from '../types'
import { extractSkills } from '../normalise'
import { MOCK_LINKEDIN } from './mock-data'

interface LinkedInJob {
  entityUrn: string
  title: string
  companyDetails: { company?: string; companyResolutionResult?: { name: string } }
  formattedLocation: string
  listedAt: number
  description?: { text: string }
  applyMethod?: { companyApplyUrl?: string; easyApplyUrl?: string }
  workRemoteAllowed?: boolean
  salaryInsights?: { compensationBreakdown?: Array<{ minCompensation?: number; maxCompensation?: number }> }
}

export const linkedinAdapter: SourceAdapter = {
  name: 'linkedin',
  rateLimit: { requestsPerMinute: 100 },

  async fetch(query: JobQuery): Promise<RawListing[]> {
    const token = process.env.LINKEDIN_API_TOKEN
    if (!token) {
      console.warn('[linkedin] LINKEDIN_API_TOKEN not set — using mock data')
      return MOCK_LINKEDIN
    }

    const params = new URLSearchParams({
      keywords: query.keywords.join(' '),
      location: query.location,
      count: String(Math.min(query.maxResults ?? 50, 50)),
      ...(query.remoteOnly ? { f_WT: '2' } : {}),
    })

    const res = await fetch(`https://api.linkedin.com/v2/jobSearch?${params}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'LinkedIn-Version': '202409',
      },
      signal: AbortSignal.timeout(10_000),
    })

    if (!res.ok) throw new Error(`LinkedIn API ${res.status}: ${await res.text()}`)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (await res.json()) as { elements: LinkedInJob[] }

    return data.elements.map((j): RawListing => {
      const desc = j.description?.text ?? ''
      const comp = j.salaryInsights?.compensationBreakdown?.[0]
      const company =
        j.companyDetails?.companyResolutionResult?.name ??
        j.companyDetails?.company ?? 'Unknown'
      return {
        externalId: j.entityUrn,
        title: j.title,
        employer: company,
        sourceName: 'linkedin',
        sourceUrl: j.applyMethod?.companyApplyUrl ?? j.applyMethod?.easyApplyUrl ?? '',
        location: j.formattedLocation,
        remote: j.workRemoteAllowed ?? null,
        salaryMin: comp?.minCompensation ?? null,
        salaryMax: comp?.maxCompensation ?? null,
        currency: 'GBP',
        postedAt: new Date(j.listedAt).toISOString(),
        descriptionText: desc,
        rawSkills: extractSkills(desc),
      }
    })
  },
}
