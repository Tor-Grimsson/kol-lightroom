import React from 'react'

const ToggleSwitch = ({
  label,
  checked = false,
  onChange,
  onToggle,
  variant = 'default',
  className = '',
  hint,
  ...props
}) => {
  const handleClick = () => {
    if (onToggle) onToggle(!checked)
    if (onChange) onChange(!checked)
  }

  const variantClass = variant === 'plain' ? 'toggle-switch--plain' : ''

  return (
    <button
      type="button"
      className={`toggle-switch ${variantClass} ${className}`.trim()}
      data-state={checked ? 'on' : 'off'}
      onClick={handleClick}
      aria-pressed={checked}
      {...props}
    >
      <span className="toggle-switch-label">
        {label}
        {hint ? (
          <span className="ml-2 opacity-60 normal-case tracking-normal text-[10px]">
            {hint}
          </span>
        ) : null}
      </span>
      <span className="toggle-switch-indicator" aria-hidden="true" />
    </button>
  )
}

export default ToggleSwitch
