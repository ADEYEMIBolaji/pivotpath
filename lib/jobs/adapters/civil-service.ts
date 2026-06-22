/**
 * Civil Service Jobs adapter — public RSS/JSON feed, no API key required.
 * Primary: https://www.civilservicejobs.service.gov.uk/csr/jobs.cgi?jcode=...
 * We use their search results feed: ?wvj=search&otype=1&q={keyword}
 */

import type { SourceAdapter, RawListing, JobQuery } from '../types'
import { parseCsGrade, extractSkills } from '../normalise'
import { MOCK_CIVIL_SERVICE } from './mock-data'

function parseRss(xml: string): Array<{
  title: string; employer: string; link: string
  description: string; pubDate: string; grade?: string; location?: string
}> {
  const items = xml.match(/<item>([\s\S]*?)<\/item>/g) ?? []
  return items.map((block) => {
    const get = (tag: string) =>
      block.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`))?.[1]?.trim() ??
      block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))?.[1]?.trim() ?? ''

    const title = get('title')
    const link  = get('link')
    const description = get('description').replace(/<[^>]+>/g, ' ').trim()
    const pubDate = get('pubDate')
    const employer = get('managingOrganisation') || get('department') || 'Civil Service'
    const grade = block.match(/Grade\s+(\d+|[A-Z]{2,3})/i)?.[1]
    const location = get('location')

    return { title, employer, link, description, pubDate, grade, location }
  }).filter((i) => i.title && i.link)
}

export const civilServiceAdapter: SourceAdapter = {
  name: 'civil-service',
  rateLimit: { requestsPerMinute: 20, minDelayMs: 1000 },

  async fetch(query: JobQuery): Promise<RawListing[]> {
    const keyword = query.keywords.join('+')
    const url = `https://www.civilservicejobs.service.gov.uk/csr/jobs.cgi?jcode=&otype=1&q=${encodeURIComponent(keyword)}&action=search_apply&wvj=search&format=rss`

    let xml: string
    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/rss+xml,application/xml,text/xml' },
        signal: AbortSignal.timeout(12_000),
      })
      if (!res.ok) throw new Error(`CS Jobs feed ${res.status}`)
      xml = await res.text()
    } catch (err) {
      console.warn('[civil-service] Feed fetch failed, using mock data:', err)
      return MOCK_CIVIL_SERVICE
    }

    const items = parseRss(xml)
    if (items.length === 0) {
      console.warn('[civil-service] Feed returned 0 items — using mock data')
      return MOCK_CIVIL_SERVICE
    }

    return items.slice(0, query.maxResults ?? 50).map((item): RawListing => {
      const gradeSalary = item.grade ? parseCsGrade(item.grade) : null
      return {
        externalId: `cs-${Buffer.from(item.link).toString('base64').slice(0, 16)}`,
        title: item.title,
        employer: item.employer,
        sourceName: 'civil-service',
        sourceUrl: item.link,
        location: item.location ?? query.location,
        remote: item.description.toLowerCase().includes('hybrid') || item.description.toLowerCase().includes('remote') ? true : null,
        salaryMin: gradeSalary?.min ?? null,
        salaryMax: gradeSalary?.max ?? null,
        currency: 'GBP',
        postedAt: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
        descriptionText: item.description,
        rawSkills: extractSkills(item.description),
      }
    })
  },
}
