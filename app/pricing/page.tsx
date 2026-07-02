import Link from 'next/link'
import { Nav } from '@/components/brand'
import { PricingTiers } from './PricingTiers'

export const metadata = {
  alternates: { canonical: '/pricing' },
  title: 'Pricing, PivotPath',
  description: 'Simple, transparent pricing for your career pivot. Start free, upgrade when you’re ready.',
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-navy">
      <Nav variant="landing" />

      <main className="max-w-pp-wide mx-auto px-8 py-20">

        {/* Header */}
        <div className="text-center mb-16">
          <p className="font-mono text-[11px] tracking-[0.1em] uppercase text-amber mb-4">Pricing</p>
          <h1 className="font-display text-[44px] font-medium text-offwhite leading-[1.1] mb-4">
            Start free. Upgrade when it clicks.
          </h1>
          <p className="text-[17px] text-pp-text-body max-w-[520px] mx-auto leading-[1.6]">
            See your skills translation map for free. When you’re ready for the full rewrite,
            pick the plan that fits, monthly or annual, cancel anytime.
          </p>
        </div>

        {/* Plan cards (monthly / annual toggle) */}
        <PricingTiers />

        {/* FAQ */}
        <div className="max-w-[680px] mx-auto">
          <h2 className="font-display text-[24px] font-medium text-offwhite mb-8 text-center">Common questions</h2>
          <div className="space-y-6">
            {[
              {
                q: 'What counts as a "pivot analysis"?',
                a: 'A pivot analysis is one full run, ingesting your CV, generating your Translation Map, rewriting your résumé, and creating your strategy brief. Opening and re-reading past results never counts. You can also re-run job matching as many times as the refresh limit allows.',
              },
              {
                q: 'What’s the difference between Free, Pivot and Accelerate?',
                a: 'Free gives you the skills translation map so you can see how your experience maps to a new field, no résumé output. Pivot (£19/mo or £99/yr) unlocks the full résumé rewrite, gap scorecard and application strategy brief. Accelerate (£39/mo or £179/yr) adds 3 live CV reviews, priority support and continually updated analyses.',
              },
              {
                q: 'Can I try it before paying?',
                a: 'Yes, the Free tier lets you generate your skills translation map and see exactly how your experience maps to a new field, no card required. When you’re ready for the full résumé rewrite, gap scorecard and strategy brief, upgrade to Pivot. You’re billed straight away and can cancel any time.',
              },
              {
                q: 'Can I switch between monthly and annual, or upgrade later?',
                a: 'Yes. You can move between monthly and annual billing, or upgrade from Pivot to Accelerate, at any time, your remaining time carries over.',
              },
              {
                q: 'Can I cancel?',
                a: 'Any time, from your settings. Your plan stays active until the end of the period you’ve already paid for, then simply doesn’t renew. You keep access to everything you’ve already generated.',
              },
              {
                q: 'Is payment secure?',
                a: 'Payments are processed by a secure third-party payment provider, we never see or store your card details. The checkout is fully encrypted.',
              },
            ].map(({ q, a }) => (
              <div key={q} className="border-b pb-6" style={{ borderColor: 'rgba(242,237,228,0.1)' }}>
                <p className="text-[15px] font-semibold text-offwhite mb-2">{q}</p>
                <p className="text-[14px] text-pp-text-body leading-[1.65]">{a}</p>
              </div>
            ))}
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t mt-20" style={{ background: '#0B121A', borderColor: 'rgba(242,237,228,0.08)' }}>
        <div className="max-w-pp-wide mx-auto px-8 py-8 flex flex-wrap items-center justify-between gap-4 text-[13px] text-pp-text-faint">
          <span>© {new Date().getFullYear()} PivotPath</span>
          <div className="flex gap-5">
            <Link href="/legal/privacy" className="hover:text-pp-text-muted transition-colors">Privacy</Link>
            <Link href="/legal/terms" className="hover:text-pp-text-muted transition-colors">Terms</Link>
            <Link href="/legal/refunds" className="hover:text-pp-text-muted transition-colors">Refunds</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
