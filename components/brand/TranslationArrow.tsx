import { cn } from '@/lib/utils'

interface TranslationArrowProps {
  /**
   * Total SVG width in px. Height is derived from width using the brand ratio
   * unless `height` is also specified.
   * Defaults to 40 (the standard inline-table size).
   */
  width?: number
  /** Total SVG height in px. Defaults to width * 0.3. */
  height?: number
  /** Stroke/fill color. Defaults to amber #E8A838. */
  color?: string
  /** Stroke width. Defaults to 1.5. */
  strokeWidth?: number
  /**
   * Render an origin circle at the start of the arrow —
   * the "origin dot" half of the signature motif.
   */
  withDot?: boolean
  /**
   * Animate the line with a drawing-in dash effect (ppDash keyframe).
   * Used in the hero translation preview cards.
   */
  animated?: boolean
  /** Animation delay in seconds. Used when staggering multiple arrows. */
  animDelay?: number
  /** Vertical variant — used in the Translation Map sidebar pivot summary. */
  vertical?: boolean
  className?: string
  'aria-hidden'?: boolean | 'true' | 'false'
}

/**
 * The PivotPath "translation arrow" motif:
 *   (optional circle dot) ──────► new language
 *
 * Used everywhere two states are being connected:
 *   - Hero preview card rows (horizontal, animated, no dot)
 *   - "How it works" step rows (horizontal, no dot)
 *   - Translation Map pivot header (horizontal, with dot)
 *   - Translation Map table rows (horizontal, no dot)
 *   - Translation Map sidebar (vertical, with dot)
 *   - Testimonial from→to labels (tiny horizontal, no dot)
 *   - Strategy Brief bridge roles (horizontal, with dot)
 *   - Hero / final CTA decoration (large, with dot)
 *
 * The geometry scales proportionally from the arrow dimensions so all
 * instances look consistent regardless of size.
 */
export function TranslationArrow({
  width = 40,
  height,
  color = '#E8A838',
  strokeWidth = 1.5,
  withDot = false,
  animated = false,
  animDelay = 0,
  vertical = false,
  className,
  'aria-hidden': ariaHidden = true,
}: TranslationArrowProps) {
  // Derive height from width if not provided
  const h = height ?? Math.round(width * 0.3)
  const w = width

  if (vertical) {
    return (
      <VerticalArrow
        width={w}
        height={h || w * 2.5}
        color={color}
        strokeWidth={strokeWidth}
        className={className}
        ariaHidden={ariaHidden}
      />
    )
  }

  // ── Horizontal geometry ────────────────────────────────────────────────────
  // Derived proportionally from the design's reference sizes (56×16 with dot,
  // 40×12 without dot). Verified against all instances in the 5 prototypes.
  const midY        = h / 2
  const dotR        = h * 0.219          // ≈ 3.5 at h=16
  const lineStart   = withDot ? dotR * 2 + h * 0.125 : 0
  const lineEnd     = w * 0.786          // ≈ 44 at w=56
  const arrowBase   = lineEnd - h * 0.125
  const arrowPeak   = lineEnd + h * 0.375
  const arrowSpread = h * 0.3125         // ≈ 5 at h=16

  const dashStyle = animated
    ? {
        strokeDasharray: '60',
        animation: `ppDash 1.1s ease ${animDelay}s both`,
      }
    : undefined

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      fill="none"
      aria-hidden={ariaHidden}
      className={cn('flex-none', className)}
    >
      {withDot && (
        <circle cx={dotR} cy={midY} r={dotR} fill={color} />
      )}
      <line
        x1={lineStart}
        y1={midY}
        x2={lineEnd}
        y2={midY}
        stroke={color}
        strokeWidth={strokeWidth}
        style={dashStyle}
      />
      <path
        d={`M${arrowBase} ${midY - arrowSpread} L${arrowPeak} ${midY} L${arrowBase} ${midY + arrowSpread}`}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}

// ── Vertical variant ─────────────────────────────────────────────────────────
// Used in Translation Map sidebar: circle top → line down → arrowhead.
// Reference: <svg width="16" height="40"> in the prototype.
function VerticalArrow({
  width,
  height,
  color,
  strokeWidth,
  className,
  ariaHidden,
}: {
  width: number
  height: number
  color: string
  strokeWidth: number
  className?: string
  ariaHidden: boolean | 'true' | 'false'
}) {
  const midX      = width / 2
  const dotR      = width * 0.1875       // ≈ 3 at w=16
  const lineStart = dotR * 2 + width * 0.125
  const lineEnd   = height * 0.8
  const arrowBase = lineEnd - width * 0.125
  const arrowPeak = lineEnd + width * 0.3125 * 1.6
  const spread    = width * 0.3125       // ≈ 5 at w=16

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      aria-hidden={ariaHidden}
      className={cn('flex-none', className)}
    >
      <circle cx={midX} cy={dotR} r={dotR} fill={color} />
      <line
        x1={midX}
        y1={lineStart}
        x2={midX}
        y2={lineEnd}
        stroke={color}
        strokeWidth={strokeWidth}
      />
      <path
        d={`M${midX - spread} ${arrowBase} L${midX} ${arrowPeak} L${midX + spread} ${arrowBase}`}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}
