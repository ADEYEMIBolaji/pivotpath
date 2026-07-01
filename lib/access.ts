/**
 * Feature-access gating by subscription tier (server-only).
 *
 * The Free tier is the hook: users get the skills Translation Map and a teaser
 * of the Strategy Brief, but the full résumé rewrite, matched jobs and the rest
 * of the brief are paid (Pivot / Accelerate). These checks run on the server so
 * gated content never reaches a free user's browser.
 */

import { auth } from '@/auth'
import { getActiveSubscription } from './subscription'
import { isDemoUser } from './demo'

/**
 * True if the current viewer is on an active paid plan (Pivot or Accelerate).
 *
 * Fail-open in file/dev mode (no DATABASE_URL) so local development isn't gated —
 * mirrors checkPivotQuota's behaviour. In production, only an active paid
 * subscription returns true; free / signed-out viewers are gated.
 */
export async function viewerHasPaidPlan(): Promise<boolean> {
  if (!process.env.DATABASE_URL) return true
  const session = await auth()
  if (!session?.user?.id) return false
  if (isDemoUser(session.user.id)) return true
  const sub = await getActiveSubscription(session.user.id)
  return Boolean(sub)
}
