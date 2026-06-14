import Icon from '../loaders/Icon.jsx'

const ICON_SIZES = { sm: 10, md: 12, lg: 14 }

/**
 * Tag — canonical (merged web rich + brand compat).
 *
 * Web's rich API: variant (default/naked/inverse/solid), size, color, solid,
 * active, icon, onRemove, onClick. Plus:
 *  - `hash` (default true) — prepend `#` (web's tag style). Pass hash={false}
 *    for plain labels (brand usage).
 *  - `text` — content fallback when no children (brand SwatchControls passes text=).
 */
export default function Tag({
  children,
  text,
  variant = 'default',
  size = 'md',
  color,
  solid = false,
  active = false,
  hash = true,
  icon,
  onRemove,
  onClick,
  className = ''
}) {
  const isInteractive = !!(onClick || onRemove)
  const Element = isInteractive ? 'button' : 'span'
  const iconSize = ICON_SIZES[size] || 12
  const content = children ?? text

  let baseClass
  if (variant === 'naked') {
    baseClass = color ? `tag-naked tag--${color}` : 'tag-naked'
  } else if (color) {
    baseClass = `tag tag--${color}`
  } else {
    baseClass = variant === 'inverse' ? 'tag-control-inverse' : 'tag-control'
  }

  const isSolid = solid || variant === 'solid'
  const activeClass = active ? (color ? 'tag--active' : 'is-active') : ''

  const classes = [
    baseClass,
    `tag-${size}`,
    isSolid && variant !== 'naked' ? 'tag--solid' : '',
    activeClass,
    isInteractive ? 'cursor-pointer' : '',
    className
  ].filter(Boolean).join(' ')

  const handleRemove = (e) => {
    e.stopPropagation()
    onRemove?.(e)
  }

  return (
    <Element
      type={isInteractive ? 'button' : undefined}
      className={classes}
      onClick={onClick}
    >
      {icon && <Icon name={icon} size={iconSize} />}
      <span>{hash ? '#' : ''}{content}</span>
      {onRemove && (
        <span
          role="button"
          tabIndex={-1}
          className="tag-dismiss"
          onClick={handleRemove}
        >
          <Icon name="cross" size={iconSize} />
        </span>
      )}
    </Element>
  )
}
