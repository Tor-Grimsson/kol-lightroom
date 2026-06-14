/**
 * Icon Component
 *
 * Dynamically loads and renders SVG icons from the svg/ directory (including subdirectories)
 *
 * @param {Object} props
 * @param {string} props.name - Icon name (matches SVG filename without extension)
 * @param {number|string} props.size - Icon size (default: 16)
 * @param {string} props.className - Additional classes
 * @param {Object} props.style - Inline styles
 * @param {ReactNode} props.children - Optional: Direct SVG path content for custom icons
 */
/* Unified icon home. Canonical mirrored set (stroke + solid) + legacy loader set
 * + web's app-specific set (chess/dashboard/docs), all folded into this package so
 * a name always resolves across web + brand. `variant` picks stroke vs solid. */
const strokeModules = import.meta.glob('./stroke/**/*.svg',  { eager: true, query: '?raw', import: 'default' })
const solidModules  = import.meta.glob('./solid/**/*.svg',   { eager: true, query: '?raw', import: 'default' })
const legacyModules = import.meta.glob('./svg/**/*.svg',     { eager: true, query: '?raw', import: 'default' })
const kolLegacy     = import.meta.glob('./svg/00-kol/*.svg', { eager: true, query: '?raw', import: 'default' })
const webModules    = import.meta.glob('./svg-web/**/*.svg', { eager: true, query: '?raw', import: 'default' })

const byName = (mods) => {
  const c = {}
  for (const [path, svg] of Object.entries(mods)) {
    c[(path.split('/').pop() || '').replace('.svg', '')] = svg
  }
  return c
}
const STROKE = byName(strokeModules)
const SOLID  = byName(solidModules)
const WEB    = byName(webModules)
const LEGACY = (() => { const c = byName(legacyModules); Object.assign(c, byName(kolLegacy)); return c })()

/* Canonical staging variant wins (kills drift); then the other variant, then the
 * legacy loader set, then web's app-specific icons. */
const resolveIcon = (name, variant) =>
  (variant === 'solid' ? SOLID : STROKE)[name]
  ?? (variant === 'solid' ? STROKE : SOLID)[name]
  ?? LEGACY[name]
  ?? WEB[name]

const normalizeSize = (value) => {
  if (typeof value === 'number') {
    return `${value}px`
  }
  if (typeof value === 'string') {
    return value
  }
  return '16px'
}

const applySizeToMarkup = (markup, sizeValue) => {
  let updated = markup

  if (/width="/i.test(updated)) {
    updated = updated.replace(/width="[^"]*"/i, `width="${sizeValue}"`)
  } else {
    updated = updated.replace('<svg', `<svg width="${sizeValue}"`)
  }

  if (/height="/i.test(updated)) {
    updated = updated.replace(/height="[^"]*"/i, `height="${sizeValue}"`)
  } else {
    updated = updated.replace('<svg', `<svg height="${sizeValue}"`)
  }

  return updated
}

const Icon = ({
  name,
  size = 16,
  variant = 'stroke',
  className = '',
  style = {},
  children
}) => {
  // If children are provided, render directly (for custom icons)
  if (children) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        className={`inline-block ${className}`}
        style={{
          verticalAlign: 'middle',
          ...style
        }}
      >
        {children}
      </svg>
    )
  }

  const svgMarkup = resolveIcon(name, variant)

  if (!svgMarkup) {
    console.warn(`Icon "${name}" not found in icon set`)
    return null
  }

  const dimension = normalizeSize(size)
  const sizedMarkup = applySizeToMarkup(svgMarkup, dimension)

  return (
    <span
      className={`inline-flex items-center justify-center ${className}`}
      style={{
        width: dimension,
        height: dimension,
        lineHeight: 0,
        ...style
      }}
      dangerouslySetInnerHTML={{ __html: sizedMarkup }}
    />
  )
}

export default Icon
