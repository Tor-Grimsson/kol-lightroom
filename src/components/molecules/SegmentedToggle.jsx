/**
 * SegmentedToggle — N-way segmented control. Joined buttons sharing one
 * outer stroke; thin dividers between cells; no gap. Active cell uses
 * bg-fg-04 + text-emphasis, inactive is text-meta with hover lifting.
 *
 *   <SegmentedToggle
 *     value={current}
 *     onChange={setCurrent}
 *     options={[{ value, label }]}
 *   />
 *
 * Companion to `ViewToggle`:
 *   - ViewToggle (text)   — bare segmented buttons separated by gap; no shared shell.
 *   - ViewToggle (icon)   — inset-well row of square icon buttons.
 *   - SegmentedToggle     — flat segmented strip with shared border + dividers.
 *
 * Labels accept any node — pass strings or inline SVG previews. Optional
 * `ariaLabel` per option for non-text labels.
 *
 * Props:
 *   value     — current option value
 *   onChange  — handler (newValue) => void
 *   options   — [{ value, label, ariaLabel? }]
 *   size      — 'md' (default, 26px) | 'sm' (16px). `sm` is for icon/preview-
 *               only options (e.g. line-style previews) where text labels
 *               aren't used; the cells still center their contents but the
 *               outer height is tighter.
 *   className — additional classes on the outer shell
 */
export default function SegmentedToggle({ value, onChange, options = [], size = 'md', className = '' }) {
  const wrapHeight = size === 'sm' ? 'h-4' : 'h-[26px]'   /* 16 vs 26 */
  const cellType   = size === 'sm' ? '' : 'kol-mono-12'
  return (
    <div className={`flex ${wrapHeight} border border-fg-04 rounded overflow-hidden ${className}`}>
      {options.map((opt, i) => {
        const isActive = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange?.(opt.value)}
            aria-pressed={isActive}
            aria-label={opt.ariaLabel}
            className={[
              `flex-1 ${cellType} inline-flex items-center justify-center cursor-pointer`,
              isActive ? 'bg-surface-secondary text-emphasis' : 'text-meta hover:text-emphasis',
              i > 0 ? 'border-l border-fg-04' : '',
            ].filter(Boolean).join(' ')}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
