import Link from 'next/link'
import { Logo } from '@/components/brand'

export const metadata = {
  title: 'Refund & Cancellation Policy, PivotPath',
  description: 'How billing, cancellations and refunds work for PivotPath subscriptions.',
  alternates: { canonical: '/legal/refunds' },
}

const LAST_UPDATED = '29 June 2026'
const BILLING_EMAIL = 'pivotpath01@gmail.com'

export default function RefundsPage() {
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
        <h1 className="font-display text-[36px] font-medium text-offwhite mb-2">Refund &amp; Cancellation Policy</h1>
        <p className="text-[13.5px] text-pp-text-ghost mb-12">Last updated: {LAST_UPDATED}</p>

        <div className="prose-pp space-y-10 text-[15px] leading-[1.75] text-pp-text-body">

          <section>
            <h2>1. Subscriptions and billing</h2>
            <p>
              PivotPath&apos;s paid plans (<strong>Pivot</strong> and <strong>Accelerate</strong>) are{' '}
              <strong>recurring subscriptions</strong>, billed either monthly or annually depending on the
              option you choose at checkout. Your subscription <strong>renews automatically</strong> at the
              end of each billing period at the then-current price until you cancel.
            </p>
            <p>
              Payments and subscriptions are managed by our Merchant of Record,{' '}
              <strong>Lemon Squeezy</strong>, which acts as the reseller of our digital services and handles
              billing, tax and receipts. We do not see or store your card details.
            </p>
          </section>

          <section>
            <h2>2. Free tier, try before you pay</h2>
            <p>
              Our <strong>free tier</strong> lets you generate your skills Translation Map and preview the
              start of your strategy brief at no cost and with no card required. This is how you evaluate the
              quality of the Service before deciding to pay, so you can make an informed decision. We do not
              offer a separate paid free trial.
            </p>
          </section>

          <section>
            <h2>3. Cancelling your subscription</h2>
            <p>
              You can cancel at any time from your account settings. Cancellation stops future renewals:
              your plan remains active until the end of the period you have already paid for, after which it
              will not renew and you will not be charged again. We do not provide pro-rata refunds for the
              unused remainder of a paid period except where required by law (see section 5).
            </p>
          </section>

          <section>
            <h2>4. 14-day cancellation right (UK consumers)</h2>
            <p>
              Under the UK Consumer Contracts Regulations 2013, consumers normally have 14 days to cancel a
              purchase. Because PivotPath is digital content supplied immediately, the following applies:
            </p>
            <ul>
              <li>
                <strong>Full refund</strong> within 14 days of your first paid charge{' '}
                <strong>provided you have not yet run a paid pivot analysis</strong>. You can request this for
                any reason.
              </li>
              <li>
                Once you run a paid pivot analysis, you are asking us to begin supplying the digital service
                immediately. At that point the current period&apos;s fee is treated as delivered and becomes{' '}
                <strong>non-refundable</strong>, as permitted under the Regulations.
              </li>
              <li>
                Access granted through a <strong>100%-off or complimentary code</strong> involves no payment
                and is therefore non-refundable.
              </li>
            </ul>
          </section>

          <section>
            <h2>5. Faulty or misdescribed service</h2>
            <p>
              Nothing in this policy affects your statutory rights under the Consumer Rights Act 2015. If the
              Service is faulty or does not work as described, you are entitled to a repair, replacement, or
              refund, contact us and we will put it right.
            </p>
          </section>

          <section>
            <h2>6. How to request a refund</h2>
            <p>
              Email{' '}
              <a href={`mailto:${BILLING_EMAIL}`}>{BILLING_EMAIL}</a> from your account email address, telling
              us the email on your account and the approximate date of the charge. Approved refunds are
              returned to your original payment method by Lemon Squeezy, normally within 14 days. You can also
              request a refund or manage your subscription via the receipt email Lemon Squeezy sends after each
              payment.
            </p>
          </section>

        </div>

        <div className="mt-16 flex flex-wrap gap-5 text-[13px] text-pp-text-ghost border-t pt-8" style={{ borderColor: 'rgba(242,237,228,0.1)' }}>
          <Link href="/" className="hover:text-pp-text-faint transition-colors">← Back to PivotPath</Link>
          <Link href="/legal/terms" className="hover:text-pp-text-faint transition-colors">Terms of service</Link>
          <Link href="/legal/privacy" className="hover:text-pp-text-faint transition-colors">Privacy policy</Link>
          <Link href="/settings" className="hover:text-pp-text-faint transition-colors">Settings</Link>
        </div>
      </main>
    </div>
  )
}
