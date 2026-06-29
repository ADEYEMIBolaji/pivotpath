'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Nav, TranslationArrow } from '@/components/brand'
import { UpgradeGate } from '@/components/upgrade-gate'
import { cn } from '@/lib/utils'
import type { ScoredJob, JobGroup, SourceName } from '@/lib/jobs/types'

// ─── Source metadata ──────────────────────────────────────────────────────────

const SOURCE_META: Record<SourceName, { label: string; color: string; dot: string }> = {
  reed:          { label: 'Reed',          color: '#CC0000', dot: '#CC0000' },
  adzuna:        { label: 'Indeed/Adzuna', color: '#2557A7', dot: '#2557A7' },
  linkedin:      { label: 'LinkedIn',      color: '#0A66C2', dot: '#0A66C2' },
  otta:          { label: 'Otta',          color: '#1A1A2E', dot: '#6C63FF' },
  nhs:           { label: 'NHS Jobs',      color: '#005EB8', dot: '#005EB8' },
  'civil-service': { label: 'Civil Service', color: '#1D70B8', dot: '#00703C' },
}

function SourceDot({ source, size = 8 }: { source: SourceName; size?: number }) {
  const meta = SOURCE_META[source]
  return (
    <span
      title={meta.label}
      className="rounded-full flex-shrink-0 inline-block"
      style={{ width: size, height: size, background: meta.dot }}
    />
  )
}

// ─── Fit badge ────────────────────────────────────────────────────────────────

function FitBadge({ score, bucket }: { score: number; bucket: ScoredJob['fitBucket'] }) {
  const colors = {
    high:    { ring: '#2E6B6B', bg: 'rgba(46,107,107,0.12)', text: '#1E5A4E' },
    partial: { ring: '#E8A838', bg: 'rgba(232,168,56,0.14)', text: '#9A6A14' },
    neutral: { ring: 'rgba(15,25,35,0.2)', bg: 'rgba(15,25,35,0.05)', text: '#6A747E' },
  }
  const c = colors[bucket]
  return (
    <div
      className="flex flex-col items-center justify-center w-14 h-14 rounded-full flex-shrink-0"
      style={{ border: `2px solid ${c.ring}`, background: c.bg }}
    >
      <span className="font-display text-[18px] font-semibold leading-none" style={{ color: c.text }}>
        {score}
      </span>
      <span className="font-mono text-[9px] tracking-[0.06em] mt-0.5" style={{ color: c.text }}>
        % fit
      </span>
    </div>
  )
}

// ─── Salary display ───────────────────────────────────────────────────────────

function fmtSalary(min: number | null, max: number | null): string {
  if (!min && !max) return ''
  const fmt = (n: number) =>
    n >= 1000 ? `£${Math.round(n / 1000)}k` : `£${n.toLocaleString()}`
  if (min && max && min !== max) return `${fmt(min)} – ${fmt(max)}`
  return fmt(min ?? max ?? 0)
}

// ─── Job card ─────────────────────────────────────────────────────────────────

