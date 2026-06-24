import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/session-store'
import { Nav, ReadinessScore, TranslationArrow } from '@/components/brand'
import { PrintButton } from './PrintButton'
import type { StrategyBrief, OriginAdvantageItem, ActionWeek, Expectation, BridgeRole } from '@/lib/types'

export const metadata = { title: 'Strategy Brief' }

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <div
        className="flex items-center gap-4 pb-4 mb-8"
        style={{ borderBottom: '1px solid rgba(242,237,228,0.12)' }}
      >
        <span className="font-mono text-[11px] tracking-[0.1em] text-pp-text-faint">{n}</span>
        <div className="flex-1 h-px" style={{ background: 'rgba(242,237,228,0.12)' }} />
        <h2 className="font-display text-[20px] font-medium text-offwhite">{title}</h2>
      </div>
      {children}
    </section>
  )
}

export default async function StrategyBriefDynamicPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params
  const session = await getSession(sessionId)
  if (!session?.strategy) notFound()

  const { strategy, target, profile, translationMap } = session
  const score = translationMap?.readiness.score ?? 0

  return (
    <div className="min-h-screen bg-navy">
      <div className="pp-noprint">
        <Nav
          variant="app"
          pivotLabel={{ from: profile.headline ?? profile.roles[0]?.title ?? 'Your background', to: target.title }}
        />
      </div>

      {/* Document */}
      <div className="pp-screenbg py-8 sm:py-16 px-3 sm:px-6">
        <article
          className="pp-doc max-w-pp-doc mx-auto rounded-pp-l shadow-pp-doc px-6 sm:px-14 py-10 sm:py-14"
          style={{ background: '#fff' }}
        >
          {/* ── Cover ── */}
          <div className="mb-14 pb-10" style={{ borderBottom: '1px solid rgba(15,25,35,0.1)' }}>
            <p className="font-mono text-[10.5px] tracking-[0.12em] uppercase text-pp-ink-meta mb-4">PivotPath Strategy Brief</p>
            <h1 className="font-display text-[36px] font-medium text-pp-ink leading-[1.1] mb-3" style={{ fontSize: 'clamp(28px, 4vw, 36px)' }}>
              {profile.name ? `${profile.name}'s ` : ''}Transition to {target.title}
            </h1>
            <div className="flex items-center gap-3 mt-4">
              <TranslationArrow width={40} height={12} />
              <p className="text-[14px] text-pp-ink-para">
                {target.function} · {target.industry}
              </p>
            </div>
            {translationMap && (
              <div className="mt-8">
                <ReadinessScore score={score} label={translationMap.readiness.label} variant="brief" />
              </div>
            )}
          </div>

          {/* ── 1. Where to aim ── */}
          <Section n="01" title="Where to aim">
            <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
              <div>
                <p className="font-mono text-[10px] tracking-[0.08em] uppercase text-pp-ink-meta mb-3">Best-fit companies</p>
                <ul className="space-y-1.5">
                  {strategy.bestFitCompanies.map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-[13.5px] text-pp-ink">
                      <span className="text-teal flex-shrink-0 mt-0.5">✓</span>
                      {c}
                    </li>
                  ))}
                </ul>
                <p className="text-[12.5px] text-pp-ink-para mt-3 leading-[1.5]">{strategy.bestFitRationale}</p>
              </div>
              <div>
                <p className="font-mono text-[10px] tracking-[0.08em] uppercase text-pp-ink-meta mb-3">Avoid for now</p>
                <ul className="space-y-1.5">
                  {strategy.avoidCompanies.map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-[13.5px] text-pp-ink-para">
                      <span className="text-pp-red flex-shrink-0 mt-0.5">✗</span>
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Bridge roles */}
            {strategy.bridgeRoles.length > 0 && (
              <div className="mt-8">
                <p className="font-mono text-[10px] tracking-[0.08em] uppercase text-pp-ink-meta mb-4">Bridge roles (optional stepping stones)</p>
                <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                  {strategy.bridgeRoles.map((r: BridgeRole, i: number) => (
                    <div
                      key={i}
                      className="rounded-pp-m p-4"
                      style={{ background: 'rgba(46,107,107,0.07)', border: '1px solid rgba(46,107,107,0.2)' }}
                    >
                      <p className="text-[14px] font-semibold text-pp-ink">{r.title}</p>
                      <p className="text-[12.5px] text-pp-ink-para mt-1 leading-[1.45]">{r.why}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Section>

          {/* ── 2. Origin advantage ── */}
          <Section n="02" title="Your origin advantage">
            <p className="text-[14px] text-pp-ink-para leading-[1.65] mb-6">{strategy.originNarrative}</p>
            <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
              {strategy.originAdvantage.map((item: OriginAdvantageItem, i: number) => (
                <div
                  key={i}
                  className="rounded-pp-m p-4"
                  style={{ border: '1px solid rgba(15,25,35,0.1)', background: 'rgba(15,25,35,0.02)' }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[12.5px] text-pp-ink-meta">{item.original}</span>
                    <svg width="20" height="8" viewBox="0 0 20 8" fill="none">
                      <line x1="0" y1="4" x2="14" y2="4" stroke="#E8A838" strokeWidth="1.2" />
                      <path d="M12 1L16 4L12 7" stroke="#E8A838" strokeWidth="1.2" fill="none" strokeLinejoin="round" strokeLinecap="round" />
                    </svg>
                    <span className="text-[12.5px] font-medium text-pp-ink">{item.translated}</span>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* ── 3. Action plan ── */}
          <Section n="03" title="Your action plan">
            <div className="space-y-6">
              {strategy.plan.map((week: ActionWeek, i: number) => (
                <div key={i} className="grid gap-6" style={{ gridTemplateColumns: '120px 1fr' }}>
                  <div className="pt-0.5">
                    <p className="font-mono text-[11px] tracking-[0.07em] uppercase text-pp-ink-meta">{week.label}</p>
                  </div>
                  <ul className="space-y-2.5">
                    {week.actions.map((action, ai) => (
                      <li key={ai} className="flex items-start gap-3 text-[13.5px] text-pp-ink leading-[1.5]">
                        <div
                          className="w-4 h-4 rounded-pp flex-shrink-0 mt-0.5 flex items-center justify-center"
                          style={{ border: '1.5px solid rgba(232,168,56,0.5)' }}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-amber/40" />
                        </div>
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Section>

          {/* ── 4. What to expect ── */}
          <Section n="04" title="What to expect">
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
              {strategy.expectations.map((exp: Expectation, i: number) => (
                <div
                  key={i}
                  className="rounded-pp-l p-5"
                  style={{ border: `1px solid ${exp.color}35`, background: `${exp.color}0a` }}
                >
                  <p className="font-mono text-[10px] tracking-[0.08em] uppercase mb-2" style={{ color: exp.color }}>
                    {exp.label}
                  </p>
                  <p className="font-display text-[26px] font-medium text-pp-ink mb-1">{exp.headline}</p>
                  <p className="text-[12.5px] text-pp-ink-para leading-[1.45]">{exp.note}</p>
                </div>
              ))}
            </div>
          </Section>
        </article>
      </div>

      {/* ── Sticky CTA ── */}
      <div
        className="pp-noprint fixed bottom-0 left-0 right-0 px-6 py-4 flex items-center justify-between"
        style={{
          background: 'rgba(15,25,35,0.96)',
          backdropFilter: 'blur(12px)',
          borderTop: '1px solid rgba(242,237,228,0.12)',
        }}
      >
        <div className="flex items-center gap-3">
          <Link
            href={`/results/${sessionId}/map`}
            className="text-[13.5px] text-pp-text-faint hover:text-pp-text-muted transition-colors"
          >
            ← Translation Map
          </Link>
          <span style={{ color: 'rgba(242,237,228,0.2)' }}>|</span>
          <Link
            href={`/results/${sessionId}/resume`}
            className="text-[13.5px] text-pp-text-faint hover:text-pp-text-muted transition-colors"
          >
            Résumé Editor
          </Link>
        </div>
        <PrintButton />
      </div>
    </div>
  )
}
