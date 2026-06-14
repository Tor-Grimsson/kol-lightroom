import React from 'react'

const ToggleCheckbox = ({
  label,
  checked = false,
  onChange,
  className = '',
  hint,
  ...props
}) => {
  const handleChange = (event) => {
    const next = event.target.checked
    if (onChange) onChange(next)
  }

  return (
    <label
      className={`toggle-checkbox ${checked ? 'is-active' : ''} ${className}`.trim()}
      {...props}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={handleChange}
        aria-checked={checked}
      />
      <span className="toggle-checkbox-indicator" aria-hidden="true">
        <svg viewBox="0 0 12 9" width="12" height="9">
          <polyline points="1 5 4 8 11 1" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="toggle-checkbox-label kol-helper-12 uppercase tracking-[0.08em]">
        {label}
        {hint ? <span className="ml-2 opacity-60 normal-case tracking-normal text-[10px]">{hint}</span> : null}
      </span>
    </label>
  )
}

export default ToggleCheckbox
