import React from 'react'

/**
 * Divider - Horizontal or vertical divider line
 *
 * Simple atom for creating separator lines
 * Uses bg-fg-08 for consistent 8% opacity across themes by default
 * Vertical variant includes wrapper div for proper flex behavior
 *
 * @param {Object} props
 * @param {string} props.variant - 'horizontal' or 'vertical' (default: 'horizontal')
 * @param {string} props.className - Additional classes
 * @param {string} props.opacity - Opacity level (01, 02, 04, 08, 12, 16, 24, 32, 48, 64, 80, 88, 96) (default: '08')
 */
const Divider = ({ variant = 'horizontal', className = '', opacity = '08', inverse = false }) => {
  const isVertical = variant === 'vertical'
  const opacityClass = inverse ? `bg-fg-inverse-${opacity}` : `bg-fg-${opacity}`

  if (isVertical) {
    return (
      <div className={`self-stretch flex justify-center items-center ${className}`.trim()}>
        <div className={opacityClass} style={{ width: '1px', height: '100%' }} />
      </div>
    )
  }

  return (
    <div className={className}>
      <div className={`${opacityClass} h-px w-full`} />
    </div>
  )
}

export default Divider
