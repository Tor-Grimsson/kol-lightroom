import Divider from '../atoms/Divider.jsx'

export default function PageSection({ id, label, title, body, children, className = '', fullbleed = false, divider = false }) {
  const hasHead = label || title || body
  const cls = [
    'kol-page',
    'kol-page-section',
    fullbleed && 'kol-page--fullbleed',
    className,
  ].filter(Boolean).join(' ')
  return (
    <section id={id} className={cls}>
      {divider && <Divider className="kol-page-section-divider" />}
      {hasHead && (
        <header className={fullbleed ? 'max-w-[960px]' : 'max-w-[720px]'}>
          {label && <p  className="kol-prose-label">{label}</p>}
          {title && <h2 className="kol-prose-title">{title}</h2>}
          {body  && <p  className="kol-prose-lede">{body}</p>}
        </header>
      )}
      {children}
    </section>
  )
}
