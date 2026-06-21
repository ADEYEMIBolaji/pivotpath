import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/session-store'
import { Nav, TranslationArrow, ConfidenceBadge, ReadinessScore } from '@/components/brand'
import type { TranslationRow, GapCard } from '@/lib/types'

export const metadata = { title: 'Translation Map' }

// ─── Tier row colors ──────────────────────────────────────────────────────────

const ROW_STYLES: Record<string, { bg: string; bgHover: string }> = {
  high:    { bg: '#EAF1EE', bgHover: '#E0EBE6' },
  partial: { bg: '#FBF1DC', bgHover: '#F7E9CB' },
  frame:   { bg: '#F1EEE6', bgHover: '#E9E4D9' },
}

const ARROW_COLORS: Record<string, string> = {
  high: '#2E6B6B',
  partial: '#E8A838',
  frame: '#9AA7B0',
}

function MapRow({ row, idx }: { row: TranslationRow; idx: number }) {
  const styles = ROW_STYLES[row.tier]
  const arrowColor = ARROW_COLORS[row.tier]
  return (
    <div
      className="grid gap-4 px-5 py-4 rounded-pp transition-colors"
      style={{
        gridTemplateColumns: '1fr auto 1fr 160px',
        background: styles.bg,
      }}
    >
      <div className="py-1">
        <p className="text-[13.5px] text-pp-ink font-medium leading-[1.45]">{row.from}</p>
        {row.note && <p className="text-[12px] text-pp-ink-meta mt-1 leading-[1.4]">{row.note}</p>}
      </div>
      <div className="flex items-center justify-center px-2">
        <svg width="56" height="16" viewBox="0 0 56 16" fill="none">
          <circle cx="4" cy="8" r="3.5" fill={arrowColor} />
          <line x1="9" y1="8" x2="44" y2="8" stroke={arrowColor} strokeWidth="1.5" />
          <path d="M42 3L47 8L42 13" stroke={arrowColor} strokeWidth="1.5" fill="none" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
      </div>
      <div className="py-1">
        <p className="text-[13.5px] text-pp-ink font-medium leading-[1.45]">{row.to}</p>
      </div>
      <div className="flex items-center justify-end">
        <ConfidenceBadge tier={row.tier} />
      </div>
    </div>
  )
}

