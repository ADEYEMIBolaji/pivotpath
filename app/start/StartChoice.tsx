'use client'

/**
 * The actual persona split — TEST BUILD.
 *
 * There's no classifier here and there doesn't need to be one: the person
 * knows which situation they're in better than any model would guess from
 * behavioral signals. This just asks directly and routes accordingly.
 */

import Link from 'next/link'
import { Logo } from '@/components/brand'

function ChoiceCard({
  eyebrow,
  title,
  description,
  href,
  cta,
}: {
  eyebrow: string
  title: string
  description: string
  href: string
  cta: string
}) {
  return (
    <Link
      href={href}
      className="group block rounded-pp-x bg-navy-surface border border-pp-border-dark p-7 transition-all hover:border-amber hover:shadow-pp-card"
    >
      <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-amber mb-3">{eyebrow}</p>
      <h2 className="font-display text-[22px] leading-[1.25] text-pp-text-bright mb-3">{title}</h2>
      <p className="text-[14.5px] leading-[1.6] text-pp-text-body mb-6">{description}</p>
      <span className="inline-flex items-center gap-2 font-semibold text-[14px] text-amber group-hover:gap-3 transition-all">
        {cta} <span aria-hidden>→</span>
      </span>
    </Link>
  )
}

export function StartChoice() {
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

      <main className="flex-1 max-w-pp-wide w-full mx-auto px-7 py-16">
        <p className="font-mono text-[11.5px] tracking-[0.14em] uppercase text-amber mb-3">
          Before we start
        </p>
        <h1 className="font-display text-[34px] leading-[1.15] text-pp-text-bright mb-3">
          Do you know what role you&rsquo;re targeting?
        </h1>
        <p className="text-[15px] leading-[1.6] text-pp-text-body mb-10 max-w-pp-narrow">
          Answer honestly — there&rsquo;s no wrong answer, and it changes nothing about how seriously
          we take your background either way.
        </p>

        <div className="grid gap-5 sm:grid-cols-2">
          <ChoiceCard
            eyebrow="I know where I'm headed"
            title="I already know my target role"
            description="Tell us the role or industry directly and we'll take you straight into positioning against it."
            href="/target-role"
            cta="Set my target role"
          />
          <ChoiceCard
            eyebrow="I'm not sure yet"
            title="I don't know what to target"
            description="Answer a few questions about what you're already good at — we'll work outward from evidence, not a guess, and surface roles you'd likely never have searched for."
            href="/discovery-test"
            cta="Start Discovery Mode"
          />
        </div>

        <p className="mt-10 text-[13px] leading-[1.6] text-pp-text-ghost border-t border-pp-border-darker pt-6 max-w-pp-narrow">
          Either path ends up in the same place: one committed target role, ready to translate your
          background against.
        </p>
      </main>
    </div>
  )
}
