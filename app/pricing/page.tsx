import Link from 'next/link'
import { Nav } from '@/components/brand'

export const metadata = {
  title: 'Pricing — PivotPath',
  description: 'Simple, transparent pricing for your career pivot. Pay once for the period you need.',
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="7.5" fill="rgba(46,107,107,0.15)" stroke="#2E6B6B" strokeWidth="1"/>
      <path d="M4.5 8l2.5 2.5 4.5-4.5" stroke="#5FB0A6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

const FEATURES_SHARED = [
  'Full Translation Map — your skills in your target field’s language',
  'AI-rewritten résumé with diff view',
  'Personalised career strategy brief',
  'Matched job listings with fit scores',
  'Apply directly to live listings',
  'Data export (GDPR Article 20)',
]

const FEATURES_6M = [
  ...FEATURES_SHARED,
  '3 full pivot analyses',
  'Job refresh every 12 hours',
  'Email support',
]

const FEATURES_12M = [
  ...FEATURES_SHARED,
  '7 full pivot analyses',
  'Job refresh every 6 hours',
  'Priority email support',
  'Early access to new features',
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-navy">
      <Nav variant="landing" />

      <main className="max-w-pp-wide mx-auto px-8 py-20">

        {/* Header */}
        <div className="text-center mb-16">
          <p className="font-mono text-[11px] tracking-[0.1em] uppercase text-amber mb-4">Pricing</p>
          <h1 className="font-display text-[44px] font-medium text-offwhite leading-[1.1] mb-4">
            One price. No surprises.
          </h1>
          <p className="text-[17px] text-pp-text-body max-w-[520px] mx-auto leading-[1.6]">
            Pay once for the period you need. No monthly rolling fees, no per-analysis charges.
            Run your pivot, land the role, move on.
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid md:grid-cols-2 gap-5 max-w-[860px] mx-auto mb-16">

          {/* 6-month */}
          <div
            className="relative rounded-pp-l p-8 flex flex-col"
            style={{ background: 'rgba(242,237,228,0.04)', border: '1px solid rgba(242,237,228,0.12)' }}
          >
            <div className="mb-1">
              <span
                className="inline-block font-mono text-[10px] tracking-[0.12em] uppercase px-2.5 py-1 rounded-pp-pill mb-3"
                style={{ background: 'rgba(232,168,56,0.15)', color: '#E8A838' }}
              >
                Most popular
              </span>
              <p className="text-[15px] font-semibold text-offwhite">6 months</p>
            </div>
            <div className="flex items-end gap-1.5 mb-1">
              <span className="font-display text-[52px] font-semibold text-offwhite leading-none">£5</span>
              <span className="text-[14px] text-pp-text-faint mb-2">one-off</span>
            </div>
            <p className="text-[13px] text-pp-text-ghost mb-8">£0.83 / month · access until {sixMonthDate()}</p>

            <ul className="space-y-3 mb-8 flex-1">
              {FEATURES_6M.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-[14px] text-pp-text-body">
                  <CheckIcon />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/checkout?plan=6month"
              className="w-full text-center py-[14px] rounded-pp font-semibold text-[15px] bg-amber text-navy hover:bg-amber/90 transition-colors"
            >
              Get started — £5
            </Link>
            <p className="text-[11.5px] text-pp-text-ghost text-center mt-3">
              Secure checkout · Discount codes welcome · No auto-renewal
            </p>
          </div>

          {/* 12-month */}
          <div
            className="relative rounded-pp-l p-8 flex flex-col"
            style={{ background: 'rgba(232,168,56,0.05)', border: '1px solid rgba(232,168,56,0.25)' }}
          >
            <div className="mb-1">
              <span
                className="inline-block font-mono text-[10px] tracking-[0.12em] uppercase px-2.5 py-1 rounded-pp-pill mb-3"
                style={{ background: 'rgba(46,107,107,0.2)', color: '#5FB0A6' }}
              >
                Best value
              </span>
              <p className="text-[15px] font-semibold text-offwhite">12 months</p>
            </div>
            <div className="flex items-end gap-1.5 mb-1">
              <span className="font-display text-[52px] font-semibold text-offwhite leading-none">£9</span>
              <span className="text-[14px] text-pp-text-faint mb-2">one-off</span>
            </div>
            <p className="text-[13px] text-pp-text-ghost mb-8">£0.75 / month · access until {twelveMonthDate()}</p>

            <ul className="space-y-3 mb-8 flex-1">
              {FEATURES_12M.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-[14px] text-pp-text-body">
                  <CheckIcon />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/checkout?plan=12month"
              className="w-full text-center py-[14px] rounded-pp font-semibold text-[15px] transition-colors"
              style={{ background: '#E8A838', color: '#0F1923' }}
            >
              Get started — £9
            </Link>
            <p className="text-[11.5px] text-pp-text-ghost text-center mt-3">
              Secure checkout · Discount codes welcome · No auto-renewal
            </p>
          </div>
        </div>

        {/* Free tier callout */}
        <div
          className="max-w-[860px] mx-auto rounded-pp-l px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 mb-16"
          style={{ background: 'rgba(242,237,228,0.03)', border: '1px solid rgba(242,237,228,0.08)' }}
        >
          <div>
            <p className="text-[15px] font-semibold text-offwhite mb-1">Try it free first</p>
            <p className="text-[13.5px] text-pp-text-faint">1 free pivot analysis — no card required. See your Translation Map before you pay a penny.</p>
          </div>
          <Link
            href="/onboarding"
            className="flex-shrink-0 px-6 py-[11px] rounded-pp text-[14px] font-semibold text-offwhite border transition-colors hover:border-offwhite/40 hover:text-offwhite"
            style={{ border: '1px solid rgba(242,237,228,0.2)' }}
          >
            Try free
          </Link>
        </div>

        {/* FAQ */}
        <div className="max-w-[680px] mx-auto">
          <h2 className="font-display text-[24px] font-medium text-offwhite mb-8 text-center">Common questions</h2>
          <div className="space-y-6">
            {[
              {
                q: 'What counts as a "pivot analysis"?',
                a: 'A pivot analysis is one full run — ingesting your CV, generating your Translation Map, rewriting your résumé, and creating your strategy brief. Opening and re-reading past results never counts. You can also re-run job matching as many times as the refresh limit allows.',
              },
              {
                q: 'Why is there a limit on analyses?',
                a: 'Each analysis sends your background through a large AI model, which has a real cost per run. The limit keeps the price low for everyone. For most career pivots, 3 analyses over 6 months is more than enough — you\'d typically refine once or twice as your target role crystallises.',
              },
              {
                q: 'What happens at the end of my subscription?',
                a: 'Nothing automatic. Your account stays active but you can\'t run new analyses until you subscribe again. You keep access to all your existing pivot sessions and can still view, export, and apply to jobs.',
              },
              {
                q: 'Can I switch from 6 to 12 months later?',
                a: 'Yes. When your 6-month period is active, you can top up to 12 months and your remaining analyses and time carry forward.',
              },
              {
                q: 'Can I get a refund?',
                a: 'Yes — you can request a full refund within 14 days of purchase as long as you haven’t yet run a paid pivot analysis. Once you run a paid analysis the digital service is delivered and the fee is non-refundable. Your free analysis lets you try the quality before paying. See our Terms of Service for full details.',
              },
              {
                q: 'Is payment secure?',
                a: 'Payments are processed by a secure third-party payment provider — we never see or store your card details. The checkout is fully encrypted.',
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
          </div>
        </div>
      </footer>
    </div>
  )
}

function sixMonthDate() {
  const d = new Date()
  d.setMonth(d.getMonth() + 6)
  return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}

function twelveMonthDate() {
  const d = new Date()
  d.setFullYear(d.getFullYear() + 1)
  return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}
