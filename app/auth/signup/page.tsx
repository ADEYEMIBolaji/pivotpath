'use client'

import { Suspense, useState, useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Logo } from '@/components/brand'
import { cn } from '@/lib/utils'

function SignUpForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/onboarding'
  const { status } = useSession()

  // Already signed in? Skip the form and continue where they were headed.
  useEffect(() => {
    if (status === 'authenticated') router.replace(callbackUrl)
  }, [status, router, callbackUrl])

  // Prefill a referral code from an influencer link, e.g. /auth/signup?ref=PIVOTESTHER20
  useEffect(() => {
    const ref = searchParams.get('ref') ?? searchParams.get('code')
    if (ref) setReferral(ref.trim().toUpperCase())
  }, [searchParams])

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [referral, setReferral] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, referral }),
    })
    const data = await res.json() as { ok: boolean; error?: string }

    if (!data.ok) {
      setLoading(false)
      setError(data.error ?? 'Something went wrong')
      return
    }

    // Auto sign-in after registration
    const result = await signIn('credentials', { email, password, redirect: false })
    setLoading(false)
    if (result?.error) {
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`)
    } else {
      router.push(callbackUrl)
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true)
    await signIn('google', { callbackUrl })
  }

  const passwordStrength = password.length === 0 ? null : password.length < 8 ? 'weak' : password.length < 12 ? 'fair' : 'strong'
  const strengthColor = passwordStrength === 'weak' ? '#C7553B' : passwordStrength === 'fair' ? '#E8A838' : '#2E6B6B'

  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-[420px]">
        <Link href="/" className="flex justify-center mb-10">
          <Logo size="sm" />
        </Link>

        <div
          className="rounded-pp-l p-8"
          style={{ background: 'rgba(242,237,228,0.04)', border: '1px solid rgba(242,237,228,0.1)' }}
        >
          <h1 className="font-display text-[26px] font-medium text-offwhite mb-1">Create your account</h1>
          <p className="text-[14px] text-pp-text-body mb-7">Map your pivot in minutes. Free to start.</p>

          {/* Google */}
          <button
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 py-[11px] px-4 rounded-pp font-medium text-[14px] text-offwhite transition-all mb-5"
            style={{ background: 'rgba(242,237,228,0.08)', border: '1px solid rgba(242,237,228,0.18)' }}
          >
            {googleLoading ? (
              <div className="w-4 h-4 rounded-full border-2 border-offwhite/30 border-t-offwhite animate-spin" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
                <path d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
            )}
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px" style={{ background: 'rgba(242,237,228,0.12)' }} />
            <span className="text-[12px] text-pp-text-ghost">or</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(242,237,228,0.12)' }} />
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-pp text-[13px] text-pp-red"
              style={{ background: 'rgba(199,85,59,0.1)', border: '1px solid rgba(199,85,59,0.3)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-mono text-[11px] tracking-[0.08em] uppercase text-pp-text-faint mb-1.5">Full name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Alex Johnson"
                className="w-full bg-navy/60 border rounded-pp px-4 py-[11px] text-[14px] text-offwhite placeholder:text-pp-text-ghost outline-none transition-all focus:border-amber/60"
                style={{ borderColor: 'rgba(242,237,228,0.18)' }}
              />
            </div>
            <div>
              <label className="block font-mono text-[11px] tracking-[0.08em] uppercase text-pp-text-faint mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full bg-navy/60 border rounded-pp px-4 py-[11px] text-[14px] text-offwhite placeholder:text-pp-text-ghost outline-none transition-all focus:border-amber/60"
                style={{ borderColor: 'rgba(242,237,228,0.18)' }}
              />
            </div>
            <div>
              <label className="block font-mono text-[11px] tracking-[0.08em] uppercase text-pp-text-faint mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="Min. 8 characters"
                className="w-full bg-navy/60 border rounded-pp px-4 py-[11px] text-[14px] text-offwhite placeholder:text-pp-text-ghost outline-none transition-all focus:border-amber/60"
                style={{ borderColor: 'rgba(242,237,228,0.18)' }}
              />
              {passwordStrength && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1 rounded-full bg-pp-border-dark overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: passwordStrength === 'weak' ? '33%' : passwordStrength === 'fair' ? '66%' : '100%',
                        background: strengthColor,
                      }}
                    />
                  </div>
                  <span className="text-[11px] font-mono" style={{ color: strengthColor }}>
                    {passwordStrength}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block font-mono text-[11px] tracking-[0.08em] uppercase text-pp-text-faint mb-1.5">
                Referral code <span className="text-pp-text-ghost normal-case tracking-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={referral}
                onChange={e => setReferral(e.target.value.toUpperCase())}
                placeholder="From an influencer? Enter their code"
                className="w-full bg-navy/60 border rounded-pp px-4 py-[11px] text-[14px] text-offwhite placeholder:text-pp-text-ghost outline-none transition-all focus:border-amber/60 uppercase"
                style={{ borderColor: 'rgba(242,237,228,0.18)' }}
              />
              {referral && (
                <p className="text-[12px] text-teal-light mt-1.5">Unlocks 20% off your first plan.</p>
              )}
            </div>

            {/* Consent checkbox */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={e => setAgreedToTerms(e.target.checked)}
                className="mt-[3px] flex-shrink-0 w-4 h-4 rounded accent-amber"
              />
              <span className="text-[12.5px] text-pp-text-faint leading-[1.55]">
                I agree to the{' '}
                <Link href="/legal/terms" target="_blank" className="text-amber hover:text-amber/80 underline underline-offset-2">Terms of service</Link>
                {' '}and{' '}
                <Link href="/legal/privacy" target="_blank" className="text-amber hover:text-amber/80 underline underline-offset-2">Privacy policy</Link>.
                I understand my CV text will be processed by an AI provider.
              </span>
            </label>

            <button
              type="submit"
              disabled={loading || !agreedToTerms}
              className={cn(
                'w-full py-[13px] rounded-pp font-semibold text-[15px] transition-all mt-2',
                loading || !agreedToTerms ? 'bg-amber/40 text-navy/60 cursor-not-allowed' : 'bg-amber text-navy hover:bg-amber/90 shadow-pp-amber',
              )}
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-[13.5px] text-pp-text-faint mt-5">
          Already have an account?{' '}
          <Link href={`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="text-amber hover:text-amber/80 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function SignUpPage() {
  return (
    <Suspense>
      <SignUpForm />
    </Suspense>
  )
}
