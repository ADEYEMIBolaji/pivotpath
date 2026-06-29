import Link from 'next/link'

function LockIcon({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <rect x="4" y="9.5" width="14" height="9" rx="2" stroke={color} strokeWidth="1.6" />
      <path d="M7 9.5V7a4 4 0 018 0v2.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="11" cy="13.5" r="1.4" fill={color} />
    </svg>
  )
}

/**
 * Paywall card shown to free-tier viewers in place of a paid feature
 * (full résumé, matched jobs, the rest of the strategy brief).
 *
 * `theme` matches the surrounding page: 'light' for the résumé editor
 * (off-white surface), 'dark' for the navy job/strategy screens.
 */
export function UpgradeGate({
  theme = 'dark',
  eyebrow,
  title,
  body,
  bullets = [],
  cta = 'Unlock with Pivot',
  href = '/pricing',
  fullScreen = true,
}: {
  theme?: 'light' | 'dark'
  eyebrow: string
  title: string
  body: string
  bullets?: string[]
  cta?: string
  href?: string
  fullScreen?: boolean
}) {
  const dark = theme === 'dark'
  const palette = dark
    ? {
        title: 'text-offwhite',
        body: 'text-pp-text-body',
        bullet: 'text-pp-text-body',
        card: { background: 'rgba(232,168,56,0.05)', border: '1px solid rgba(232,168,56,0.3)' },
        iconBg: 'rgba(232,168,56,0.14)',
        eyebrow: 'text-amber',
      }
    : {
        title: 'text-pp-ink',
        body: 'text-pp-ink-para',
        bullet: 'text-pp-ink-para',
        card: { background: 'rgba(232,168,56,0.06)', border: '1px solid rgba(232,168,56,0.35)' },
        iconBg: 'rgba(232,168,56,0.16)',
        eyebrow: 'text-amber',
      }

  return (
    <div className={fullScreen ? 'flex items-center justify-center px-6 py-20' : ''}>
      <div className="w-full max-w-[460px] rounded-pp-l p-8 text-center" style={palette.card}>
        <div
          className="w-14 h-14 rounded-full mx-auto mb-6 flex items-center justify-center"
          style={{ background: palette.iconBg }}
        >
          <LockIcon color="#E8A838" />
        </div>
        <p className={`font-mono text-[11px] tracking-[0.1em] uppercase mb-3 ${palette.eyebrow}`}>{eyebrow}</p>
        <h2 className={`font-display text-[26px] font-medium mb-3 ${palette.title}`}>{title}</h2>
        <p className={`text-[14px] leading-[1.6] mb-6 ${palette.body}`}>{body}</p>

        {bullets.length > 0 && (
          <ul className="text-left space-y-2 mb-7 max-w-[320px] mx-auto">
            {bullets.map((b) => (
              <li key={b} className={`flex items-start gap-2.5 text-[13.5px] ${palette.bullet}`}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 mt-0.5" aria-hidden="true">
                  <circle cx="8" cy="8" r="7.5" fill="rgba(232,168,56,0.15)" stroke="#E8A838" strokeWidth="1" />
                  <path d="M4.5 8l2.5 2.5 4.5-4.5" stroke="#E8A838" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        )}

        <Link
          href={href}
          className="inline-block bg-amber text-navy px-7 py-[13px] rounded-pp font-semibold text-[15px] hover:bg-amber/90 transition-colors shadow-pp-amber"
        >
          {cta}
        </Link>
      </div>
    </div>
  )
}
