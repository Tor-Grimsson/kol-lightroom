import { useEffect } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import Filmstrip from './Filmstrip.jsx'
import ThemeToggle from '../components/framework/ThemeToggle.jsx'
import Library from '../pages/Library.jsx'
import Develop from '../pages/Develop.jsx'

/* LightroomShell — the app chrome. Both modules stay mounted; visibility toggles
 * by path. This keeps the editor's WebGPU device alive and your decoded photo +
 * edit intact when you switch modules (Lightroom behaviour), and avoids the
 * remount that was dropping Develop to CPU. Top bar = module switcher; bottom =
 * the persistent filmstrip. */

const MODULES = [
  { to: '/library', label: 'Library' },
  { to: '/develop', label: 'Develop' },
]

export default function LightroomShell() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  useEffect(() => {
    if (pathname === '/') navigate('/library', { replace: true })
  }, [pathname, navigate])

  const isDevelop = pathname.startsWith('/develop')

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#161616] text-body">
      <header className="flex h-11 shrink-0 items-center justify-between border-b border-fg-08 bg-black/40 px-4">
        <span className="kol-mono-12 uppercase tracking-[0.2em] text-meta">kol · lightroom</span>
        <nav className="flex items-center gap-1">
          {MODULES.map((m) => (
            <NavLink
              key={m.to}
              to={m.to}
              className={({ isActive }) =>
                `rounded px-3 py-1 kol-mono-12 uppercase tracking-wide transition-colors ${
                  isActive ? 'bg-fg-08 text-emphasis' : 'text-meta hover:text-body'
                }`
              }
            >
              {m.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center">
          <ThemeToggle />
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-hidden">
        <div className={isDevelop ? 'hidden' : 'h-full'}>
          <Library active={!isDevelop} />
        </div>
        <div className={isDevelop ? 'h-full' : 'hidden'}>
          <Develop active={isDevelop} />
        </div>
      </main>

      <Filmstrip />
    </div>
  )
}
