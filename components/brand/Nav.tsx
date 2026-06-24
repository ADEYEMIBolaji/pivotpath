'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { Logo } from './Logo'
import { cn } from '@/lib/utils'

interface NavLink {
  href: string
  label: string
}

interface NavProps {
  /** Which visual variant to render */
  variant?: 'landing' | 'app'
  /** Current pivot context shown as "ICU Nurse → Product Manager" breadcrumb */
  pivotLabel?: { from: string; to: string }
  /** Right-side action label for app header */
  exitLabel?: string
  exitHref?: string
  className?: string
}

const LANDING_LINKS: NavLink[] = [
  { href: '/#how',    label: 'How it works'    },
  { href: '/#map',    label: 'Translation Map' },
  { href: '/#proof',  label: 'Results'         },
  { href: '/pricing', label: 'Pricing'         },
]

// ─── Avatar ─────────────────────────────────────────────────────────────────

function Avatar({ name, email, image }: { name?: string | null; email?: string | null; image?: string | null }) {
  const initial = (name?.[0] ?? email?.[0] ?? '?').toUpperCase()
  return (
    <div
      className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-[13px] font-semibold text-navy"
      style={{ background: '#E8A838' }}
    >
      {image ? <img src={image} alt="" className="w-full h-full object-cover" /> : initial}
    </div>
  )
}

/**
 * Two variants:
 *
 * landing — marketing nav; session-aware (signed-in users see their account)
 * app     — minimal app shell nav with logo, pivot breadcrumb, and "Save & exit"
 */
export function Nav({ variant = 'landing', pivotLabel, exitLabel = 'Save & exit', exitHref = '/', className }: NavProps) {
  const { data: session, status } = useSession()
  const [menuOpen, setMenuOpen] = useState(false)
  const isAuthed = status === 'authenticated' && !!session?.user

  if (variant === 'app') {
    return (
      <header
        className={cn('border-b', className)}
        style={{ borderColor: 'rgba(242,237,228,0.1)' }}
      >
        <div className="max-w-pp-content mx-auto px-4 sm:px-7 py-4 flex items-center justify-between gap-3 sm:gap-5">
          <div className="flex items-center gap-[10px]">
            <Logo size="sm" />
          </div>

          {/* Pivot breadcrumb — shown when a pivot context is active (hidden on mobile) */}
          {pivotLabel && (
            <div
              className="hidden md:flex items-center gap-[10px] pl-[18px] border-l"
              style={{ borderColor: 'rgba(242,237,228,0.14)' }}
            >
              <span className="text-[14px] text-pp-text-body">{pivotLabel.from}</span>
              <svg width="30" height="11" viewBox="0 0 30 11" fill="none" aria-hidden="true">
                <line x1="0" y1="5.5" x2="22" y2="5.5" stroke="#E8A838" strokeWidth="1.5" />
                <path d="M20 1.5 L26 5.5 L20 9.5" stroke="#E8A838" strokeWidth="1.5" fill="none" strokeLinejoin="round" strokeLinecap="round" />
              </svg>
              <span className="text-[14px] font-semibold text-offwhite">{pivotLabel.to}</span>
            </div>
          )}

          <Link
            href={exitHref}
            className="font-mono text-[11.5px] tracking-[0.06em] text-pp-text-faint hover:text-pp-text-muted transition-colors"
          >
            {exitLabel}
          </Link>
        </div>
      </header>
    )
  }

  // ── Landing variant ────────────────────────────────────────────────────────
  return (
    <header
      className={cn('sticky top-0 z-50 pp-backdrop border-b', className)}
      style={{ borderColor: 'rgba(242,237,228,0.12)' }}
    >
      <nav className="max-w-pp-wide mx-auto px-5 sm:px-8 py-[16px] sm:py-[18px] flex items-center justify-between gap-4">
        <Link href="/" aria-label="PivotPath home">
          <Logo size="md" showTagline />
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-2 flex-wrap justify-end">
          {LANDING_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[14px] text-pp-text-muted hover:text-offwhite transition-colors px-[14px] py-2"
            >
              {link.label}
            </Link>
          ))}

          {isAuthed ? (
            <>
              <Link
                href="/onboarding"
                className="text-[14px] font-semibold text-navy bg-amber px-5 py-[11px] rounded-pp hover:bg-amber/90 transition-colors ml-1"
              >
                Start a pivot
              </Link>
              <Link href="/settings" className="ml-2" aria-label="Account settings">
                <Avatar name={session.user?.name} email={session.user?.email} image={session.user?.image} />
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/auth/signin"
                className="text-[14px] font-medium text-pp-text-muted hover:text-offwhite transition-colors px-4 py-[11px] rounded-pp"
              >
                Sign in
              </Link>
              <Link
                href="/auth/signup"
                className="text-[14px] font-semibold text-navy bg-amber px-5 py-[11px] rounded-pp hover:bg-amber/90 transition-colors"
              >
                Get started
              </Link>
            </>
          )}
        </div>

        {/* Mobile: avatar (if authed) + hamburger */}
        <div className="flex md:hidden items-center gap-3">
          {isAuthed && (
            <Link href="/settings" aria-label="Account settings">
              <Avatar name={session.user?.name} email={session.user?.email} image={session.user?.image} />
            </Link>
          )}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            className="w-9 h-9 flex items-center justify-center rounded-pp text-offwhite"
            style={{ background: 'rgba(242,237,228,0.08)', border: '1px solid rgba(242,237,228,0.15)' }}
          >
            {menuOpen ? (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M2 5h14M2 9h14M2 13h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div
          className="md:hidden border-t px-5 py-4 flex flex-col gap-1"
          style={{ borderColor: 'rgba(242,237,228,0.12)', background: 'rgba(15,25,35,0.98)' }}
        >
          {LANDING_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="text-[15px] text-pp-text-muted hover:text-offwhite transition-colors py-3 px-2 rounded-pp"
            >
              {link.label}
            </Link>
          ))}
          <div className="h-px my-2" style={{ background: 'rgba(242,237,228,0.1)' }} />
          {isAuthed ? (
            <>
              <Link
                href="/onboarding"
                onClick={() => setMenuOpen(false)}
                className="text-[15px] font-semibold text-navy bg-amber px-4 py-3 rounded-pp text-center"
              >
                Start a pivot
              </Link>
              <Link
                href="/settings"
                onClick={() => setMenuOpen(false)}
                className="text-[15px] text-pp-text-muted hover:text-offwhite transition-colors py-3 px-2"
              >
                Account settings
              </Link>
              <button
                onClick={() => { setMenuOpen(false); signOut({ callbackUrl: '/' }) }}
                className="text-[15px] text-pp-text-faint hover:text-pp-text-muted transition-colors py-3 px-2 text-left"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/signin"
                onClick={() => setMenuOpen(false)}
                className="text-[15px] text-pp-text-muted hover:text-offwhite transition-colors py-3 px-2"
              >
                Sign in
              </Link>
              <Link
                href="/auth/signup"
                onClick={() => setMenuOpen(false)}
                className="text-[15px] font-semibold text-navy bg-amber px-4 py-3 rounded-pp text-center"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  )
}
