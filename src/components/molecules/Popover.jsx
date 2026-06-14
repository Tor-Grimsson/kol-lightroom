import { useState } from 'react'
import {
  useFloating,
  autoUpdate,
  offset as offsetMw,
  flip as flipMw,
  shift as shiftMw,
  size as sizeMw,
  FloatingPortal,
  FloatingFocusManager,
  useClick,
  useHover,
  useFocus,
  useDismiss,
  useRole,
  useInteractions,
} from '@floating-ui/react'

/**
 * Popover — anchored floating-element primitive built on @floating-ui/react.
 * Two surfaces:
 *
 *   1. `usePopover({ open, onOpenChange, ... })` — full hook. Returns refs +
 *      `getReferenceProps` / `getFloatingProps` so the consumer wires the
 *      anchor and the floater explicitly. Use when the trigger is non-trivial
 *      (custom component, span wrapper, anchor on something other than a
 *      button).
 *
 *      const popover = usePopover({ open, onOpenChange })
 *      <button ref={popover.refs.setReference} {...popover.getReferenceProps()} />
 *      <PopoverPanel popover={popover}>...</PopoverPanel>
 *
 *   2. `<PopoverPanel popover={...}>` — renders the floater into a
 *      `FloatingPortal` (escapes overflow:hidden ancestors), wraps in
 *      `FloatingFocusManager` (focus trap + return-focus), applies the
 *      `.kol-popover` panel chrome.
 *
 * Position middleware: `offset` (gap), `flip` (auto-flip on overflow),
 * `shift` (slide along the cross-axis to stay in viewport), optional
 * `size` (clamp to available width/height). `autoUpdate` keeps everything
 * synced on scroll / resize / layout shift.
 *
 * Interaction defaults: click toggles, outside-click + Esc dismiss, role
 * defaults to `dialog` (use `role: 'menu' | 'listbox' | 'tooltip'` for
 * other shapes — also drives the right ARIA attrs on the reference).
 */
export function usePopover({
  open,
  onOpenChange,
  placement = 'bottom-start',
  offset = 6,
  flip = true,
  flipPadding = 8,
  shiftPadding = 8,
  matchReferenceWidth = false,
  click = true,
  hover = false,
  hoverDelay = { open: 400, close: 100 },
  focus = false,
  dismiss = true,
  role = 'dialog',
  referenceElement = null,
} = {}) {
  const middleware = [offsetMw(offset)]
  if (flip) middleware.push(flipMw({ padding: flipPadding }))
  middleware.push(shiftMw({ padding: shiftPadding }))
  if (matchReferenceWidth) {
    middleware.push(
      sizeMw({
        apply({ rects, elements }) {
          Object.assign(elements.floating.style, {
            minWidth: `${rects.reference.width}px`,
          })
        },
      })
    )
  }

  /* `elements.reference` lets the consumer anchor the popover to an
   * external DOM node (e.g. a parent container ref) instead of wiring
   * `setReference` onto the trigger. Used by TypeBlockToolbar to anchor
   * to its TypeFrame parent. */
  const data = useFloating({
    open,
    onOpenChange,
    placement,
    middleware,
    whileElementsMounted: autoUpdate,
    elements: referenceElement ? { reference: referenceElement } : undefined,
  })

  const interactions = useInteractions([
    useClick(data.context, { enabled: click }),
    useHover(data.context, { enabled: hover, delay: hoverDelay, move: false }),
    useFocus(data.context, { enabled: focus }),
    useDismiss(data.context, { enabled: dismiss }),
    useRole(data.context, { role }),
  ])

  return { ...data, ...interactions, open }
}

/**
 * Tooltip — hover-triggered popover with text content. Wraps any trigger
 * element. Built on `usePopover` with `hover: true`, `click: false`,
 * `role: 'tooltip'`. Includes keyboard focus trigger so tab-focused
 * controls also reveal the tooltip.
 *
 *   <Tooltip label="Pattern" shortcut="P" placement="bottom">
 *     <Button iconOnly="ptrn-checker" ... />
 *   </Tooltip>
 */
export function Tooltip({
  label,
  shortcut,
  placement = 'bottom',
  offset = 6,
  children,
  triggerClassName = 'inline-flex',
}) {
  const [open, setOpen] = useState(false)
  const popover = usePopover({
    open,
    onOpenChange: setOpen,
    placement,
    offset,
    role: 'tooltip',
    click: false,
    hover: true,
    focus: true,
  })

  return (
    <>
      <span
        ref={popover.refs.setReference}
        {...popover.getReferenceProps()}
        className={triggerClassName}
      >
        {children}
      </span>
      <PopoverPanel
        popover={popover}
        focus={false}
        panel={false}
        className="kol-tooltip"
      >
        <span className="text-emphasis">{label}</span>
        {shortcut && <span className="kol-tooltip-key">{shortcut}</span>}
      </PopoverPanel>
    </>
  )
}

/**
 * PopoverPanel — renders the floater into a portal with default panel chrome.
 *
 * Props:
 *   popover         — the value returned from `usePopover`
 *   panel           — apply default `.kol-popover` chrome (default: true)
 *   modal           — focus modality (default: false — non-modal popover)
 *   focus           — wrap in FloatingFocusManager (default: true)
 *   className       — extra classes on the panel
 *   style           — extra inline styles merged with floatingStyles
 */
export function PopoverPanel({
  popover,
  children,
  panel = true,
  modal = false,
  focus = true,
  className = '',
  style: extraStyle,
}) {
  if (!popover.open) return null

  const { refs, floatingStyles, context, getFloatingProps } = popover
  const cls = [panel && 'kol-popover', className].filter(Boolean).join(' ')

  /* `data-editor-keep-selection` mirrors the marker on the EditorShell
   * root. Popovers render via FloatingPortal (mounted on <body>, outside
   * the shell), so the editor's document-level click-away handler would
   * otherwise treat clicks on popover content as "outside the editor"
   * and deselect. Tagging the panel here keeps that handler happy for
   * every popover — color picker, dropdowns, menus, tooltips. Harmless
   * for non-editor consumers since they ignore the attr. */
  const node = (
    <div
      ref={refs.setFloating}
      style={extraStyle ? { ...floatingStyles, ...extraStyle } : floatingStyles}
      className={cls}
      data-editor-keep-selection
      {...getFloatingProps()}
    >
      {children}
    </div>
  )

  return (
    <FloatingPortal>
      {focus
        ? <FloatingFocusManager context={context} modal={modal}>{node}</FloatingFocusManager>
        : node}
    </FloatingPortal>
  )
}

export default PopoverPanel
