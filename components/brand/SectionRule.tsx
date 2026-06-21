import { cn } from '@/lib/utils'

// ── Overline label + heading (used in landing/results sections) ───────────────
interface OverlineProps {
  overline: string
  heading: React.ReactNode
  body?: string
  /** Color of the overline label — defaults to amber */
  overlineColor?: 'amber' | 'teal'
  className?: string
}

/**
 * Section header pattern used throughout the marketing and results screens:
 *   OVERLINE LABEL (mono, uppercase)
 *   Section Heading (display serif)
 *   Optional body paragraph
 */
export function SectionOverline({
  overline,
  heading,
  body,
  overlineColor = 'amber',
  className,
}: OverlineProps) {
  const overlineClass =
    overlineColor === 'teal' ? 'text-teal' : 'text-amber'

  return (
    <div className={cn('', className)}>
      <div className={cn('font-mono text-[12px] tracking-[0.2em] uppercase mb-[18px]', overlineClass)}>
        {overline}
      </div>
      <h2 className="font-display font-medium text-balance tracking-[-0.02em] m-0">
        {heading}
      </h2>
      {body && (
        <p className="text-[16px] leading-[1.55] mt-[14px] mb-0">
          {body}
        </p>
      )}
    </div>
  )
}

// ── Numbered section rule (Strategy Brief) ────────────────────────────────────
interface NumberedRuleProps {
  num: string       // e.g. "01", "02"
  title: string
  className?: string
}

/**
 * The numbered section divider used in the Strategy Brief document:
 *   01  ─────────────────────────────
 *       Section Title
 */
export function NumberedSectionRule({ num, title, className }: NumberedRuleProps) {
  return (
    <div className={cn('flex items-baseline gap-3 mb-[18px] border-b-2 border-pp-ink pb-[10px]', className)}>
      <span className="font-mono text-[13px] text-amber">{num}</span>
      <h2 className="font-display font-medium text-pp-ink tracking-[-0.01em] m-0">
        {title}
      </h2>
    </div>
  )
}

// ── Step row divider (How it works) ───────────────────────────────────────────
interface StepRowProps {
  num: string      // e.g. "01"
  title: string
  body: string
  className?: string
}

/**
 * One row in the "How it works" step list:
 *   01   Ingest ────►   Description…
 */
export function StepRow({ num, title, body, className }: StepRowProps) {
  return (
    <div
      className={cn(
        'grid items-start border-t',
        'py-[clamp(24px,3vw,36px)] gap-[clamp(18px,3vw,40px)]',
        className,
      )}
      style={{
        gridTemplateColumns: 'auto auto 1fr',
        borderColor: 'rgba(15,25,35,0.14)',
      }}
    >
      <div className="font-mono text-[13px] text-pp-ink-cap pt-[6px]">{num}</div>
      <div
        className="font-display font-medium tracking-[-0.01em] text-pp-ink flex items-center gap-[14px]"
        style={{ fontSize: 'clamp(22px,2.4vw,30px)', minWidth: 'clamp(140px,16vw,200px)' }}
      >
        {title}
        {/* inline amber arrow */}
        <svg
          width="34"
          height="12"
          viewBox="0 0 34 12"
          fill="none"
          aria-hidden="true"
          className="flex-none opacity-85"
        >
          <line x1="0" y1="6" x2="26" y2="6" stroke="#E8A838" strokeWidth="1.5" />
          <path
            d="M24 2 L30 6 L24 10"
            stroke="#E8A838"
            strokeWidth="1.5"
            fill="none"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <p
        className="text-pp-ink-para leading-[1.6] m-0 max-w-[560px] pt-1"
        style={{ fontSize: 'clamp(15px,1.3vw,17px)' }}
      >
        {body}
      </p>
    </div>
  )
}
