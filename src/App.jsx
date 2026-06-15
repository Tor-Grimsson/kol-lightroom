import { Routes, Route } from 'react-router-dom'
import { CatalogProvider } from './app/CatalogContext.jsx'
import LightroomShell from './app/LightroomShell.jsx'

/* One catch-all route renders the shell; the shell keeps both modules mounted
 * and toggles visibility by path (so the editor's WebGPU device + decoded photo
 * survive module switches). */
export default function App() {
  return (
    <Routes>
      <Route
        path="/*"
        element={
          <CatalogProvider>
            <LightroomShell />
          </CatalogProvider>
        }
      />
    </Routes>
  )
}
