'use client'

/**
 * Discovery Mode flow — TEST BUILD.
 *
 * intake → skills map → adjacent roles → swipe → shortlist, all in one client
 * component so the whole thing is demoable end-to-end without navigation.
 *
 * The run id lives in localStorage so a refresh mid-flow resumes rather than
 * starting over (and re-paying for the AI stages).
 */

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/brand'
import { cn } from '@/lib/utils'
import { INTAKE_PROMPTS } from '@/lib/discovery/chip-seed'
import {
  type DiscoveryRole,
  type FunctionalSkill,
  type IntakeSelections,
  type Reaction,
  type RoleComparisonEnrichment,
  type ShortlistEntry,
} from '@/lib/discovery/types'

const RUN_KEY = 'pp.discovery.runId'
const COMMITMENT_KEY = 'pp.target.commitmentId'

type Stage = 'intake' | 'skills' | 'swipe' | 'shortlist'

/** Capitalize only the first letter — Claude returns lowercase function names. */
function sentenceCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** Evidence quotes sometimes arrive already wrapped in quote marks; strip them
 * before we wrap in our own curly quotes, or the two stack. */
function stripQuotes(s: string): string {
  return s.trim().replace(/^["“]+/, '').replace(/["”]+$/, '')
}

// ─── Shell ────────────────────────────────────────────────────────────────────

function Shell({ stage, children }: { stage: Stage; children: React.ReactNode }) {
  const steps: Stage[] = ['intake', 'skills', 'swipe', 'shortlist']
  const current = steps.indexOf(stage)

  return (
    <div className="min-h-screen bg-navy flex flex-col">
      <header className="border-b border-pp-border-darker">
        <div className="max-w-pp-content mx-auto px-7 py-4 flex items-center justify-between gap-4">
          <Link href="/" aria-label="PivotPath home">
            <Logo size="sm" />
          </Link>
          <div className="flex items-center gap-[5px]">
            {steps.map((s, i) => (
              <div
                key={s}
                className="h-[3px] rounded-full transition-all duration-300"
                style={{
                  width: i <= current ? '32px' : '20px',
                  background: i <= current ? '#E8A838' : 'rgba(242,237,228,0.18)',
                }}
              />
            ))}
          </div>
          <span className="font-mono text-[11.5px] tracking-[0.06em] text-pp-text-faint">
            TEST BUILD
          </span>
        </div>
      </header>
      <main className="flex-1 max-w-pp-narrow w-full mx-auto px-7 py-12">{children}</main>
    </div>
  )
}

function Overline({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[11.5px] tracking-[0.14em] uppercase text-amber mb-3">{children}</p>
  )
}

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="font-display text-[32px] leading-[1.15] text-pp-text-bright mb-3">{children}</h1>
  )
}

function Sub({ children }: { children: React.ReactNode }) {
  return <p className="text-[15px] leading-[1.6] text-pp-text-body mb-8">{children}</p>
}

function Button({
  children,
  onClick,
  disabled,
  variant = 'primary',
  className,
}: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: 'primary' | 'ghost'
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'px-6 py-3 rounded-pp font-semibold text-[14px] transition-all disabled:opacity-40 disabled:cursor-not-allowed',
        variant === 'primary'
          ? 'bg-amber text-navy hover:shadow-pp-amber'
          : 'border border-pp-border-dark text-pp-text-dim hover:text-pp-text-bright',
        className,
      )}
    >
      {children}
    </button>
  )
}

function ErrorNote({ message }: { message: string }) {
  return (
    <p className="mt-4 text-[13.5px] text-pp-red border border-pp-red-alert-bd bg-pp-red-alert-bg rounded-pp-m px-4 py-3">
      {message}
    </p>
  )
}

function Loading({ label }: { label: string }) {
  return (
    <div className="py-20 text-center">
      <p className="font-mono text-[12px] tracking-[0.1em] uppercase text-amber animate-pp-pulse">
        {label}
      </p>
    </div>
  )
}

// ─── Step 1: evidence intake ──────────────────────────────────────────────────

const MIN_CHIPS = 3

