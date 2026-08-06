'use client'

/**
 * Pure placeholder — no logic, no data, nothing persisted. Exists only so the
 * "Continue to positioning" CTA on /target-committed has somewhere to land.
 */

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Logo } from '@/components/brand'

export function PositioningStub() {
  const searchParams = useSearchParams()
  const role = searchParams.get('role') || 'your target role'

  return (
    <div className="min-h-screen bg-navy flex flex-col">
      <header className="border-b border-pp-border-darker">
        <div className="max-w-pp-content mx-auto px-7 py-4 flex items-center justify-between gap-4">
          <Link href="/" aria-label="PivotPath home">
            <Logo size="sm" />
          </Link>
          <span className="font-mono text-[11.5px] tracking-[0.06em] text-pp-text-faint">STUB</span>
        </div>
      </header>
      <main className="flex-1 max-w-pp-narrow w-full mx-auto px-7 py-24 text-center">
        <p className="font-mono text-[11.5px] tracking-[0.14em] uppercase text-amber mb-3">
          Coming soon
        </p>
        <h1 className="font-display text-[28px] leading-[1.2] text-pp-text-bright mb-3">
          Positioning tools for {role}
        </h1>
        <p className="text-[15px] leading-[1.6] text-pp-text-body">
          This is a placeholder. The positioning → applications → interview prep → outreach →
          tracking funnel isn&rsquo;t built in this test branch yet.
        </p>
      </main>
    </div>
  )
}
