/**
 * Reviewer/demo account identity.
 *
 * A single well-known user id used by the credentials-based reviewer login
 * (see auth.ts). This account is treated as a paid subscriber and is exempt from
 * the analysis quota so reviewers (e.g. payment-provider approval teams) can see
 * the full product without a real subscription. Enabled only when
 * REVIEWER_DEMO_ENABLED=1.
 */

export const REVIEWER_DEMO_USER_ID = 'reviewer-demo'

export function isDemoUser(userId: string | null | undefined): boolean {
  return userId === REVIEWER_DEMO_USER_ID
}
