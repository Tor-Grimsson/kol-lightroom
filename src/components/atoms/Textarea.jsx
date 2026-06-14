import Icon from '../loaders/Icon.jsx'

/**
 * Textarea — multi-line text atom built on the .kol-control shell with the
 * `--textarea` modifier (display: block).
 *
 *   variant="filled" (default) — persistent solid bg
 *   variant="ghost"            — borderless at rest, reveals on hover/focus
 *   variant="outline"          — bordered, transparent bg
 *
 *   size="sm" / "md" (default) / "lg" — padding + type class
 *
 * Default rows = 3 (kept short — long content gets scrollbars instead of
 * dominating the panel). No native resize handle — fixed size, scrollable
 * overflow. The kol resize-corner icon in the bottom-right is decorative.
 *
 * Controlled OR uncontrolled:
 *   - pass `value` + `onChange` for controlled,
 *   - pass `value` alone (no onChange) and we route through defaultValue.
 *
 * Pairs with `<Input>` for single-line.
 */

const SIZE_TYPE = { sm: 'kol-mono-12', md: 'kol-mono-14', lg: 'kol-mono-16' }

export default function Textarea({
  value,
  onChange,
  variant = 'filled',
  size = 'md',
  rows = 3,
  placeholder,
  disabled = false,
  className = '',
  ...props
}) {
  const wrapperCls = [
    'kol-control',
    `kol-control--${variant}`,
    'kol-control--textarea',
    `kol-control-${size}`,
    SIZE_TYPE[size],
    'relative block w-full',
    className,
  ].filter(Boolean).join(' ')

  /* React requires controlled inputs (value + onChange) OR uncontrolled
   * (defaultValue only). Pick based on whether onChange was passed. */
  const valueProps = onChange
    ? { value: value ?? '', onChange }
    : { defaultValue: value ?? '' }

  return (
    <label className={wrapperCls} aria-disabled={disabled || undefined}>
      <textarea
        {...valueProps}
        rows={rows}
        placeholder={placeholder}
        disabled={disabled}
        spellCheck={false}
        className="block w-full bg-transparent border-none outline-none text-auto"
        style={{ resize: 'none' }}
        {...props}
      />
      <span aria-hidden="true" className="kol-textarea-resize-icon text-meta pointer-events-none">
        <Icon name="resize-corner" size={12} />
      </span>
    </label>
  )
}
