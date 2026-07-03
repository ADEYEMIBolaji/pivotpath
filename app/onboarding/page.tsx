'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Logo, TranslationArrow } from '@/components/brand'
import { cn } from '@/lib/utils'
import { INDUSTRIES, FUNCTIONS, ROLES } from '@/lib/role-taxonomy'
import type { ParsedProfile, TargetRole, ParsedRole } from '@/lib/types'

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-[5px]">
      {[1, 2, 3, 4, 5].map((n) => (
        <div
          key={n}
          className="h-[3px] rounded-full transition-all duration-300"
          style={{
            width: n <= step ? '32px' : '20px',
            background: n <= step ? '#E8A838' : 'rgba(242,237,228,0.18)',
          }}
        />
      ))}
    </div>
  )
}

// ─── Shell ────────────────────────────────────────────────────────────────────

function WizardShell({
  step,
  children,
  onBack,
}: {
  step: number
  children: React.ReactNode
  onBack?: () => void
}) {
  return (
    <div className="min-h-screen bg-navy flex flex-col">
      {/* nav */}
      <header
        className="border-b"
        style={{ borderColor: 'rgba(242,237,228,0.1)' }}
      >
        <div className="max-w-pp-content mx-auto px-7 py-4 flex items-center justify-between">
          <Link href="/" aria-label="PivotPath home">
            <Logo size="sm" />
          </Link>
          <ProgressBar step={step} />
          <Link
            href="/"
            className="font-mono text-[11.5px] tracking-[0.06em] text-pp-text-faint hover:text-pp-text-muted transition-colors"
          >
            Exit
          </Link>
        </div>
      </header>

      {/* content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-[640px]">
          {onBack && step > 1 && (
            <button
              onClick={onBack}
              className="mb-8 flex items-center gap-2 text-[13px] text-pp-text-faint hover:text-pp-text-muted transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back
            </button>
          )}
          {children}
        </div>
      </main>
    </div>
  )
}

// ─── Step 1 — Background input ────────────────────────────────────────────────

type InputMode = 'upload' | 'linkedin' | 'paste'

function Step1({
  onContinue,
}: {
  onContinue: (raw: { mode: InputMode; file?: File; text?: string }) => void
}) {
  const [mode, setMode] = useState<InputMode>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [text, setText] = useState('')
  const [url, setUrl] = useState('')
  const [linkedinText, setLinkedinText] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) setFile(f)
  }, [])

  function canContinue() {
    if (mode === 'upload') return !!file
    if (mode === 'linkedin') return linkedinText.trim().length > 100
    return text.trim().length > 100
  }

  function handleContinue() {
    if (mode === 'upload' && file) onContinue({ mode, file })
    // LinkedIn can't be scraped, so we use the profile text the user pastes.
    // The URL (if given) is prepended purely as a reference for the extraction.
    else if (mode === 'linkedin') onContinue({ mode, text: `${url.trim() ? `LinkedIn profile: ${url.trim()}\n\n` : ''}${linkedinText}` })
    else onContinue({ mode, text })
  }

  const TAB_LABELS: { id: InputMode; label: string }[] = [
    { id: 'upload', label: 'Upload file' },
    { id: 'linkedin', label: 'LinkedIn' },
    { id: 'paste', label: 'Paste text' },
  ]

  return (
    <div className="animate-pp-rise">
      <p className="font-mono text-[11px] tracking-[0.1em] uppercase text-amber mb-3">Step 1 of 3</p>
      <h1 className="font-display text-[32px] font-medium text-offwhite leading-[1.15] mb-3">
        Share your background
      </h1>
      <p className="text-[15px] text-pp-text-body mb-8 leading-[1.6]">
        Upload your résumé, paste your LinkedIn profile, or paste your work history. We extract the raw facts, you review everything before the analysis runs.
      </p>

      {/* tabs */}
      <div
        className="flex gap-0 p-[3px] rounded-pp-m mb-6"
        style={{ background: 'rgba(242,237,228,0.07)', border: '1px solid rgba(242,237,228,0.1)' }}
      >
        {TAB_LABELS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setMode(id)}
            className={cn(
              'flex-1 py-[10px] px-4 rounded-pp text-[13.5px] font-medium transition-all',
              mode === id
                ? 'bg-offwhite/10 text-offwhite shadow-sm'
                : 'text-pp-text-faint hover:text-pp-text-muted',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* upload zone */}
      {mode === 'upload' && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileRef.current?.click()}
          className={cn(
            'rounded-pp-l border-2 border-dashed cursor-pointer transition-all p-10 text-center',
            dragOver
              ? 'border-amber bg-pp-amber-hl'
              : file
                ? 'border-teal bg-pp-teal-ok-faint'
                : 'border-pp-border-dark hover:border-pp-border-darker bg-navy-surface/40',
          )}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.docx,.doc,.txt"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) setFile(f)
            }}
          />
          {file ? (
            <div className="flex flex-col items-center gap-3">
              {/* teal document icon */}
              <svg width="40" height="48" viewBox="0 0 40 48" fill="none">
                <rect x="1" y="1" width="38" height="46" rx="3" fill="#16242F" stroke="#5FB0A6" strokeWidth="1.5" />
                <path d="M10 16h20M10 22h20M10 28h14" stroke="#5FB0A6" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <div>
                <p className="text-[14px] font-medium text-offwhite">{file.name}</p>
                <p className="text-[12px] text-pp-text-faint mt-0.5">
                  {(file.size / 1024).toFixed(0)} KB, click to replace
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              {/* amber circle with upload arrow */}
              <div className="w-14 h-14 rounded-full bg-pp-amber-hl border border-amber/30 flex items-center justify-center">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <path d="M11 14V4M11 4L7 8M11 4L15 8" stroke="#E8A838" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M4 17h14" stroke="#E8A838" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <p className="text-[14px] font-medium text-offwhite">Drop your résumé here</p>
                <p className="text-[12.5px] text-pp-text-muted mt-1">PDF, DOCX, or TXT, up to 5 MB</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* linkedin */}
      {mode === 'linkedin' && (
        <div className="space-y-3">
          <div
            className="rounded-pp-m px-4 py-3 text-[12.5px] text-pp-text-body leading-[1.55]"
            style={{ background: 'rgba(232,168,56,0.08)', border: '1px solid rgba(232,168,56,0.25)' }}
          >
            LinkedIn blocks automated access, so we can&apos;t pull your profile from a link alone. Open your
            profile, select everything from your headline down through your experience and education, copy it,
            and paste it below. The link is optional.
          </div>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://linkedin.com/in/your-profile (optional)"
            className="w-full bg-navy-surface/60 border rounded-pp-m px-4 py-3 text-[14px] text-offwhite placeholder:text-pp-text-ghost outline-none transition-all focus:border-amber/60 focus:shadow-pp-focus"
            style={{ borderColor: 'rgba(242,237,228,0.18)' }}
          />
          <textarea
            value={linkedinText}
            onChange={(e) => setLinkedinText(e.target.value)}
            rows={9}
            placeholder={`Paste your LinkedIn profile text here…\n\nInclude:\n• Headline and about section\n• Each role: title, company, dates, description\n• Skills and education`}
            className="w-full bg-navy-surface/60 border rounded-pp-m px-4 py-3 text-[14px] text-offwhite placeholder:text-pp-text-ghost outline-none resize-none transition-all focus:border-amber/60 focus:shadow-pp-focus font-mono text-[13px] leading-[1.6]"
            style={{ borderColor: 'rgba(242,237,228,0.18)' }}
          />
        </div>
      )}

      {/* paste */}
      {mode === 'paste' && (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          placeholder={`Paste your résumé or LinkedIn profile text here…\n\nInclude:\n• Job titles and dates\n• Bullet points or descriptions\n• Skills and education`}
          className="w-full bg-navy-surface/60 border rounded-pp-m px-4 py-3 text-[14px] text-offwhite placeholder:text-pp-text-ghost outline-none resize-none transition-all focus:border-amber/60 focus:shadow-pp-focus font-mono text-[13px] leading-[1.6]"
          style={{ borderColor: 'rgba(242,237,228,0.18)' }}
        />
      )}

      <button
        onClick={handleContinue}
        disabled={!canContinue()}
        className={cn(
          'mt-6 w-full py-[14px] rounded-pp font-semibold text-[15px] transition-all',
          canContinue()
            ? 'bg-amber text-navy hover:bg-amber/90 shadow-pp-amber'
            : 'bg-pp-border-dark text-pp-text-ghost cursor-not-allowed',
        )}
      >
        Continue
      </button>
    </div>
  )
}