function JobCard({
  job,
  sessionId,
  onSaveToggle,
}: {
  job: ScoredJob & { saved?: boolean }
  sessionId: string
  onSaveToggle: (id: string, saved: boolean) => void
}) {
  const [saving, setSaving] = useState(false)
  const [applying, setApplying] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      const method = job.saved ? 'DELETE' : 'POST'
      await fetch(`/api/jobs/${job.id}/save`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })
      onSaveToggle(job.id, !job.saved)
    } finally {
      setSaving(false)
    }
  }

  async function handleApply() {
    setApplying(true)
    try {
      const res = await fetch(`/api/jobs/${job.id}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })
      const data = (await res.json()) as { sourceUrl: string }
      if (data.sourceUrl) window.open(data.sourceUrl, '_blank', 'noopener,noreferrer')
    } finally {
      setApplying(false)
    }
  }

  const salary = fmtSalary(job.salaryMin, job.salaryMax)

  return (
    <div
      className="rounded-pp-l overflow-hidden transition-shadow hover:shadow-pp-card"
      style={{
        border: '1px solid rgba(242,237,228,0.1)',
        background: 'rgba(242,237,228,0.04)',
      }}
    >
      {/* Top bar — fit score + title + employer */}
      <div className="flex items-start gap-4 px-5 pt-5 pb-4">
        <FitBadge score={job.fitScore} bucket={job.fitBucket} />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[15px] font-semibold text-offwhite leading-[1.25]">{job.title}</p>
              <p className="text-[13px] text-pp-text-body mt-0.5">{job.employer}</p>
            </div>
            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={saving}
              aria-label={job.saved ? 'Unsave job' : 'Save job'}
              className={cn(
                'flex-shrink-0 w-8 h-8 rounded-pp flex items-center justify-center transition-colors',
                job.saved
                  ? 'bg-amber/20 text-amber'
                  : 'text-pp-text-ghost hover:text-pp-text-muted hover:bg-white/5',
              )}
            >
              <svg width="15" height="15" viewBox="0 0 15 15" fill={job.saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.4">
                <path d="M2 2h11v12l-5.5-3L2 14V2z" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          {/* Meta row */}
          <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-2">
            {/* Location + remote */}
            <span className="flex items-center gap-1 text-[12px] text-pp-text-faint">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <circle cx="5.5" cy="4.5" r="2" stroke="currentColor" strokeWidth="1.2" />
                <path d="M5.5 10C5.5 10 1.5 7 1.5 4.5a4 4 0 018 0C9.5 7 5.5 10 5.5 10z" stroke="currentColor" strokeWidth="1.2" fill="none" />
              </svg>
              {job.location}
              {job.remote && <span className="ml-1 text-teal-light font-medium">· Remote</span>}
            </span>

            {salary && (
              <span className="text-[12px] text-pp-text-faint">{salary}</span>
            )}

            {/* Source dots */}
            <div className="flex items-center gap-1.5">
              <SourceDot source={job.primarySource} size={7} />
              {job.alsoListedOn.map((s) => <SourceDot key={s} source={s} size={7} />)}
            </div>

            {job.alsoListedOn.length > 0 && (
              <span className="text-[11px] text-pp-text-ghost">
                Also on {job.alsoListedOn.map((s) => SOURCE_META[s].label).join(', ')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Matched skills */}
      {job.matchedSkills.length > 0 && (
        <div
          className="px-5 py-3 flex flex-wrap gap-1.5"
          style={{ borderTop: '1px solid rgba(242,237,228,0.07)' }}
        >
          {job.matchedSkills.slice(0, 6).map((skill) => (
            <span
              key={skill}
              className="px-2.5 py-1 rounded-pp-pill text-[11.5px] font-medium"
              style={{ background: 'rgba(46,107,107,0.18)', color: '#5FB0A6', border: '1px solid rgba(46,107,107,0.3)' }}
            >
              ✓ {skill}
            </span>
          ))}
          {job.matchedSkills.length > 6 && (
            <span className="text-[11.5px] text-pp-text-ghost self-center">
              +{job.matchedSkills.length - 6} more
            </span>
          )}
        </div>
      )}

      {/* Gap flags */}
      {job.gapFlags.length > 0 && (
        <div
          className="px-5 py-3 flex flex-wrap gap-1.5"
          style={{ borderTop: '1px solid rgba(242,237,228,0.07)' }}
        >
          {job.gapFlags.slice(0, 3).map((flag) => {
            const color = flag.severity === 'disqualifying' ? '#C7553B' : flag.severity === 'closable' ? '#E8A838' : '#9AA7B0'
            return (
              <span
                key={flag.gapName}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-pp-pill text-[11.5px]"
                style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}
              >
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <path d="M4 1v4M4 6.5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                Wants {flag.gapName}
                {flag.severity !== 'disqualifying' && (
                  <span className="opacity-70"> — in your {flag.severity} list</span>
                )}
              </span>
            )
          })}
        </div>
      )}

      {/* Apply row */}
      <div
        className="px-5 py-3 flex items-center justify-between gap-3"
        style={{ borderTop: '1px solid rgba(242,237,228,0.07)' }}
      >
        <div className="flex items-center gap-2 text-[11.5px] text-pp-text-ghost">
          <span>via</span>
          <SourceDot source={job.primarySource} size={7} />
          <span>{SOURCE_META[job.primarySource].label}</span>
          <span>·</span>
          <span>{new Date(job.postedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
        </div>
        <button
          onClick={handleApply}
          disabled={applying}
          className="flex items-center gap-2 px-4 py-2 rounded-pp text-[13px] font-semibold bg-amber text-navy hover:bg-amber/90 transition-colors"
        >
          {applying ? 'Opening…' : `Apply via ${SOURCE_META[job.primarySource].label}`}
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path d="M1 5.5h8M5.5 1l4.5 4.5-4.5 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}

// ─── Filter bar ───────────────────────────────────────────────────────────────

const ALL_SOURCES: SourceName[] = ['reed', 'adzuna', 'nhs', 'civil-service']

function FilterBar({
  source,
  remoteOnly,
  sort,
  onSource,
  onRemote,
  onSort,
}: {
  source: SourceName | null
  remoteOnly: boolean
  sort: 'fit' | 'date'
  onSource: (s: SourceName | null) => void
  onRemote: (v: boolean) => void
  onSort: (s: 'fit' | 'date') => void
}) {
  return (
    <div className="flex items-center flex-wrap gap-3 mb-8">
      {/* Source filter */}
      <div
        className="flex items-center gap-1.5 p-1 rounded-pp-m"
        style={{ background: 'rgba(242,237,228,0.07)', border: '1px solid rgba(242,237,228,0.1)' }}
      >
        <button
          onClick={() => onSource(null)}
          className={cn(
            'px-3 py-1.5 rounded-pp text-[12.5px] font-medium transition-colors',
            !source ? 'bg-offwhite/10 text-offwhite' : 'text-pp-text-faint hover:text-pp-text-muted',
          )}
        >
          All sources
        </button>
        {ALL_SOURCES.map((s) => (
          <button
            key={s}
            onClick={() => onSource(source === s ? null : s)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-pp text-[12.5px] transition-colors',
              source === s ? 'bg-offwhite/10 text-offwhite font-medium' : 'text-pp-text-faint hover:text-pp-text-muted',
            )}
          >
            <SourceDot source={s} size={7} />
            {SOURCE_META[s].label}
          </button>
        ))}
      </div>

      {/* Remote toggle */}
      <button
        onClick={() => onRemote(!remoteOnly)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-pp text-[12.5px] font-medium border transition-all',
          remoteOnly
            ? 'bg-teal/20 text-teal-light border-teal/40'
            : 'text-pp-text-faint border-pp-border-dark hover:text-pp-text-muted',
        )}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2" />
          <path d="M1 6h10M6 1c-1.5 2-1.5 6 0 10M6 1c1.5 2 1.5 6 0 10" stroke="currentColor" strokeWidth="1.2" />
        </svg>
        Remote only
      </button>

      {/* Sort */}
      <div className="flex items-center gap-1 ml-auto">
        <span className="text-[12px] text-pp-text-ghost mr-1">Sort:</span>
        {(['fit', 'date'] as const).map((s) => (
          <button
            key={s}
            onClick={() => onSort(s)}
            className={cn(
              'px-3 py-1.5 rounded-pp text-[12.5px] transition-colors',
              sort === s ? 'bg-offwhite/10 text-offwhite font-medium' : 'text-pp-text-faint hover:text-pp-text-muted',
            )}
          >
            {s === 'fit' ? 'Best fit' : 'Most recent'}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

interface ApiResponse {
  jobs: (ScoredJob & { saved?: boolean })[]
  groups: JobGroup[]
  locked?: boolean
  meta: {
    total: number
    lastRefreshedAt: string
    duplicatesMerged: number
    staleRemoved: number
    savedCount?: number
    bySource?: Record<string, number>
  }
}

export default function JobsPage() {
  const params = useParams()
  const sessionId = params.sessionId as string

  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [source, setSource]       = useState<SourceName | null>(null)
  const [remoteOnly, setRemoteOnly] = useState(false)
  const [sort, setSort]           = useState<'fit' | 'date'>('fit')

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ sessionId, sort })
    if (source) params.set('source', source)
    if (remoteOnly) params.set('remoteOnly', 'true')

    try {
      const res = await fetch(`/api/jobs?${params}`)
      const json = await res.json() as ApiResponse
      setData(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [sessionId, source, remoteOnly, sort])

  useEffect(() => { fetchJobs() }, [fetchJobs])

  function handleSaveToggle(jobId: string, saved: boolean) {
    setData((d) =>
      d
        ? { ...d, jobs: d.jobs.map((j) => (j.id === jobId ? { ...j, saved } : j)) }
        : d,
    )
  }

  const displayJobs = data?.jobs ?? []

  if (data?.locked) {
    return (
      <div className="min-h-screen bg-navy">
        <Nav variant="app" />
        <UpgradeGate
          eyebrow="Pivot feature"
          title="Roles that want your story"
          body="We match live UK listings to your translated profile and rank them by fit. Upgrade to Pivot to unlock your matched roles, fit scores and one-click apply."
          bullets={[
            'Hand-picked roles ranked by fit to your pivot',
            'Matched skills and gap flags on every listing',
            'Save roles and apply straight from the source',
          ]}
          href={`/checkout?plan=pivot&cycle=monthly`}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-navy">
      <Nav variant="app" />

      <div className="max-w-pp-content mx-auto px-6 py-12">

        {/* ── Header ── */}
        <div className="mb-8">
          <p className="font-mono text-[11px] tracking-[0.1em] uppercase text-amber mb-2">Step 5 of 5 · Matched Jobs</p>
          <div className="flex items-end justify-between gap-6 flex-wrap">
            <div>
              <h1 className="font-display text-[32px] font-medium text-offwhite leading-[1.1] mb-1">
                Roles that want your story
              </h1>
              <p className="text-[14px] text-pp-text-body">
                Hand-picked roles that fit your translated profile — the ones worth applying to first.
              </p>
            </div>

            {data?.meta && (
              <div className="flex items-center gap-5 text-right">
                <div>
                  <p className="font-display text-[28px] font-medium text-offwhite">{data.meta.total}</p>
                  <p className="text-[12px] text-pp-text-faint">recommended</p>
                </div>
                <div
                  className="w-px h-10 self-center"
                  style={{ background: 'rgba(242,237,228,0.15)' }}
                />
                <div>
                  <p className="font-mono text-[12px] text-pp-text-faint">
                    Refreshed {new Date(data.meta.lastRefreshedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {data.meta.duplicatesMerged > 0 && (
                    <p className="font-mono text-[11px] text-pp-text-ghost">
                      {data.meta.duplicatesMerged} duplicates merged
                    </p>
                  )}
                </div>
                <button
                  onClick={fetchJobs}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-pp text-[12.5px] text-pp-text-faint hover:text-pp-text-muted border border-pp-border-dark hover:border-pp-border-darker transition-all"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={loading ? 'animate-spin' : ''}>
                    <path d="M10 6a4 4 0 01-6.93 2.73M10 6l1-1.5M10 6l1.5 1M2 6a4 4 0 016.93-2.73M2 6l-1 1.5M2 6L.5 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                  Refresh
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Filters ── */}
        <FilterBar
          source={source}
          remoteOnly={remoteOnly}
          sort={sort}
          onSource={setSource}
          onRemote={setRemoteOnly}
          onSort={setSort}
        />

        {/* ── Content ── */}
        {loading && (
          <div className="flex items-center justify-center py-20 gap-3 text-pp-text-muted">
            <div className="w-5 h-5 rounded-full border-2 border-pp-text-ghost border-t-amber animate-spin" />
            Fetching live listings…
          </div>
        )}

        {error && (
          <div
            className="rounded-pp-l p-6 text-center"
            style={{ background: 'rgba(199,85,59,0.08)', border: '1px solid rgba(199,85,59,0.3)' }}
          >
            <p className="text-[14px] text-pp-red">{error}</p>
            <button onClick={fetchJobs} className="mt-3 text-[13px] text-amber underline">Retry</button>
          </div>
        )}

        {!loading && !error && displayJobs.length === 0 && (
          <div className="text-center py-20">
            <p className="text-[18px] font-medium text-offwhite mb-2">No listings found</p>
            <p className="text-[14px] text-pp-text-body">Try removing filters or refreshing.</p>
          </div>
        )}

        {!loading && !error && data && (
          <>
            {/* Grouped view (by bridge role) */}
            {(data.groups ?? []).length > 1 ? (
              <div className="space-y-10">
                {data.groups.map((group) => (
                  <section key={group.bridgeRole}>
                    <div className="flex items-center gap-3 mb-5">
                      <TranslationArrow width={32} height={10} />
                      <h2 className="text-[16px] font-semibold text-offwhite">{group.bridgeRole}</h2>
                      <span className="text-[12px] text-pp-text-ghost">{group.jobs.length} roles</span>
                    </div>
                    <div className="space-y-3">
                      {group.jobs.map((job) => (
                        <JobCard key={job.id} job={job} sessionId={sessionId} onSaveToggle={handleSaveToggle} />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              /* Flat view — no bridge roles or only one group */
              <div className="space-y-3">
                {displayJobs.map((job) => (
                  <JobCard key={job.id} job={job} sessionId={sessionId} onSaveToggle={handleSaveToggle} />
                ))}
              </div>
            )}

            {/* Back link */}
            <div className="mt-12 pt-8 flex items-center gap-4" style={{ borderTop: '1px solid rgba(242,237,228,0.1)' }}>
              <Link
                href={`/results/${sessionId}/map`}
                className="text-[13.5px] text-pp-text-faint hover:text-pp-text-muted transition-colors"
              >
                ← Translation Map
              </Link>
              <Link
                href={`/results/${sessionId}/resume`}
                className="text-[13.5px] text-pp-text-faint hover:text-pp-text-muted transition-colors"
              >
                Résumé Editor
              </Link>
              <Link
                href={`/results/${sessionId}/strategy`}
                className="text-[13.5px] text-pp-text-faint hover:text-pp-text-muted transition-colors"
              >
                Strategy Brief
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
