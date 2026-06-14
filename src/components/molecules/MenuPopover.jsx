import { useEffect, useRef, useState } from 'react'

/**
 * MenuPopover — generic action-menu / popover primitive.
 *
 *   <MenuPopover label="File">
 *     <MenuItem onClick={…}>Save</MenuItem>
 *     <MenuItem onClick={…}>Export…</MenuItem>
 *   </MenuPopover>
 *
 * Opens on click, closes on outside-click + Escape, anchors to the trigger
 * via getBoundingClientRect + position:fixed so it escapes overflow:auto
 * clipping. Pass `panelClassName` to size the panel (e.g. wider for
 * Templates).
 *
 * For value-list selection (single value, active state) use `Dropdown`
 * instead — this primitive is for action menus / popover panels that
 * hold arbitrary children.
 */
export function MenuPopover({
  label,
  children,
  align = 'start',
  panelClassName = '',
  panelStyle,
  buttonClassName = '',
}) {
  const [open, setOpen] = useState(false)
  const wrapRef   = useRef(null)
  const buttonRef = useRef(null)
  const [panelPos, setPanelPos] = useState(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown',   onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown',   onKey)
    }
  }, [open])

  useEffect(() => {
    if (!open) { setPanelPos(null); return }
    const update = () => {
      const rect = buttonRef.current?.getBoundingClientRect()
      if (!rect) return
      setPanelPos({ top: rect.bottom + 4, left: rect.left, right: rect.right })
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [open])

  const close = () => setOpen(false)

  const positioned = panelPos && (
    align === 'end'
      ? { top: panelPos.top, right: window.innerWidth - panelPos.right }
      : { top: panelPos.top, left: panelPos.left }
  )

  return (
    <div ref={wrapRef} className="relative inline-block">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`kol-helper-12 px-3 h-8 inline-flex items-center gap-1 rounded text-meta hover:text-emphasis transition-colors ${buttonClassName}`}
      >
        <span>{label}</span>
        <svg width="10" height="10" viewBox="0 0 12 12" aria-hidden="true">
          <path d="m3 5 3 3 3-3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      </button>
      {open && positioned && (
        <div
          role="menu"
          className={`fixed z-[1000] bg-surface-primary border border-fg-08 rounded shadow-lg ${panelClassName}`}
          style={{ ...positioned, ...panelStyle }}
          onClick={(e) => {
            /* close on item click — items inside fire their handler then bubble. */
            if (e.target.closest('[data-menu-item]')) close()
          }}
        >
          {typeof children === 'function' ? children({ close }) : children}
        </div>
      )}
    </div>
  )
}

/**
 * MenuItem — action row inside a MenuPopover. Renders as a button so it
 * picks up disabled state, focus, and keyboard activation. The popover
 * closes automatically when an item is clicked (via the wrapper's
 * delegate click — the data-menu-item attr marks rows for that match).
 */
export function MenuItem({ onClick, disabled, shortcut, iconLeft, children }) {
  return (
    <button
      type="button"
      data-menu-item
      onClick={onClick}
      disabled={disabled}
      role="menuitem"
      className="w-full kol-helper-12 px-3 h-8 inline-flex items-center gap-2 text-meta hover:text-emphasis hover:bg-fg-08 disabled:opacity-40 disabled:cursor-not-allowed text-left"
    >
      {iconLeft && <span className="shrink-0 w-4 inline-flex items-center justify-center text-meta">{iconLeft}</span>}
      <span className="flex-1">{children}</span>
      {shortcut && <span className="kol-helper-10 text-subtle shrink-0">{shortcut}</span>}
    </button>
  )
}

export function MenuDivider() {
  return <div className="border-t border-fg-08 my-1" />
}
