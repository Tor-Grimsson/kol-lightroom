/**
 * ColorSwatch — fixed-size color chip atom.
 *
 *   onClick provided → renders <button> with hover + selected states
 *   onClick omitted  → renders <span aria-hidden> — non-interactive preview
 *
 * Pass `showTransparent` to render the TransparentX overlay (for null /
 * unset color slots). When true, bg goes transparent regardless of `hex`.
 *
 * Props:
 *   hex             — color string, e.g. '#FF6F00'. Ignored if showTransparent.
 *   selected        — adds active border + ring (border-fg-64 ring-1).
 *   size            — number (px) for fixed-size, 'fill' (w-full aspect-square,
 *                     for grid cells that should stay square), or 'stretch'
 *                     (w-full h-full, for grid cells that stretch to row height).
 *                     Default 24.
 *   radius          — 'sm' (4px, default) | 'tight' (2px) | 'none' | 'full' (circle).
 *   frame           — boolean (default true). When false, no border drawn —
 *                     used by tightly-packed grid layouts.
 *   variant         — 'default' (border-based chrome) |
 *                     'halo' (macOS-port double box-shadow halo). Halo
 *                     overrides `frame` since it provides its own ring.
 *   hoverable       — boolean (default true). When false, no hover border
 *                     state is applied even if `onClick` is set. For static
 *                     chips that just open a popover (e.g. inspector fill /
 *                     stroke swatches).
 *   showTransparent — universal "disabled / no value / unset" indicator.
 *                     Renders white background + TransparentX diagonal
 *                     stroke; rounded corners clip the line cleanly via
 *                     `overflow-hidden` on the swatch root.
 *   transparentTone — tone of the TransparentX stroke when `showTransparent`
 *                     is true: 'warning' (default) | 'error' | 'info' |
 *                     'success'. Maps through to `var(--ui-{tone})`.
 *   onClick         — if provided, renders as <button>; else <span>.
 *   title           — passes through.
 */
import TransparentX from './TransparentX'

const SIZE_CLASSES = {
  fill:    'w-full aspect-square',
  stretch: 'w-full h-full',
}

const RADIUS_CLASSES = {
  none:  'rounded-none',
  tight: 'rounded-[2px]',
  sm:    'rounded',
  full:  'rounded-full',
}

const HALO_SHADOW = '0 0 0 1px #000, 0 0 0 2px #505050'

export default function ColorSwatch({
  hex,
  selected = false,
  size = 24,
  radius = 'tight',
  frame = true,
  variant = 'default',
  hoverable = true,
  showTransparent = false,
  transparentTone = 'warning',
  onClick,
  title,
  className = '',
  ...rest
}) {
  const interactive = typeof onClick === 'function'
  const isNamed = typeof size === 'string'
  const sizeCls   = isNamed ? (SIZE_CLASSES[size] ?? '') : ''
  const sizeStyle = isNamed ? null : { width: size, height: size }

  const isHalo  = variant === 'halo'
  const radiusCls = RADIUS_CLASSES[radius] ?? RADIUS_CLASSES.sm

  /* Halo provides its own ring via box-shadow → no border classes.
   * frame=false → consumer wants a borderless chip (e.g. swatch grids
   * that tile edge-to-edge). */
  const showBorder = !isHalo && frame

  /* Border policy:
   *   default state (not selected) — no border, clean chip
   *   selected                     — 2px border-fg-64 (the selection chrome)
   *   halo variant                 — handled separately via box-shadow
   * `frame` and `hoverable` are kept on the API but no longer drive a
   * default-state border; they're advisory for future variants. */
  const cls = [
    'relative shrink-0 inline-flex overflow-hidden',
    radiusCls,
    !isHalo && selected ? 'border-2 border-fg-64' : '',
    interactive ? 'cursor-pointer' : '',
    sizeCls,
    className,
  ].filter(Boolean).join(' ')

  const style = {
    background: showTransparent ? '#FFFFFF' : (hex || 'transparent'),
    ...(isHalo && { boxShadow: HALO_SHADOW }),
    ...sizeStyle,
  }

  const inner = showTransparent ? <TransparentX tone={transparentTone} /> : null

  if (interactive) {
    return (
      <button
        {...rest}
        type="button"
        onClick={onClick}
        title={title}
        aria-label={rest['aria-label'] ?? hex ?? 'transparent'}
        aria-pressed={selected}
        className={cls}
        style={style}
      >
        {inner}
      </button>
    )
  }

  return (
    <span {...rest} aria-hidden="true" title={title} className={cls} style={style}>
      {inner}
    </span>
  )
}
