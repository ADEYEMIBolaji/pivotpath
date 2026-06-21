import { cn } from '@/lib/utils'

interface LogoProps {
  /** Controls the tile + icon size */
  size?: 'sm' | 'md' | 'lg'
  /** Show "Transition Intelligence" tagline below the wordmark */
  showTagline?: boolean
  className?: string
}

const sizes = {
  sm: { tile: 34, icon: 19, radius: 'rounded-[9px]', wordmark: 'text-[20px]' },
  md: { tile: 40, icon: 22, radius: 'rounded-[10px]', wordmark: 'text-[22px]' },
  lg: { tile: 48, icon: 26, radius: 'rounded-[12px]', wordmark: 'text-[26px]' },
} as const

/**
 * The PivotPath logo: amber tile with the pivot-arrow glyph + wordmark.
 *
 * Used in Nav (md), Footer (sm), Strategy Brief toolbar (sm).
 */
export function Logo({ size = 'md', showTagline = false, className }: LogoProps) {
  const s = sizes[size]

  return (
    <div className={cn('flex items-center', size === 'sm' ? 'gap-[10px]' : 'gap-[13px]', className)}>
      {/* ── Amber tile ── */}
      <span
        className={cn(
          'inline-flex items-center justify-center flex-none bg-amber',
          s.radius,
          size === 'lg' && 'shadow-pp-amber',
        )}
        style={{ width: s.tile, height: s.tile }}
      >
        {/* Pivot-arrow glyph: origin dot → L-turn path → arrowhead */}
        <svg
          width={s.icon}
          height={s.icon}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="5" cy="18.5" r="2.3" fill="#0F1923" />
          <path
            d="M5 18.5 H13 V9"
            stroke="#0F1923"
            strokeWidth="2.2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9.6 11.5 L13 7 L16.4 11.5"
            stroke="#0F1923"
            strokeWidth="2.2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>

      {/* ── Wordmark + optional tagline ── */}
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            'font-display font-semibold tracking-[-0.01em] text-offwhite',
            s.wordmark,
          )}
        >
          PivotPath
        </span>
        {showTagline && (
          <span className="font-mono text-[8.5px] tracking-[0.24em] uppercase text-pp-text-faint mt-1">
            Transition Intelligence
          </span>
        )}
      </span>
    </div>
  )
}