function ChipButton({
  label,
  selected,
  onClick,
}: {
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'rounded-pp-pill border px-3.5 py-2 text-[13.5px] font-medium text-left transition-colors',
        selected
          ? 'bg-pp-skill-hi-bg border-pp-skill-hi-bd text-amber'
          : 'bg-navy-surface border-pp-border-dark text-pp-text-body hover:border-pp-border-input hover:text-pp-text-bright',
      )}
    >
      {label}
    </button>
  )
}

function IntakeForm({
  onSubmit,
  busy,
  error,
}: {
  onSubmit: (selections: IntakeSelections, otherNotes: string) => void
  busy: boolean
  error: string | null
}) {
  const [selections, setSelections] = useState<IntakeSelections>({})
  const [otherNotes, setOtherNotes] = useState('')

  const totalChips = Object.values(selections).reduce((sum, picks) => sum + picks.length, 0)

  const toggleChip = (promptId: string, chipId: string) => {
    setSelections((prev) => {
      const picks = prev[promptId] ?? []
      const isSelected = picks.some((p) => p.chipId === chipId)
      const next = isSelected
        ? picks.filter((p) => p.chipId !== chipId)
        : [...picks, { chipId, note: undefined }]
      return { ...prev, [promptId]: next }
    })
  }

  const setChipNote = (promptId: string, chipId: string, note: string) => {
    setSelections((prev) => ({
      ...prev,
      [promptId]: (prev[promptId] ?? []).map((p) => (p.chipId === chipId ? { ...p, note } : p)),
    }))
  }

  return (
    <div className="animate-pp-fade">
      <Overline>Step 1 · Evidence</Overline>
      <Heading>Let&rsquo;s start with what you already do well.</Heading>
      <Sub>
        No &ldquo;what do you want to do?&rdquo; — that question is the reason you&rsquo;re stuck.
        Tap whatever sounds like you. Add a specific example under any chip if you want to —
        never required.
      </Sub>

      <div className="space-y-9">
        {INTAKE_PROMPTS.map((bank) => {
          const picked = selections[bank.id] ?? []
          return (
            <div key={bank.id}>
              <h2 className="text-[15px] font-semibold text-pp-text-bright mb-3">{bank.prompt}</h2>
              <div className="flex flex-wrap gap-2">
                {bank.chips.map((chip) => (
                  <ChipButton
                    key={chip.id}
                    label={chip.label}
                    selected={picked.some((p) => p.chipId === chip.id)}
                    onClick={() => toggleChip(bank.id, chip.id)}
                  />
                ))}
              </div>

              {picked.length > 0 && (
                <div className="mt-4 space-y-2.5 border-l-2 border-pp-border-darker pl-4">
                  {picked.map((p) => {
                    const chip = bank.chips.find((c) => c.id === p.chipId)
                    if (!chip) return null
                    return (
                      <div key={p.chipId}>
                        <label className="block text-[12px] text-pp-text-faint mb-1">
                          {chip.label} — add a specific example (optional)
                        </label>
                        <input
                          type="text"
                          maxLength={300}
                          value={p.note ?? ''}
                          onChange={(e) => setChipNote(bank.id, p.chipId, e.target.value)}
                          className="w-full rounded-pp-m bg-navy-surface border border-pp-border-dark px-3 py-2 text-[13.5px] text-pp-text-bright placeholder:text-pp-text-ghost focus:outline-none focus:border-amber focus:shadow-pp-focus"
                          placeholder="e.g. a specific instance — who, what, when"
                        />
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-9">
        <label htmlFor="other-notes" className="block text-[15px] font-semibold text-pp-text-bright mb-1">
          Anything else?
        </label>
        <p className="text-[13px] text-pp-text-faint mb-2">
          Optional — anything that didn&rsquo;t fit above.
        </p>
        <textarea
          id="other-notes"
          rows={3}
          maxLength={2000}
          value={otherNotes}
          onChange={(e) => setOtherNotes(e.target.value)}
          className="w-full rounded-pp-m bg-navy-surface border border-pp-border-dark px-4 py-3 text-[14.5px] leading-[1.6] text-pp-text-bright placeholder:text-pp-text-ghost focus:outline-none focus:border-amber focus:shadow-pp-focus resize-y"
          placeholder="Optional."
        />
      </div>

      {error && <ErrorNote message={error} />}

      <div className="mt-9 flex items-center gap-4">
        <Button onClick={() => onSubmit(selections, otherNotes)} disabled={busy || totalChips < MIN_CHIPS}>
          {busy ? 'Reading your answers…' : 'Build my skills map'}
        </Button>
        <span className="font-mono text-[11.5px] text-pp-text-faint">
          {totalChips} selected · {MIN_CHIPS} minimum
        </span>
      </div>
    </div>
  )
}

// ─── Step 2: functional skills map ────────────────────────────────────────────

function SkillsMapCards({
  functions,
  onNext,
  busy,
  error,
}: {
  functions: FunctionalSkill[]
  onNext: () => void
  busy: boolean
  error: string | null
}) {
  return (
    <div className="animate-pp-fade">
      <Overline>Step 2 · Functional skills map</Overline>
      <Heading>Here&rsquo;s what you&rsquo;re actually good at.</Heading>
      <Sub>
        Not job titles — functions. These are the capabilities underneath your examples, and they&rsquo;re
        what transfers across industries.
      </Sub>

      <div className="grid gap-4 sm:grid-cols-2">
        {functions.map((f) => (
          <div
            key={f.name}
            className="rounded-pp-l bg-navy-surface border border-pp-border-dark p-5 shadow-pp-card"
          >
            <h3 className="font-display text-[19px] text-amber mb-2">{sentenceCase(f.name)}</h3>
            <p className="text-[14px] leading-[1.6] text-pp-text-body mb-3">{f.summary}</p>
            <ul className="space-y-1.5 border-t border-pp-border-darker pt-3">
              {f.evidence.map((e, i) => (
                <li key={i} className="text-[13px] leading-[1.55] text-pp-text-muted italic">
                  &ldquo;{stripQuotes(e)}&rdquo;
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {error && <ErrorNote message={error} />}

      <div className="mt-9">
        <Button onClick={onNext} disabled={busy}>
          {busy ? 'Finding adjacent roles…' : 'Show me roles this fits'}
        </Button>
      </div>
    </div>
  )
}

// ─── Steps 3 + 4: role deck and swipe ─────────────────────────────────────────

function RoleDeck({
  roles,
  index,
  onReact,
  busy,
}: {
  roles: DiscoveryRole[]
  index: number
  onReact: (role: DiscoveryRole, reaction: Reaction) => void
  busy: boolean
}) {
  const role = roles[index]
  if (!role) return null

  return (
    <div className="animate-pp-fade">
      <Overline>Step 3 · React, don&rsquo;t reflect</Overline>
      <Heading>Would you look twice at this?</Heading>
      <Sub>
        Don&rsquo;t overthink it. Your gut reaction across the whole deck is the signal — we&rsquo;ll
        rank the shortlist from the pattern.
      </Sub>

      <p className="font-mono text-[11.5px] tracking-[0.1em] text-pp-text-faint mb-3">
        {index + 1} / {roles.length}
      </p>

      <div
        key={role.id}
        className="rounded-pp-x bg-offwhite-surface p-7 shadow-pp-result animate-pp-rise"
      >
        <p className="font-mono text-[11.5px] tracking-[0.12em] uppercase text-pp-ink-meta mb-2">
          {role.industry}
        </p>
        <h2 className="font-display text-[27px] leading-[1.2] text-pp-ink mb-2">{role.title}</h2>
        <p className="text-[14.5px] leading-[1.55] text-pp-ink-meta italic mb-5">
          {role.plainLanguageLine}
        </p>
        <p className="text-[15px] leading-[1.65] text-pp-ink-body mb-5">{role.whyFits}</p>

        <div className="flex flex-wrap gap-2 mb-5">
          {role.functionsUsed.map((f) => (
            <span
              key={f}
              className="rounded-pp-pill bg-pp-skill-hi-bg border border-pp-skill-hi-bd px-3 py-1 text-[12.5px] font-medium text-pp-ink-soft"
            >
              {sentenceCase(f)}
            </span>
          ))}
        </div>

        <div className="rounded-pp-m bg-pp-amber-flag-bg border border-pp-amber-flag-bd px-4 py-3">
          <p className="font-mono text-[10.5px] tracking-[0.12em] uppercase text-pp-ink-meta mb-1">
            The honest gap
          </p>
          <p className="text-[13.5px] leading-[1.55] text-pp-ink-body">{role.gap}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <Button variant="ghost" onClick={() => onReact(role, 'pass')} disabled={busy}>
          Pass
        </Button>
        <Button variant="ghost" onClick={() => onReact(role, 'unsure')} disabled={busy}>
          Unsure
        </Button>
        <Button onClick={() => onReact(role, 'like')} disabled={busy}>
          Like
        </Button>
      </div>

      {/* STUB: these roles are AI-reasoned, not live postings. See lib/discovery/pipeline.ts. */}
      <p className="mt-6 font-mono text-[11px] text-pp-text-ghost">
        Test build — roles are AI-generated, not live job postings.
      </p>
    </div>
  )
}

/**
 * Step 4's second half: the bridge from "here's a shortlist" to "commit to
 * ONE". Enriches each shortlisted role with stubbed day-to-day / entry-barrier
 * / demand content (see the TODO in lib/discovery/pipeline.ts) so there's
 * something to actually compare before picking.
 */
function CompareAndChoose({
  entries,
  enrichment,
  onChoose,
  onRestart,
  committingId,
}: {
  entries: ShortlistEntry[]
  enrichment: Record<string, RoleComparisonEnrichment>
  onChoose: (role: DiscoveryRole) => void
  onRestart: () => void
  committingId: string | null
}) {
  return (
    <div className="animate-pp-fade">
      <Overline>Step 4 · Compare and choose</Overline>
      <Heading>
        {entries.length > 0 ? 'Which one do you want to chase?' : 'Nothing landed — that’s useful too.'}
      </Heading>
      <Sub>
        {entries.length > 0
          ? 'Liked roles first, then the ones you were unsure about. Pick one to commit to — you can change your mind later.'
          : 'You passed on everything. Re-run the intake with more specific examples and the roles will get sharper.'}
      </Sub>

      <div className="space-y-4">
        {entries.map((entry, i) => {
          const enrich = enrichment[entry.role.id]
          return (
            <div
              key={entry.role.id}
              className="rounded-pp-l bg-navy-surface border border-pp-border-dark p-5 flex gap-4"
            >
              <span className="font-display text-[22px] text-pp-text-ghost leading-none pt-1">
                {i + 1}
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <h3 className="font-display text-[19px] text-pp-text-bright">{entry.role.title}</h3>
                  <span
                    className={cn(
                      'rounded-pp-pill px-2.5 py-0.5 font-mono text-[10.5px] tracking-[0.1em] uppercase border',
                      entry.reaction === 'like'
                        ? 'text-teal-light border-pp-teal-ok-bd bg-pp-teal-ok-bg'
                        : 'text-pp-text-muted border-pp-border-dark',
                    )}
                  >
                    {entry.reaction}
                  </span>
                </div>
                <p className="text-[13.5px] leading-[1.5] text-pp-text-body italic mb-4">
                  {entry.role.plainLanguageLine}
                </p>

                {enrich ? (
                  <dl className="grid gap-4 sm:grid-cols-3 mb-5">
                    <div>
                      <dt className="font-mono text-[10.5px] tracking-[0.1em] uppercase text-pp-text-faint mb-1">
                        Day to day
                      </dt>
                      <dd className="text-[13px] leading-[1.5] text-pp-text-body">{enrich.dayToDay}</dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[10.5px] tracking-[0.1em] uppercase text-pp-text-faint mb-1">
                        Entry barrier
                      </dt>
                      <dd className="text-[13px] leading-[1.5] text-pp-text-body">{enrich.entryBarrier}</dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[10.5px] tracking-[0.1em] uppercase text-pp-text-faint mb-1">
                        Demand (est.)
                      </dt>
                      <dd className="text-[13px] leading-[1.5] text-pp-text-body">{enrich.demandNote}</dd>
                    </div>
                  </dl>
                ) : (
                  <p className="font-mono text-[11px] text-pp-text-ghost mb-5">Loading comparison…</p>
                )}

                <Button onClick={() => onChoose(entry.role)} disabled={committingId !== null}>
                  {committingId === entry.role.id ? 'Committing…' : 'Choose this one'}
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-9 flex flex-wrap gap-3">
        <Button variant="ghost" onClick={onRestart}>
          Start a new run
        </Button>
      </div>

      {/* STUB: day-to-day / entry-barrier / demand content is Claude reasoning
          from general knowledge, not live market data. See the TODO in
          lib/discovery/pipeline.ts. */}
      <p className="mt-6 font-mono text-[11px] text-pp-text-ghost">
        Test build — comparison details are AI-generated, not sourced from real market data.
      </p>

      {/* Follow-up, deliberately out of scope for this build: */}
      <p className="mt-8 text-[13px] leading-[1.6] text-pp-text-ghost border-t border-pp-border-darker pt-5">
        Not built yet: the info-interview kit (step 5 of the spec). Committing above hands off into the
        real onboarding flow with your role pre-filled — applications, interview prep, outreach, and
        tracking beyond that still aren&rsquo;t built in this test branch.
      </p>
    </div>
  )
}

// ─── Orchestrator ─────────────────────────────────────────────────────────────

async function postJSON<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `Request failed (${res.status})`)
  return data as T
}

export function DiscoveryFlow() {
  const router = useRouter()
  const [stage, setStage] = useState<Stage>('intake')
  const [runId, setRunId] = useState<string | null>(null)
  const [functions, setFunctions] = useState<FunctionalSkill[]>([])
  const [roles, setRoles] = useState<DiscoveryRole[]>([])
  const [index, setIndex] = useState(0)
  const [shortlist, setShortlist] = useState<ShortlistEntry[]>([])
  const [enrichment, setEnrichment] = useState<Record<string, RoleComparisonEnrichment>>({})
  const [committingId, setCommittingId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [loadingLabel, setLoadingLabel] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Shared by the resume-effect and the end-of-deck transition: fetch the
  // ranked shortlist, show it, then fetch its (stubbed) comparison content.
  // Comparison failing is a nice-to-have, not a blocker — don't let it stop
  // someone from picking a role.
  const loadShortlistWithComparison = useCallback(async (id: string) => {
    const res = await fetch(`/api/discovery/shortlist?runId=${id}`).then((r) => r.json())
    const list: ShortlistEntry[] = res.shortlist ?? []
    setShortlist(list)
    setStage('shortlist')
    if (list.length === 0) return

    setLoadingLabel('Comparing your options…')
    try {
      const cmp = await postJSON<{ enrichment: Record<string, RoleComparisonEnrichment> }>(
        '/api/discovery/compare',
        { runId: id },
      )
      setEnrichment(cmp.enrichment)
    } catch {
      // Comparison content is a nice-to-have — don't block picking a role on it.
    } finally {
      setLoadingLabel(null)
    }
  }, [])

  // Resume an in-progress run after a refresh rather than restarting the flow.
  useEffect(() => {
    const saved = localStorage.getItem(RUN_KEY)
    if (!saved) return
    setRunId(saved)
    ;(async () => {
      try {
        const [skillsRes, rolesRes, reactionsRes] = await Promise.all([
          fetch(`/api/discovery/skills?runId=${saved}`).then((r) => r.json()),
          fetch(`/api/discovery/roles?runId=${saved}`).then((r) => r.json()),
          fetch(`/api/discovery/reactions?runId=${saved}`).then((r) => r.json()),
        ])
        if (skillsRes.functions) setFunctions(skillsRes.functions)
        const reactedIds: string[] = reactionsRes.reactedRoleIds ?? []

        if (rolesRes.roles?.length) {
          setRoles(rolesRes.roles)
          const firstUnreacted = rolesRes.roles.findIndex(
            (r: DiscoveryRole) => !reactedIds.includes(r.id),
          )
          if (firstUnreacted === -1) {
            // Every card in the deck already has a reaction — the run is done.
            await loadShortlistWithComparison(saved)
          } else {
            setIndex(firstUnreacted)
            setStage('swipe')
          }
        } else if (skillsRes.functions) {
          setStage('skills')
        }
      } catch {
        // A stale/unreadable run just falls back to a fresh intake.
      }
    })()
  }, [loadShortlistWithComparison])

  const startRun = useCallback(async (selections: IntakeSelections, otherNotes: string) => {
    setBusy(true)
    setError(null)
    try {
      const { runId: id } = await postJSON<{ runId: string }>('/api/discovery/intake', {
        selections,
        otherNotes,
      })
      localStorage.setItem(RUN_KEY, id)
      setRunId(id)

      setLoadingLabel('Reading the evidence…')
      const { functions: fns } = await postJSON<{ functions: FunctionalSkill[] }>(
        '/api/discovery/skills',
        { runId: id },
      )
      setFunctions(fns)
      setStage('skills')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
      setLoadingLabel(null)
    }
  }, [])

  const loadRoles = useCallback(async () => {
    if (!runId) return
    setBusy(true)
    setError(null)
    setLoadingLabel('Cross-referencing adjacent industries…')
    try {
      const { roles: found } = await postJSON<{ roles: DiscoveryRole[] }>('/api/discovery/roles', {
        runId,
      })
      setRoles(found)
      setIndex(0)
      setStage('swipe')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
      setLoadingLabel(null)
    }
  }, [runId])

  const react = useCallback(
    async (role: DiscoveryRole, reaction: Reaction) => {
      if (!runId) return
      setBusy(true)
      setError(null)
      try {
        await postJSON('/api/discovery/reactions', { runId, roleId: role.id, reaction })
        const next = index + 1
        if (next < roles.length) {
          setIndex(next)
        } else {
          await loadShortlistWithComparison(runId)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
      } finally {
        setBusy(false)
      }
    },
    [runId, index, roles.length, loadShortlistWithComparison],
  )

  // The bridge: commit to exactly one shortlisted role, then hand off to the
  // (stubbed) confirmation screen shared with Persona B's direct-entry path.
  const commitToRole = useCallback(
    async (role: DiscoveryRole) => {
      if (!runId) return
      setCommittingId(role.id)
      setError(null)
      try {
        const { commitmentId } = await postJSON<{ commitmentId: string }>('/api/discovery/commit', {
          runId,
          roleId: role.id,
          roleTitle: role.title,
        })
        localStorage.setItem(COMMITMENT_KEY, commitmentId)
        router.push(`/target-committed?commitmentId=${commitmentId}`)
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
        setCommittingId(null)
      }
    },
    [runId, router],
  )

  const restart = useCallback(() => {
    localStorage.removeItem(RUN_KEY)
    setRunId(null)
    setFunctions([])
    setRoles([])
    setShortlist([])
    setEnrichment({})
    setIndex(0)
    setStage('intake')
  }, [])

  if (loadingLabel) {
    return (
      <Shell stage={stage}>
        <Loading label={loadingLabel} />
      </Shell>
    )
  }

  return (
    <Shell stage={stage}>
      {stage === 'intake' && <IntakeForm onSubmit={startRun} busy={busy} error={error} />}
      {stage === 'skills' && (
        <SkillsMapCards functions={functions} onNext={loadRoles} busy={busy} error={error} />
      )}
      {stage === 'swipe' && (
        <>
          <RoleDeck roles={roles} index={index} onReact={react} busy={busy} />
          {error && <ErrorNote message={error} />}
        </>
      )}
      {stage === 'shortlist' && (
        <CompareAndChoose
          entries={shortlist}
          enrichment={enrichment}
          onChoose={commitToRole}
          onRestart={restart}
          committingId={committingId}
        />
      )}
    </Shell>
  )
}
