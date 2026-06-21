import Link from 'next/link'
import { Nav } from '@/components/brand/Nav'
import { TranslationArrow } from '@/components/brand/TranslationArrow'
import { ConfidenceBadge } from '@/components/brand/ConfidenceBadge'
import { SectionOverline, StepRow } from '@/components/brand/SectionRule'
import type { ConfidenceTier } from '@/lib/types'

// ─── Static data (ICU Nurse → PM example) ────────────────────────────────────

const STEPS = [
  { num: '01', title: 'Ingest',    body: 'Drop in your résumé or paste a LinkedIn profile. We extract titles, tenures and accomplishments — messy formatting and non-linear histories included.' },
  { num: '02', title: 'Translate', body: 'Every line is mapped to the vocabulary, frameworks and action verbs your target field actually uses. You see your old work in the new language, side by side.' },
  { num: '03', title: 'Score',     body: 'An honest Pivot Readiness Score, with a confidence band — never false precision. Disqualifying gaps, closable gaps and noise are clearly separated.' },
  { num: '04', title: 'Rewrite',   body: 'A repositioned résumé in the new field\'s language. Every bullet is traceable to something true — a reframe of real experience, not embellishment.' },
  { num: '05', title: 'Apply',     body: 'Where to apply, which bridge roles to target first, and a 30-day plan. You never leave a screen without a clear next action.' },
]

const TABLE_ROWS: {
  from: string; to: string; tier: ConfidenceTier
  arrowColor: string; bg: string; bgHover: string
}[] = [
  { from: 'Managed ICU patient triage under time pressure',   to: 'Prioritisation under constraint — ruthless triage of competing demands', tier: 'high',    arrowColor: '#2E6B6B', bg: '#EAF1EE', bgHover: '#E0EBE6' },
  { from: 'Authored and maintained treatment protocols',       to: 'Process documentation, SOP & PRD writing',                               tier: 'high',    arrowColor: '#2E6B6B', bg: '#EAF1EE', bgHover: '#E0EBE6' },
  { from: 'Coordinated multi-department patient rounds',       to: 'Cross-functional collaboration & stakeholder alignment',                  tier: 'high',    arrowColor: '#2E6B6B', bg: '#EAF1EE', bgHover: '#E0EBE6' },
  { from: 'Tracked patient outcomes over time',                to: 'Metrics ownership & longitudinal outcome thinking',                       tier: 'partial', arrowColor: '#E8A838', bg: '#FBF1DC', bgHover: '#F7E9CB' },
  { from: 'Trained and onboarded new nursing staff',           to: 'Team enablement, documentation & onboarding',                            tier: 'partial', arrowColor: '#E8A838', bg: '#FBF1DC', bgHover: '#F7E9CB' },
  { from: 'No software product shipped end-to-end',            to: 'Direct product-delivery evidence — not yet shown',                        tier: 'frame',   arrowColor: '#B6AE9E', bg: '#FBF9F4', bgHover: '#F4F0E7' },
]

const GAPS = [
  {
    tier: 'Disqualifying', color: '#C7553B', count: '1 item',
    items: [
      { name: 'No product-shipping evidence', note: 'Required by >70% of PM job descriptions and not yet translatable from your background. Close with one end-to-end case study before targeting senior roles.' },
    ],
  },
  {
    tier: 'Closable', color: '#E8A838', count: '3 items',
    items: [
      { name: 'SQL & basic data querying',       note: 'Learnable in ~3 weeks. Enough to read dashboards and ask analysts the right questions.' },
      { name: 'Product analytics tooling',       note: 'Amplitude or Mixpanel fundamentals. A weekend of guided practice covers interview-level fluency.' },
      { name: 'A shipped case study',            note: 'Reframe a protocol redesign as a product spec — scope, tradeoffs, outcome.' },
    ],
  },
  {
    tier: 'Nice-to-have', color: '#2E6B6B', count: '2 items',
    items: [
      { name: 'Figma familiarity',         note: 'Listed often, rarely filtered on. Comfort reading mockups is enough at entry.' },
      { name: 'A/B testing vocabulary',    note: 'Useful framing, not a blocker. Pick it up on the job.' },
    ],
  },
]

