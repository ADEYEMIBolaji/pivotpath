'use client'

/**
 * Shared confirmation screen — TEST BUILD.
 *
 * Reads `commitmentId` from the query string, falling back to localStorage so
 * a bare revisit still resolves. The CTA into "positioning" is a stub route
 * (per the roadmap doc) — the actual positioning → applications →
 * interview-prep → outreach → tracking funnel isn't built in this branch.
 * "Change target role" is also a stub: it doesn't force irreversible
 * commitment, it just re-opens /target-role with the same commitmentId so a
 * new submission updates the row instead of creating a duplicate.
 */

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { track } from '@vercel/analytics'
import { Logo } from '@/components/brand'

const COMMITMENT_KEY = 'pp.target.commitmentId'

interface Commitment {
  roleTitle: string
  plainLanguageLine: string | null
  source: 'discovery' | 'direct'
}

export function TargetCommitted() {
  const searchParams = useSearchParams()
  const [commitment, setCommitment] = useState<Commitment | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [commitmentId, setCommitmentId] = useState<string | null>(null)

  useEffect(() => {
    const id = searchParams.get('commitmentId') ?? localStorage.getItem(COMMITMENT_KEY)
    if (!id) {
      setNotFound(true)
      return
    }
    setCommitmentId(id)
    fetch(`/api/discovery/commit?commitmentId=${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.commitment) {
          setCommitment(data.commitment)
          localStorage.setItem(COMMITMENT_KEY, id)
        } else {
          setNotFound(true)
        }
      })
      .catch(() => setNotFound(true))
  }, [searchParams])

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
        {notFound && (
          <p className="text-[15px] text-pp-text-body">
            No commitment found. Go back to{' '}
            <Link href="/discovery-test" className="text-amber underline">
              Discovery Mode
            </Link>{' '}
            or{' '}
            <Link href="/target-role" className="text-amber underline">
              set a target role directly
            </Link>
            .
          </p>
        )}

        {!notFound && !commitment && (
          <p className="font-mono text-[12px] tracking-[0.1em] uppercase text-amber animate-pp-pulse">
            Loading…
          </p>
        )}

        {commitment && (
          <div className="animate-pp-fade">
            <p className="font-mono text-[11.5px] tracking-[0.14em] uppercase text-amber mb-3">
              {commitment.source === 'discovery' ? 'From your shortlist' : 'Direct entry'}
            </p>
            <h1 className="font-display text-[32px] leading-[1.15] text-pp-text-bright mb-3">
              Your target role: {commitment.roleTitle}
            </h1>
            {commitment.plainLanguageLine && (
              <p className="text-[15px] leading-[1.6] text-pp-text-body italic mb-8">
                {commitment.plainLanguageLine}
              </p>
            )}

            <div className="flex flex-wrap gap-3">
              <Link
                href={`/onboarding?${new URLSearchParams({
                  targetTitle: commitment.roleTitle,
                  ...(commitment.plainLanguageLine ? { plainLanguageLine: commitment.plainLanguageLine } : {}),
                }).toString()}`}
                onClick={() => track('Continue To Positioning Clicked', { source: commitment.source })}
                className="inline-block px-6 py-3 rounded-pp font-semibold text-[14px] bg-amber text-navy hover:shadow-pp-amber transition-all"
              >
                Continue to positioning
              </Link>
              <Link
                href={`/target-role${commitmentId ? `?commitmentId=${commitmentId}` : ''}`}
                onClick={() => track('Change Target Role Clicked', { source: commitment.source })}
                className="inline-block px-6 py-3 rounded-pp font-semibold text-[14px] border border-pp-border-dark text-pp-text-dim hover:text-pp-text-bright transition-all"
              >
                Change target role
              </Link>
            </div>

            <p className="mt-10 text-[13px] leading-[1.6] text-pp-text-ghost border-t border-pp-border-darker pt-5">
              &ldquo;Continue to positioning&rdquo; takes you into the real onboarding flow with this role
              pre-filled — you&rsquo;ll still need to upload or paste your background, since the translation
              map needs it. Not built yet: applications, interview prep, outreach, and tracking.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
