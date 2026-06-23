'use client'

import Link from 'next/link'
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
  { href: '#how',   label: 'How it works'   },
  { href: '#map',   label: 'Translation Map' },
  { href: '#proof', label: 'Results'         },
]

/**
 * Two variants:
 *
 * landing — marketing nav with section links + "Start free" CTA
 * app     — minimal app shell nav with logo, pivot breadcrumb, and "Save & exit"
 */
export function Nav({ variant = 'landing', pivotLabel, exitLabel = 'Save & exit', exitHref = '/', className }: NavProps) {
  if (variant === 'app') {
    return (
      <header
        className={cn('border-b', className)}
        style={{ borderColor: 'rgba(242,237,228,0.1)' }}
      >
        <div
          className="max-w-pp-content mx-auto px-7 py-4 flex items-center justify-between gap-5"
        >
          <div className="flex items-center gap-[10px]">
            <Logo size="sm" />
          </div>

          {/* Pivot breadcrumb — shown when a pivot context is active */}
          {pivotLabel && (
            <div
              className="flex items-center gap-[10px] pl-[18px] border-l"
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
      <nav className="max-w-pp-wide mx-auto px-8 py-[18px] flex items-center justify-between gap-6">
        <Link href="/" aria-label="PivotPath home">
          <Logo size="md" showTagline />
        </Link>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          {LANDING_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[14px] text-pp-text-muted hover:text-offwhite transition-colors px-[14px] py-2 hidden sm:block"
            >
              {link.label}
            </Link>
          ))}
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
        </div>
      </nav>
    </header>
  )
}
