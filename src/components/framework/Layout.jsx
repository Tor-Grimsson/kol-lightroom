import { Outlet, useLocation } from 'react-router-dom'
import ScrollToTop from './ScrollToTop'
import ExitPreview from '../primitives/ExitPreview.jsx'

const clientSurfacePatterns = [/^\/site/]

export default function Layout() {
  const { pathname } = useLocation()
  const isClientSiteRoute = clientSurfacePatterns.some((re) => re.test(pathname))

  return (
    <div className="min-h-dvh flex flex-col">
      <ScrollToTop />
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
      {isClientSiteRoute && <ExitPreview />}
    </div>
  )
}
