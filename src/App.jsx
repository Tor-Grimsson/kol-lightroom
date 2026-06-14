import { Routes, Route } from 'react-router-dom'
import AppShell from './components/framework/AppShell.jsx'
import { NAV_TREE, getActivePage } from './sidebars.config'
import Home from './pages/Home'
import Develop from './pages/Develop'
import Library from './pages/Library'

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell navTree={NAV_TREE} getActivePage={getActivePage} />}>
        <Route path="/" element={<Home />} />
        <Route path="/develop" element={<Develop />} />
        <Route path="/library" element={<Library />} />
      </Route>
    </Routes>
  )
}
