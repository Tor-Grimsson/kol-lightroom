/**
 * @kol/framework — shared KOL app shell.
 *
 * Site chrome (sidenav, layout, theme toggle, footer, heroes) consumed across
 * apps. SideNav takes its nav data as props (navTree + getActivePage) so the
 * tree stays app-local. CSS lives in src/styles: kol-framework.css
 * and kol-brand-color.css.
 */

export { default as AppShell } from './AppShell.jsx'
export { default as SideNav } from './SideNav.jsx'
export { default as ThemeToggle } from './ThemeToggle.jsx'
export { default as Layout } from './Layout.jsx'
export { default as PageSection } from './PageSection.jsx'
export { default as PortalFooter } from './PortalFooter.jsx'
export { default as ScrollToTop } from './ScrollToTop.jsx'
export { default as BrandHero } from './BrandHero.jsx'
export { default as SubPageHero } from './SubPageHero.jsx'
