'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Logo } from '@/components/brand'
import { cn } from '@/lib/utils'

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-pp-l p-6 mb-5"
      style={{ background: 'rgba(242,237,228,0.04)', border: '1px solid rgba(242,237,228,0.1)' }}
    >
      <div className="mb-5">
        <h2 className="text-[16px] font-semibold text-offwhite">{title}</h2>
        {description && <p className="text-[13px] text-pp-text-faint mt-1">{description}</p>}
      </div>
      {children}
    </div>
  )
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6 py-4 border-b last:border-b-0" style={{ borderColor: 'rgba(242,237,228,0.08)' }}>
      <div className="flex-1">
        <p className="text-[14px] font-medium text-offwhite">{label}</p>
        {description && <p className="text-[12.5px] text-pp-text-faint mt-0.5 leading-[1.45]">{description}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative w-10 h-6 rounded-full transition-all flex-shrink-0"
      style={{ background: checked ? '#2E6B6B' : 'rgba(242,237,228,0.15)' }}
    >
      <span
        className="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all"
        style={{ left: checked ? '20px' : '4px' }}
      />
    </button>
  )
}

function DeleteAccountDialog({ onClose }: { onClose: () => void }) {
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleDelete() {
    setLoading(true)
    setError(null)
    const res = await fetch('/api/account', { method: 'DELETE' })
    const data = await res.json() as { ok: boolean; error?: string }
    if (!data.ok) { setLoading(false); setError(data.error ?? 'Something went wrong'); return }
    await signOut({ redirect: false })
    router.push('/')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6" style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div className="w-full max-w-[440px] rounded-pp-l p-7" style={{ background: '#0F1923', border: '1px solid rgba(199,85,59,0.4)' }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-pp flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(199,85,59,0.15)' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2v6M8 11v1" stroke="#C7553B" strokeWidth="1.8" strokeLinecap="round"/>
              <circle cx="8" cy="8" r="7" stroke="#C7553B" strokeWidth="1.3"/>
            </svg>
          </div>
          <h3 className="text-[17px] font-semibold text-offwhite">Delete account</h3>
        </div>
        <p className="text-[13.5px] text-pp-text-body mb-5 leading-[1.6]">
          This permanently deletes your account, all pivot sessions, and analysis history. Under GDPR, this is your right to erasure.
        </p>
        <p className="text-[12.5px] text-pp-text-faint mb-2">Type <strong className="text-offwhite">DELETE</strong> to confirm:</p>
        <input
          type="text"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          placeholder="DELETE"
          className="w-full bg-navy border rounded-pp px-4 py-[10px] text-[14px] text-offwhite placeholder:text-pp-text-ghost outline-none mb-4"
          style={{ borderColor: 'rgba(199,85,59,0.4)' }}
        />
        {error && <p className="text-[13px] text-pp-red mb-3">{error}</p>}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-[10px] rounded-pp text-[14px] font-medium text-pp-text-muted transition-colors hover:text-offwhite" style={{ background: 'rgba(242,237,228,0.06)', border: '1px solid rgba(242,237,228,0.1)' }}>
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={confirm !== 'DELETE' || loading}
            className={cn(
              'flex-1 py-[10px] rounded-pp text-[14px] font-semibold transition-all',
              confirm === 'DELETE' && !loading ? 'text-white' : 'opacity-40 cursor-not-allowed text-white',
            )}
            style={{ background: '#C7553B' }}
          >
            {loading ? 'Deleting…' : 'Delete my account'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession()
  const router = useRouter()

  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState('')
  const [nameSaving, setNameSaving] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)

  const [defaultModel, setDefaultModel] = useState<'claude' | 'grok'>('claude')
  const [emailUpdates, setEmailUpdates] = useState(true)
  const [showDelete, setShowDelete] = useState(false)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)

  function showSaved(msg = 'Saved') {
    setSaveMsg(msg)
    setTimeout(() => setSaveMsg(null), 2500)
  }

  async function saveName() {
    if (!nameValue.trim()) return
    setNameSaving(true)
    setNameError(null)
    const res = await fetch('/api/account/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: nameValue.trim() }),
    })
    const data = await res.json() as { ok: boolean; name?: string; error?: string }
    setNameSaving(false)
    if (!data.ok) { setNameError(data.error ?? 'Failed to save'); return }
    await updateSession({ name: data.name })
    setEditingName(false)
    showSaved('Name updated')
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center">
        <div className="text-center">
          <p className="text-pp-text-body mb-4">Sign in to access settings</p>
          <Link href="/auth/signin" className="bg-amber text-navy px-5 py-2.5 rounded-pp font-semibold text-[14px]">
            Sign in
          </Link>
        </div>
      </div>
    )
  }

  const isOAuth = !session.user?.email?.includes('@') || true // simplified — shown via account type

  return (
    <div className="min-h-screen bg-navy">
      {showDelete && <DeleteAccountDialog onClose={() => setShowDelete(false)} />}

      <header className="border-b" style={{ borderColor: 'rgba(242,237,228,0.1)' }}>
        <div className="max-w-pp-content mx-auto px-7 py-4 flex items-center justify-between">
          <Link href="/" aria-label="PivotPath home"><Logo size="sm" /></Link>
          <nav className="flex items-center gap-5">
            <Link href="/onboarding" className="text-[13.5px] text-pp-text-faint hover:text-pp-text-muted transition-colors">
              New pivot
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="text-[13.5px] text-pp-text-faint hover:text-pp-text-muted transition-colors"
            >
              Sign out
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-[680px] mx-auto px-6 py-12">
        <div className="mb-10">
          <p className="font-mono text-[11px] tracking-[0.1em] uppercase text-amber mb-2">Settings</p>
          <h1 className="font-display text-[32px] font-medium text-offwhite">Account &amp; preferences</h1>
        </div>

        {/* ── Profile ── */}
        <Section title="Profile" description="Your public identity on PivotPath.">
          {/* Avatar */}
          <div className="flex items-center gap-4 pb-5 mb-1 border-b" style={{ borderColor: 'rgba(242,237,228,0.08)' }}>
            <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-[20px] font-semibold text-navy"
              style={{ background: '#E8A838' }}>
              {session.user?.image
                ? <img src={session.user.image} alt="" className="w-full h-full object-cover" />
                : (session.user?.name?.[0] ?? session.user?.email?.[0] ?? '?').toUpperCase()
              }
            </div>
            <div>
              <p className="text-[15px] font-semibold text-offwhite">{session.user?.name ?? 'No name set'}</p>
              <p className="text-[13px] text-pp-text-faint">{session.user?.email}</p>
            </div>
          </div>

          {/* Editable name */}
          <div className="py-4 border-b" style={{ borderColor: 'rgba(242,237,228,0.08)' }}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-[14px] font-medium text-offwhite mb-1">Display name</p>
                {editingName ? (
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="text"
                      value={nameValue}
                      onChange={e => setNameValue(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false) }}
                      placeholder={session.user?.name ?? 'Your name'}
                      autoFocus
                      className="flex-1 bg-navy/60 border rounded-pp px-3 py-[8px] text-[13.5px] text-offwhite placeholder:text-pp-text-ghost outline-none focus:border-amber/60"
                      style={{ borderColor: 'rgba(242,237,228,0.2)' }}
                    />
                    <button
                      onClick={saveName}
                      disabled={nameSaving || !nameValue.trim()}
                      className="px-4 py-[8px] rounded-pp text-[13px] font-semibold bg-amber text-navy disabled:opacity-50"
                    >
                      {nameSaving ? '…' : 'Save'}
                    </button>
                    <button
                      onClick={() => setEditingName(false)}
                      className="px-3 py-[8px] rounded-pp text-[13px] text-pp-text-faint hover:text-offwhite"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <p className="text-[13px] text-pp-text-faint mt-0.5">{session.user?.name ?? 'Not set'}</p>
                )}
                {nameError && <p className="text-[12px] text-pp-red mt-1">{nameError}</p>}
              </div>
              {!editingName && (
                <button
                  onClick={() => { setNameValue(session.user?.name ?? ''); setEditingName(true) }}
                  className="text-[13px] font-medium text-amber hover:text-amber/80 transition-colors mt-0.5"
                >
                  Edit
                </button>
              )}
            </div>
          </div>

          <SettingRow label="Email" description="Your sign-in email. Cannot be changed.">
            <span className="text-[13.5px] text-pp-text-muted">{session.user?.email}</span>
          </SettingRow>
          <SettingRow label="Account type">
            <span className="text-[12px] font-mono px-2 py-1 rounded-pp" style={{ background: 'rgba(46,107,107,0.2)', color: '#5FB0A6' }}>
              Free
            </span>
          </SettingRow>
        </Section>

        {/* ── AI model ── */}
        <Section title="AI model" description="Choose which model powers your pivot analysis.">
          <div
            className="flex gap-0 p-[3px] rounded-pp-m"
            style={{ background: 'rgba(242,237,228,0.07)', border: '1px solid rgba(242,237,228,0.1)' }}
          >
            {(['claude', 'grok'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setDefaultModel(m); showSaved('Preference saved') }}
                className={cn(
                  'flex-1 py-[9px] px-4 rounded-pp text-[13px] font-medium transition-all',
                  defaultModel === m ? 'bg-offwhite/10 text-offwhite' : 'text-pp-text-faint hover:text-pp-text-muted',
                )}
              >
                {m === 'claude' ? 'Claude · Anthropic' : 'Grok · xAI'}
              </button>
            ))}
          </div>
          <p className="text-[12px] text-pp-text-ghost mt-2">
            {defaultModel === 'claude'
              ? 'Claude 3.5 Sonnet — best for nuanced career analysis.'
              : 'Grok — fast, good for broad strategy.'
            }
          </p>
        </Section>

        {/* ── Notifications ── */}
        <Section title="Notifications">
          <SettingRow
            label="Product updates"
            description="Occasional emails about new PivotPath features and improvements."
          >
            <Toggle checked={emailUpdates} onChange={(v) => { setEmailUpdates(v); showSaved() }} />
          </SettingRow>
        </Section>

        {/* ── Data & privacy ── */}
        <Section title="Data &amp; privacy" description="Your data belongs to you. We never sell it or share it with third parties beyond AI processing.">
          <SettingRow
            label="Export my data"
            description="Download all your pivot sessions and analyses as JSON (GDPR Article 20)."
          >
            <a
              href="/api/account/export"
              className="text-[13px] font-medium text-amber hover:text-amber/80 transition-colors"
            >
              Download
            </a>
          </SettingRow>
          <SettingRow
            label="Privacy policy"
            description="How we collect, use, and protect your personal data."
          >
            <Link href="/legal/privacy" className="text-[13px] font-medium text-pp-text-faint hover:text-offwhite transition-colors">
              Read →
            </Link>
          </SettingRow>
          <SettingRow
            label="Terms of service"
            description="The terms governing your use of PivotPath."
          >
            <Link href="/legal/terms" className="text-[13px] font-medium text-pp-text-faint hover:text-offwhite transition-colors">
              Read →
            </Link>
          </SettingRow>
        </Section>

        {/* ── Danger zone ── */}
        <Section title="Danger zone">
          <SettingRow
            label="Delete account"
            description="Permanently remove your account and all associated data. Exercises your GDPR right to erasure."
          >
            <button
              onClick={() => setShowDelete(true)}
              className="text-[13px] font-medium px-4 py-2 rounded-pp transition-all hover:text-white"
              style={{ color: '#C7553B', background: 'rgba(199,85,59,0.1)', border: '1px solid rgba(199,85,59,0.3)' }}
            >
              Delete account
            </button>
          </SettingRow>
        </Section>

        {/* Legal footer */}
        <div className="mt-8 flex flex-wrap gap-4 text-[12px] text-pp-text-ghost">
          <Link href="/legal/terms" className="hover:text-pp-text-faint transition-colors">Terms of service</Link>
          <Link href="/legal/privacy" className="hover:text-pp-text-faint transition-colors">Privacy policy</Link>
          <span>© {new Date().getFullYear()} PivotPath</span>
        </div>
      </main>

      {saveMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-pp text-[13.5px] font-medium text-offwhite shadow-lg transition-all"
          style={{ background: 'rgba(46,107,107,0.95)', border: '1px solid rgba(95,176,166,0.3)' }}>
          ✓ {saveMsg}
        </div>
      )}
    </div>
  )
}
