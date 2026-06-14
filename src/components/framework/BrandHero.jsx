export default function BrandHero({ id = 'hero', label, title, lede, mark }) {
  return (
    <section id={id} className="kol-page-hero">
      {label && <p className="kol-prose-label">{label}</p>}
      <div className="flex items-center gap-12 flex-wrap">
        {mark}
        <div className="flex-1 min-w-[280px]">
          <h1 className="kol-prose-display">{title}</h1>
          {lede && <p className="kol-prose-lede max-w-[60ch]">{lede}</p>}
        </div>
      </div>
    </section>
  )
}
