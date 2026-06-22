/**
 * Adapter registry — import all adapters here.
 * To add a 7th source: create lib/jobs/adapters/newsource.ts and add it below.
 */

import { reedAdapter } from './adapters/reed'
import { adzunaAdapter } from './adapters/adzuna'
import { linkedinAdapter } from './adapters/linkedin'
import { ottaAdapter } from './adapters/otta'
import { nhsAdapter } from './adapters/nhs'
import { civilServiceAdapter } from './adapters/civil-service'
import type { SourceAdapter } from './types'

export const ADAPTERS: SourceAdapter[] = [
  reedAdapter,
  adzunaAdapter,
  linkedinAdapter,
  ottaAdapter,
  nhsAdapter,
  civilServiceAdapter,
]

export const ADAPTER_MAP = Object.fromEntries(
  ADAPTERS.map((a) => [a.name, a]),
) as Record<string, SourceAdapter>
