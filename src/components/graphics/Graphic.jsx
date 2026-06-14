/**
 * Graphic — SVG illustration loader.
 *
 * Globs ./svg/<category>/<name>.svg at build time. Usage:
 *   <Graphic category="patterns" name="pattern-05" />
 *
 * When an asset is missing, renders an AssetPlaceholder with the
 * category/name labeled — missing graphics are visible rather than silently
 * empty. Matches the logo loader pattern (loader lives with assets).
 */
import AssetPlaceholder from '../primitives/AssetPlaceholder.jsx'

const svgModules = import.meta.glob('./svg/**/*.svg', { eager: true, query: '?raw', import: 'default' })

// category → name → raw SVG string. Exported so gallery/table consumers
// (e.g. AssetTable) read raw markup without a cross-package glob.
export const GRAPHIC_RAW = Object.entries(svgModules).reduce((acc, [path, svg]) => {
  const [category, file] = path.replace('./svg/', '').split('/')
  const name = file.replace('.svg', '')
  if (!acc[category]) acc[category] = {}
  acc[category][name] = svg
  return acc
}, {})

const GRAPHIC_CACHE = GRAPHIC_RAW

export const GRAPHICS = Object.fromEntries(
  Object.entries(GRAPHIC_CACHE).map(([category, items]) => [category, Object.keys(items).sort()])
)

export default function Graphic({
  category,
  name,
  className = '',
  style,
  title,
  aspectRatio = '1 / 1',
}) {
  const raw = GRAPHIC_CACHE[category]?.[name]
  if (!raw) {
    if (import.meta.env.DEV) console.warn(`Graphic: ${category}/${name} not found`)
    return <AssetPlaceholder category={category} name={name} aspectRatio={aspectRatio} note="pending" className={className} />
  }
  return (
    <span
      className={`kol-graphic inline-flex w-full h-auto ${className}`.trim()}
      style={style}
      role={title ? 'img' : undefined}
      aria-label={title}
      dangerouslySetInnerHTML={{ __html: raw }}
    />
  )
}
