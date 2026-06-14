import { useEffect, useMemo, useState } from 'react'
import Input from './Input.jsx'

/**
 * Slider — range slider with label and an editable value readout.
 *
 * Variants (track/shell styling):
 *   default — bordered track + boxed value.
 *   minimal — bare track + boxed value. 99% of real usage (foundry previews,
 *             inline controls). PRESERVED from web.
 *   subtle  — filled rounded chip; for inspector-style controls.
 *
 * The value readout is an editable <Input> (type a value, commit on
 * blur / Enter, revert on Escape). Track color is exposed as the
 * `--kol-slider-track` CSS variable on `.slider-black`; override
 * per-instance via style={{ '--kol-slider-track': '...' }}.
 *
 * @param {Object} props
 * @param {string} props.label - Slider label text
 * @param {number} props.min - Minimum value
 * @param {number} props.max - Maximum value
 * @param {number} props.value - Current value
 * @param {Function} props.onChange - Change handler
 * @param {'default'|'minimal'|'subtle'} props.variant - Visual variant (default: 'default')
 * @param {string} props.className - Additional wrapper classes
 * @param {number} props.displayWidth - Width of the value readout, in characters (default: 6)
 * @param {string} props.fontSize - Font size for label/value (e.g., '11px')
 * @param {number} props.step - Slider step increment (default: 1)
 * @param {Function} props.formatValue - Optional formatter for displayed value
 */
const Slider = ({
  label,
  min = 0,
  max = 100,
  value = 0,
  onChange,
  variant = 'default',
  className = '',
  displayWidth = 6,
  fontSize,
  step = 1,
  formatValue
}) => {
  const handleChange = (e) => {
    if (onChange) {
      onChange(Number(e.target.value))
    }
  }

  const variantClass = variant === 'minimal'
    ? 'control-slider-minimal'
    : variant === 'subtle'
    ? 'control-slider-subtle'
    : 'control-slider'

  const decimals = useMemo(() => {
    if (formatValue) return null
    if (!Number.isFinite(step)) return 0
    if (step >= 1) return 0
    const decimalPart = step.toString().split('.')[1]
    return decimalPart ? decimalPart.length : 2
  }, [formatValue, step])

  const displayValue = useMemo(() => {
    if (formatValue) return String(formatValue(value))
    if (decimals && decimals > 0) {
      return Number(value).toFixed(decimals)
    }
    return String(Math.round(value))
  }, [decimals, formatValue, value])

  /* Editable readout — local string state lets the user type intermediate
   * values (e.g. "-" while entering a negative) without clamping mid-keystroke.
   * Commits on blur / Enter; reverts to current value on Escape. */
  const [draft, setDraft]     = useState(displayValue)
  const [editing, setEditing] = useState(false)
  useEffect(() => { if (!editing) setDraft(displayValue) }, [displayValue, editing])

  const commit = () => {
    setEditing(false)
    const parsed = Number(draft)
    if (!Number.isFinite(parsed) || onChange == null) {
      setDraft(displayValue)
      return
    }
    const clamped = Math.max(min, Math.min(max, parsed))
    onChange(clamped)
    setDraft(String(clamped))
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter')  { e.currentTarget.blur() }
    if (e.key === 'Escape') { setDraft(displayValue); setEditing(false); e.currentTarget.blur() }
  }

  return (
    <div className={`${variantClass} gap-3 shadow-none ${className}`}>
      {label && (
        <label className="kol-helper-12 whitespace-nowrap shrink-0 w-fit" style={fontSize ? { fontSize } : undefined}>
          {label}
        </label>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
        className="slider-black flex-1 w-full cursor-pointer"
      />
      <Input
        type="text"
        inputMode="decimal"
        variant="filled"
        size="sm"
        chars={displayWidth}
        value={draft}
        onFocus={(e) => { setEditing(true); e.target.select() }}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={onKeyDown}
        inputClassName="text-center"
      />
    </div>
  )
}

export default Slider
