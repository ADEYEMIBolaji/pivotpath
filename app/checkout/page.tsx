'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { initializePaddle, type Paddle } from '@paddle/paddle-js'
import { Logo } from '@/components/brand'
import { cn } from '@/lib/utils'
import { PRICING_CONFIG, priceForCycle, type BillingCycle } from '@/lib/pricing'

type PaidPlanId = 'pivot' | 'accelerate'

function fmt(pence: number) {
  return pence % 100 === 0 ? `£${pence / 100}` : `£${(pence / 100).toFixed(2)}`
}

function CheckoutInner() {
  const params = useSearchParams()
  const router = useRouter()
  const { status } = useSession()

  const rawPlan = params.get('plan')
  const planId: PaidPlanId = rawPlan === 'accelerate' ? 'accelerate' : 'pivot'
  const cycle: BillingCycle = params.get('cycle') === 'annual' ? 'annual' : 'monthly'
  const tier = PRICING_CONFIG[planId]
  const plan = { name: tier.name, price: priceForCycle(planId, cycle) }
  const cycleLabel = cycle === 'annual' ? 'year' : 'month'

  const [code, setCode] = useState('')
  const [applying, setApplying] = useState(false)
  const [discount, setDiscount] = useState<{ percentOff: number; finalPrice: number } | null>(null)
  const [codeError, setCodeError] = useState<string | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState<{ activated: boolean; message?: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [paddle, setPaddle] = useState<Paddle | null>(null)
  const [activePlanName, setActivePlanName] = useState<string | null>(null)
  const [checkingAccess, setCheckingAccess] = useState(true)
  const [extendMode, setExtendMode] = useState(false)

  // Require sign-in
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace(`/auth/signin?callbackUrl=${encodeURIComponent(`/checkout?plan=${planId}&cycle=${cycle}`)}`)
    }
  }, [status, router, planId, cycle])

  // Block re-purchase: if the user already has an active paid plan, don't let
  // them pay again. (Server enforces this too, in /api/checkout.)
  useEffect(() => {
    if (status !== 'authenticated') return
    fetch('/api/account/usage')
      .then((r) => r.json())
      .then((d) => { if (d.ok && d.planId && d.planId !== 'free') setActivePlanName(d.planName ?? 'your current') })
      .catch(() => {})
      .finally(() => setCheckingAccess(false))
  }, [status])

  // Returned from Paddle's hosted success redirect
  useEffect(() => {
    if (params.get('success') === '1') setDone({ activated: true })
  }, [params])

  // Initialise Paddle.js (only if a client token is configured)
  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN
    if (!token) return
    initializePaddle({
      token,
      environment: process.env.NEXT_PUBLIC_PADDLE_ENV === 'production' ? 'production' : 'sandbox',
      eventCallback: (e) => {
        // Fired when the overlay reports the checkout is complete. Fulfilment is
        // handled by the webhook; here we just move the user to the success state.
        if (e.name === 'checkout.completed') {
          setDone({ activated: true })
        }
      },
    }).then((p) => setPaddle(p ?? null)).catch(() => {})
  }, [])

  const finalPrice = discount?.finalPrice ?? plan.price

  async function applyCode() {
    if (!code.trim()) return
    setApplying(true)
    setCodeError(null)
    try {
      const res = await fetch('/api/discount/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, plan: planId, cycle }),
      })
      const data = await res.json() as { valid: boolean; reason?: string; percentOff?: number; finalPrice?: number }
      if (!data.valid) {
        setDiscount(null)
        setCodeError(data.reason ?? 'Invalid code.')
      } else {
        setDiscount({ percentOff: data.percentOff!, finalPrice: data.finalPrice! })
        setCodeError(null)
      }
    } finally {
      setApplying(false)
    }
  }

  async function checkout() {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId, cycle, code: discount ? code : undefined, extend: extendMode }),
      })
      const data = await res.json() as {
        ok: boolean
        activated?: boolean
        requiresPayment?: boolean
        alreadyActive?: boolean
        message?: string
        error?: string
        paddle?: {
          priceId?: string
          discountId?: string
          email?: string
          customData?: Record<string, unknown>
        }
      }

      // Already has an active plan — don't charge again
      if (data.alreadyActive) { setActivePlanName('your current'); return }
      if (!data.ok) { setError(data.error ?? 'Something went wrong.'); return }

      // Instant activation (100%-off comp code) — no payment needed
      if (data.activated) { setDone({ activated: true }); return }

      // Paid → open the Paddle overlay checkout
      if (data.paddle?.priceId) {
        if (!paddle) { setError('Payment is still loading — please try again in a moment.'); return }
        paddle.Checkout.open({
          items: [{ priceId: data.paddle.priceId, quantity: 1 }],
          ...(data.paddle.discountId ? { discountId: data.paddle.discountId } : {}),
          ...(data.paddle.email ? { customer: { email: data.paddle.email } } : {}),
          customData: data.paddle.customData,
          settings: { displayMode: 'overlay', theme: 'dark', successUrl: `${window.location.origin}/checkout?plan=${planId}&cycle=${cycle}&success=1` },
        })
        return
      }

      // Payment not yet live (Paddle not configured) — show the validated message
      if (data.requiresPayment) { setDone({ activated: false, message: data.message }); return }
    } finally {
      setSubmitting(false)
    }
  }

  if (status === 'loading' || status === 'unauthenticated' || checkingAccess) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-pp-text-ghost border-t-amber animate-spin" />
      </div>
    )
  }

  // Already on an active plan — don't allow an accidental second payment, but
  // offer a deliberate extend/upgrade path.
  if (activePlanName && !extendMode && !done) {
    return (
      <div className="min-h-screen bg-navy flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="w-full max-w-[460px]">
          <div className="w-14 h-14 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ background: 'rgba(46,107,107,0.15)' }}>
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
              <path d="M7 13.5l4 4 8-9" stroke="#5FB0A6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="font-display text-[28px] font-medium text-offwhite mb-3">You already have an active plan</h1>
          <p className="text-[15px] text-pp-text-body mb-8">
            No need to pay again — your plan is active and ready to use. If you’d like more analyses or more time,
            you can extend or upgrade — any remaining time carries over.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mb-3">
            <Link href="/onboarding" className="flex-1 bg-amber text-navy px-6 py-[14px] rounded-pp font-semibold text-[15px] hover:bg-amber/90 transition-colors">
              Start a pivot
            </Link>
            <Link href="/settings" className="flex-1 px-6 py-[14px] rounded-pp font-medium text-[15px] text-pp-text-muted transition-colors hover:text-offwhite" style={{ background: 'rgba(242,237,228,0.06)', border: '1px solid rgba(242,237,228,0.12)' }}>
              View plan &amp; usage
            </Link>
          </div>
          <button
            onClick={() => setExtendMode(true)}
            className="text-[13.5px] text-amber hover:text-amber/80 transition-colors underline underline-offset-2"
          >
            Extend or upgrade my plan →
          </button>
        </div>
      </div>
    )
  }

  // Success states
  if (done) {
    return (
      <div className="min-h-screen bg-navy flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="w-full max-w-[440px]">
          <div className="w-14 h-14 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ background: 'rgba(46,107,107,0.15)' }}>
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
              <path d="M7 13.5l4 4 8-9" stroke="#5FB0A6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          {done.activated ? (
            <>
              <h1 className="font-display text-[30px] font-medium text-offwhite mb-3">You&apos;re all set</h1>
              <p className="text-[15px] text-pp-text-body mb-8">Your {plan.name} plan is active. Time to map your pivot.</p>
              <Link href="/onboarding" className="inline-block bg-amber text-navy px-7 py-[14px] rounded-pp font-semibold text-[15px] hover:bg-amber/90 transition-colors">
                Start your pivot
              </Link>
            </>
          ) : (
            <>
              <h1 className="font-display text-[28px] font-medium text-offwhite mb-3">Almost there</h1>
              <p className="text-[15px] text-pp-text-body mb-2">{done.message}</p>
              <p className="text-[13px] text-pp-text-faint mb-8">We&apos;ll email you the moment card payment goes live. Meanwhile, your free pivot is ready to use.</p>
              <Link href="/onboarding" className="inline-block bg-amber text-navy px-7 py-[14px] rounded-pp font-semibold text-[15px] hover:bg-amber/90 transition-colors">
                Use my free pivot
              </Link>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-navy">
      <header className="border-b" style={{ borderColor: 'rgba(242,237,228,0.1)' }}>
        <div className="max-w-pp-content mx-auto px-5 sm:px-7 py-4 flex items-center justify-between">
          <Link href="/" aria-label="PivotPath home"><Logo size="sm" /></Link>
          <Link href="/pricing" className="text-[13.5px] text-pp-text-faint hover:text-pp-text-muted transition-colors">
            ← Back to plans
          </Link>
        </div>
      </header>

      <main className="max-w-[480px] mx-auto px-5 sm:px-6 py-12 sm:py-16">
        <p className="font-mono text-[11px] tracking-[0.1em] uppercase text-amber mb-3">
          {extendMode ? 'Extend / upgrade' : 'Checkout'}
        </p>
        <h1 className="font-display text-[30px] sm:text-[34px] font-medium text-offwhite mb-8">
          {extendMode ? 'Extend or upgrade your plan' : 'Confirm your plan'}
        </h1>

        {extendMode && (
          <div className="rounded-pp-l px-5 py-4 mb-5 text-[13.5px] text-teal-light" style={{ background: 'rgba(46,107,107,0.1)', border: '1px solid rgba(46,107,107,0.3)' }}>
            Your current plan stays active — this switches you to {plan.name} ({cycle === 'annual' ? 'annual' : 'monthly'}) and adds time on top of what you have left.
          </div>
        )}

        {/* Plan summary */}
        <div className="rounded-pp-l p-6 mb-5" style={{ background: 'rgba(242,237,228,0.04)', border: '1px solid rgba(242,237,228,0.12)' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[16px] font-semibold text-offwhite">PivotPath · {plan.name}</p>
              <p className="text-[13px] text-pp-text-faint mt-0.5">Billed {cycle === 'annual' ? 'yearly' : 'monthly'} · cancel anytime</p>
            </div>
            {/* Billing-cycle switcher */}
            <Link
              href={`/checkout?plan=${planId}&cycle=${cycle === 'annual' ? 'monthly' : 'annual'}`}
              className="text-[12.5px] text-amber hover:text-amber/80 transition-colors flex-shrink-0"
            >
              {cycle === 'annual' ? 'Switch to monthly' : 'Switch to annual'}
            </Link>
          </div>

          {/* Price breakdown */}
          <div className="space-y-2 pt-4 border-t" style={{ borderColor: 'rgba(242,237,228,0.1)' }}>
            <div className="flex justify-between text-[14px] text-pp-text-body">
              <span>Plan price</span>
              <span className={discount ? 'line-through text-pp-text-ghost' : ''}>{fmt(plan.price)}</span>
            </div>
            {discount && (
              <div className="flex justify-between text-[14px] text-teal-light">
                <span>Discount ({discount.percentOff}% off)</span>
                <span>−{fmt(plan.price - discount.finalPrice)}</span>
              </div>
            )}
            <div className="flex justify-between text-[17px] font-semibold text-offwhite pt-2">
              <span>Total today</span>
              <span>{fmt(finalPrice)}</span>
            </div>
          </div>
        </div>

        {/* Discount code */}
        <div className="rounded-pp-l p-6 mb-6" style={{ background: 'rgba(242,237,228,0.04)', border: '1px solid rgba(242,237,228,0.12)' }}>
          <label className="block font-mono text-[11px] tracking-[0.08em] uppercase text-pp-text-faint mb-2">Discount code</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => { setCode(e.target.value.toUpperCase()); setDiscount(null); setCodeError(null) }}
              onKeyDown={(e) => { if (e.key === 'Enter') applyCode() }}
              placeholder="Enter code"
              className="flex-1 bg-navy/60 border rounded-pp px-4 py-[11px] text-[14px] text-offwhite placeholder:text-pp-text-ghost outline-none transition-all focus:border-amber/60 uppercase"
              style={{ borderColor: 'rgba(242,237,228,0.18)' }}
            />
            <button
              onClick={applyCode}
              disabled={applying || !code.trim()}
              className="px-5 rounded-pp text-[14px] font-semibold text-offwhite transition-colors disabled:opacity-40"
              style={{ background: 'rgba(242,237,228,0.08)', border: '1px solid rgba(242,237,228,0.18)' }}
            >
              {applying ? '…' : 'Apply'}
            </button>
          </div>
          {codeError && <p className="text-[12.5px] text-pp-red mt-2">{codeError}</p>}
          {discount && <p className="text-[12.5px] text-teal-light mt-2">✓ Code applied — {discount.percentOff}% off</p>}
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-pp text-[13px] text-pp-red" style={{ background: 'rgba(199,85,59,0.1)', border: '1px solid rgba(199,85,59,0.3)' }}>
            {error}
          </div>
        )}

        <button
          onClick={checkout}
          disabled={submitting}
          className={cn(
            'w-full py-[15px] rounded-pp font-semibold text-[15px] transition-all',
            submitting ? 'bg-amber/50 text-navy/60 cursor-not-allowed' : 'bg-amber text-navy hover:bg-amber/90 shadow-pp-amber',
          )}
        >
          {submitting ? 'Processing…' : finalPrice === 0 ? 'Activate my plan — free' : `Continue · ${fmt(finalPrice)}`}
        </button>
        <p className="text-[11.5px] text-pp-text-ghost text-center mt-3">
          Secure · Billed {cycle === 'annual' ? 'yearly' : 'monthly'} · Cancel anytime ·{' '}
          <Link href="/legal/terms" className="underline hover:text-pp-text-faint">Terms</Link>
          {' · '}
          <Link href="/legal/refunds" className="underline hover:text-pp-text-faint">Refunds</Link>
        </p>
      </main>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutInner />
    </Suspense>
  )
}