// ─── Step 2 — Target role ─────────────────────────────────────────────────────

function Step2({
  onContinue,
}: {
  onContinue: (target: TargetRole) => void
}) {
  const [industry, setIndustry] = useState('')
  const [func, setFunc] = useState('')
  const [role, setRole] = useState('')
  const [desc, setDesc] = useState('')
  const [showJD, setShowJD] = useState(false)
  const [jd, setJD] = useState('')

  const functions = industry ? (FUNCTIONS[industry] ?? []) : []
  const roles = industry && func ? (ROLES[industry]?.[func] ?? []) : []

  function handleIndustryChange(v: string) {
    setIndustry(v)
    setFunc('')
    setRole('')
  }
  function handleFuncChange(v: string) {
    setFunc(v)
    setRole('')
  }

  const canContinue = !!(industry && func && role)

  function handleContinue() {
    onContinue({
      industry,
      function: func,
      title: role,
      userDescription: desc.trim() || undefined,
      jobDescription: showJD && jd.trim() ? jd.trim() : undefined,
    })
  }

  const SELECT_CLS =
    'w-full bg-navy-surface/60 border rounded-pp-m px-4 py-3 text-[14px] text-offwhite outline-none appearance-none cursor-pointer transition-all focus:border-amber/60 focus:shadow-pp-focus'
  const SELECT_STYLE = { borderColor: 'rgba(242,237,228,0.18)' }

  return (
    <div className="animate-pp-rise">
      <p className="font-mono text-[11px] tracking-[0.1em] uppercase text-amber mb-3">Step 2 of 3</p>
      <h1 className="font-display text-[32px] font-medium text-offwhite leading-[1.15] mb-3">
        Where are you headed?
      </h1>
      <p className="text-[15px] text-pp-text-body mb-8 leading-[1.6]">
        Choose the role you're targeting. The more specific you are, the sharper the translation.
      </p>

      <div className="space-y-4">
        {/* Industry */}
        <div>
          <label className="block font-mono text-[11px] tracking-[0.08em] uppercase text-pp-text-faint mb-2">
            Industry
          </label>
          <div className="relative">
            <select value={industry} onChange={(e) => handleIndustryChange(e.target.value)} className={SELECT_CLS} style={SELECT_STYLE}>
              <option value="">Select industry…</option>
              {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 5l4 4 4-4" stroke="#9AA7B0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* Function */}
        <div>
          <label className="block font-mono text-[11px] tracking-[0.08em] uppercase text-pp-text-faint mb-2">
            Function
          </label>
          <div className="relative">
            <select value={func} onChange={(e) => handleFuncChange(e.target.value)} disabled={!industry} className={cn(SELECT_CLS, !industry && 'opacity-40 cursor-not-allowed')} style={SELECT_STYLE}>
              <option value="">Select function…</option>
              {functions.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 5l4 4 4-4" stroke="#9AA7B0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* Role */}
        <div>
          <label className="block font-mono text-[11px] tracking-[0.08em] uppercase text-pp-text-faint mb-2">
            Target role
          </label>
          <div className="relative">
            <select value={role} onChange={(e) => setRole(e.target.value)} disabled={!func} className={cn(SELECT_CLS, !func && 'opacity-40 cursor-not-allowed')} style={SELECT_STYLE}>
              <option value="">Select role…</option>
              {roles.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 5l4 4 4-4" stroke="#9AA7B0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* Optional description */}
        <div>
          <label className="block font-mono text-[11px] tracking-[0.08em] uppercase text-pp-text-faint mb-2">
            Describe it in your own words <span className="normal-case text-pp-text-ghost">(optional)</span>
          </label>
          <input
            type="text"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder={'e.g. “I want to move from nursing into healthcare product management”'}
            className="w-full bg-navy-surface/60 border rounded-pp-m px-4 py-3 text-[14px] text-offwhite placeholder:text-pp-text-ghost outline-none transition-all focus:border-amber/60 focus:shadow-pp-focus"
            style={{ borderColor: 'rgba(242,237,228,0.18)' }}
          />
        </div>

        {/* JD toggle */}
        <div
          className="rounded-pp-l p-4"
          style={{ border: '1px solid rgba(242,237,228,0.1)', background: 'rgba(242,237,228,0.04)' }}
        >
          <button
            onClick={() => setShowJD(!showJD)}
            className="flex items-center justify-between w-full text-left"
          >
            <div>
              <p className="text-[14px] font-medium text-offwhite">Add a job description</p>
              <p className="text-[12.5px] text-pp-text-faint mt-0.5">Highest-signal input, dramatically sharpens the gap analysis</p>
            </div>
            <div
              className={cn(
                'w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ml-4',
                showJD ? 'bg-amber' : 'bg-pp-border-dark',
              )}
            >
              <div
                className={cn(
                  'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform',
                  showJD ? 'translate-x-5' : 'translate-x-0.5',
                )}
              />
            </div>
          </button>
          {showJD && (
            <textarea
              value={jd}
              onChange={(e) => setJD(e.target.value)}
              rows={6}
              placeholder="Paste the full job description here…"
              className="mt-4 w-full bg-navy/60 border rounded-pp-m px-4 py-3 text-[13px] text-offwhite placeholder:text-pp-text-ghost outline-none resize-none transition-all focus:border-amber/60 font-mono leading-[1.6]"
              style={{ borderColor: 'rgba(242,237,228,0.18)' }}
            />
          )}
        </div>
      </div>

      <button
        onClick={handleContinue}
        disabled={!canContinue}
        className={cn(
          'mt-8 w-full py-[14px] rounded-pp font-semibold text-[15px] transition-all',
          canContinue
            ? 'bg-amber text-navy hover:bg-amber/90 shadow-pp-amber'
            : 'bg-pp-border-dark text-pp-text-ghost cursor-not-allowed',
        )}
      >
        Continue
      </button>
    </div>
  )
}

// ─── Step 3 — Confirm extracted profile ───────────────────────────────────────

function BulletEditor({
  text,
  flag,
  onChange,
}: {
  text: string
  flag?: string
  onChange: (v: string) => void
}) {
  return (
    <div className={cn('group relative', flag && 'pl-3 border-l-2 border-amber/60')}>
      {flag && (
        <div
          className="flex items-start gap-2 rounded-pp px-3 py-2 mb-1.5"
          style={{ background: 'rgba(232,168,56,0.1)', border: '1px solid rgba(232,168,56,0.3)' }}
        >
          <svg width="12" height="12" className="flex-shrink-0 mt-0.5" viewBox="0 0 12 12" fill="none">
            <path d="M6 1v6M6 10v.5" stroke="#E8A838" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <p className="text-[11.5px] text-amber leading-[1.4]">{flag}</p>
        </div>
      )}
      <div
        contentEditable
        suppressContentEditableWarning
        onBlur={(e) => onChange(e.currentTarget.textContent ?? '')}
        className="text-[13.5px] text-pp-text-dim leading-[1.6] outline-none focus:text-offwhite cursor-text"
        dangerouslySetInnerHTML={{ __html: text }}
      />
    </div>
  )
}

function Step3({
  profile: initialProfile,
  target,
  onConfirm,
}: {
  profile: ParsedProfile
  target: TargetRole
  onConfirm: (profile: ParsedProfile, provider: 'claude' | 'grok') => void
}) {
  const [profile, setProfile] = useState(initialProfile)
  const [provider, setProvider] = useState<'claude' | 'grok'>('claude')

  function updateBullet(roleIdx: number, bulletIdx: number, text: string) {
    setProfile((p) => {
      const roles = p.roles.map((r, ri) =>
        ri !== roleIdx
          ? r
          : {
              ...r,
              bullets: r.bullets.map((b, bi) => (bi !== bulletIdx ? b : { ...b, text })),
            },
      )
      return { ...p, roles }
    })
  }

  function updateSkill(idx: number, val: string) {
    setProfile((p) => {
      const skills = [...p.skills]
      skills[idx] = val
      return { ...p, skills }
    })
  }

  function addSkill() {
    setProfile((p) => ({ ...p, skills: [...p.skills, ''] }))
  }

  function removeSkill(idx: number) {
    setProfile((p) => ({ ...p, skills: p.skills.filter((_, i) => i !== idx) }))
  }

  const flagCount = profile.roles.flatMap((r) => r.bullets).filter((b) => b.flag).length

  return (
    <div className="animate-pp-rise">
      <p className="font-mono text-[11px] tracking-[0.1em] uppercase text-amber mb-3">Step 3 of 3</p>
      <h1 className="font-display text-[32px] font-medium text-offwhite leading-[1.15] mb-3">
        Confirm your profile
      </h1>
      <p className="text-[15px] text-pp-text-body mb-2 leading-[1.6]">
        We extracted the following from your background. Review and correct any errors before the analysis runs.
      </p>

      {flagCount > 0 && (
        <div
          className="flex items-start gap-3 rounded-pp-m p-4 mb-6"
          style={{ background: 'rgba(232,168,56,0.1)', border: '1px solid rgba(232,168,56,0.3)' }}
        >
          <svg width="16" height="16" className="flex-shrink-0 mt-0.5" viewBox="0 0 16 16" fill="none">
            <path d="M8 2v8M8 13v.5" stroke="#E8A838" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <p className="text-[13px] text-amber leading-[1.5]">
            <strong>{flagCount} bullet{flagCount > 1 ? 's are' : ' is'} flagged</strong> as too vague to translate well. Strengthen them with specific outcomes or metrics before running the analysis.
          </p>
        </div>
      )}

      {/* Target reminder */}
      <div
        className="flex items-center gap-3 rounded-pp-m px-4 py-3 mb-8"
        style={{ background: 'rgba(46,107,107,0.12)', border: '1px solid rgba(46,107,107,0.3)' }}
      >
        <TranslationArrow width={40} height={12} />
        <p className="text-[13px] text-teal-light">
          Targeting: <strong className="text-offwhite">{target.title}</strong> · {target.function} / {target.industry}
        </p>
      </div>

      {/* Role cards */}
      <div className="space-y-5">
        {profile.roles.map((role: ParsedRole, ri: number) => (
          <div
            key={ri}
            className="rounded-pp-l overflow-hidden"
            style={{ border: '1px solid rgba(242,237,228,0.1)', background: 'rgba(242,237,228,0.04)' }}
          >
            <div
              className="px-5 py-4 border-b"
              style={{ borderColor: 'rgba(242,237,228,0.08)', background: 'rgba(242,237,228,0.04)' }}
            >
              <p className="text-[14px] font-semibold text-offwhite">{role.title}</p>
              <p className="text-[12px] text-pp-text-faint mt-0.5">{role.company} · {role.dateRange}</p>
            </div>
            <div className="px-5 py-4 space-y-3">
              {role.bullets.map((bullet, bi) => (
                <BulletEditor
                  key={bi}
                  text={bullet.text}
                  flag={bullet.flag}
                  onChange={(v) => updateBullet(ri, bi, v)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Skills */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <p className="font-mono text-[11px] tracking-[0.08em] uppercase text-pp-text-faint">Skills</p>
          <button
            onClick={addSkill}
            className="text-[12px] text-amber hover:text-amber/80 transition-colors"
          >
            + Add skill
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {profile.skills.map((skill, si) => (
            <div
              key={si}
              className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-pp-pill text-[12.5px]"
              style={{ background: 'rgba(242,237,228,0.08)', border: '1px solid rgba(242,237,228,0.15)' }}
            >
              <span
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => updateSkill(si, e.currentTarget.textContent ?? '')}
                className="text-offwhite outline-none cursor-text min-w-[20px]"
                dangerouslySetInnerHTML={{ __html: skill }}
              />
              <button
                onClick={() => removeSkill(si)}
                className="text-pp-text-ghost hover:text-pp-text-faint ml-1"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 2l6 6M8 2L2 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Model selector */}
      <div className="mt-8 mb-4">
        <p className="font-mono text-[10.5px] tracking-[0.08em] uppercase text-pp-text-faint mb-3">AI model</p>
        <div
          className="flex gap-0 p-[3px] rounded-pp-m"
          style={{ background: 'rgba(242,237,228,0.07)', border: '1px solid rgba(242,237,228,0.1)' }}
        >
          {([
            { id: 'claude', label: 'Claude (Anthropic)', badge: 'Default' },
            { id: 'grok', label: 'Grok (xAI)', badge: 'Beta' },
          ] as const).map(({ id, label, badge }) => (
            <button
              key={id}
              onClick={() => setProvider(id)}
              className={cn(
                'flex-1 py-[9px] px-4 rounded-pp text-[13px] font-medium transition-all flex items-center justify-center gap-2',
                provider === id
                  ? 'bg-offwhite/10 text-offwhite shadow-sm'
                  : 'text-pp-text-faint hover:text-pp-text-muted',
              )}
            >
              {label}
              <span
                className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                style={{
                  background: provider === id ? 'rgba(232,168,56,0.2)' : 'rgba(242,237,228,0.08)',
                  color: provider === id ? '#E8A838' : 'rgba(242,237,228,0.35)',
                }}
              >
                {badge}
              </span>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => onConfirm(profile, provider)}
        className="w-full py-[14px] rounded-pp font-semibold text-[15px] bg-amber text-navy hover:bg-amber/90 shadow-pp-amber transition-all"
      >
        Run my analysis →
      </button>
    </div>
  )
}

// ─── Analysis progress ────────────────────────────────────────────────────────

const STAGE_LABELS: Record<string, string> = {
  translate: 'Mapping your skills to the target field…',
  rewrite: 'Repositioning your résumé…',
  strategy: 'Building your transition strategy…',
}

function AnalysisProgress({ stageKey, provider }: { stageKey: string; provider: 'claude' | 'grok' }) {
  const stageOrder = ['translate', 'rewrite', 'strategy']
  const currentIdx = stageOrder.indexOf(stageKey)

  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center px-6">
      <Logo size="lg" />
      <div className="mt-12 w-full max-w-[420px]">
        <p className="font-display text-[26px] font-medium text-offwhite text-center mb-2">
          Analysing your pivot…
        </p>
        <p className="text-[14px] text-pp-text-muted text-center mb-1">
          {STAGE_LABELS[stageKey] ?? 'Working…'}
        </p>
        <p className="text-[11.5px] font-mono text-pp-text-ghost text-center mb-10">
          {provider === 'grok' ? 'Powered by Grok · xAI' : 'Powered by Claude · Anthropic'}
        </p>

        <div className="space-y-3">
          {stageOrder.map((s, i) => {
            const isDone = i < currentIdx
            const isActive = i === currentIdx
            return (
              <div
                key={s}
                className={cn(
                  'flex items-center gap-4 rounded-pp-m px-4 py-3 transition-all',
                  isActive
                    ? 'bg-pp-amber-hl border border-amber/30'
                    : isDone
                      ? 'bg-pp-teal-ok-faint border border-teal/30'
                      : 'border border-pp-border-dark',
                )}
              >
                {isDone ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
                    <circle cx="8" cy="8" r="7" fill="#2E6B6B" />
                    <path d="M5 8l2.5 2.5L11 5.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : isActive ? (
                  <div className="w-4 h-4 rounded-full border-2 border-amber border-t-transparent animate-spin flex-shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-pp-border-dark flex-shrink-0" />
                )}
                <span className={cn('text-[13.5px]', isActive ? 'text-offwhite font-medium' : isDone ? 'text-teal-light' : 'text-pp-text-ghost')}>
                  {STAGE_LABELS[s]}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Main wizard ──────────────────────────────────────────────────────────────

type WizardStep = 1 | 2 | 3 | 'running' | 'error' | 'quota'

export default function OnboardingPage() {
  const router = useRouter()
  const { status } = useSession()

  // Require an account — the free trial (1 analysis) can only be enforced per-user.
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace(`/auth/signup?callbackUrl=${encodeURIComponent('/onboarding')}`)
    }
  }, [status, router])

  const [wizardStep, setWizardStep] = useState<WizardStep>(1)
  const [ingestLoading, setIngestLoading] = useState(false)
  const [ingestError, setIngestError] = useState<string | null>(null)
  const [profile, setProfile] = useState<ParsedProfile | null>(null)
  const [target, setTarget] = useState<TargetRole | null>(null)
  const [analysisStage, setAnalysisStage] = useState('translate')
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [provider, setProvider] = useState<'claude' | 'grok'>('claude')

  // Called after step 1 — triggers ingest while user fills step 2
  const pendingIngestRef = useRef<Promise<{ profile: ParsedProfile | null; error: string | null }> | null>(null)

  // Stable session id for the analysis, generated client-side and reused across
  // retries so a dropped connection (locked phone / backgrounded tab) resumes the
  // same session server-side instead of re-running — and re-paying for — the AI.
  const analysisSessionIdRef = useRef<string | null>(null)

  async function handleStep1(raw: { mode: InputMode; file?: File; text?: string }) {
    pendingIngestRef.current = (async () => {
      try {
        let res: Response
        if (raw.file) {
          const form = new FormData()
          form.append('file', raw.file)
          form.append('provider', provider)
          res = await fetch('/api/ingest', { method: 'POST', body: form })
        } else {
          res = await fetch('/api/ingest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: raw.text, source: raw.mode, provider }),
          })
        }
        const json = await res.json() as { ok: boolean; data?: ParsedProfile; error?: string }
        if (!json.ok) return { profile: null, error: json.error ?? 'Unknown error from server' }
        return { profile: json.data ?? null, error: null }
      } catch (e) {
        return { profile: null, error: e instanceof Error ? e.message : String(e) }
      }
    })()

    setWizardStep(2)
  }

  async function handleStep2(t: TargetRole) {
    setTarget(t)
    setIngestLoading(true)
    setIngestError(null)

    const result = await pendingIngestRef.current
    setIngestLoading(false)

    if (!result?.profile) {
      setIngestError(result?.error ?? 'Failed to parse your background.')
      setWizardStep(1)
      return
    }
    const parsed = result.profile

    setProfile(parsed)
    setWizardStep(3)
  }

  async function handleStep3(confirmedProfile: ParsedProfile, chosenProvider: 'claude' | 'grok') {
    if (!target) return
    setProvider(chosenProvider)
    setWizardStep('running')

    // Reuse the same session id on retry so the server resumes finished stages.
    if (!analysisSessionIdRef.current) {
      analysisSessionIdRef.current =
        typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`
    }
    const sessionIdForRun = analysisSessionIdRef.current

    try {
      const res = await fetch('/api/analyse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: confirmedProfile, target, sessionId: sessionIdForRun, provider: chosenProvider }),
      })

      // Quota exceeded — free trial used up or plan limit reached
      if (res.status === 402) {
        const data = await res.json().catch(() => ({})) as { error?: string }
        setAnalysisError(data.error ?? null)
        setWizardStep('quota')
        return
      }

      if (!res.body) throw new Error('No response stream')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let sessionId: string | null = null
      let buffer = ''

      // Parse one complete SSE "data: {...}" line. Large events (résumé/strategy)
      // can span multiple network chunks, so we only parse whole lines.
      const handleLine = (line: string) => {
        if (!line.startsWith('data: ')) return
        const json = line.slice(6).trim()
        if (!json) return
        const payload = JSON.parse(json) as Record<string, unknown>
        if (payload.error) throw new Error(payload.error as string)
        if (payload.stage === 'complete') {
          sessionId = payload.sessionId as string
        } else if (payload.status === 'running') {
          setAnalysisStage(payload.stage as string)
        }
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? '' // keep the last (possibly incomplete) line
        for (const line of lines) handleLine(line)
      }
      // Flush any final event that had no trailing newline
      buffer += decoder.decode()
      if (buffer.trim()) handleLine(buffer.trim())

      // Server echoes the id back on 'complete'; fall back to the one we sent.
      const finalSessionId = sessionId ?? sessionIdForRun

      // Analysis finished — reset so a future, different pivot gets a fresh id.
      analysisSessionIdRef.current = null

      // Persist to localStorage for client-side results pages
      localStorage.setItem('pp_last_session', finalSessionId)

      router.push(`/results/${finalSessionId}/map`)
    } catch (e) {
      setAnalysisError(e instanceof Error ? e.message : String(e))
      setWizardStep('error')
    }
  }

  // While auth status resolves (or we're redirecting an anonymous visitor), show a loader
  if (status !== 'authenticated') {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-pp-text-ghost border-t-amber animate-spin" />
      </div>
    )
  }

  if (wizardStep === 'running') return <AnalysisProgress stageKey={analysisStage} provider={provider} />

  if (wizardStep === 'error') {
    return (
      <div className="min-h-screen bg-navy flex flex-col items-center justify-center px-6 text-center">
        <p className="font-display text-[28px] text-offwhite mb-3">Something went wrong</p>
        <p className="text-[14px] text-pp-text-body max-w-md mb-8">{analysisError}</p>
        <button
          onClick={() => { setWizardStep(3); setAnalysisError(null) }}
          className="bg-amber text-navy px-6 py-3 rounded-pp font-semibold"
        >
          Try again
        </button>
      </div>
    )
  }

  if (wizardStep === 'quota') {
    return (
      <div className="min-h-screen bg-navy flex flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-[480px] text-center">
          <div className="w-14 h-14 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ background: 'rgba(232,168,56,0.15)' }}>
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
              <path d="M13 7v7l4 2" stroke="#E8A838" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="13" cy="13" r="10" stroke="#E8A838" strokeWidth="1.6" />
            </svg>
          </div>
          <h1 className="font-display text-[30px] font-medium text-offwhite mb-3">You&apos;ve used your free pivot</h1>
          <p className="text-[15px] text-pp-text-body leading-[1.6] mb-8">
            {analysisError ?? 'Free accounts include 1 full pivot analysis.'} Unlock more to keep refining your pivot as your target role sharpens.
          </p>

          {/* What paid unlocks */}
          <div
            className="rounded-pp-l p-6 mb-8 text-left"
            style={{ background: 'rgba(242,237,228,0.04)', border: '1px solid rgba(242,237,228,0.12)' }}
          >
            <p className="font-mono text-[10px] tracking-[0.1em] uppercase text-amber mb-4">What a plan unlocks</p>
            <ul className="space-y-3">
              {[
                'Up to 7 full pivot analyses, refine as your direction evolves',
                'Re-run when you target a new role or industry',
                'Fresh job matches every few hours',
                'Priority support and early access to new features',
              ].map((b) => (
                <li key={b} className="flex items-start gap-2.5 text-[14px] text-pp-text-body">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 mt-0.5">
                    <circle cx="8" cy="8" r="7.5" fill="rgba(46,107,107,0.15)" stroke="#2E6B6B" strokeWidth="1"/>
                    <path d="M4.5 8l2.5 2.5 4.5-4.5" stroke="#5FB0A6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {b}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/pricing"
              className="flex-1 bg-amber text-navy px-6 py-[14px] rounded-pp font-semibold text-[15px] hover:bg-amber/90 transition-colors"
            >
              View plans, from £19/mo
            </Link>
            <Link
              href="/settings"
              className="flex-1 px-6 py-[14px] rounded-pp font-medium text-[15px] text-pp-text-muted transition-colors hover:text-offwhite"
              style={{ background: 'rgba(242,237,228,0.06)', border: '1px solid rgba(242,237,228,0.12)' }}
            >
              View past pivots
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <WizardShell step={wizardStep as number} onBack={wizardStep > 1 ? () => setWizardStep((s) => ((s as number) - 1) as WizardStep) : undefined}>
      {wizardStep === 1 && (
        <>
          {ingestError && (
            <div className="mb-4 p-4 rounded-pp-m text-[13px] text-pp-red" style={{ background: 'rgba(199,85,59,0.1)', border: '1px solid rgba(199,85,59,0.3)' }}>
              {ingestError}
            </div>
          )}
          <Step1 onContinue={handleStep1} />
        </>
      )}
      {wizardStep === 2 && (
        <Step2 onContinue={handleStep2} />
      )}
      {wizardStep === 3 && profile && target && (
        <Step3 profile={profile} target={target} onConfirm={handleStep3} />
      )}
      {ingestLoading && wizardStep === 2 && (
        <div className="mt-4 flex items-center gap-2 text-[12px] text-pp-text-faint">
          <div className="w-3 h-3 rounded-full border border-amber border-t-transparent animate-spin" />
          Parsing your résumé…
        </div>
      )}
    </WizardShell>
  )
}
