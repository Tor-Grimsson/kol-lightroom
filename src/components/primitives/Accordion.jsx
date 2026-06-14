/**
 * Accordion — collapsible panel group.
 *
 * Composition-based: <Accordion> wraps <AccordionPanel> children. Each panel
 * owns its open/closed state independently (additive — multiple can be open).
 * For single-open behavior, manage state from the parent and pass controlled
 * `open` + `onToggle` props to each panel.
 */
import { useState } from 'react'

export function Accordion({ children, className = '' }) {
  return <div className={`kol-accordion mt-2 mb-6 ${className}`.trim()}>{children}</div>
}

export function AccordionPanel({
  title,
  meta,
  defaultOpen = false,
  open: controlledOpen,
  onToggle,
  children,
}) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const toggle = () => {
    if (isControlled) onToggle?.(!open)
    else setInternalOpen(!open)
  }
  return (
    <div className={`kol-accordion-panel border-t border-[var(--kol-fg-08)] last:border-b${open ? ' is-open' : ''}`}>
      <button
        type="button"
        className="kol-accordion-trigger flex items-center gap-4 w-full py-4 bg-transparent border-0 cursor-pointer text-left font-mono text-emphasis transition-colors duration-[120ms] hover:text-fg-88"
        onClick={toggle}
        aria-expanded={open}
      >
        <span className="kol-accordion-title kol-helper-12 uppercase tracking-widest">{title}</span>
        {meta && <span className="kol-accordion-meta kol-helper-12 uppercase tracking-widest text-fg-48 ml-auto mr-3">{meta}</span>}
        <span className="kol-accordion-chevron font-mono text-[18px] text-fg-48 min-w-3 transition-colors duration-[120ms] ml-auto" aria-hidden="true">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="kol-accordion-body pt-2 pb-6">{children}</div>}
    </div>
  )
}
