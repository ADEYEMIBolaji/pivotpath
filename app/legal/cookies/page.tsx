import Link from 'next/link'
import { Logo } from '@/components/brand'

export const metadata = {
  title: 'Cookie Policy, PivotPath',
  description: 'How PivotPath uses cookies. We use a single strictly necessary session cookie and no tracking or advertising cookies.',
  alternates: { canonical: '/legal/cookies' },
}

const LAST_UPDATED = '2 July 2026'
const PRIVACY_EMAIL = 'pivotpath01@gmail.com'

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-navy">
      <header className="border-b" style={{ borderColor: 'rgba(242,237,228,0.1)' }}>
        <div className="max-w-pp-content mx-auto px-7 py-4 flex items-center justify-between">
          <Link href="/" aria-label="PivotPath home"><Logo size="sm" /></Link>
          <Link href="/legal/privacy" className="text-[13.5px] text-pp-text-faint hover:text-pp-text-muted transition-colors">
            Privacy policy
          </Link>
        </div>
      </header>

      <main className="max-w-[720px] mx-auto px-6 py-14">
        <p className="font-mono text-[11px] tracking-[0.1em] uppercase text-amber mb-3">Legal</p>
        <h1 className="font-display text-[36px] font-medium text-offwhite mb-2">Cookie Policy</h1>
        <p className="text-[13.5px] text-pp-text-ghost mb-12">Last updated: {LAST_UPDATED}</p>

        <div className="prose-pp space-y-10 text-[15px] leading-[1.75] text-pp-text-body">

          <section>
            <h2>1. What cookies are</h2>
            <p>
              Cookies are small text files that a website stores on your device to make it work or to
              remember information about your visit. This policy explains which cookies PivotPath uses and
              why. It should be read alongside our{' '}
              <Link href="/legal/privacy">Privacy policy</Link>.
            </p>
          </section>

          <section>
            <h2>2. Our approach</h2>
            <p>
              We keep cookies to the absolute minimum. PivotPath uses{' '}
              <strong>one strictly necessary cookie</strong> to keep you signed in. We do{' '}
              <strong>not</strong> use advertising cookies, and we do <strong>not</strong> use third-party
              analytics or tracking cookies. Because the only cookie we set is strictly necessary to provide
              the service you asked for, no consent banner is required for it under UK PECR and GDPR.
            </p>
          </section>

          <section>
            <h2>3. The cookie we use</h2>
            <table>
              <thead>
                <tr>
                  <th>Cookie</th>
                  <th>Purpose</th>
                  <th>Type</th>
                  <th>Retention</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <code>next-auth.session-token</code> /{' '}
                    <code>__Secure-next-auth.session-token</code>
                  </td>
                  <td>Keeps you signed in to your account (authentication session).</td>
                  <td>Strictly necessary, first-party</td>
                  <td>Up to 30 days, or until you sign out</td>
                </tr>
              </tbody>
            </table>
            <p>
              This is a first-party session cookie set by our authentication layer (NextAuth). It contains a
              signed token, not your personal details, and it is never used for advertising or cross-site
              tracking.
            </p>
          </section>

          <section>
            <h2>4. Third-party services</h2>
            <p>
              When you make a payment, checkout is handled by our payment provider, and when you sign in with
              Google, authentication is handled by Google. These providers may set their own cookies on their
              own pages under their own policies. We do not control those cookies. See the provider&apos;s
              policy for details.
            </p>
          </section>

          <section>
            <h2>5. Managing cookies</h2>
            <p>
              You can block or delete cookies through your browser settings at any time. Because our only
              cookie is strictly necessary, blocking it will sign you out and prevent you from using
              account features, but you can still browse our public pages.
            </p>
          </section>

          <section>
            <h2>6. Changes and contact</h2>
            <p>
              If we ever introduce new cookies, we will update this policy and, where the law requires it,
              ask for your consent first. Questions about cookies? Email{' '}
              <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a>.
            </p>
          </section>

        </div>

        <div className="mt-16 flex flex-wrap gap-5 text-[13px] text-pp-text-ghost border-t pt-8" style={{ borderColor: 'rgba(242,237,228,0.1)' }}>
          <Link href="/" className="hover:text-pp-text-faint transition-colors">← Back to PivotPath</Link>
          <Link href="/legal/privacy" className="hover:text-pp-text-faint transition-colors">Privacy policy</Link>
          <Link href="/legal/terms" className="hover:text-pp-text-faint transition-colors">Terms of service</Link>
          <Link href="/settings" className="hover:text-pp-text-faint transition-colors">Settings</Link>
        </div>
      </main>
    </div>
  )
}
