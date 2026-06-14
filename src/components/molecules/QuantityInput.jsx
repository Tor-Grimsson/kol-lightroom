import { useEffect, useState } from 'react'

const SIZE_MAP = {
  sm: { fontSize: 11, paddingY: 12, paddingX: 24, radius: 20, icon: 10 },
  md: { fontSize: 12, paddingY: 14, paddingX: 24, radius: 22, icon: 12 },
  lg: { fontSize: 14, paddingY: 16, paddingX: 24, radius: 24, icon: 14 }
}

const QuantityInput = ({
  value = 1,
  onChange,
  min = 1,
  max = 99,
  size,
  className = ''
}) => {
  const [resolvedSize, setResolvedSize] = useState('md')
  const [componentWidth, setComponentWidth] = useState('180px')

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

  const increment = () => {
    if (value < max) onChange?.(value + 1)
  }

  const decrement = () => {
    if (value > min) onChange?.(value - 1)
  }

  return (
    <div
      className={`relative block ${className}`}
    >
      {/* Border wrapper - EXPLICIT 42.5px height */}
      <div
        className="w-full flex items-center"
        style={{
          position: 'relative',
          height: '42.5px',
          border: '1px solid var(--kol-border-default)',
          borderRadius: `${metrics.radius}px`,
          backgroundColor: 'var(--kol-surface-primary)',
          color: 'var(--kol-surface-on-primary)',
          paddingLeft: `${metrics.paddingX}px`,
          paddingRight: `${metrics.paddingX}px`,
          fontSize: `${metrics.fontSize}px`,
          lineHeight: '120%',
          fontFamily: 'var(--kol-font-family-mono)',
          boxSizing: 'border-box'
        }}
      >
        <span>{value}</span>

        {/* Chevrons - absolute, OUTSIDE the padded content */}
        <div
          style={{
            position: 'absolute',
            right: `${metrics.paddingX}px`,
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <button
            type="button"
            onClick={increment}
            disabled={value >= max}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              padding: '0',
              cursor: value >= max ? 'not-allowed' : 'pointer',
              opacity: value >= max ? 0.3 : 1,
              lineHeight: 0,
              display: 'block'
            }}
            aria-label="Increase quantity"
          >
            <svg
              width={metrics.icon}
              height={metrics.icon}
              viewBox="0 0 12 12"
              fill="none"
            >
              <path
                d="m3 7 3-3 3 3"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={decrement}
            disabled={value <= min}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              padding: '0',
              cursor: value <= min ? 'not-allowed' : 'pointer',
              opacity: value <= min ? 0.3 : 1,
              lineHeight: 0,
              display: 'block'
            }}
            aria-label="Decrease quantity"
          >
            <svg
              width={metrics.icon}
              height={metrics.icon}
              viewBox="0 0 12 12"
              fill="none"
            >
              <path
                d="m3 5 3 3 3-3"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default QuantityInput
