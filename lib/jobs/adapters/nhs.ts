/**
 * NHS Jobs adapter — public Atom/XML feed, no API key required.
 * Feed: https://www.jobs.nhs.uk/search.atom?keyword={keywords}
 */

import type { SourceAdapter, RawListing, JobQuery } from '../types'
import { parseNhsBand, extractSkills } from '../normalise'
import { MOCK_NHS } from './mock-data'

/** Minimal Atom entry shape we care about */
interface AtomEntry {
  title: string
  employer: string
  link: string
  summary: string
  published: string
  payBand?: string
  location?: string
}

/** Parse Atom XML into flat entries (regex-based, no xml parser dep) */
function parseAtom(xml: string): AtomEntry[] {
  const entries: AtomEntry[] = []
  const entryBlocks = xml.match(/<entry>([\s\S]*?)<\/entry>/g) ?? []

  for (const block of entryBlocks) {
    const get = (tag: string) =>
      block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))?.[1]?.trim() ?? ''

    const title = get('title').replace(/<!\[CDATA\[|\]\]>/g, '').trim()
    const link  = block.match(/rel="alternate"\s+href="([^"]+)"/)?.[1] ?? ''
    const summary = get('summary').replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, ' ').trim()
    const published = get('published')
    const employer = get('nhs:employer') || get('author').replace(/<[^>]+>/g, '').trim()
    const payBand  = block.match(/Band\s+(\d+[ab]?)/i)?.[1]
    const location = get('nhs:location') || get('category')

    if (title && link) {
      entries.push({ title, employer, link, summary, published, payBand, location })
    }
  }
  return entries
}

export const nhsAdapter: SourceAdapter = {
  name: 'nhs',
  rateLimit: { requestsPerMinute: 30, minDelayMs: 500 },

  async fetch(query: JobQuery): Promise<RawListing[]> {
    const keyword = query.keywords.join(' ')
    const url = `https://www.jobs.nhs.uk/search.atom?keyword=${encodeURIComponent(keyword)}&location=${encodeURIComponent(query.location)}`

    let xml: string
    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/atom+xml,application/xml' },
        signal: AbortSignal.timeout(12_000),
      })
      if (!res.ok) throw new Error(`NHS Jobs feed ${res.status}`)
      xml = await res.text()
    } catch (err) {
      console.warn('[nhs] Feed fetch failed, using mock data:', err)
      return MOCK_NHS
    }

    const entries = parseAtom(xml)
    if (entries.length === 0) {
      console.warn('[nhs] Feed returned 0 entries — using mock data')
      return MOCK_NHS
    }

    return entries.slice(0, query.maxResults ?? 50).map((e): RawListing => {
      const bandSalary = e.payBand ? parseNhsBand(e.payBand) : null
      return {
        externalId: `nhs-${Buffer.from(e.link).toString('base64').slice(0, 16)}`,
        title: e.title,
        employer: e.employer || 'NHS',
        sourceName: 'nhs',
        sourceUrl: e.link,
        location: e.location ?? query.location,
        remote: e.summary.toLowerCase().includes('remote') || e.summary.toLowerCase().includes('home working') ? true : null,
        salaryMin: bandSalary?.min ?? null,
        salaryMax: bandSalary?.max ?? null,
        currency: 'GBP',
        postedAt: e.published ? new Date(e.published).toISOString() : new Date().toISOString(),
        descriptionText: e.summary,
        rawSkills: extractSkills(e.summary),
      }
    })
  },
}
