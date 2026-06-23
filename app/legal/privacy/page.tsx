import Link from 'next/link'
import { Logo } from '@/components/brand'

export const metadata = {
  title: 'Privacy Policy — PivotPath',
  description: 'How PivotPath collects, uses, and protects your personal data.',
}

const LAST_UPDATED = '24 June 2026'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-navy">
      <header className="border-b" style={{ borderColor: 'rgba(242,237,228,0.1)' }}>
        <div className="max-w-pp-content mx-auto px-7 py-4 flex items-center justify-between">
          <Link href="/" aria-label="PivotPath home"><Logo size="sm" /></Link>
          <Link href="/legal/terms" className="text-[13.5px] text-pp-text-faint hover:text-pp-text-muted transition-colors">
            Terms of service
          </Link>
        </div>
      </header>

      <main className="max-w-[720px] mx-auto px-6 py-14">
        <p className="font-mono text-[11px] tracking-[0.1em] uppercase text-amber mb-3">Legal</p>
        <h1 className="font-display text-[36px] font-medium text-offwhite mb-2">Privacy Policy</h1>
        <p className="text-[13.5px] text-pp-text-ghost mb-12">Last updated: {LAST_UPDATED}</p>

        <div className="prose-pp space-y-10 text-[15px] leading-[1.75] text-pp-text-body">

          <section>
            <h2>1. Who we are</h2>
            <p>
              PivotPath (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is an AI-powered career transition platform that helps professionals
              understand how their existing skills translate into new roles and industries.
              This Privacy Policy explains how we collect, use, disclose, and protect your personal data
              in accordance with the UK General Data Protection Regulation (UK GDPR), the Data Protection
              Act 2018, and applicable data protection law.
            </p>
          </section>

          <section>
            <h2>2. Data we collect</h2>
            <p>We collect the following categories of personal data:</p>
            <ul>
              <li><strong>Account data</strong> — your name and email address, provided directly or via Google OAuth.</li>
              <li><strong>CV / career background</strong> — text you paste or upload. We extract the text content only; we never store the original file.</li>
              <li><strong>Target role information</strong> — the job title and industry you are pivoting toward.</li>
              <li><strong>Analysis outputs</strong> — your Translation Map, rewritten resume content, and career strategy brief generated during a pivot session.</li>
              <li><strong>Usage data</strong> — anonymised logs for debugging (e.g. error traces). We do not use third-party analytics trackers.</li>
              <li><strong>Session data</strong> — a secure session cookie (JWT) to keep you signed in.</li>
            </ul>
          </section>

          <section>
            <h2>3. How we use your data</h2>
            <table>
              <thead>
                <tr><th>Purpose</th><th>Legal basis (UK GDPR)</th></tr>
              </thead>
              <tbody>
                <tr><td>Providing the pivot analysis service</td><td>Contract performance (Art. 6(1)(b))</td></tr>
                <tr><td>Saving your sessions so you can return to them</td><td>Contract performance (Art. 6(1)(b))</td></tr>
                <tr><td>Sending product update emails (if opted in)</td><td>Consent (Art. 6(1)(a))</td></tr>
                <tr><td>Preventing fraud and securing accounts</td><td>Legitimate interests (Art. 6(1)(f))</td></tr>
                <tr><td>Complying with legal obligations</td><td>Legal obligation (Art. 6(1)(c))</td></tr>
              </tbody>
            </table>
          </section>

          <section>
            <h2>4. AI processing and third-party providers</h2>
            <p>
              Your CV text and target role information are sent to one of the following AI providers to generate your pivot analysis:
            </p>
            <ul>
              <li><strong>Anthropic (Claude)</strong> — your text is processed under Anthropic&apos;s API terms. Anthropic does not use API inputs to train models by default. See <a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener noreferrer">anthropic.com/privacy</a>.</li>
              <li><strong>xAI (Grok)</strong> — your text is processed under xAI&apos;s API terms. See <a href="https://x.ai/privacy-policy" target="_blank" rel="noopener noreferrer">x.ai/privacy-policy</a>.</li>
            </ul>
            <p>
              We send only the minimum data required for analysis (career background text + target role).
              We do not send your email, name, or account details to AI providers.
            </p>
          </section>

          <section>
            <h2>5. Data storage and security</h2>
            <p>
              Your data is stored in a Postgres database hosted by Neon (neon.tech) on infrastructure
              in the United States with SOC 2 Type II certification. Data in transit is encrypted using TLS.
              Data at rest is encrypted by the hosting provider.
            </p>
            <p>
              We use password hashing (bcrypt, 12 rounds) for credentials-based accounts.
              Passwords are never stored in plain text.
            </p>
          </section>

          <section>
            <h2>6. Data retention</h2>
            <p>
              We retain your account data and pivot sessions for as long as your account is active.
              If you delete your account, all associated data is permanently erased within 30 days.
              Anonymised aggregated usage statistics (no personal data) may be retained indefinitely.
            </p>
          </section>

          <section>
            <h2>7. Your rights under UK GDPR</h2>
            <p>You have the following rights regarding your personal data:</p>
            <ul>
              <li><strong>Access</strong> — request a copy of your data (available via Settings → Export my data).</li>
              <li><strong>Rectification</strong> — correct inaccurate data (available via Settings → Edit name).</li>
              <li><strong>Erasure</strong> — delete your account and all associated data (available via Settings → Delete account).</li>
              <li><strong>Portability</strong> — download your data in a machine-readable format (JSON export).</li>
              <li><strong>Restriction</strong> — request we limit processing of your data.</li>
              <li><strong>Objection</strong> — object to processing based on legitimate interests.</li>
              <li><strong>Withdraw consent</strong> — opt out of marketing emails at any time in Settings.</li>
            </ul>
            <p>
              To exercise any right not available in-app, contact us at{' '}
              <a href="mailto:privacy@pivotpath.co">privacy@pivotpath.co</a>.
              We will respond within 30 days. You also have the right to lodge a complaint with the
              Information Commissioner&apos;s Office (ICO) at <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer">ico.org.uk</a>.
            </p>
          </section>

          <section>
            <h2>8. Cookies</h2>
            <p>
              We use one session cookie (<code>next-auth.session-token</code> or <code>__Secure-next-auth.session-token</code>)
              that keeps you signed in. This is a strictly necessary cookie — it is not used for advertising or tracking.
              No third-party tracking cookies are set.
            </p>
          </section>

          <section>
            <h2>9. Children</h2>
            <p>
              PivotPath is intended for adults in professional contexts. We do not knowingly collect
              data from anyone under the age of 16. If you believe a minor has created an account,
              contact us and we will delete it promptly.
            </p>
          </section>

          <section>
            <h2>10. Changes to this policy</h2>
            <p>
              We may update this policy from time to time. We will notify registered users of material
              changes by email at least 14 days before they take effect. The &quot;Last updated&quot; date at
              the top of this page reflects the most recent revision.
            </p>
          </section>

          <section>
            <h2>11. Contact</h2>
            <p>
              For privacy questions or data requests, contact us at{' '}
              <a href="mailto:privacy@pivotpath.co">privacy@pivotpath.co</a>.
            </p>
          </section>

        </div>

        <div className="mt-16 flex flex-wrap gap-5 text-[13px] text-pp-text-ghost border-t pt-8" style={{ borderColor: 'rgba(242,237,228,0.1)' }}>
          <Link href="/" className="hover:text-pp-text-faint transition-colors">← Back to PivotPath</Link>
          <Link href="/legal/terms" className="hover:text-pp-text-faint transition-colors">Terms of service</Link>
          <Link href="/settings" className="hover:text-pp-text-faint transition-colors">Settings</Link>
        </div>
      </main>
    </div>
  )
}
