export default function Home() {
  return (
    <main className="p-8 md:p-12 max-w-3xl">
      <p className="kol-helper-12 text-meta uppercase mb-2">kol-lightroom</p>
      <h1 className="kol-sans-display-01 text-emphasis mb-4">Design system online.</h1>
      <p className="kol-sans-body-01 text-body max-w-prose">
        This shell renders the vendored <code className="kol-mono-14 text-emphasis">@kol</code> snapshot —
        theme tokens, typography, the brand color layer, and the framework chrome
        (sidenav + theme toggle). Self-contained: no dependency on the monorepo.
      </p>
    </main>
  )
}