const TESTIMONIALS = [
  { quote: '"I\'d been rejected 40 times. PivotPath didn\'t cheerlead — it showed me the two gaps actually killing me, and both were closable in a month."',     from: 'ICU Nurse',        to: 'Associate PM',    name: 'Maya R. · now at a health-tech startup'  },
  { quote: '"The translation map was the first time someone explained why my experience counted. I stopped apologising for my background in interviews."',          from: 'Logistics Coord.', to: 'Ops Analyst',     name: 'David O. · 11 weeks to first offer'      },
  { quote: '"It told me my first target was a stretch and handed me three bridge roles instead. I\'m in one now, on the track I wanted."',                          from: 'Teacher',          to: 'L&D Specialist',  name: 'Priya S. · SaaS, 200-person team'        },
]

// ─── Grid backdrop (hero + final CTA) ────────────────────────────────────────
function GridBackdrop({ maskPos }: { maskPos: string }) {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage:
          'linear-gradient(rgba(242,237,228,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(242,237,228,0.05) 1px, transparent 1px)',
        backgroundSize: '64px 64px',
        WebkitMaskImage: `radial-gradient(ellipse ${maskPos}, #000 30%, transparent 78%)`,
        maskImage: `radial-gradient(ellipse ${maskPos}, #000 30%, transparent 78%)`,
      }}
    />
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section id="top" className="relative bg-navy text-offwhite overflow-hidden">
      <GridBackdrop maskPos="90% 70% at 70% 35%" />
      <div
        className="relative max-w-pp-wide mx-auto px-8 grid items-center"
        style={{
          padding: 'clamp(64px,9vw,120px) 32px clamp(72px,9vw,120px)',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: 'clamp(40px,6vw,80px)',
        }}
      >
        {/* Left: headline + CTAs */}
        <div className="min-w-0">
          <p className="font-mono text-[12px] tracking-[0.22em] text-amber uppercase mb-[26px]">
            Career Transition Intelligence
          </p>
          <h1
            className="font-display font-medium tracking-[-0.02em] text-offwhite text-balance m-0 mb-[26px]"
            style={{ fontSize: 'clamp(40px,5.6vw,72px)', lineHeight: '1.02' }}
          >
            You're not underqualified.<br />
            You're <em className="italic text-amber">untranslated.</em>
          </h1>
          <p
            className="text-pp-text-body leading-[1.55] max-w-[540px] m-0 mb-9"
            style={{ fontSize: 'clamp(17px,1.5vw,20px)' }}
          >
            PivotPath reads the experience you already have and rewrites it in the
            language your target field hires for — then scores exactly what's left
            to close. No fabrication. No fluff.
          </p>
          <div className="flex flex-wrap gap-[14px] items-center">
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-[10px] text-[16px] font-semibold text-navy bg-amber px-[30px] py-4 rounded-pp hover:bg-amber/90 transition-colors"
            >
              Start free
              <TranslationArrow width={20} height={12} color="#0F1923" strokeWidth={1.8} />
            </Link>
            <Link
              href="#map"
              className="text-[16px] font-medium text-offwhite px-6 py-4 rounded-pp border border-offwhite/25 hover:border-offwhite/50 transition-colors"
            >
              See a real translation
            </Link>
          </div>
          <p className="font-mono text-[12.5px] text-pp-text-faint mt-[30px] tracking-[0.02em]">
            Built for mid-career pivoters — not lateral movers.
          </p>
        </div>

        {/* Right: translation preview card */}
        <div
          className="min-w-0 bg-navy-surface rounded-pp-m border animate-pp-rise"
          style={{
            padding: 'clamp(22px,2.6vw,30px)',
            borderColor: 'rgba(242,237,228,0.12)',
            boxShadow: '0 30px 70px -30px rgba(0,0,0,0.6)',
          }}
        >
          {/* Card header */}
          <div
            className="flex items-center justify-between mb-[22px] pb-4 border-b"
            style={{ borderColor: 'rgba(242,237,228,0.1)' }}
          >
            <span className="font-mono text-[11px] tracking-[0.18em] uppercase text-pp-text-faint">Translation Preview</span>
            <span className="font-mono text-[11px] text-amber">ICU Nurse → PM</span>
          </div>

          {/* Rows */}
          <div className="flex flex-col gap-[18px]">
            {[
              { old: 'Managed ICU triage under pressure',  nw: 'Prioritisation under constraint',  delay: 0.2 },
              { old: 'Authored treatment protocols',        nw: 'PRD & process documentation',       delay: 0.35 },
              { old: 'Coordinated multi-dept rounds',       nw: 'Cross-functional leadership',        delay: 0.5 },
            ].map((row) => (
              <div
                key={row.old}
                className="grid items-center gap-[14px]"
                style={{ gridTemplateColumns: '1fr auto 1fr' }}
              >
                <div className="text-[13.5px] leading-[1.4] text-pp-text-body">{row.old}</div>
                <TranslationArrow width={40} height={12} color="#E8A838" strokeWidth={1.4} animated animDelay={row.delay} />
                <div className="text-[13.5px] leading-[1.4] text-offwhite font-semibold">{row.nw}</div>
              </div>
            ))}
          </div>

          {/* Readiness bar */}
          <div
            className="mt-6 pt-[18px] border-t flex items-center justify-between gap-3"
            style={{ borderColor: 'rgba(242,237,228,0.1)' }}
          >
            <span className="text-[12.5px] text-pp-text-faint">Pivot Readiness</span>
            <div className="flex items-center gap-[10px] flex-1 max-w-[200px]">
              <div
                className="flex-1 h-[6px] rounded-[3px] overflow-hidden"
                style={{ background: 'rgba(242,237,228,0.12)' }}
              >
                <div className="w-[67%] h-full bg-teal" />
              </div>
              <span className="font-mono text-[13px] font-medium text-offwhite">
                67<span className="text-pp-text-faint">/100</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Thesis band ──────────────────────────────────────────────────────────────
