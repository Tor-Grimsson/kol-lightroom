/**
 * Badge — status / categorization indicator
 *
 * Converted from Badge.tsx (shadcn/CVA) → plain JSX with kol- CSS variables.
 * CSS classes live in components.css under 2-LABELS → Badges.
 */

import Icon from '../loaders/Icon.jsx'

const VARIANT_MAP = {
  default: 'kol-badge-default',
  secondary: 'kol-badge-secondary',
  destructive: 'kol-badge-destructive',
  outline: 'kol-badge-outline',
  success: 'kol-badge-success',
  warning: 'kol-badge-warning',
  critical: 'kol-badge-critical',
  info: 'kol-badge-info'
}

const SIZE_MAP = {
  sm: 'kol-badge-sm',
  md: 'kol-badge-md',
  lg: 'kol-badge-lg'
}

const ICON_SIZES = { sm: 12, md: 14, lg: 16 }

const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  icon,
  className = '',
  ...props
}) => {
  const variantClass = VARIANT_MAP[variant] || VARIANT_MAP.default
  const sizeClass = SIZE_MAP[size] || SIZE_MAP.md

  return (
    <div
      className={`kol-badge ${variantClass} ${sizeClass} ${className}`.trim()}
      {...props}
    >
      {icon && <Icon name={icon} size={ICON_SIZES[size] ?? ICON_SIZES.md} />}
      {children}
    </div>
  )
}

export default Badge
