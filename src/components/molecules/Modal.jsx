import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Button from '../atoms/Button.jsx'
import Input from '../atoms/Input.jsx'

/**
 * Modal — promise-based prompt + confirm dialogs.
 *
 *   const { prompt, confirm } = useModal()
 *   const name    = await prompt('Name this frame:', 'Untitled')
 *   const proceed = await confirm('Discard unsaved changes?')
 *
 * Returned promise resolves to:
 *   - prompt  → string (value) on submit, `null` on cancel
 *   - confirm → boolean: `true` on confirm, `false` on cancel
 *
 * Mounted once at the app root (BrandLayout). Renders into `document.body`
 * via portal, so it floats above any rail / scroll-context.
 */

const ModalCtx = createContext(null)

export function ModalProvider({ children }) {
  const [state, setState] = useState(null)

  const closeWith = useCallback((value) => {
    setState((s) => {
      if (s) s.resolve(value)
      return null
    })
  }, [])

  const prompt = useCallback((title, defaultValue = '') =>
    new Promise((resolve) => setState({ kind: 'prompt', title, defaultValue, resolve })),
  [])

  const confirm = useCallback((title) =>
    new Promise((resolve) => setState({ kind: 'confirm', title, resolve })),
  [])

  return (
    <ModalCtx.Provider value={{ prompt, confirm }}>
      {children}
      {state && typeof document !== 'undefined' && createPortal(
        <ModalView state={state} closeWith={closeWith} />,
        document.body,
      )}
    </ModalCtx.Provider>
  )
}

function ModalView({ state, closeWith }) {
  const [val, setVal] = useState(state.defaultValue ?? '')
  const inputRef = useRef(null)

  useEffect(() => {
    if (state.kind === 'prompt') inputRef.current?.focus()
    const onKey = (e) => {
      if (e.key === 'Escape') closeWith(state.kind === 'prompt' ? null : false)
      if (e.key === 'Enter')  closeWith(state.kind === 'prompt' ? val : true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [state.kind, val, closeWith])

  const submit = () => closeWith(state.kind === 'prompt' ? val : true)
  const cancel = () => closeWith(state.kind === 'prompt' ? null : false)

  return (
    <div
      onMouseDown={cancel}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className="kol-modal flex flex-col gap-4 p-5 rounded border border-fg-08"
        style={{
          background: 'var(--kol-surface-primary)',
          color: 'var(--kol-surface-on-primary)',
          minWidth: 320,
          maxWidth: '90vw',
        }}
      >
        <p className="kol-helper-12 text-emphasis">{state.title}</p>
        {state.kind === 'prompt' && (
          <Input
            ref={inputRef}
            variant="outline"
            size="sm"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            className="w-full"
          />
        )}
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" size="sm" onClick={cancel}>Cancel</Button>
          <Button variant="primary"   size="sm" onClick={submit}>OK</Button>
        </div>
      </div>
    </div>
  )
}

export function useModal() {
  const ctx = useContext(ModalCtx)
  if (ctx) return ctx
  /* No-context fallback — falls back to native prompt/confirm so callers
   * don't need to null-check. */
  return {
    prompt:  async (title, def = '') => {
      if (typeof window === 'undefined') return null
      const v = window.prompt(title, def)
      return v
    },
    confirm: async (title) => {
      if (typeof window === 'undefined') return false
      return window.confirm(title)
    },
  }
}