function ThesisBand() {
  return (
    <section
      className="bg-navy text-offwhite border-t"
      style={{ borderColor: 'rgba(242,237,228,0.08)' }}
    >
      <div
        className="max-w-[1000px] mx-auto px-8 text-center"
        style={{ padding: 'clamp(56px,7vw,96px) 32px' }}
      >
        <p
          className="font-display font-normal tracking-[-0.01em] text-offwhite m-0 text-balance"
          style={{ fontSize: 'clamp(24px,3.2vw,38px)', lineHeight: '1.32' }}
        >
          Job platforms are built for people moving sideways. The filters reject
          career changers on a title before a human ever reads the work.{' '}
          <em className="italic text-amber">
            The experience is there — it's just written in the wrong language.
          </em>
        </p>
      </div>
    </section>
  )
}

// ─── How it works ─────────────────────────────────────────────────────────────
function HowItWorksSection() {
  return (
    <section id="how" className="bg-offwhite text-pp-ink">
      <div
        className="max-w-pp-wide mx-auto px-8"
        style={{ padding: 'clamp(64px,8vw,110px) 32px' }}
      >
        {/* Header row */}
        <div className="flex flex-wrap items-end justify-between gap-5 mb-[clamp(40px,5vw,64px)]">
          <div className="max-w-[560px]">
            <SectionOverline
              overline="How it works"
              heading={
                <span style={{ fontSize: 'clamp(30px,4vw,48px)', lineHeight: '1.06' }}>
                  Five steps from stuck to in motion
                </span>
              }
              overlineColor="teal"
            />
          </div>
          <p className="text-[16px] leading-[1.55] text-pp-ink-para max-w-[360px] m-0">
            One honest pass over your background. Every step ends with a clear
            next action — never a dead end.
          </p>
        </div>

        {STEPS.map((s) => (
          <StepRow key={s.num} num={s.num} title={s.title} body={s.body} />
        ))}
        <div className="border-t" style={{ borderColor: 'rgba(15,25,35,0.14)' }} />
      </div>
    </section>
  )
}

