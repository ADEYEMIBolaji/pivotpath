/**
 * Civil Service Jobs adapter.
 *
 * Civil Service Jobs removed its public RSS feed (it now needs an authenticated
 * search session), so we source real Civil Service / government roles from
 * Adzuna (filtered to the "civil service" phrase) and tag them as
 * 'civil-service'. Falls back to mock data if Adzuna is unavailable.
 */

import type { SourceAdapter, RawListing, JobQuery } from '../types'
import { queryAdzuna } from './adzuna'
import { MOCK_CIVIL_SERVICE } from './mock-data'

export const civilServiceAdapter: SourceAdapter = {
  name: 'civil-service',
  rateLimit: { requestsPerMinute: 60 },

  async fetch(query: JobQuery): Promise<RawListing[]> {
    try {
      const listings = await queryAdzuna({
        // Broad Civil Service / government pull — fit-scoring ranks them
        whatPhrase: 'civil service',
        where: query.location,
        perPage: Math.min(query.maxResults ?? 50, 50),
        sourceName: 'civil-service',
      })
      if (listings === null) {
        console.warn('[civil-service] Adzuna not configured — using mock data')
        return MOCK_CIVIL_SERVICE
      }
      return listings
    } catch (err) {
      console.warn('[civil-service] Adzuna failed, using mock data:', err)
      return MOCK_CIVIL_SERVICE
    }
  },
}
