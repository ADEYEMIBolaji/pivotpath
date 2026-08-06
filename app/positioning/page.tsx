/**
 * /positioning — stub landing placeholder for the not-yet-built downstream
 * funnel (positioning → applications → interview prep → outreach → tracking).
 *
 * Linked to from /target-committed after someone commits to a target role.
 * Not a real feature — just a placeholder so that CTA doesn't 404. Gated
 * behind the same DISCOVERY_MODE flag as the rest of the bridge.
 */

import type { Metadata } from 'next'
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { isDiscoveryEnabled } from '@/lib/discovery/access'
import { PositioningStub } from './PositioningStub'

export const metadata: Metadata = {
  title: 'Positioning (coming soon)',
  robots: { index: false, follow: false },
}

export default function PositioningStubPage() {
  if (!isDiscoveryEnabled()) notFound()
  return (
    <Suspense>
      <PositioningStub />
    </Suspense>
  )
}
