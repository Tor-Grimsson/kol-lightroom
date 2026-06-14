/**
 * TransparentX — diagonal stroke indicator for transparent / disabled / unused
 * slots. Universal "no value" affordance.
 *
 * Renders absolute-positioned to fill its parent. Parent must be `position:
 * relative` and apply `overflow: hidden` if a clean clip at the corners is
 * desired. Stroke uses non-scaling stroke so the line stays a thin 1px
 * regardless of container size.
 *
 * Props:
 *   tone — 'warning' (default, yellow) | 'error' (red) | 'info' (blue) |
 *          'success' (green). Maps to `var(--ui-{tone})`.
 */
const TONE_VAR = {
  warning: 'var(--ui-warning)',
  error:   'var(--ui-error)',
  info:    'var(--ui-info)',
  success: 'var(--ui-success)',
}

export default function TransparentX({ tone = 'warning', className = '' }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      preserveAspectRatio="none"
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`.trim()}
    >
      <line
        x1="0" y1="24" x2="24" y2="0"
        stroke={TONE_VAR[tone] ?? TONE_VAR.warning}
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
