/**
 * GET /api/discovery/status — whether Discovery Mode is switched on.
 *
 * isDiscoveryEnabled() reads server-only env vars, so client components (e.g.
 * the settings page's "what's new" notice) can't evaluate it directly the
 * way server components like app/page.tsx can. This is the client-safe way
 * to ask the same question without exposing anything else about the flag.
 *
 * TEST BUILD — mirrors the gating on every other /api/discovery/* route.
 */

import { NextResponse } from 'next/server'
import { isDiscoveryEnabled } from '@/lib/discovery/access'

export const runtime = 'nodejs'

export async function GET() {
  return NextResponse.json({ ok: true, enabled: isDiscoveryEnabled() })
}
