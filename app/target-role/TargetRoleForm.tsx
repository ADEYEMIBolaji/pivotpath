'use client'

/**
 * Persona B ("The Decided") direct-entry stub — TEST BUILD.
 *
 * Already knows their target role, so skips Discovery Mode entirely. Reuses
 * the same discovery_target_commitment shape as Persona A (via
 * /api/discovery/commit) so both personas converge on one data model and
 * land on the same /target-committed confirmation screen.
 *
 * Deliberately NOT built here: the "instant gap/fit check" free preview from
 * the roadmap — flagged as a follow-up, out of scope for this build.
 */

import { useCallback, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { track } from '@vercel/analytics'
import { Logo } from '@/components/brand'

const COMMITMENT_KEY = 'pp.target.commitmentId'

export function TargetRoleForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [roleTitle, setRoleTitle] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // "Change target role" (from /target-committed) passes the existing
  // commitmentId back so this submission updates that row instead of
  // creating a new one.
  const commitmentId = searchParams.get('commitmentId') ?? undefined

  const submit = useCallback(async () => {
    const trimmed = roleTitle.trim()
    if (!trimmed) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/discovery/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commitmentId, roleTitle: trimmed }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`)
      localStorage.setItem(COMMITMENT_KEY, data.commitmentId)
      track('Target Role Committed', { source: 'direct', roleTitle: trimmed, isChange: Boolean(commitmentId) })
      router.push(`/target-committed?commitmentId=${data.commitmentId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }, [roleTitle, commitmentId, router])

  return (
    <div className="min-h-screen bg-navy flex flex-col">
      <header className="border-b border-pp-border-darker">
        <div className="max-w-pp-content mx-auto px-7 py-4 flex items-center justify-between gap-4">
          <Link href="/" aria-label="PivotPath home">
            <Logo size="sm" />
          </Link>
          <span className="font-mono text-[11.5px] tracking-[0.06em] text-pp-text-faint">
            TEST BUILD
          </span>
        </div>
      </header>

      <main className="flex-1 max-w-pp-narrow w-full mx-auto px-7 py-16">
        <p className="font-mono text-[11.5px] tracking-[0.14em] uppercase text-amber mb-3">
          Direct entry
        </p>
        <h1 className="font-display text-[32px] leading-[1.15] text-pp-text-bright mb-3">
          What role or industry are you targeting?
        </h1>
        <p className="text-[15px] leading-[1.6] text-pp-text-body mb-8">
          Already know where you&rsquo;re headed? Skip Discovery Mode and tell us directly.
        </p>

        <input
          type="text"
          maxLength={200}
          value={roleTitle}
          onChange={(e) => setRoleTitle(e.target.value)}
          className="w-full rounded-pp-m bg-navy-surface border border-pp-border-dark px-4 py-3 text-[15px] text-pp-text-bright placeholder:text-pp-text-ghost focus:outline-none focus:border-amber focus:shadow-pp-focus"
          placeholder='e.g. "Product Manager", or "something in health tech"'
        />

        {error && (
          <p className="mt-4 text-[13.5px] text-pp-red border border-pp-red-alert-bd bg-pp-red-alert-bg rounded-pp-m px-4 py-3">
            {error}
          </p>
        )}

        <div className="mt-7">
          <button
            type="button"
            onClick={submit}
            disabled={busy || !roleTitle.trim()}
            className="px-6 py-3 rounded-pp font-semibold text-[14px] bg-amber text-navy hover:shadow-pp-amber transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {busy ? 'Saving…' : 'Set as my target role'}
          </button>
        </div>

        <p className="mt-8 text-[13px] leading-[1.6] text-pp-text-ghost border-t border-pp-border-darker pt-5">
          Not sure?{' '}
          <Link href="/discovery-test" className="text-amber underline">
            Try Discovery Mode instead
          </Link>{' '}
          — it works from evidence about what you&rsquo;re already good at, not a title you have to
          already know.
        </p>
      </main>
    </div>
  )
}