function GapCardView({ card, idx }: { card: GapCard; idx: number }) {
  const tierLabels: Record<string, string> = {
    disqualifying: 'Would screen you out',
    closable: 'Closable gap',
    'nice-to-have': 'Nice to have',
  }
  return (
    <div
      className="rounded-pp-l p-5"
      style={{ border: `1px solid ${card.color}40`, background: `${card.color}0d` }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full" style={{ background: card.color }} />
        <p className="font-mono text-[10.5px] tracking-[0.08em] uppercase" style={{ color: card.color }}>
          {tierLabels[card.tier] ?? card.tier}
        </p>
      </div>
      <div className="space-y-3">
        {card.items.map((item, i) => (
          <div key={i} className="border-b last:border-b-0 pb-3 last:pb-0" style={{ borderColor: `${card.color}20` }}>
            <div className="flex items-start justify-between gap-4">
              <p className="text-[13.5px] font-medium text-pp-ink">{item.name}</p>
              {item.timeToClose && (
                <span
                  className="text-[11px] font-mono flex-shrink-0 px-2 py-0.5 rounded-pp"
                  style={{ background: `${card.color}20`, color: card.color }}
                >
                  {item.timeToClose}
                </span>
              )}
            </div>
            <p className="text-[12.5px] text-pp-ink-meta mt-1 leading-[1.45]">{item.note}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default async function TranslationMapPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params
  const session = getSession(sessionId)
  if (!session?.translationMap) notFound()

  const { translationMap, gapScorecard, profile, target } = session

  return (
    <div className="min-h-screen bg-offwhite-surface">
      <Nav variant="app" pivotLabel={{ from: profile.headline ?? profile.roles[0]?.title ?? 'Your background', to: target.title }} />

      <div className="max-w-pp-content mx-auto px-6 py-14">

        {/* ── Header ── */}
        <div className="mb-10">
          <p className="font-mono text-[11px] tracking-[0.1em] uppercase text-pp-ink-meta mb-2">Step 4 of 5 · Translation Map</p>
          <h1
            className="font-display font-medium text-pp-ink leading-[1.15] mb-3"
            style={{ fontSize: 'clamp(28px, 4vw, 40px)' }}
          >
            How your experience translates
          </h1>
          <p className="text-[15px] text-pp-ink-para max-w-2xl leading-[1.6]">
            Every row maps something from your background to the language of {target.title} roles. High-confidence rows are ready to use. Partial rows need reframing. Frame rows need evidence you haven't yet built.
          </p>
        </div>

        <div className="grid gap-8" style={{ gridTemplateColumns: '1fr 280px' }}>

          {/* ── Main column ── */}
          <div className="space-y-6">

            {/* Summary callout */}
            <div
              className="flex items-start gap-4 rounded-pp-l px-6 py-5"
              style={{ background: 'rgba(46,107,107,0.08)', border: '1px solid rgba(46,107,107,0.25)' }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="flex-shrink-0 mt-0.5">
                <circle cx="10" cy="10" r="9" stroke="#2E6B6B" strokeWidth="1.5" />
                <path d="M7 10l2 2 4-4" stroke="#2E6B6B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div>
                <p className="text-[14px] font-medium text-pp-ink">{translationMap.summaryCopy}</p>
                <p className="text-[13px] text-pp-ink-para mt-1">
                  Strongest asset: <strong className="text-pp-ink">{translationMap.readiness.strongestAsset}</strong>
                </p>
              </div>
            </div>

            {/* Table header */}
            <div
              className="grid gap-4 px-5 py-3 rounded-pp"
              style={{
                gridTemplateColumns: '1fr auto 1fr 160px',
                background: 'rgba(15,25,35,0.06)',
              }}
            >
              <p className="font-mono text-[10.5px] tracking-[0.08em] uppercase text-pp-ink-meta">Your experience</p>
              <div className="w-[56px]" />
              <p className="font-mono text-[10.5px] tracking-[0.08em] uppercase text-pp-ink-meta">{target.title} language</p>
              <p className="font-mono text-[10.5px] tracking-[0.08em] uppercase text-pp-ink-meta text-right">Confidence</p>
            </div>

            {/* Rows */}
            <div className="space-y-1.5">
              {translationMap.rows.map((row, i) => (
                <MapRow key={i} row={row} idx={i} />
              ))}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 pt-2">
              {(['high', 'partial', 'frame'] as const).map((tier) => (
                <div key={tier} className="flex items-center gap-2">
                  <ConfidenceBadge tier={tier} />
                  <span className="text-[12px] text-pp-ink-meta">
                    {tier === 'high' ? 'Direct transfer' : tier === 'partial' ? 'Needs reframing' : 'Needs building'}
                  </span>
                </div>
              ))}
            </div>

            {/* Gap scorecard */}
            {gapScorecard && (
              <div>
                <h2 className="text-[18px] font-semibold text-pp-ink mb-1">Gap scorecard</h2>
                <p className="text-[13.5px] text-pp-ink-para mb-5">
                  Biggest gap: <span className="font-medium text-pp-ink">{translationMap.readiness.biggestGap}</span>
                </p>
                <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
                  {gapScorecard.cards.map((card, i) => (
                    <GapCardView key={i} card={card} idx={i} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Sidebar ── */}
          <div className="space-y-6">
            {/* Readiness score */}
            <div
              className="rounded-pp-l p-6"
              style={{ border: '1px solid rgba(15,25,35,0.12)', background: '#fff' }}
            >
              <p className="font-mono text-[10.5px] tracking-[0.08em] uppercase text-pp-ink-meta mb-4">Pivot Readiness</p>
              <ReadinessScore
                score={translationMap.readiness.score}
                label={translationMap.readiness.label}
                variant="brief"
              />
            </div>

            {/* Competencies */}
            <div
              className="rounded-pp-l p-5"
              style={{ border: '1px solid rgba(15,25,35,0.12)', background: '#fff' }}
            >
              <p className="font-mono text-[10.5px] tracking-[0.08em] uppercase text-pp-ink-meta mb-3">Core Competencies</p>
              <div className="flex items-end gap-1 mb-2">
                <span className="font-display text-[34px] font-medium text-pp-ink leading-none">
                  {translationMap.competenciesHave}
                </span>
                <span className="text-[18px] text-pp-ink-meta mb-1">/{translationMap.competenciesTotal}</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-pp-border-light overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(translationMap.competenciesHave / translationMap.competenciesTotal) * 100}%`,
                    background: 'linear-gradient(90deg, #2E6B6B, #5FB0A6)',
                  }}
                />
              </div>
              <p className="text-[12px] text-pp-ink-meta mt-2">
                for {target.title}
              </p>
            </div>

            {/* Target */}
            <div
              className="rounded-pp-l p-5"
              style={{ border: '1px solid rgba(15,25,35,0.12)', background: '#fff' }}
            >
              <p className="font-mono text-[10.5px] tracking-[0.08em] uppercase text-pp-ink-meta mb-3">Target</p>
              <p className="text-[15px] font-semibold text-pp-ink">{target.title}</p>
              <p className="text-[13px] text-pp-ink-meta mt-0.5">{target.function} · {target.industry}</p>
            </div>
          </div>
        </div>

        {/* ── Sticky CTA ── */}
        <div
          className="fixed bottom-0 left-0 right-0 px-6 py-4 flex items-center justify-between"
          style={{
            background: 'rgba(242,237,228,0.96)',
            backdropFilter: 'blur(12px)',
            borderTop: '1px solid rgba(15,25,35,0.1)',
          }}
        >
          <div>
            <p className="text-[14px] font-medium text-pp-ink">Ready to see your repositioned résumé?</p>
            <p className="text-[12.5px] text-pp-ink-meta">Rewritten in {target.title} language — every bullet traceable to your actual experience</p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <Link
              href={`/results/${sessionId}/strategy`}
              className="text-[13.5px] font-medium text-pp-ink-para hover:text-pp-ink transition-colors px-4 py-2.5"
            >
              View strategy brief
            </Link>
            <Link
              href={`/results/${sessionId}/resume`}
              className="flex items-center gap-2 bg-navy text-offwhite px-5 py-[11px] rounded-pp font-semibold text-[14px] hover:bg-navy/90 transition-colors"
            >
              Generate my repositioned résumé
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </div>
        {/* spacer so content clears sticky bar */}
        <div className="h-20" />
      </div>
    </div>
  )
}
