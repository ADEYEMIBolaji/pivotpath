import { cn } from '@/lib/utils'
import type { ConfidenceTier } from '@/lib/types'

interface ConfidenceBadgeProps {
  tier: ConfidenceTier
  className?: string
}

const STYLES: Record<
  ConfidenceTier,
  { label: string; fg: string; bg: string; border: string }
> = {
  high:    { label: 'High',          fg: '#1E5A4E', bg: '#DCEBE5', border: '#9ECBBE' },
  partial: { label: 'Partial',       fg: '#9A6A14', bg: '#F7E6C4', border: '#E0BD79' },
  frame:   { label: 'Needs framing', fg: '#5A6470', bg: '#ECE7DC', border: '#C9C1B2' },
}

/**
 * Confidence badge used in translation-map table rows.
 * Rendered as a small all-caps mono label with tier-appropriate color triplet.
 */
export function ConfidenceBadge({ tier, className }: ConfidenceBadgeProps) {
  const s = STYLES[tier]
  return (
    <span
      className={cn('inline-block font-mono text-[10.5px] tracking-[0.1em] uppercase whitespace-nowrap rounded-pp', className)}
      style={{
        padding: '5px 9px',
        color: s.fg,
        background: s.bg,
        border: `1px solid ${s.border}`,
      }}
    >
      {s.label}
    </span>
  )
}
