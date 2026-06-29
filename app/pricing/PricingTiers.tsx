'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PRICING_CONFIG, type BillingCycle, type PlanId } from '@/lib/subscription'

const ORDER: PlanId[] = ['free', 'pivot', 'accelerate']

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="7.5" fill="rgba(46,107,107,0.15)" stroke="#2E6B6B" strokeWidth="1" />
      <path d="M4.5 8l2.5 2.5 4.5-4.5" stroke="#5FB0A6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** £19 from 1900 pence — whole pounds where possible, else 2dp. */
function gbp(pence: number) {
  return pence % 100 === 0 ? `£${pence / 100}` : `£${(pence / 100).toFixed(2)}`
}

export function PricingTiers() {
  const [cycle, setCycle] = useState<BillingCycle>('monthly')

  return (
    <>
      {/* Billing-cycle toggle */}
      <div className="flex justify-center mb-10">
        <div
          className="inline-flex p-1 rounded-pp-pill"
          style={{ background: 'rgba(242,237,228,0.06)', border: '1px solid rgba(242,237,228,0.12)' }}
        >
          {(['monthly', 'annual'] as BillingCycle[]).map((c) => (
            <button
              key={c}
              onClick={() => setCycle(c)}
              className="px-5 py-2 rounded-pp-pill text-[13.5px] font-semibold transition-colors"
              style={
                cycle === c
                  ? { background: '#E8A838', color: '#0F1923' }
                  : { background: 'transparent', color: 'rgba(242,237,228,0.6)' }
              }
            >
              {c === 'monthly' ? 'Monthly' : 'Annual'}
            </button>
          ))}
        </div>
      </div>

      {/* Tier cards */}
      <div className="grid md:grid-cols-3 gap-5 max-w-[1040px] mx-auto mb-16 items-stretch">
        {ORDER.map((id) => {
          const tier = PRICING_CONFIG[id]
          const isFree = id === 'free'
          const price = cycle === 'annual' ? tier.annualPrice : tier.monthlyPrice
          const href = isFree ? '/onboarding' : `/checkout?plan=${id}&cycle=${cycle}`

          const cardStyle = tier.highlighted
            ? { background: 'rgba(232,168,56,0.05)', border: '1px solid rgba(232,168,56,0.35)' }
            : { background: 'rgba(242,237,228,0.04)', border: '1px solid rgba(242,237,228,0.12)' }

          const badgeStyle = tier.highlighted
            ? { background: 'rgba(232,168,56,0.15)', color: '#E8A838' }
            : { background: 'rgba(46,107,107,0.2)', color: '#5FB0A6' }

          const ctaClass = tier.highlighted
            ? 'bg-amber text-navy hover:bg-amber/90 shadow-pp-amber'
            : isFree
              ? 'text-offwhite hover:border-offwhite/40'
              : 'bg-amber text-navy hover:bg-amber/90'

          return (
            <div key={id} className="relative rounded-pp-l p-8 flex flex-col" style={cardStyle}>
              <div className="mb-1 min-h-[28px]">
                {tier.badge && (
                  <span
                    className="inline-block font-mono text-[10px] tracking-[0.12em] uppercase px-2.5 py-1 rounded-pp-pill mb-3"
                    style={badgeStyle}
                  >
                    {tier.badge}
                  </span>
                )}
                <p className="text-[15px] font-semibold text-offwhite">{tier.name}</p>
              </div>

              <div className="flex items-end gap-1.5 mb-1">
                <span className="font-display text-[52px] font-semibold text-offwhite leading-none">{gbp(price)}</span>
                {!isFree && (
                  <span className="text-[14px] text-pp-text-faint mb-2">/{cycle === 'annual' ? 'year' : 'month'}</span>
                )}
              </div>
              <p className="text-[13px] text-pp-text-ghost mb-8 min-h-[18px]">
                {isFree
                  ? 'No card required'
                  : cycle === 'annual'
                    ? `Billed yearly · ${gbp(Math.round(tier.annualPrice / 12))}/mo equivalent`
                    : 'Billed monthly · cancel anytime'}
              </p>

              <ul className="space-y-3 mb-8 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-[14px] text-pp-text-body">
                    <CheckIcon />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={href}
                className={`w-full text-center py-[14px] rounded-pp font-semibold text-[15px] transition-colors ${ctaClass}`}
                style={isFree ? { border: '1px solid rgba(242,237,228,0.2)' } : undefined}
              >
                {tier.cta}
              </Link>
            </div>
          )
        })}
      </div>
    </>
  )
}
