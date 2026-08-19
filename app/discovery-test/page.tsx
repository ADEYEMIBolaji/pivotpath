/**
 * /discovery-test — Discovery Mode ("Skills Translator"), TEST BUILD.
 *
 * Isolated from the main funnel: nothing links here, and the route 404s unless
 * the DISCOVERY_MODE flag is on (default: on in development only).
 */

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isDiscoveryEnabled } from '@/lib/discovery/access'
import { DiscoveryFlow } from './DiscoveryFlow'

export const metadata: Metadata = {
  title: 'Discovery Mode (test)',
  robots: { index: false, follow: false },
}

export default function DiscoveryTestPage() {
  if (!isDiscoveryEnabled()) notFound()
  return <DiscoveryFlow />
}
