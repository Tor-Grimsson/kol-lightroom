import { useEffect, useState } from 'react'

// Match Dropdown SIZE_MAP for consistent height
const SIZE_MAP = {
  sm: { fontSize: 11, paddingY: 12, paddingX: 24, radius: 20 },
  md: { fontSize: 12, paddingY: 14, paddingX: 24, radius: 22 },
  lg: { fontSize: 14, paddingY: 16, paddingX: 24, radius: 24 }
}

const QuantityStepper = ({
  value = 1,
  onChange,
  min = 1,
  max = 10,
  size,
  className = ''
}) => {
  const [resolvedSize, setResolvedSize] = useState('md')
  const [componentWidth, setComponentWidth] = useState('180px')

  // Responsive size
  useEffect(() => {
    const determineSize = () => {
      if (size) {
        setResolvedSize(size)
        return
      }

      if (typeof window === 'undefined') {
        setResolvedSize('md')
        return
      }

      if (window.innerWidth >= 1024) {
        setResolvedSize('lg')
      } else if (window.innerWidth >= 768) {
        setResolvedSize('md')
      } else {
        setResolvedSize('sm')
      }
    }

    determineSize()
    window.addEventListener('resize', determineSize)
    return () => window.removeEventListener('resize', determineSize)
  }, [size])

  // Width management - match Dropdown
  useEffect(() => {
    const updateWidth = () => {
      if (typeof window === 'undefined') return

      if (window.innerWidth >= 1024) {
        setComponentWidth('180px')
      } else if (window.innerWidth >= 768) {
        setComponentWidth('140px')
      } else {
        setComponentWidth('100px')
      }
    }
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  const metrics = SIZE_MAP[resolvedSize] || SIZE_MAP.md

  const decrement = () => {
    if (value > min) onChange?.(value - 1)
  }

  const increment = () => {
    if (value < max) onChange?.(value + 1)
  }

  const buttonStyle = {
    padding: `${metrics.paddingY}px 12px`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--kol-surface-on-primary)',
    cursor: 'pointer',
    transition: 'opacity 0.15s',
    fontFamily: 'var(--kol-font-family-mono)',
    fontSize: `${metrics.fontSize}px`,
    lineHeight: '120%'
  }

  const disabledStyle = {
    opacity: 0.3,
    cursor: 'not-allowed'
  }

  return (
    <div
      className={`flex items-center justify-center ${className}`}
      style={{
        width: componentWidth,
        minWidth: componentWidth,
        border: '1px solid var(--kol-border-default)',
        borderRadius: `${metrics.radius}px`,
        backgroundColor: 'var(--kol-surface-primary)'
      }}
    >
      <button
        type="button"
        onClick={decrement}
        disabled={value <= min}
        style={{
          ...buttonStyle,
          ...(value <= min ? disabledStyle : {})
        }}
        aria-label="Decrease quantity"
      >
        −
      </button>

      <span
        style={{
          minWidth: '24px',
          textAlign: 'center',
          color: 'var(--kol-surface-on-primary)',
          fontFamily: 'var(--kol-font-family-mono)',
          fontSize: `${metrics.fontSize}px`,
          lineHeight: '120%'
        }}
      >
        {value}
      </span>

      <button
        type="button"
        onClick={increment}
        disabled={value >= max}
        style={{
          ...buttonStyle,
          ...(value >= max ? disabledStyle : {})
        }}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  )
}

export default QuantityStepper
