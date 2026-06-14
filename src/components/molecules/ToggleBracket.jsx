/**
 * ToggleBracket — text-pair toggle showing `Label [STATE]`.
 *
 *   variant="default" — Filled shell (bg-surface-secondary). When ON,
 *                       overrides to accent-yellow with navy ink.
 *   variant="plain"   — Bare text rows, no chrome. For inline contexts
 *                       (sidenav child rows, dense panels).
 */
const ToggleBracket = ({
  label,
  value = false,
  onToggle,
  onChange,
  offLabel = 'OFF',
  onLabel = 'ON',
  variant = 'default',
  className = '',
  ...props
}) => {
  const handleClick = () => {
    if (onToggle) onToggle(!value)
    if (onChange) onChange(!value)
  }

  const isPlain = variant === 'plain'

  const cls = isPlain
    ? `inline-flex items-center gap-3 kol-mono-12 uppercase text-meta hover:text-emphasis transition-colors bg-transparent border-0 p-0 cursor-pointer ${className}`
    : `kol-control kol-control--filled kol-control-md kol-mono-12 uppercase justify-between gap-3 ${value ? 'toggle-bracket--active' : ''} ${className}`

  return (
    <button
      type="button"
      className={cls.trim()}
      onClick={handleClick}
      aria-pressed={value}
      {...props}
    >
      <span>{label}</span>
      <span>[{value ? onLabel : offLabel}]</span>
    </button>
  )
}

export default ToggleBracket
