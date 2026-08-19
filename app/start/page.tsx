/**
 * /start — the missing front door between the two personas.
 *
 * Nothing routed users to /discovery-test vs /target-role before this — both
 * existed but were only reachable by typing the URL directly. This is a
 * plain, no-AI choice: the user says which situation they're in, and we send
 * them to the matching flow. Both destinations converge on the same
 * /target-committed screen regardless of which door they came through.
 *
 * TEST BUILD — gated behind the DISCOVERY_MODE flag, same as the routes it
 * links to. Not yet linked from the real landing page — see the deliverable
 * notes on wiring this up.
 */

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isDiscoveryEnabled } from '@/lib/discovery/access'
import { StartChoice } from './StartChoice'

export const metadata: Metadata = {
  title: 'Get started (test)',
  robots: { index: false, follow: false },
}

export default function StartPage() {
  if (!isDiscoveryEnabled()) notFound()
  return <StartChoice />
}
