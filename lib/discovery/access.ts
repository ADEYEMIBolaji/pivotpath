/**
 * Discovery Mode gating — TEST BUILD.
 *
 * Two separate concerns:
 *   isDiscoveryEnabled()  — the feature flag that keeps this off for real users
 *   canAccessRun()        — per-run ownership, so a guessed run id can't read
 *                           someone else's intake answers
 */

import { auth } from '@/auth'
import { getIntake } from './store'

/**
 * Discovery Mode is a test build. It is ON in development and OFF everywhere
 * else unless DISCOVERY_MODE is explicitly set to "on" — so deploying this
 * branch by accident does not expose the flow to existing users.
 */
export function isDiscoveryEnabled(): boolean {
  const flag = process.env.DISCOVERY_MODE ?? process.env.NEXT_PUBLIC_DISCOVERY_MODE
  if (flag) return flag === 'on'
  return process.env.NODE_ENV !== 'production'
}

/**
 * True if the current viewer may read/write this discovery run.
 *
 * Runs created while signed out have no owner — the id is the capability, and
 * there's no account data to protect. Runs created while signed in belong to
 * that user only.
 */
export async function canAccessRun(runId: string): Promise<boolean> {
  const intake = await getIntake(runId)
  if (!intake) return false
  if (!intake.userId) return true
  const session = await auth()
  return session?.user?.id === intake.userId
}
