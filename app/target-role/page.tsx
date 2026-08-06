/**
 * /target-role — Persona B ("The Decided") direct-entry stub.
 *
 * For people who already know their target role and don't need Discovery
 * Mode at all. Isolated from the main app the same way as /discovery-test.
 */

import type { Metadata } from 'next'
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { isDiscoveryEnabled } from '@/lib/discovery/access'
import { TargetRoleForm } from './TargetRoleForm'

export const metadata: Metadata = {
  title: 'Target role (test)',
  robots: { index: false, follow: false },
}

export default function TargetRolePage() {
  if (!isDiscoveryEnabled()) notFound()
  return (
    <Suspense>
      <TargetRoleForm />
    </Suspense>
  )
}
