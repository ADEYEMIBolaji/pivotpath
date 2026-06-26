/**
 * Reed.co.uk adapter — official Jobs API v1
 * Docs: https://www.reed.co.uk/developers/jobseeker
 * Auth: HTTP Basic, username = API key, password = empty
 */

import type { SourceAdapter, RawListing, JobQuery } from '../types'
import { parseSalaryString, extractSkills } from '../normalise'
import { MOCK_REED } from './mock-data'

/** Reed returns dates as DD/MM/YYYY, which `new Date()` can't parse. */
function parseReedDate(s: string): string {
  if (s) {
    const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
    if (m) {
      const d = new Date(`${m[3]}-${m[2]}-${m[1]}T00:00:00Z`)
      if (!isNaN(d.getTime())) return d.toISOString()
    }
    const d = new Date(s)
    if (!isNaN(d.getTime())) return d.toISOString()
  }
  return new Date().toISOString()
}

interface ReedJob {
  jobId: number
  jobTitle: string
  employerName: string
  locationName: string
  minimumSalary: number | null
  maximumSalary: number | null
  currency: string
  expirationDate: string
  date: string
  jobDescription: string
  jobUrl: string
}

interface ReedResponse {
  results: ReedJob[]
  totalResults: number
}

export const reedAdapter: SourceAdapter = {
  name: 'reed',
  rateLimit: { requestsPerMinute: 60, minDelayMs: 200 },

  async fetch(query: JobQuery): Promise<RawListing[]> {
    const apiKey = process.env.REED_API_KEY
    if (!apiKey) {
      console.warn('[reed] REED_API_KEY not set — using mock data')
      return MOCK_REED
    }

    // Search each role (target + bridge roles) and merge, so bridge-role jobs
    // are included — not just one combined AND-query.
    const roles = (query.keywords.length ? query.keywords : ['']).slice(0, 5)
    const perRole = Math.max(15, Math.floor((query.maxResults ?? 100) / roles.length))
    const seen = new Set<string>()
    const merged: ReedJob[] = []

    for (const role of roles) {
      const params = new URLSearchParams({
        keywords: role,
        locationName: query.location,
        resultsToTake: String(Math.min(perRole, 100)),
        ...(query.remoteOnly ? { distanceFromLocation: '0', locationName: 'Remote' } : {}),
      })
      try {
        const res = await fetch(`https://www.reed.co.uk/api/1.0/search?${params}`, {
          headers: {
            Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`,
            Accept: 'application/json',
          },
          signal: AbortSignal.timeout(10_000),
        })
        if (!res.ok) continue
        const data = (await res.json()) as ReedResponse
        for (const j of data.results) {
          if (seen.has(String(j.jobId))) continue
          seen.add(String(j.jobId))
          merged.push(j)
        }
      } catch { /* skip this role on error */ }
    }

    return merged.map((j): RawListing => {
      const salary = j.minimumSalary && j.maximumSalary
        ? { min: j.minimumSalary, max: j.maximumSalary }
        : parseSalaryString(j.jobDescription ?? '')
      return {
        externalId: String(j.jobId),
        title: j.jobTitle,
        employer: j.employerName,
        sourceName: 'reed',
        sourceUrl: j.jobUrl,
        location: j.locationName,
        remote: j.locationName.toLowerCase().includes('remote') ? true : null,
        salaryMin: salary.min,
        salaryMax: salary.max,
        currency: 'GBP',
        postedAt: parseReedDate(j.date),
        descriptionText: j.jobDescription ?? '',
        rawSkills: extractSkills(j.jobDescription ?? ''),
      }
    })
  },
}