// ─── Translation Map section ───────────────────────────────────────────────────
function TranslationMapSection() {
  return (
    <section id="map" className="bg-navy text-offwhite">
      <div
        className="max-w-[1180px] mx-auto px-8"
        style={{ padding: 'clamp(64px,8vw,110px) 32px' }}
      >
        {/* Section header */}
        <div className="text-center max-w-[680px] mx-auto mb-[clamp(40px,5vw,60px)]">
          <SectionOverline
            overline="Skills Translation Map"
            heading={
              <span
                className="text-offwhite"
                style={{ fontSize: 'clamp(30px,4vw,48px)', lineHeight: '1.06' }}
              >
                A sample pivot, line by line
              </span>
            }
            body="Eight years in an ICU, read in the language of product management. Not analogies — the actual job."
            overlineColor="amber"
          />
        </div>

        {/* Pivot header */}
        <div className="flex flex-wrap items-center justify-center gap-[clamp(14px,2vw,26px)] mb-[30px]">
          <div
            className="border rounded-pp-s px-[22px] py-[14px] text-left"
            style={{ background: '#16242F', borderColor: 'rgba(242,237,228,0.14)' }}
          >
            <div className="font-mono text-[11px] tracking-[0.14em] uppercase text-pp-text-faint">From</div>
            <div className="text-[18px] font-semibold text-offwhite mt-[3px]">ICU Nurse · 8 yrs</div>
          </div>
          <TranslationArrow width={56} height={16} color="#E8A838" strokeWidth={1.8} withDot />
          <div
            className="border rounded-pp-s px-[22px] py-[14px] text-left"
            style={{ background: '#16242F', borderColor: 'rgba(232,168,56,0.45)' }}
          >
            <div className="font-mono text-[11px] tracking-[0.14em] uppercase text-pp-text-faint">To</div>
            <div className="text-[18px] font-semibold text-offwhite mt-[3px]">Product Manager</div>
          </div>
          <div
            className="border rounded-pp-s px-[22px] py-[14px] text-left"
            style={{ background: '#16242F', borderColor: 'rgba(46,107,107,0.55)' }}
          >
            <div className="font-mono text-[11px] tracking-[0.14em] uppercase text-pp-text-faint">Readiness</div>
            <div className="text-[18px] font-semibold text-teal-light mt-[3px]">
              67<span className="text-pp-text-faint font-normal">/100 · medium confidence</span>
            </div>
          </div>
        </div>

        {/* Table */}
        <div
          className="rounded-pp-m overflow-hidden"
          style={{ background: '#F2EDE4', boxShadow: '0 30px 80px -40px rgba(0,0,0,0.7)' }}
        >
          {/* Table header */}
          <div
            className="grid"
            style={{ gridTemplateColumns: '1.1fr auto 1.1fr 160px', background: '#0F1923' }}
          >
            <div className="px-6 py-4 font-mono text-[11px] tracking-[0.16em] uppercase text-pp-text-muted">Your experience</div>
            <div />
            <div className="px-6 py-4 font-mono text-[11px] tracking-[0.16em] uppercase text-amber">In Product Management</div>
            <div className="px-6 py-4 font-mono text-[11px] tracking-[0.16em] uppercase text-pp-text-muted text-right">Confidence</div>
          </div>
          {/* Table rows */}
          {TABLE_ROWS.map((row, i) => (
            <div
              key={i}
              className="grid items-center border-t"
              style={{
                gridTemplateColumns: '1.1fr auto 1.1fr 160px',
                background: row.bg,
                borderColor: 'rgba(15,25,35,0.1)',
              }}
            >
              <div
                className="text-[15px] leading-[1.45] text-pp-ink-body"
                style={{ padding: 'clamp(16px,1.8vw,22px) 24px' }}
              >
                {row.from}
              </div>
              <div className="px-1 flex justify-center">
                <TranslationArrow width={38} height={12} color={row.arrowColor} strokeWidth={1.5} />
              </div>
              <div
                className="text-[15px] leading-[1.45] text-pp-ink font-semibold"
                style={{ padding: 'clamp(16px,1.8vw,22px) 24px' }}
              >
                {row.to}
              </div>
              <div
                className="text-right"
                style={{ padding: 'clamp(16px,1.8vw,22px) 24px' }}
              >
                <ConfidenceBadge tier={row.tier} />
              </div>
            </div>
          ))}
        </div>

        {/* Summary callout */}
        <div
          className="mt-[26px] border border-l-[3px] rounded-pp-m flex flex-wrap items-center gap-[18px] justify-between"
          style={{
            background: '#16242F',
            borderColor: 'rgba(46,107,107,0.4)',
            borderLeftColor: '#2E6B6B',
            padding: 'clamp(22px,2.6vw,30px) clamp(24px,3vw,36px)',
          }}
        >
          <p
            className="font-display leading-[1.3] m-0 text-offwhite"
            style={{ fontSize: 'clamp(20px,2.2vw,26px)' }}
          >
            You have <span className="text-teal-light">8 of 12</span> core PM competencies — more than you think.
          </p>
          <span className="font-mono text-[12.5px] text-pp-text-faint">
            4 left to close · 3 are learnable in &lt; 3 months
          </span>
        </div>

        {/* Gap scorecard */}
        <div className="mt-[clamp(40px,5vw,60px)]">
          <h3
            className="font-display font-medium tracking-[-0.01em] text-offwhite text-center m-0 mb-2"
            style={{ fontSize: 'clamp(22px,2.6vw,32px)' }}
          >
            The gap, told honestly
          </h3>
          <p className="text-center text-[15px] text-pp-text-body m-0 mb-[30px]">
            What's missing, why it matters, and what it actually costs you.
          </p>
          <div
            className="grid gap-[18px]"
            style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}
          >
            {GAPS.map((gap) => (
              <div
                key={gap.tier}
                className="border rounded-pp-m p-6 flex flex-col gap-[14px]"
                style={{
                  background: '#16242F',
                  borderColor: 'rgba(242,237,228,0.12)',
                  borderTopColor: gap.color,
                  borderTopWidth: 3,
                }}
              >
                <div className="flex items-center justify-between gap-[10px]">
                  <span className="font-mono text-[11px] tracking-[0.12em] uppercase font-medium" style={{ color: gap.color }}>
                    {gap.tier}
                  </span>
                  <span className="font-mono text-[11px] text-pp-text-faint">{gap.count}</span>
                </div>
                {gap.items.map((item) => (
                  <div key={item.name} className="pt-[14px] border-t" style={{ borderColor: 'rgba(242,237,228,0.08)' }}>
                    <div className="text-[15px] font-semibold text-offwhite mb-[5px]">{item.name}</div>
                    <div className="text-[13.5px] leading-[1.5] text-pp-text-muted">{item.note}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Social proof ─────────────────────────────────────────────────────────────
function SocialProofSection() {
  return (
    <section id="proof" className="bg-offwhite text-pp-ink">
      <div
        className="max-w-[1180px] mx-auto px-8"
        style={{ padding: 'clamp(64px,8vw,110px) 32px' }}
      >
        <div className="max-w-[600px] mb-[clamp(40px,5vw,56px)]">
          <SectionOverline
            overline="From people who were stuck"
            heading={
              <span
                style={{ fontSize: 'clamp(30px,4vw,48px)', lineHeight: '1.06' }}
                className="text-pp-ink"
              >
                It didn't pump them up. It told them the truth — then what to do with it.
              </span>
            }
            overlineColor="teal"
          />
        </div>
        <div
          className="grid gap-5"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}
        >
          {TESTIMONIALS.map((t) => (
            <figure
              key={t.name}
              className="border rounded-pp-m m-0 flex flex-col gap-[22px]"
              style={{
                background: '#FBF9F4',
                borderColor: 'rgba(15,25,35,0.1)',
                padding: 'clamp(26px,2.6vw,34px)',
              }}
            >
              <blockquote
                className="font-display text-pp-ink-soft m-0"
                style={{ fontSize: 'clamp(18px,1.6vw,21px)', lineHeight: '1.45' }}
              >
                {t.quote}
              </blockquote>
              <figcaption className="flex items-center gap-[14px] mt-auto">
                <div className="flex items-center gap-2 font-mono text-[12px] text-teal">
                  <span>{t.from}</span>
                  <TranslationArrow width={26} height={9} color="#E8A838" strokeWidth={1.4} />
                  <span className="text-pp-ink font-medium">{t.to}</span>
                </div>
              </figcaption>
              <div
                className="text-[13px] text-pp-ink-meta border-t pt-[14px]"
                style={{ borderColor: 'rgba(15,25,35,0.1)' }}
              >
                {t.name}
              </div>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Final CTA ────────────────────────────────────────────────────────────────
function FinalCTASection() {
  return (
    <section id="start" className="bg-navy text-offwhite relative overflow-hidden">
      <GridBackdrop maskPos="70% 80% at 50% 50%" />
      <div
        className="relative max-w-pp-doc mx-auto px-8 text-center"
        style={{ padding: 'clamp(72px,9vw,120px) 32px' }}
      >
        <TranslationArrow
          width={84}
          height={20}
          color="#E8A838"
          strokeWidth={2}
          withDot
          className="mx-auto mb-[30px]"
        />
        <h2
          className="font-display font-medium tracking-[-0.02em] text-offwhite text-balance m-0 mb-[22px]"
          style={{ fontSize: 'clamp(34px,5vw,60px)', lineHeight: '1.04' }}
        >
          Stop reapplying with the same résumé.
        </h2>
        <p
          className="text-pp-text-body leading-[1.55] max-w-[520px] mx-auto m-0 mb-[38px]"
          style={{ fontSize: 'clamp(17px,1.6vw,20px)' }}
        >
          Run one honest translation of your background. See your readiness score,
          your real gaps, and a repositioned résumé in the language your new field
          hires for.
        </p>
        <Link
          href="/onboarding"
          className="inline-flex items-center gap-[10px] text-[17px] font-semibold text-navy bg-amber px-[38px] py-[18px] rounded-pp hover:bg-amber/90 transition-colors"
        >
          Start free
          <TranslationArrow width={20} height={12} color="#0F1923" strokeWidth={1.8} />
        </Link>
        <p className="font-mono text-[12.5px] text-pp-text-faint mt-[26px] tracking-[0.02em]">
          Free to translate · email to save your results · no card
        </p>
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function FooterSection() {
  return (
    <footer
      className="text-pp-text-faint border-t"
      style={{ background: '#0B121A', borderColor: 'rgba(242,237,228,0.08)' }}
    >
      <div className="max-w-pp-wide mx-auto px-8 py-10 flex flex-wrap items-center justify-between gap-[18px]">
        <div className="flex items-center gap-3">
          <span
            className="inline-flex items-center justify-center flex-none bg-amber rounded-[9px]"
            style={{ width: 36, height: 36 }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="5" cy="18.5" r="2.3" fill="#0F1923" />
              <path d="M5 18.5 H13 V9" stroke="#0F1923" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M9.6 11.5 L13 7 L16.4 11.5" stroke="#0F1923" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="flex flex-col leading-[1.1]">
            <span className="font-display text-[18px] font-semibold text-offwhite">PivotPath</span>
            <span className="font-mono text-[8px] tracking-[0.22em] uppercase text-[#5A6470] mt-[3px]">
              You're not underqualified. You're untranslated.
            </span>
          </span>
        </div>
        <span className="text-[13px]">Career transition intelligence · © 2026</span>
      </div>
    </footer>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <>
      <Nav variant="landing" />
      <HeroSection />
      <ThesisBand />
      <HowItWorksSection />
      <TranslationMapSection />
      <SocialProofSection />
      <FinalCTASection />
      <FooterSection />
    </>
  )
}
