'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Nav } from '@/components/brand'
import { UpgradeGate } from '@/components/upgrade-gate'
import { cn } from '@/lib/utils'
import type { AnalysisSession, RepositionedBullet, RepositionedRole } from '@/lib/types'

// ─── Diff helpers ─────────────────────────────────────────────────────────────

function DiffBullet({ original, repositioned }: { original: string; repositioned: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-start gap-2 px-3 py-2 rounded-pp" style={{ background: 'rgba(199,85,59,0.08)' }}>
        <span className="text-[11px] font-mono text-pp-red flex-shrink-0 mt-0.5">−</span>
        <p className="text-[13px] text-pp-ink-para line-through leading-[1.5]">{original}</p>
      </div>
      <div className="flex items-start gap-2 px-3 py-2 rounded-pp" style={{ background: 'rgba(46,107,107,0.08)' }}>
        <span className="text-[11px] font-mono text-teal flex-shrink-0 mt-0.5">+</span>
        <p className="text-[13px] text-pp-ink leading-[1.5]">{repositioned}</p>
      </div>
    </div>
  )
}

// ─── Bullet row with rationale expander ──────────────────────────────────────

function BulletRow({
  bullet,
  diffMode,
  onChange,
}: {
  bullet: RepositionedBullet
  diffMode: boolean
  onChange: (v: string) => void
}) {
  const [expanded, setExpanded] = useState(false)

  if (diffMode) return <DiffBullet original={bullet.original} repositioned={bullet.repositioned} />

  return (
    <div className="group">
      <div className="flex items-start gap-2.5">
        <span className="text-[#E8A838] text-[10px] mt-[5px] flex-shrink-0">▸</span>
        <div className="flex-1">
          <div
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onChange(e.currentTarget.textContent ?? '')}
            className="text-[13.5px] text-pp-ink leading-[1.55] outline-none focus:text-navy cursor-text"
            dangerouslySetInnerHTML={{ __html: bullet.repositioned }}
          />
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-1 flex items-center gap-1.5 text-[11.5px] text-pp-ink-meta hover:text-pp-ink transition-colors"
          >
            <svg
              width="10" height="10" viewBox="0 0 10 10" fill="none"
              className={cn('transition-transform', expanded && 'rotate-90')}
            >
              <path d="M3 2l4 3-4 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Why this reframe
          </button>
          {expanded && (
            <div
              className="mt-2 px-3 py-2.5 rounded-pp text-[12.5px] text-pp-ink-para leading-[1.5] animate-pp-fade"
              style={{ background: 'rgba(232,168,56,0.08)', border: '1px solid rgba(232,168,56,0.2)' }}
            >
              {bullet.rationale}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Role section ─────────────────────────────────────────────────────────────

function ResumeRoleSection({
  role,
  diffMode,
  onBulletChange,
}: {
  role: RepositionedRole
  diffMode: boolean
  onBulletChange: (bulletIdx: number, value: string) => void
}) {
  return (
    <div className="mb-7">
      <div className="flex items-baseline justify-between mb-3 pb-2" style={{ borderBottom: '1px solid rgba(15,25,35,0.1)' }}>
        <div>
          <p className="text-[15px] font-semibold text-pp-ink">{role.title}</p>
          <p className="text-[12.5px] text-pp-ink-meta mt-0.5">{role.meta}</p>
        </div>
      </div>
      <div className="space-y-3">
        {role.bullets.map((b, bi) => (
          <BulletRow
            key={bi}
            bullet={b}
            diffMode={diffMode}
            onChange={(v) => onBulletChange(bi, v)}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ResumeEditorPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.sessionId as string

  const [session, setSession] = useState<AnalysisSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [locked, setLocked] = useState(false)
  const [diffMode, setDiffMode] = useState(false)
  const [copied, setCopied] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  // Local editable resume state
  const [resume, setResume] = useState(session?.resume ?? null)

  useEffect(() => {
    fetch(`/api/session/${sessionId}`)
      .then((r) => r.json())
      .then((json) => {
        if (!json.ok) { setError(json.error); return }
        if (json.locked) { setLocked(true); setSession(json.data); return }
        setSession(json.data)
        setResume(json.data.resume ?? null)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [sessionId])

  function updateBullet(roleIdx: number, bulletIdx: number, value: string) {
    if (!resume) return
    setResume((r) => {
      if (!r) return r
      return {
        ...r,
        roles: r.roles.map((role, ri) =>
          ri !== roleIdx
            ? role
            : {
                ...role,
                bullets: role.bullets.map((b, bi) =>
                  bi !== bulletIdx ? b : { ...b, repositioned: value },
                ),
              },
        ),
      }
    })
  }

  function handleCopyText() {
    if (!resume || !session) return
    const lines = [
      resume.summary,
      '',
      ...resume.roles.flatMap((r) => [
        `${r.title} | ${r.meta}`,
        ...r.bullets.map((b) => `• ${b.repositioned}`),
        '',
      ]),
      'Skills: ' + resume.newSkills.join(', '),
    ]
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handlePrint() {
    window.print()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-offwhite-surface flex items-center justify-center">
        <div className="flex items-center gap-3 text-pp-ink-meta">
          <div className="w-4 h-4 rounded-full border-2 border-navy/30 border-t-navy animate-spin" />
          Loading your résumé…
        </div>
      </div>
    )
  }

  if (locked && session) {
    const { target, profile } = session
    return (
      <div className="min-h-screen bg-offwhite-surface">
        <Nav
          variant="app"
          pivotLabel={{ from: profile.headline ?? profile.roles[0]?.title ?? 'Your background', to: target.title }}
        />
        <UpgradeGate
          theme="light"
          eyebrow="Pivot feature"
          title="Your repositioned résumé is ready"
          body="We've rewritten your résumé for this target role. Upgrade to Pivot to unlock the full AI-rewritten résumé, gap scorecard and strategy brief."
          bullets={[
            'Full résumé rewrite, reframed for your target role',
            'Editable bullets with the reasoning behind each reframe',
            'Download as a polished PDF',
          ]}
          href={`/checkout?plan=pivot&cycle=monthly`}
        />
      </div>
    )
  }

  if (error || !session || !resume) {
    return (
      <div className="min-h-screen bg-offwhite-surface flex flex-col items-center justify-center gap-4 text-center px-6">
        <p className="text-[18px] font-semibold text-pp-ink">Session not found</p>
        <p className="text-[14px] text-pp-ink-para">{error ?? 'This session may have expired or the ID is invalid.'}</p>
        <Link href="/onboarding" className="bg-navy text-offwhite px-5 py-3 rounded-pp font-medium">
          Start a new analysis
        </Link>
      </div>
    )
  }

  const { target, profile } = session

  return (
    <>
      {/* Print styles — hidden on screen, full page when printing */}
      <style>{`
        @media print {
          .pp-noprint { display: none !important; }
          .pp-resume-doc { box-shadow: none !important; margin: 0 !important; max-width: 100% !important; }
          body { background: white !important; }
        }
      `}</style>

      <div className="min-h-screen bg-offwhite-surface">
        <div className="pp-noprint">
          <Nav
            variant="app"
            pivotLabel={{ from: profile.headline ?? profile.roles[0]?.title ?? 'Your background', to: target.title }}
          />
        </div>

        <div className="max-w-pp-wide mx-auto px-6 py-10">

          {/* ── Toolbar ── */}
          <div className="pp-noprint flex items-center justify-between mb-8 flex-wrap gap-4">
            <div>
              <h1 className="text-[26px] font-display font-medium text-pp-ink">Repositioned Résumé</h1>
              <p className="text-[13.5px] text-pp-ink-meta mt-0.5">
                Rewritten for <strong className="text-pp-ink">{target.title}</strong> · click any bullet to edit
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Diff toggle */}
              <button
                onClick={() => setDiffMode(!diffMode)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-pp text-[13px] font-medium transition-all border',
                  diffMode
                    ? 'bg-navy text-offwhite border-navy'
                    : 'bg-white text-pp-ink border-pp-border-light hover:border-pp-border-stone',
                )}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 4h5M1 7h5M1 10h5M8 4h5M8 7h5M8 10h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
                {diffMode ? 'Exit diff' : 'Diff view'}
              </button>

              {/* Copy */}
              <button
                onClick={handleCopyText}
                className="flex items-center gap-2 px-4 py-2 rounded-pp text-[13px] font-medium bg-white border border-pp-border-light hover:border-pp-border-stone transition-all text-pp-ink"
              >
                {copied ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l4 4 6-7" stroke="#2E6B6B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="4" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3" /><path d="M4 4V2.5A1.5 1.5 0 015.5 1h6A1.5 1.5 0 0113 2.5v6A1.5 1.5 0 0111.5 10H10" stroke="currentColor" strokeWidth="1.3" /></svg>
                )}
                {copied ? 'Copied!' : 'Copy text'}
              </button>

              {/* Print/PDF */}
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 rounded-pp text-[13px] font-semibold bg-navy text-offwhite hover:bg-navy/90 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M4 1h6v4H4zM2 5h10a1 1 0 011 1v4a1 1 0 01-1 1H2a1 1 0 01-1-1V6a1 1 0 011-1z" stroke="white" strokeWidth="1.3" /><path d="M4 10v3h6v-3" stroke="white" strokeWidth="1.3" /></svg>
                Download PDF
              </button>
            </div>
          </div>

          {/* ── Split pane ── */}
          <div
            className={cn('gap-6', diffMode ? 'block' : 'grid')}
            style={diffMode ? undefined : { gridTemplateColumns: '1fr 1fr' }}
          >
            {/* Original — left pane (hidden in diff mode) */}
            {!diffMode && (
              <div
                className="rounded-pp-l overflow-hidden"
                style={{ border: '1px solid rgba(15,25,35,0.12)', background: '#fff' }}
              >
                <div
                  className="px-6 py-4 border-b flex items-center gap-3"
                  style={{ borderColor: 'rgba(15,25,35,0.08)', background: 'rgba(15,25,35,0.03)' }}
                >
                  <span className="font-mono text-[10.5px] tracking-[0.08em] uppercase text-pp-ink-meta">Original</span>
                  <span className="text-[11px] text-pp-ink-cap px-2 py-0.5 rounded-pp" style={{ background: 'rgba(15,25,35,0.06)' }}>Read-only</span>
                </div>
                <div className="px-6 py-6">
                  {profile.roles.map((role, ri) => (
                    <div key={ri} className="mb-6">
                      <div className="pb-2 mb-3" style={{ borderBottom: '1px solid rgba(15,25,35,0.08)' }}>
                        <p className="text-[14px] font-semibold text-pp-ink">{role.title}</p>
                        <p className="text-[12px] text-pp-ink-meta">{role.company} · {role.dateRange}</p>
                      </div>
                      <div className="space-y-2">
                        {role.bullets.map((b, bi) => (
                          <div key={bi} className="flex items-start gap-2">
                            <span className="text-pp-ink-cap text-[10px] mt-[5px] flex-shrink-0">▸</span>
                            <p className="text-[13px] text-pp-ink-para leading-[1.55]">{b.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Repositioned — right pane (or full width in diff mode) */}
            <div
              ref={printRef}
              className="pp-resume-doc rounded-pp-l overflow-hidden shadow-pp-doc"
              style={{ border: '1px solid rgba(15,25,35,0.12)', background: '#fff' }}
            >
              <div
                className="px-6 py-4 border-b flex items-center gap-3 pp-noprint"
                style={{ borderColor: 'rgba(15,25,35,0.08)', background: 'rgba(232,168,56,0.06)' }}
              >
                <span className="font-mono text-[10.5px] tracking-[0.08em] uppercase text-amber">Repositioned</span>
                <span className="text-[11px] text-amber/70 px-2 py-0.5 rounded-pp" style={{ background: 'rgba(232,168,56,0.1)' }}>
                  Editable — click any bullet
                </span>
              </div>

              <div className="px-8 py-8">
                {/* Name + target */}
                <div className="mb-6 pb-5" style={{ borderBottom: '2px solid rgba(15,25,35,0.12)' }}>
                  <p className="text-[22px] font-semibold text-pp-ink">{profile.name ?? 'Your Name'}</p>
                  <p className="text-[14px] text-pp-ink-para mt-1">{target.title} · {target.industry}</p>
                </div>

                {/* Summary */}
                <div className="mb-7">
                  <p className="font-mono text-[10px] tracking-[0.1em] uppercase text-pp-ink-meta mb-2">Summary</p>
                  <p
                    contentEditable
                    suppressContentEditableWarning
                    className="text-[13.5px] text-pp-ink-para leading-[1.65] outline-none focus:text-pp-ink cursor-text"
                    dangerouslySetInnerHTML={{ __html: resume.summary }}
                    onBlur={(e) =>
                      setResume((r) => r ? { ...r, summary: e.currentTarget.textContent ?? '' } : r)
                    }
                  />
                </div>

                {/* Experience */}
                <div className="mb-7">
                  <p className="font-mono text-[10px] tracking-[0.1em] uppercase text-pp-ink-meta mb-4">Experience</p>
                  {resume.roles.map((role, ri) => (
                    <ResumeRoleSection
                      key={ri}
                      role={role}
                      diffMode={diffMode}
                      onBulletChange={(bi, v) => updateBullet(ri, bi, v)}
                    />
                  ))}
                </div>

                {/* Skills */}
                <div className="mb-7">
                  <p className="font-mono text-[10px] tracking-[0.1em] uppercase text-pp-ink-meta mb-3">Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {resume.newSkills.map((skill, i) => (
                      <span
                        key={i}
                        className="px-3 py-1.5 rounded-pp-pill text-[12.5px] text-pp-ink font-medium"
                        style={{ background: 'rgba(232,168,56,0.12)', border: '1px solid rgba(232,168,56,0.3)' }}
                      >
                        {skill}
                      </span>
                    ))}
                    {resume.oldSkills.map((skill, i) => (
                      <span
                        key={i}
                        className="px-3 py-1.5 rounded-pp-pill text-[12.5px] text-pp-ink-meta"
                        style={{ background: 'rgba(15,25,35,0.05)', border: '1px solid rgba(15,25,35,0.1)' }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* What's still missing */}
                {resume.missingItems.length > 0 && (
                  <div className="pp-noprint">
                    <p className="font-mono text-[10px] tracking-[0.1em] uppercase text-pp-ink-meta mb-3">What this résumé can't fix yet</p>
                    <div className="space-y-2">
                      {resume.missingItems.map((item, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 rounded-pp-m p-3"
                          style={{ background: `${item.color}0d`, border: `1px solid ${item.color}30` }}
                        >
                          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ background: item.color }} />
                          <div className="flex-1">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-[13px] font-medium text-pp-ink">{item.name}</p>
                              <span
                                className="text-[11px] font-mono px-2 py-0.5 rounded-pp flex-shrink-0"
                                style={{ background: `${item.color}20`, color: item.color }}
                              >
                                {item.timeToClose}
                              </span>
                            </div>
                            <p className="text-[12px] text-pp-ink-para mt-0.5">{item.note}</p>
                            <p className="text-[11.5px] text-pp-ink-meta mt-1">
                              Action: <span className="text-pp-ink-para">{item.action}</span>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Navigation ── */}
          <div className="pp-noprint flex items-center justify-between mt-10 pt-8" style={{ borderTop: '1px solid rgba(15,25,35,0.1)' }}>
            <Link
              href={`/results/${sessionId}/map`}
              className="flex items-center gap-2 text-[13.5px] text-pp-ink-para hover:text-pp-ink transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M10 2L4 7l6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Translation Map
            </Link>
            <Link
              href={`/results/${sessionId}/strategy`}
              className="flex items-center gap-2 bg-navy text-offwhite px-5 py-3 rounded-pp font-semibold text-[14px] hover:bg-navy/90 transition-colors"
            >
              View strategy brief
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M4 2l6 5-6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
          <div className="h-4" />
        </div>
      </div>
    </>
  )
}
