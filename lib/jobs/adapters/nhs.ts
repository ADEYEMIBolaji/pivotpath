/**
 * NHS Jobs adapter.
 *
 * NHS Jobs removed its public Atom/RSS feed and gated its data API behind an
 * approved-integrator token, so we source real NHS roles from Adzuna (filtered
 * to NHS) and tag them as 'nhs'. Falls back to mock data if Adzuna is
 * unconfigured or unavailable.
 */

import type { SourceAdapter, RawListing, JobQuery } from '../types'
import { queryAdzuna } from './adzuna'
import { MOCK_NHS } from './mock-data'

export const nhsAdapter: SourceAdapter = {
  name: 'nhs',
  rateLimit: { requestsPerMinute: 60 },

  async fetch(query: JobQuery): Promise<RawListing[]> {
    try {
      const listings = await queryAdzuna({
        // Broad NHS pull — the pivot fit-scoring ranks them to the user's profile
        what: 'NHS',
        where: query.location,
        perPage: Math.min(query.maxResults ?? 50, 50),
        sourceName: 'nhs',
      })
      // null = Adzuna not configured (dev without keys) → mock for local/demo.
      // An empty real result is returned as-is (no placeholder example.com jobs).
      if (listings === null) {
        console.warn('[nhs] Adzuna not configured — using mock data')
        return MOCK_NHS
      }
      return listings
    } catch (err) {
      console.warn('[nhs] Adzuna failed, using mock data:', err)
      return MOCK_NHS
    }
  },
}
