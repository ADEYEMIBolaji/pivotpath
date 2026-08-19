/**
 * Pure decision logic for onboarding Step 2 ("Where are you headed?") — kept
 * out of app/onboarding/page.tsx specifically so it's unit-testable without a
 * browser, a server, or a database. This is exactly the logic that had the
 * bug where a Discovery Mode hand-off with an unmatched title left "Continue"
 * disabled forever (see tests/onboarding-target.spec.ts, and the git history
 * on this file for the fix).
 */

/** What a Discovery Mode or /target-role hand-off carries into Step 2. */
export interface IncomingTarget {
  industry?: string
  function?: string
  title?: string
  description?: string
  /** True if we had a title to work with but couldn't match it to the taxonomy. */
  unmatched?: boolean
}

export interface Step2FormState {
  industry: string
  func: string
  role: string
}

/**
 * The title that will actually be submitted. Falls back to the originally
 * hand-off title if `role` state has been cleared — which happens the moment
 * someone opens the (optional, for a hand-off) industry/function dropdowns
 * without finishing a specific selection. Without this fallback, exploring
 * an optional dropdown silently discards the target that was already locked
 * in from Discovery Mode or /target-role.
 */
export function resolveEffectiveTitle(state: Step2FormState, initialTarget?: IncomingTarget | null): string {
  return state.role.trim() || initialTarget?.title || ''
}

/**
 * Whether Step 2's "Continue" button should be enabled.
 *
 * A Discovery Mode / direct-entry hand-off already answered "where are you
 * headed" — that's the whole point of those flows. Re-requiring industry and
 * function here, which the person may genuinely not know (that's *why* they
 * used Discovery Mode), traps them exactly where it was supposed to prevent
 * them from getting stuck. industry/function are never validated against the
 * role taxonomy anywhere downstream (lib/prompts.ts interpolates them as
 * plain prompt text; the UI shows them as a plain label) — leaving them
 * blank when there's a hand-off title is safe, not a data-quality risk.
 *
 * Without a hand-off, this is a fresh, unprompted entry — a normal user still
 * needs to pick from the full industry → function → role chain, since there's
 * no other signal to work from.
 */
export function canContinueStep2(state: Step2FormState, initialTarget?: IncomingTarget | null): boolean {
  const arrivedWithTarget = Boolean(initialTarget?.title)
  if (arrivedWithTarget) {
    return Boolean(resolveEffectiveTitle(state, initialTarget))
  }
  return Boolean(state.industry && state.func && state.role)
}
