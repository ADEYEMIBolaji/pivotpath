import type { Metadata } from 'next'
import Link from 'next/link'
import { TranslationArrow } from '@/components/brand/TranslationArrow'
import { NumberedSectionRule } from '@/components/brand/SectionRule'

export const metadata: Metadata = {
  title: 'Application Strategy Brief',
}

// ─── Static data (ICU Nurse → PM example) ────────────────────────────────────

const BRIDGES = [
  { title: 'Associate Product Manager (APM)',        why: 'The standard re-entry point — APM tracks are built to take strong generalists without a PM title yet.' },
  { title: 'Product Operations Manager',             why: 'Leans directly on your coordination and process strengths while you build product-delivery evidence.' },
  { title: 'Clinical Informatics Analyst → PM track', why: 'Your domain expertise is the whole job here; many analysts move into health-tech PM within a year.' },
]

const ORIGIN_ADVANTAGE = [
  { original: 'High-stakes triage',        translated: 'Prioritisation under constraint' },
  { original: 'Protocol documentation',    translated: 'PRD writing'                     },
  { original: 'Multi-discipline rounds',   translated: 'Cross-functional leadership'     },
]

const PLAN = [
  {
    label: 'Week 1',
    actions: [
      'Publish your repositioned résumé and rewrite your LinkedIn headline to \'Product-minded clinician\'.',
      'List 15 target health-tech companies hiring APMs or Product Ops.',
      'Start one product case study reframing a protocol redesign you led.',
    ],
  },
  {
    label: 'Week 2',
    actions: [
      'Send 5 informational-interview requests to PMs with clinical backgrounds.',
      'Complete an intro SQL course; add it to your Skills section.',
      'Apply to 3 bridge roles with a tailored pivot summary each.',
    ],
  },
  {
    label: 'Weeks 3–4',
    actions: [
      'Finish and publish your case study; link it from your résumé.',
      'Run 2 informational interviews; ask each for one referral.',
      'Apply to 5 more roles, prioritising Series A–B health-tech.',
    ],
  },
]

const EXPECTATIONS = [
  { label: 'Timeline',          color: '#2E6B6B', headline: '3–6 months',    note: 'Realistic for a first PM role given your starting point. Faster with a referral.'           },
  { label: 'Salary',            color: '#E8A838', headline: '−10 to −20%',   note: 'Expect a year-one dip in most markets. It typically recovers within 18 months as you re-level.' },
  { label: 'Leading indicator', color: '#2E6B6B', headline: '1 / week',      note: 'One informational interview per week is the minimum signal you\'re in real forward motion.'   },
]

