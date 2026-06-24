/**
 * Adapter registry — import all adapters here.
 * To add a 7th source: create lib/jobs/adapters/newsource.ts and add it below.
 */

import { reedAdapter } from './adapters/reed'
import { adzunaAdapter } from './adapters/adzuna'
import { nhsAdapter } from './adapters/nhs'
import { civilServiceAdapter } from './adapters/civil-service'
import type { SourceAdapter } from './types'

// LinkedIn and Otta have no free public API (mock-only with placeholder URLs),
// so they're excluded — every active source below returns real, applyable jobs.
export const ADAPTERS: SourceAdapter[] = [
  reedAdapter,
  adzunaAdapter,
  nhsAdapter,
  civilServiceAdapter,
]

export const ADAPTER_MAP = Object.fromEntries(
  ADAPTERS.map((a) => [a.name, a]),
) as Record<string, SourceAdapter>
