import { useEffect, useState } from 'react'
import Icon from '../loaders/Icon.jsx'
import { MenuDropdownItem } from './MenuItem.jsx'
import { PopoverPanel, usePopover } from './Popover.jsx'

const SIZE_MAP = {
  sm: { fontSize: 12, paddingY: 4, paddingX: 12, radius: 14, panelRadius: 14, icon: 10 },
  md: { fontSize: 12, paddingY: 6, paddingX: 16, radius: 22, panelRadius: 22, icon: 12 },
  lg: { fontSize: 14, paddingY: 8, paddingX: 20, radius: 24, panelRadius: 24, icon: 14 }
}

const SIZE_TYPE = { sm: 'kol-mono-12', md: 'kol-mono-12', lg: 'kol-mono-14' }

const Dropdown = ({
  options = [],
  value,
  onChange,
  size,
  variant = 'default',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [resolvedSize, setResolvedSize] = useState('md')
  const [dropdownWidth, setDropdownWidth] = useState('100px')

  /* Floating-ui popover. `flip: false` keeps the panel below the button
   * — the seamless border-radius edge between button and panel assumes
   * the panel sits below; flipping above would visually disconnect them.
   * `matchReferenceWidth: true` pins panel min-width to the button. */
  const popover = usePopover({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: 'bottom-start',
    offset: variant === 'minimal' ? 0 : -1,
    flip: false,
    matchReferenceWidth: true,
    role: 'listbox',
  })

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

    return () => {
      window.removeEventListener('resize', determineSize)
    }
  }, [size])

  // Width management for variants
  useEffect(() => {
    const updateWidth = () => {
      if (typeof window === 'undefined') return

      if (variant === 'minimal' || variant === 'subtle') {
        // Minimal/subtle: 100px mobile, 140px tablet+
        setDropdownWidth(window.innerWidth >= 768 ? '140px' : '100px')
      } else if (variant === 'default') {
        // Default: 100px mobile, 140px tablet, 180px desktop
        if (window.innerWidth >= 1024) {
          setDropdownWidth('180px')
        } else if (window.innerWidth >= 768) {
          setDropdownWidth('140px')
        } else {
          setDropdownWidth('100px')
        }
      }
    }
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [variant])

  const metrics = SIZE_MAP[resolvedSize] || SIZE_MAP.md

  // Variant-specific styles
  const variantStyles = {
    default: {
      border: '1px solid var(--kol-border-default)',
      borderRadius: isOpen
        ? `${metrics.radius}px ${metrics.radius}px 0 0`
        : `${metrics.radius}px`,
      backgroundColor: 'var(--kol-surface-primary)',
      padding: `${metrics.paddingY}px ${metrics.paddingX}px`
    },
    minimal: {
      border: 'none',
      borderRadius: '0',
      backgroundColor: 'transparent',
      padding: '0',
      height: '24px',
      display: 'flex',
      alignItems: 'center'
    },
    subtle: {
      /* 1px transparent border so total height matches Button + Input + the
       * other shared-control atoms (which have a transparent 1px border for
       * hover/focus consistency). Without this, subtle is 2px shorter. */
      border: '1px solid transparent',
      borderRadius: isOpen ? '4px 4px 0 0' : '4px',
      backgroundColor: 'var(--kol-surface-secondary)',
      padding: `${metrics.paddingY}px ${metrics.paddingX}px`
    }
  }

  const styles = variantStyles[variant] || variantStyles.default

  const handleSelect = (option) => {
    onChange?.(option.value)
    setIsOpen(false)
  }

  const currentOption = options.find((opt) => opt.value === value) || options[0]

  return (
    <div
      className={`relative block ${className}`}
      style={{
        ...((variant === 'minimal' || variant === 'default' || variant === 'subtle') && dropdownWidth && !className.includes('w-full') && {
          width: dropdownWidth,
          minWidth: dropdownWidth
        })
      }}
    >
      <button
        ref={popover.refs.setReference}
        {...popover.getReferenceProps()}
        type="button"
        className={`w-full flex items-center justify-between transition-colors duration-200 ${SIZE_TYPE[resolvedSize]}`}
        style={{
          border: styles.border,
          borderRadius: styles.borderRadius,
          backgroundColor: styles.backgroundColor,
          color: 'var(--kol-surface-on-primary)',
          padding: styles.padding,
          transition: 'background-color 0.2s, color 0.2s, border-color 0.2s',
          ...(variant === 'minimal' && {
            height: styles.height,
          }),
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        data-state={isOpen ? 'open' : 'closed'}
      >
        <span className="opacity-100">{currentOption?.label}</span>
        <Icon
          name="chevron-down"
          size={metrics.icon}
          className="ml-auto"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 300ms',
          }}
        />
      </button>

      <PopoverPanel
        popover={popover}
        panel={false}
        focus={false}
        style={{
          backgroundColor: variant === 'minimal'
            ? 'var(--kol-surface-primary)'
            : styles.backgroundColor,
          color: 'var(--kol-surface-on-primary)',
          border: variant === 'subtle' ? 'none' : styles.border,
          borderRadius: variant === 'minimal'
            ? '0'
            : (variant === 'subtle'
                ? '0 0 4px 4px'
                : `0 0 ${metrics.panelRadius}px ${metrics.panelRadius}px`),
        }}
      >
        {variant !== 'minimal' && (
          <div style={{ padding: `0 ${metrics.paddingX}px` }}>
            <div
              style={{
                height: '1px',
                backgroundColor: 'var(--kol-border-default)'
              }}
            />
          </div>
        )}

        <div className="flex max-h-[300px] flex-col items-stretch overflow-y-auto" role="listbox">
          {options.map((option) => {
            const isActive = option.value === currentOption?.value
            return (
              <MenuDropdownItem
                key={option.value}
                onClick={() => handleSelect(option)}
                shortcut={isActive ? <Icon name="check" size={11} /> : undefined}
              >
                {option.label}
              </MenuDropdownItem>
            )
          })}
        </div>
      </PopoverPanel>
    </div>
  )
}

export default Dropdown