// ─── Shared logo glyph (small, used in toolbar) ───────────────────────────────
function ToolbarLogo() {
  return (
    <div className="flex items-center gap-[10px]">
      <span
        className="inline-flex items-center justify-center flex-none bg-amber rounded-[8px]"
        style={{ width: 30, height: 30 }}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="5" cy="18.5" r="2.3" fill="#0F1923" />
          <path d="M5 18.5 H13 V9" stroke="#0F1923" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9.6 11.5 L13 7 L16.4 11.5" stroke="#0F1923" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="font-mono text-[11px] tracking-[0.16em] uppercase text-pp-text-faint">
        Application Strategy Brief
      </span>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function StrategyBriefPage() {
  return (
    <div
      className="pp-screenbg font-body min-h-screen overflow-x-hidden"
      style={{
        background: '#0F1923',
        padding: 'clamp(20px,4vw,48px) 20px clamp(110px,14vw,140px)',
      }}
    >
      {/* ── Toolbar ── */}
      <div className="pp-noprint max-w-pp-doc mx-auto mb-[18px] flex items-center justify-between gap-4 flex-wrap">
        <ToolbarLogo />
        <button
          className="inline-flex items-center gap-2 text-[13px] font-medium text-offwhite border rounded-pp px-4 py-[9px] cursor-pointer hover:bg-white/5 transition-colors"
          style={{ background: 'transparent', borderColor: 'rgba(242,237,228,0.24)' }}
        >
          {/* Share icon */}
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <circle cx="3" cy="7" r="2" stroke="#E8A838" strokeWidth="1.3" />
            <circle cx="11" cy="3" r="2" stroke="#E8A838" strokeWidth="1.3" />
            <circle cx="11" cy="11" r="2" stroke="#E8A838" strokeWidth="1.3" />
            <line x1="4.7" y1="6.1" x2="9.3" y2="3.7" stroke="#E8A838" strokeWidth="1.3" />
            <line x1="4.7" y1="7.9" x2="9.3" y2="10.3" stroke="#E8A838" strokeWidth="1.3" />
          </svg>
          Share this brief
        </button>
      </div>

      {/* ── Document ── */}
      <article
        className="pp-doc max-w-pp-doc mx-auto rounded-pp-x overflow-hidden"
        style={{
          background: '#F2EDE4',
          color: '#1A2733',
          boxShadow: '0 40px 90px -50px rgba(0,0,0,0.7)',
        }}
      >
        {/* Document header band */}
        <div
          className="bg-navy text-offwhite"
          style={{ padding: 'clamp(28px,4vw,44px) clamp(28px,5vw,56px)' }}
        >
          <div className="font-mono text-[11px] tracking-[0.2em] uppercase text-amber mb-[14px]">
            Your Strategy Brief · prepared June 2026
          </div>
          <h1
            className="font-display font-medium tracking-[-0.02em] text-offwhite m-0 mb-2"
            style={{ fontSize: 'clamp(26px,3.6vw,40px)', lineHeight: '1.1' }}
          >
            How to actually land the pivot
          </h1>
          <p className="text-[15px] leading-[1.55] text-pp-text-body m-0 max-w-[560px]">
            A working document — keep it open while you apply. Everything here is
            specific to your profile, not generic advice.
          </p>
        </div>

        <div style={{ padding: 'clamp(28px,5vw,56px)' }}>

          {/* ── 1. Pivot Profile ── */}
          <section className="mb-[clamp(36px,5vw,52px)]">
            <div
              className="border rounded-pp-x overflow-hidden"
              style={{ background: '#FBF9F4', borderColor: 'rgba(15,25,35,0.14)' }}
            >
              {/* From → To row */}
              <div
                className="flex flex-wrap items-center gap-[clamp(14px,2vw,24px)]"
                style={{ padding: 'clamp(20px,2.6vw,28px)' }}
              >
                <div>
                  <div className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-pp-ink-meta">From</div>
                  <div className="text-[19px] font-semibold text-pp-ink mt-[2px]">ICU Nurse</div>
                  <div className="text-[12.5px] text-pp-ink-meta">8 years · critical care</div>
                </div>
                <TranslationArrow width={50} height={15} color="#E8A838" strokeWidth={1.8} withDot />
                <div>
                  <div className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-pp-ink-meta">To</div>
                  <div className="text-[19px] font-semibold text-pp-ink mt-[2px]">Product Manager</div>
                  <div className="text-[12.5px] text-pp-ink-meta">target role</div>
                </div>
                <div className="ml-auto text-right">
                  <div className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-pp-ink-meta">Readiness</div>
                  <div className="font-display text-[34px] leading-none text-teal font-medium">
                    67<span className="text-[16px] text-pp-ink-cap font-normal">/100</span>
                  </div>
                </div>
              </div>

              {/* Asset / Gap row */}
              <div
                className="grid border-t"
                style={{
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  borderColor: 'rgba(15,25,35,0.12)',
                }}
              >
                <div
                  className="border-r"
                  style={{
                    padding: '18px clamp(20px,2.6vw,28px)',
                    borderColor: 'rgba(15,25,35,0.12)',
                  }}
                >
                  <div className="flex items-center gap-[7px] font-mono text-[10px] tracking-[0.1em] uppercase text-teal mb-[5px]">
                    <span className="w-[7px] h-[7px] rounded-full bg-teal flex-none" />
                    Strongest asset
                  </div>
                  <div className="text-[14.5px] font-semibold text-pp-ink-soft">Process thinking under pressure</div>
                </div>
                <div style={{ padding: '18px clamp(20px,2.6vw,28px)' }}>
                  <div className="flex items-center gap-[7px] font-mono text-[10px] tracking-[0.1em] uppercase text-pp-red mb-[5px]">
                    <span className="w-[7px] h-[7px] rounded-full bg-pp-red flex-none" />
                    Biggest gap
                  </div>
                  <div className="text-[14.5px] font-semibold text-pp-ink-soft">No shipped product / technical exposure</div>
                </div>
              </div>
            </div>
          </section>

          {/* ── 2. Where to Apply ── */}
          <section className="mb-[clamp(36px,5vw,52px)]">
            <NumberedSectionRule num="01" title="Where to apply" />
            <div
              className="grid gap-4"
              style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}
            >
              <div
                className="border rounded-pp-l p-5"
                style={{
                  background: 'rgba(46,107,107,0.1)',
                  borderColor: 'rgba(46,107,107,0.4)',
                }}
              >
                <div className="font-mono text-[10.5px] tracking-[0.1em] uppercase text-teal mb-3">Best fits</div>
                <ul className="m-0 p-0 list-none flex flex-col gap-2">
                  {['Health-tech startups', 'Mission-driven SaaS', 'Series A–B (weight adaptability over credentials)'].map((item) => (
                    <li key={item} className="flex gap-[9px] text-[14.5px] leading-[1.45] text-pp-ink-soft">
                      <span className="text-teal">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div
                className="border rounded-pp-l p-5"
                style={{
                  background: 'rgba(199,85,59,0.08)',
                  borderColor: 'rgba(199,85,59,0.35)',
                }}
              >
                <div className="font-mono text-[10.5px] tracking-[0.1em] uppercase text-pp-red mb-3">Avoid for now</div>
                <ul className="m-0 p-0 list-none flex flex-col gap-2">
                  {['Enterprise tech PM roles', 'FAANG APM programs (credential-heavy)', 'Roles demanding 3+ yrs shipped product'].map((item) => (
                    <li key={item} className="flex gap-[9px] text-[14.5px] leading-[1.45] text-pp-ink-soft">
                      <span className="text-pp-red">✕</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <p className="text-[14.5px] leading-[1.6] text-pp-ink-body mt-4 mb-0">
              <strong className="text-pp-ink">Why:</strong> Your clinical domain expertise is a genuine differentiator
              in health-tech — they are starved for PMs who understand the user. Early-stage companies hire for
              adaptability and judgement over pedigree, which is exactly where your profile is strong.
            </p>
          </section>

          {/* ── 3. Bridge Roles ── */}
          <section className="mb-[clamp(36px,5vw,52px)]">
            <NumberedSectionRule num="02" title="Bridge roles — apply to these first" />
            <div className="flex flex-col gap-[14px]">
              {BRIDGES.map((b, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 border-t"
                  style={{
                    padding: '16px 0',
                    borderColor: 'rgba(15,25,35,0.12)',
                  }}
                >
                  <TranslationArrow
                    width={40}
                    height={13}
                    color="#E8A838"
                    strokeWidth={1.5}
                    withDot
                    className="mt-[5px]"
                  />
                  <div className="flex-1">
                    <div className="text-[16.5px] font-semibold text-pp-ink">{b.title}</div>
                    <div className="text-[14px] leading-[1.5] text-pp-ink-para mt-[3px]">{b.why}</div>
                  </div>
                </div>
              ))}
              <div className="border-t" style={{ borderColor: 'rgba(15,25,35,0.12)' }} />
            </div>
          </section>

          {/* ── 4. Origin as Advantage ── */}
          <section className="mb-[clamp(36px,5vw,52px)]">
            <NumberedSectionRule num="03" title="Your origin as advantage" />
            <div
              className="bg-navy text-offwhite border-l-4 border-amber rounded-r-pp-l"
              style={{ padding: 'clamp(22px,3vw,30px)' }}
            >
              <p
                className="font-display leading-[1.55] m-0 mb-4 text-offwhite"
                style={{ fontSize: 'clamp(16px,1.8vw,20px)' }}
              >
                In health-tech interviews, don't hide the nursing — lead with it.
              </p>
              <div className="flex flex-col gap-[11px]">
                {ORIGIN_ADVANTAGE.map((item) => (
                  <div key={item.original} className="flex flex-wrap items-center gap-[10px] text-[14.5px]">
                    <span className="text-pp-text-muted">{item.original}</span>
                    <span className="text-amber font-mono">=</span>
                    <span className="text-offwhite font-semibold">{item.translated}</span>
                  </div>
                ))}
              </div>
              <p className="text-[14px] leading-[1.6] mt-[18px] mb-0 text-pp-text-body">
                These are not analogies you're stretching to make. In a health-tech product team, they are the job.
              </p>
            </div>
          </section>

          {/* ── 5. 30-Day Plan ── */}
          <section className="mb-[clamp(36px,5vw,52px)]">
            <NumberedSectionRule num="04" title="Your 30-day action plan" />
            <div className="flex flex-col gap-[14px]">
              {PLAN.map((wk) => (
                <div
                  key={wk.label}
                  className="grid border rounded-pp-l"
                  style={{
                    gridTemplateColumns: '120px 1fr',
                    gap: 'clamp(12px,2vw,24px)',
                    alignItems: 'start',
                    background: '#FBF9F4',
                    borderColor: 'rgba(15,25,35,0.12)',
                    padding: '18px clamp(16px,2vw,22px)',
                  }}
                >
                  <div className="font-mono text-[11px] tracking-[0.1em] uppercase text-pp-badge-pt-fg pt-[3px]">
                    {wk.label}
                  </div>
                  <ul className="m-0 p-0 list-none flex flex-col gap-[9px]">
                    {wk.actions.map((act) => (
                      <li key={act} className="flex gap-[10px] items-start text-[14.5px] leading-[1.45] text-pp-ink-soft">
                        <span
                          className="w-4 h-4 border rounded-[3px] flex-none mt-[2px]"
                          style={{ borderColor: '#E8A838', borderWidth: 1.5 }}
                        />
                        {act}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* ── 6. Honest Expectations ── */}
          <section>
            <NumberedSectionRule num="05" title="Honest expectations" />
            <div
              className="grid gap-[14px]"
              style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}
            >
              {EXPECTATIONS.map((ex) => (
                <div
                  key={ex.label}
                  className="border rounded-pp-l p-5"
                  style={{
                    background: '#FBF9F4',
                    borderColor: 'rgba(15,25,35,0.14)',
                    borderTopColor: ex.color,
                    borderTopWidth: 3,
                  }}
                >
                  <div className="font-mono text-[10.5px] tracking-[0.1em] uppercase text-pp-ink-meta mb-2">
                    {ex.label}
                  </div>
                  <div
                    className="font-display leading-[1.2] text-pp-ink mb-[6px]"
                    style={{ fontSize: '19px' }}
                  >
                    {ex.headline}
                  </div>
                  <div className="text-[13px] leading-[1.5] text-pp-ink-para">{ex.note}</div>
                </div>
              ))}
            </div>
            <p className="text-[13.5px] leading-[1.6] text-pp-ink-meta mt-5 mb-0 italic font-display">
              A readiness score under 100 is normal — most successful pivoters start here.
              Forward motion, not perfection, is the goal.
            </p>
          </section>

        </div>
      </article>

      {/* ── Sticky CTA ── */}
      <div
        className="pp-noprint fixed bottom-0 left-0 right-0 z-[60] pp-backdrop border-t"
        style={{ borderColor: 'rgba(242,237,228,0.14)' }}
      >
        <div className="max-w-pp-doc mx-auto px-7 py-[15px] flex flex-wrap items-center justify-between gap-[14px]">
          <span className="text-[14px] text-pp-text-body leading-[1.4]">
            You have a profile, a résumé and a plan. The only thing left is to start.
          </span>
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-[10px] text-[15px] font-semibold text-navy bg-amber px-7 py-[14px] rounded-pp whitespace-nowrap hover:bg-amber/90 transition-colors"
          >
            Start applying
            <TranslationArrow width={20} height={12} color="#0F1923" strokeWidth={1.8} />
          </Link>
        </div>
      </div>
    </div>
  )
}
