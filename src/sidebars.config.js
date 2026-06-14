/**
 * Single navigation tree for the labs shell.
 *
 * Leaf shape:
 *   { id: 'about',  label: 'About' }   — page section anchor (#about)
 *   { to: '/about', label: 'About' }   — sub-route link
 * Group shape (no id, no to):
 *   { label: 'Color', children: [...] }
 *
 * Stub: one Home entry. Add a top-level entry here + a matching <Route> in
 * App.jsx as experiments land.
 */

export const NAV_TREE = [
  { id: 'home', label: 'Home', to: '/', icon: 'book-open' },
  { id: 'develop', label: 'Develop', to: '/develop', icon: 'image' },
  { id: 'library', label: 'Library', to: '/library', icon: 'library' },
]

/* Find the active top-level page given a pathname. */
export function getActivePage(pathname) {
  if (pathname === '/') return NAV_TREE.find((n) => n.to === '/')
  return NAV_TREE.find((n) => n.to !== '/' && pathname.startsWith(n.to))
}
