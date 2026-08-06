/**
 * /target-committed — shared confirmation screen for both personas.
 *
 * The convergence point of the Discovery Mode (Persona A) and direct-entry
 * (Persona B) paths: both land here after committing to one target role.
 */

import type { Metadata } from 'next'
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { isDiscoveryEnabled } from '@/lib/discovery/access'
import { TargetCommitted } from './TargetCommitted'

export const metadata: Metadata = {
  title: 'Target role confirmed (test)',
  robots: { index: false, follow: false },
}

export default function TargetCommittedPage() {
  if (!isDiscoveryEnabled()) notFound()
  return (
    <Suspense>
      <TargetCommitted />
    </Suspense>
  )
}
