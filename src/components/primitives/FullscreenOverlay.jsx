import { useEffect, useRef } from 'react'

export default function FullscreenOverlay({ open, onClose, children }) {
  const sheetRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  const onBackdropClick = (e) => {
    if (sheetRef.current && !sheetRef.current.contains(e.target)) onClose?.()
  }

  return (
    <div className="kol-overlay" role="dialog" aria-modal="true" onMouseDown={onBackdropClick}>
      <div ref={sheetRef} className="kol-overlay-sheet">
        <button
          type="button"
          className="kol-overlay-close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  )
}
