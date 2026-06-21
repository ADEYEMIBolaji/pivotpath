import { cn } from '@/lib/utils'

interface ReadinessScoreProps {
  score: number
  /** 'hero' — large display number (sidebar); 'chip' — inline pill; 'brief' — document header */
  variant?: 'hero' | 'chip' | 'brief'
  label?: string
  className?: string
}

/**
 * Renders the Pivot Readiness Score in three visual variants:
 *
 * hero  — large serif number + /100 + gradient progress bar + explanatory label
 *         (Translation Map sidebar, Onboarding results)
 *
 * chip  — small pill badge with score
 *         (Résumé Editor top bar, Translation Map top bar)
 *
 * brief — large serif number in a document-style layout
 *         (Strategy Brief pivot profile card)
 */
export function ReadinessScore({
  score,
  variant = 'hero',
  label,
  className,
}: ReadinessScoreProps) {
  const clampedScore = Math.max(0, Math.min(100, score))

  if (variant === 'chip') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-2 rounded-[20px] px-3 py-[5px]',
          'font-mono text-[11.5px] text-teal-light',
          'border',
          className,
        )}
        style={{
          background: 'rgba(46,107,107,0.18)',
          borderColor: 'rgba(46,107,107,0.5)',
        }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-teal-light flex-none" />
        Readiness {clampedScore}/100
      </span>
    )
  }

  if (variant === 'brief') {
    return (
      <div className={cn('text-right', className)}>
        <div className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-pp-ink-meta mb-1">
          Readiness
        </div>
        <div className="font-display text-[34px] leading-none text-teal font-medium">
          {clampedScore}
          <span className="text-[16px] text-pp-ink-cap font-normal">/100</span>
        </div>
      </div>
    )
  }

  // hero variant
  return (
    <div className={cn('', className)}>
      {/* Score number */}
      <div className="flex items-end gap-2">
        <span className="font-display text-[52px] leading-[0.9] font-medium text-teal-light">
          {clampedScore}
        </span>
        <span className="font-mono text-[14px] text-pp-text-faint pb-[6px]">/100</span>
      </div>

      {/* Progress bar */}
      <div
        className="mt-[14px] h-[7px] rounded-[4px] overflow-hidden"
        style={{ background: 'rgba(242,237,228,0.12)' }}
      >
        <div
          className="h-full"
          style={{
            width: `${clampedScore}%`,
            background: 'linear-gradient(90deg, #2E6B6B, #5FB0A6)',
          }}
        />
      </div>

      {/* Explanatory label */}
      {label && (
        <p className="text-[12.5px] leading-relaxed text-pp-text-muted mt-3">
          {label}
        </p>
      )}
    </div>
  )
}
