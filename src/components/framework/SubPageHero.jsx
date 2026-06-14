import { Link } from 'react-router-dom'

export default function SubPageHero({ backTo, backLabel, label, title, lede }) {
  return (
    <section className="kol-page-hero" id="hero">
      {backTo && (
        <Link
          to={backTo}
          className="kol-back-link kol-helper-12 uppercase tracking-widest text-body hover:text-emphasis no-underline"
        >
          {backLabel}
        </Link>
      )}
      {label && (
        <p className="kol-helper-12 uppercase tracking-widest text-meta m-0 mb-4">
          {label}
        </p>
      )}
      <div className="flex-1 min-w-[280px]">
        <h1 className="kol-sans-display-01 text-auto m-0 mb-6">{title}</h1>
        {lede && (
          <p className="kol-sans-body-01 text-body m-0 max-w-[60ch]">{lede}</p>
        )}
      </div>
    </section>
  )
}
